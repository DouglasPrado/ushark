"use strict";

const { EventEmitter } = require("node:events");
const { randomUUID } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { MpvAdapter } = require("./mpv-adapter.cjs");
const { PlaybackProgressJournal } = require("./playback-store.cjs");
const { PlaybackTrackController } = require("./playback-track-controller.cjs");

const PROTOCOL_VERSION = 1;
const SCHEMA_VERSION = 1;
const MEDIA_EXTENSIONS = new Set([
  ".avi",
  ".m2ts",
  ".m4v",
  ".mkv",
  ".mov",
  ".mp4",
  ".mpeg",
  ".mpg",
  ".ts",
  ".webm",
  ".wmv",
]);

class PlaybackServiceError extends Error {
  constructor(code, publicMessage, retryable = false, cause) {
    super(publicMessage, cause ? { cause } : undefined);
    this.name = "PlaybackServiceError";
    this.code = code;
    this.publicMessage = publicMessage;
    this.retryable = retryable;
  }
}

function success(value) {
  return { ok: true, value };
}

function failure(error) {
  const known =
    error &&
    typeof error.code === "string" &&
    (typeof error.publicMessage === "string" ||
      typeof error.message === "string");
  return {
    ok: false,
    error: {
      code: known ? error.code : "PLAYBACK_STORAGE_FAILED",
      message: known
        ? (error.publicMessage ?? error.message)
        : "Não foi possível iniciar a reprodução local.",
      recoverable: known ? error.retryable === true : true,
      retryable: known ? error.retryable === true : true,
    },
  };
}

function validateId(value, label) {
  if (
    typeof value !== "string" ||
    value.length < 3 ||
    value.length > 256 ||
    value.includes("\0") ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]+$/.test(value)
  )
    throw new PlaybackServiceError(
      "PLAYBACK_INVALID",
      `A identidade de ${label} não é válida.`,
    );
  return value;
}

function validatePosition(value, label = "posição") {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0)
    throw new PlaybackServiceError(
      "PLAYBACK_INVALID",
      `A ${label} não é válida.`,
    );
  return value;
}

function validateMutation(value) {
  const key = validateId(value?.idempotencyKey, "operação");
  if (
    value.expectedGeneration !== undefined &&
    (!Number.isInteger(value.expectedGeneration) ||
      value.expectedGeneration < 1)
  )
    throw new PlaybackServiceError(
      "PLAYBACK_INVALID",
      "A geração esperada não é válida.",
    );
  return { key, expectedGeneration: value.expectedGeneration };
}

function requireResult(result) {
  if (result.ok) return result.value;
  throw new PlaybackServiceError(
    result.error.code,
    result.error.message,
    result.error.retryable,
  );
}

class LocalPlaybackSourceResolver {
  constructor(databasePath, managedLibraryRoot) {
    if (typeof databasePath !== "string" || !path.isAbsolute(databasePath))
      throw new PlaybackServiceError(
        "PLAYBACK_INVALID",
        "O banco local de reprodução não é válido.",
      );
    if (
      typeof managedLibraryRoot !== "string" ||
      !path.isAbsolute(managedLibraryRoot)
    )
      throw new PlaybackServiceError(
        "PLAYBACK_INVALID",
        "A biblioteca local de reprodução não é válida.",
      );
    this.database = new DatabaseSync(databasePath, { readOnly: true });
    this.database.exec("PRAGMA busy_timeout = 5000");
    this.managedLibraryRoot = managedLibraryRoot;
  }

  resolveManagedPath(candidate) {
    try {
      const root = fs.realpathSync(this.managedLibraryRoot);
      const before = fs.lstatSync(candidate);
      if (!before.isFile() || before.isSymbolicLink()) throw new Error("type");
      const target = fs.realpathSync(candidate);
      const relative = path.relative(root, target);
      if (
        !relative ||
        relative === ".." ||
        relative.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relative) ||
        !MEDIA_EXTENSIONS.has(path.extname(target).toLowerCase())
      )
        throw new Error("scope");
      return target;
    } catch (error) {
      throw new PlaybackServiceError(
        "PLAYBACK_FILE_MISSING",
        "O arquivo local desta source não está disponível.",
        true,
        error,
      );
    }
  }

  resolve(input) {
    const contentId = validateId(input?.contentId, "conteúdo");
    const sourceId =
      input?.sourceId === undefined
        ? undefined
        : validateId(input.sourceId, "source");
    const rows = this.database
      .prepare(
        `SELECT s.id AS source_id, s.managed_path
         FROM content_sources cs
         JOIN sources s ON s.id = cs.source_id
         WHERE cs.content_id = ? AND (? IS NULL OR s.id = ?)
         ORDER BY CASE WHEN s.managed_path IS NULL THEN 1 ELSE 0 END, s.id`,
      )
      .all(contentId, sourceId ?? null, sourceId ?? null);
    const hasStorage = this.database
      .prepare(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name='storage_entries'",
      )
      .get();
    if (hasStorage)
      rows.unshift(
        ...this.database
          .prepare(
            `SELECT source_id, managed_path
             FROM storage_entries
             WHERE content_id=? AND keep=1 AND (? IS NULL OR source_id=?)
             ORDER BY source_id`,
          )
          .all(contentId, sourceId ?? null, sourceId ?? null),
      );
    if (!rows.length)
      throw new PlaybackServiceError(
        "PLAYBACK_SOURCE_UNAVAILABLE",
        "Nenhuma source local pertence a este conteúdo.",
        true,
      );
    let missing;
    for (const row of rows) {
      if (!row.managed_path) continue;
      try {
        return {
          contentId,
          sourceId: row.source_id,
          mediaPath: this.resolveManagedPath(row.managed_path),
        };
      } catch (error) {
        missing = error;
      }
    }
    if (missing) throw missing;
    throw new PlaybackServiceError(
      "PLAYBACK_SOURCE_UNAVAILABLE",
      "A source ainda não possui um arquivo local gerenciado.",
      true,
    );
  }

  close() {
    this.database.close();
  }
}

class PlaybackApplicationService extends EventEmitter {
  constructor(options) {
    super();
    this.store = options.store;
    this.resolver = options.resolver;
    this.subtitleStore = options.subtitleStore;
    this.adapterFactory = options.adapterFactory ?? (() => new MpvAdapter());
    this.fullscreen = options.fullscreen === true;
    this.preparations = new Map();
    this.cancelledRequests = new Set();
    this.commandResults = new Map();
    this.active = null;
    this.lastPositionEventAt = 0;
    requireResult(this.store.recoverInterrupted());
  }

  publish(type, input = {}) {
    const event = {
      protocolVersion: PROTOCOL_VERSION,
      eventId: `event:${randomUUID()}`,
      type,
      occurredAt: new Date().toISOString(),
      ...input,
    };
    this.emit("playback-event", event);
    return event;
  }

  subscribe(listener) {
    this.on("playback-event", listener);
    return () => this.off("playback-event", listener);
  }

  activeSourceIds() {
    return this.active && !this.active.stopping
      ? [this.active.preparation.sourceId]
      : [];
  }

  async prepare(input) {
    try {
      const requestId = validateId(input?.requestId, "solicitação");
      if (this.cancelledRequests.delete(requestId))
        throw new PlaybackServiceError(
          "PLAYBACK_CANCELLED",
          "A preparação foi cancelada.",
        );
      const resolved = this.resolver.resolve(input);
      const saved = requireResult(
        this.store.readProgress({ contentId: resolved.contentId }),
      );
      const requested =
        input.startPositionSeconds === undefined
          ? undefined
          : validatePosition(input.startPositionSeconds);
      const preparation = {
        operationId: `playback-operation:${randomUUID()}`,
        requestId,
        contentId: resolved.contentId,
        sourceId: resolved.sourceId,
        mediaPath: resolved.mediaPath,
        state: "ready",
        resumePositionSeconds: requested ?? saved?.positionSeconds ?? 0,
      };
      this.publish("prepare-started", { operationId: preparation.operationId });
      this.preparations.set(preparation.operationId, preparation);
      this.publish("prepare-ready", { operationId: preparation.operationId });
      const publicPreparation = { ...preparation };
      delete publicPreparation.mediaPath;
      return success(publicPreparation);
    } catch (error) {
      return failure(error);
    }
  }

  async start(input) {
    try {
      const operationId = validateId(input?.operationId, "preparação");
      const mutation = validateMutation(input?.mutation);
      if (this.commandResults.has(mutation.key))
        return success(this.commandResults.get(mutation.key));
      const preparation = this.preparations.get(operationId);
      if (!preparation)
        throw new PlaybackServiceError(
          "PLAYBACK_NOT_FOUND",
          "A preparação de reprodução não foi encontrada.",
        );
      if (this.active)
        throw new PlaybackServiceError(
          "PLAYBACK_CONFLICT",
          "Já existe uma reprodução local ativa.",
          true,
        );
      const sessionId = `playback-session:${randomUUID()}`;
      const generation = 1;
      const adapter = this.adapterFactory();
      const journal = new PlaybackProgressJournal(this.store);
      const tracks = new PlaybackTrackController({
        adapter,
        subtitleStore: this.subtitleStore,
      });
      const active = {
        operationId,
        sessionId,
        generation,
        preparation,
        adapter,
        journal,
        tracks,
        state: "launching",
        positionSeconds: preparation.resumePositionSeconds,
        seekTarget: undefined,
        stopping: false,
      };
      this.active = active;
      requireResult(
        this.store.begin({
          sessionId,
          generation,
          contentId: preparation.contentId,
          sourceId: preparation.sourceId,
          startPositionSeconds: preparation.resumePositionSeconds,
        }),
      );
      this.attachAdapter(active);
      await adapter.start({ fullscreen: this.fullscreen });
      await adapter.load(preparation.mediaPath, {
        startPositionSeconds: preparation.resumePositionSeconds,
      });
      this.preparations.delete(operationId);
      const snapshot = this.snapshot(active);
      this.commandResults.set(mutation.key, snapshot);
      this.publish("started", { operationId, session: snapshot });
      return success(snapshot);
    } catch (error) {
      if (this.active && this.active.state === "launching") {
        await this.failActive(error).catch(() => {});
      }
      return failure(error);
    }
  }

  attachAdapter(active) {
    active.adapter.on("event", (event) => {
      void this.onAdapterEvent(active, event);
    });
    active.adapter.on("exit", ({ expected }) => {
      if (!expected && this.active === active)
        void this.failActive(
          new PlaybackServiceError(
            "PLAYBACK_PLAYER_CRASHED",
            "O player foi encerrado inesperadamente.",
            true,
          ),
        );
    });
  }

  async onAdapterEvent(active, event) {
    if (this.active !== active || active.stopping) return;
    if (event.type === "first-frame") {
      active.state = active.adapter.snapshot().paused ? "paused" : "playing";
      requireResult(
        this.store.markFirstFrame({
          sessionId: active.sessionId,
          generation: active.generation,
        }),
      );
      this.publish("first-frame", { session: this.snapshot(active) });
      return;
    }
    if (event.type === "end-file") {
      if (event.reason === "eof") await this.finishActive("ended");
      else if (event.reason !== "stop")
        await this.failActive(
          new PlaybackServiceError(
            "PLAYBACK_MEDIA_OPEN_FAILED",
            "A mídia local foi encerrada antes do fim.",
            true,
          ),
        );
      return;
    }
    if (event.type === "error") {
      await this.failActive(
        new PlaybackServiceError(
          event.code ?? "PLAYBACK_PLAYER_CRASHED",
          "O player local encontrou uma falha.",
          true,
        ),
      );
      return;
    }
    if (event.type !== "property") return;
    const state = active.adapter.snapshot();
    if (event.name === "time-pos") {
      if (
        active.seekTarget !== undefined &&
        Math.abs(state.positionSeconds - active.seekTarget) > 0.25
      )
        return;
      active.positionSeconds = state.positionSeconds;
      active.seekTarget = undefined;
      active.journal.record({
        sessionId: active.sessionId,
        generation: active.generation,
        positionSeconds: active.positionSeconds,
        durationSeconds: state.durationSeconds,
        metrics: this.metrics(state),
      });
      const now = Date.now();
      if (now - this.lastPositionEventAt >= 250) {
        this.lastPositionEventAt = now;
        this.publish("position", { session: this.snapshot(active) });
      }
    } else if (event.name === "pause") {
      if (active.state === "launching") return;
      active.state = state.paused ? "paused" : "playing";
      this.publish(state.paused ? "paused" : "resumed", {
        session: this.snapshot(active),
      });
    } else if (event.name === "track-list") {
      this.publish("track-changed", { session: this.snapshot(active) });
    }
  }

  metrics(state) {
    return {
      videoCodec: state.videoCodec,
      audioCodec: state.audioCodec,
      framesPerSecond: state.framesPerSecond,
      droppedFrames: state.droppedFrames,
      hardwareDecode: state.hardwareDecode ?? "unknown",
    };
  }

  snapshot(active) {
    const state = active.adapter.snapshot();
    const audioTracks = state.audioTracks ?? [];
    const subtitleTracks = state.subtitleTracks ?? [];
    return {
      schemaVersion: SCHEMA_VERSION,
      protocolVersion: PROTOCOL_VERSION,
      sessionId: active.sessionId,
      generation: active.generation,
      contentId: active.preparation.contentId,
      sourceId: active.preparation.sourceId,
      state: active.state,
      positionSeconds: active.positionSeconds ?? state.positionSeconds ?? 0,
      durationSeconds: state.durationSeconds,
      paused: state.paused === true,
      volumePercent: state.volumePercent ?? 100,
      muted: state.muted === true,
      audioTracks,
      subtitleTracks,
      selectedAudioTrackId: audioTracks.find((track) => track.selected)?.id,
      selectedSubtitleTrackId: subtitleTracks.find((track) => track.selected)
        ?.id,
      firstFrameAt:
        active.state === "launching"
          ? undefined
          : requireResult(
              this.store.readSession({ sessionId: active.sessionId }),
            ).firstFrameAt,
      metrics: this.metrics(state),
      updatedAt: new Date().toISOString(),
    };
  }

  requireActive(input) {
    const sessionId = validateId(input?.sessionId, "sessão");
    const active = this.active;
    if (!active || active.sessionId !== sessionId)
      throw new PlaybackServiceError(
        "PLAYBACK_NOT_FOUND",
        "A sessão de reprodução não foi encontrada.",
      );
    const mutation = validateMutation(input?.mutation);
    if (
      mutation.expectedGeneration !== undefined &&
      mutation.expectedGeneration !== active.generation
    )
      throw new PlaybackServiceError(
        "PLAYBACK_CONFLICT",
        "A sessão de reprodução foi substituída.",
      );
    return { active, mutation };
  }

  async command(input, operation) {
    try {
      const { active, mutation } = this.requireActive(input);
      if (this.commandResults.has(mutation.key))
        return success(this.commandResults.get(mutation.key));
      await operation(active);
      const snapshot = this.snapshot(active);
      this.commandResults.set(mutation.key, snapshot);
      return success(snapshot);
    } catch (error) {
      return failure(error);
    }
  }

  setPaused(input) {
    return this.command(input, async (active) => {
      await active.adapter.setPaused(input.paused === true);
      active.state = input.paused ? "paused" : "playing";
      requireResult(
        this.store.setState({
          sessionId: active.sessionId,
          generation: active.generation,
          state: active.state,
        }),
      );
      active.journal.flush(this.progressInput(active));
    });
  }

  seek(input) {
    return this.command(input, async (active) => {
      const next = validatePosition(input.positionSeconds);
      const previous = active.state;
      active.state = "seeking";
      requireResult(
        this.store.setState({
          sessionId: active.sessionId,
          generation: active.generation,
          state: "seeking",
        }),
      );
      this.publish("seeking", { session: this.snapshot(active) });
      await active.adapter.seek(next);
      active.positionSeconds = next;
      active.seekTarget = next;
      active.state = previous === "paused" ? "paused" : "playing";
      requireResult(
        this.store.setState({
          sessionId: active.sessionId,
          generation: active.generation,
          state: active.state,
        }),
      );
      active.journal.flush(this.progressInput(active));
      this.publish("seeked", { session: this.snapshot(active) });
    });
  }

  setVolume(input) {
    return this.command(input, async (active) => {
      const volume = validatePosition(input.volumePercent, "volume");
      if (volume > 100)
        throw new PlaybackServiceError(
          "PLAYBACK_INVALID",
          "O volume deve estar entre 0 e 100.",
        );
      await active.adapter.setVolume(volume);
    });
  }

  setMuted(input) {
    return this.command(input, (active) =>
      active.adapter.setMuted(input.muted === true),
    );
  }

  selectAudio(input) {
    return this.command(input, (active) =>
      active.tracks.selectAudio(input.trackId),
    );
  }

  selectSubtitle(input) {
    return this.command(input, (active) =>
      active.tracks.selectSubtitle(input.trackId),
    );
  }

  addExternalSubtitle(input) {
    return this.command(input, (active) =>
      active.tracks.addExternalSubtitle({
        sessionId: active.sessionId,
        candidatePath: input.candidatePath,
      }),
    );
  }

  progressInput(active) {
    const state = active.adapter.snapshot();
    return {
      sessionId: active.sessionId,
      generation: active.generation,
      positionSeconds: active.positionSeconds ?? state.positionSeconds ?? 0,
      durationSeconds: state.durationSeconds,
      metrics: this.metrics(state),
    };
  }

  async finishActive(reason) {
    const active = this.active;
    if (!active || active.stopping) return undefined;
    active.stopping = true;
    active.state = reason === "ended" ? "ended" : "stopping";
    const state = active.adapter.snapshot();
    const progress = requireResult(
      active.journal.stop({
        ...this.progressInput(active),
        reason,
        idempotencyKey: `playback-stop:${active.sessionId}:${reason}`,
      }),
    );
    active.tracks.cleanup(active.sessionId);
    await active.adapter.stop().catch(() => {});
    this.active = null;
    this.publish(reason === "ended" ? "ended" : "stopped", {
      session: {
        ...this.snapshotStopped(active, state),
        state: reason === "ended" ? "ended" : "stopped",
      },
    });
    return progress;
  }

  snapshotStopped(active, state) {
    return {
      schemaVersion: SCHEMA_VERSION,
      protocolVersion: PROTOCOL_VERSION,
      sessionId: active.sessionId,
      generation: active.generation,
      contentId: active.preparation.contentId,
      sourceId: active.preparation.sourceId,
      state: "stopped",
      positionSeconds: active.positionSeconds ?? state.positionSeconds ?? 0,
      durationSeconds: state.durationSeconds,
      paused: state.paused === true,
      volumePercent: state.volumePercent ?? 100,
      muted: state.muted === true,
      audioTracks: state.audioTracks ?? [],
      subtitleTracks: state.subtitleTracks ?? [],
      selectedAudioTrackId: state.audioTracks?.find((track) => track.selected)
        ?.id,
      selectedSubtitleTrackId: state.subtitleTracks?.find(
        (track) => track.selected,
      )?.id,
      metrics: this.metrics(state),
      updatedAt: new Date().toISOString(),
    };
  }

  async failActive(error) {
    const active = this.active;
    if (!active || active.stopping) return;
    active.stopping = true;
    const state = active.adapter.snapshot();
    active.journal.stop({
      ...this.progressInput(active),
      reason: "error",
      idempotencyKey: `playback-stop:${active.sessionId}:error`,
    });
    active.tracks.cleanup(active.sessionId);
    await active.adapter.stop().catch(() => {});
    this.active = null;
    this.publish("failed", {
      session: { ...this.snapshotStopped(active, state), state: "error" },
      error: failure(error).error,
    });
  }

  async stop(input) {
    try {
      validateId(input?.sessionId, "sessão");
      const mutation = validateMutation(input?.mutation);
      if (this.commandResults.has(mutation.key))
        return success(this.commandResults.get(mutation.key));
      this.requireActive(input);
      if (!["user", "ended", "error", "shutdown"].includes(input.reason))
        throw new PlaybackServiceError(
          "PLAYBACK_INVALID",
          "O motivo de encerramento não é válido.",
        );
      const progress = await this.finishActive(input.reason);
      this.commandResults.set(mutation.key, progress);
      return success(progress);
    } catch (error) {
      return failure(error);
    }
  }

  async readSession(input) {
    try {
      const sessionId = validateId(input?.sessionId, "sessão");
      if (this.active?.sessionId === sessionId)
        return success(this.snapshot(this.active));
      const stored = requireResult(this.store.readSession({ sessionId }));
      return success({
        schemaVersion: SCHEMA_VERSION,
        protocolVersion: PROTOCOL_VERSION,
        sessionId: stored.sessionId,
        generation: stored.generation,
        contentId: stored.contentId,
        sourceId: stored.sourceId,
        state: stored.state,
        positionSeconds: stored.positionSeconds,
        durationSeconds: stored.durationSeconds,
        paused: stored.state === "paused",
        volumePercent: 100,
        muted: false,
        audioTracks: [],
        subtitleTracks: [],
        firstFrameAt: stored.firstFrameAt,
        metrics: {
          ...stored.metrics,
          hardwareDecode: stored.metrics.hardwareDecode ?? "unknown",
        },
        updatedAt: stored.endedAt ?? stored.startedAt,
      });
    } catch (error) {
      return failure(error);
    }
  }

  async readProgress(input) {
    return this.store.readProgress(input);
  }

  async cancelPreparation(input) {
    try {
      const requestId = validateId(input?.requestId, "solicitação");
      this.cancelledRequests.add(requestId);
      let cancelled = false;
      for (const [operationId, preparation] of this.preparations) {
        if (preparation.requestId === requestId) {
          this.preparations.delete(operationId);
          cancelled = true;
        }
      }
      return success({ requestId, cancelled });
    } catch (error) {
      return failure(error);
    }
  }

  async close() {
    if (this.active) await this.finishActive("shutdown").catch(() => {});
    this.preparations.clear();
    this.resolver.close();
    this.store.close();
  }
}

module.exports = {
  LocalPlaybackSourceResolver,
  MEDIA_EXTENSIONS,
  PlaybackApplicationService,
  PlaybackServiceError,
  failure,
  success,
};
