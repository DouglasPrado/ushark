"use strict";

const { randomUUID } = require("node:crypto");
const { EventEmitter } = require("node:events");
const { DatabaseSync } = require("node:sqlite");
const { setTimeout: delay } = require("node:timers/promises");
const { calculateStreamSchedule } = require("./stream-scheduler.cjs");

const PROTOCOL_VERSION = 1;
const SCHEMA_VERSION = 1;

class ProgressiveStreamError extends Error {
  constructor(code, publicMessage, retryable = false, cause) {
    super(publicMessage, cause ? { cause } : undefined);
    this.name = "ProgressiveStreamError";
    this.code = code;
    this.publicMessage = publicMessage;
    this.retryable = retryable;
  }
}

function validId(value, name) {
  if (
    typeof value !== "string" ||
    value.length < 3 ||
    value.length > 256 ||
    value.includes("\0") ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]+$/.test(value)
  )
    throw new ProgressiveStreamError(
      "STREAM_INVALID",
      `A identidade de ${name} não é válida.`,
    );
  return value;
}

function position(value, name = "posição") {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0)
    throw new ProgressiveStreamError(
      "STREAM_INVALID",
      `A ${name} não é válida.`,
    );
  return value;
}

function normalizeError(error) {
  if (error instanceof ProgressiveStreamError) return error;
  return new ProgressiveStreamError(
    typeof error?.code === "string" ? error.code : "STREAM_DAEMON_UNAVAILABLE",
    typeof error?.publicMessage === "string"
      ? error.publicMessage
      : typeof error?.message === "string"
        ? error.message
        : "O streaming progressivo falhou.",
    error?.retryable === true,
    error,
  );
}

function failure(error) {
  const value = normalizeError(error);
  return {
    ok: false,
    error: {
      code: value.code,
      message: value.publicMessage,
      recoverable: value.retryable,
      retryable: value.retryable,
    },
  };
}

class TorrentStreamSourceResolver {
  constructor(databasePath, daemon) {
    if (typeof databasePath !== "string" || !databasePath)
      throw new ProgressiveStreamError(
        "STREAM_INVALID",
        "O banco de sources não é válido.",
      );
    this.database = new DatabaseSync(databasePath, { readOnly: true });
    this.database.exec("PRAGMA busy_timeout = 5000");
    this.daemon = daemon;
  }

  row(input) {
    const contentId = validId(input?.contentId, "conteúdo");
    const sourceId = validId(input?.sourceId, "source");
    const row = this.database
      .prepare(
        `SELECT tr.torrent_id, tr.info_hash, tr.managed_torrent_path,
                ts.input_type, ts.input_label, css.selector_json,
                tr.metadata_json
         FROM content_source_selectors css
         JOIN torrent_sources ts ON ts.source_id = css.source_id
         JOIN torrent_runtimes tr ON tr.info_hash = ts.info_hash
         WHERE css.content_id = ? AND css.source_id = ?`,
      )
      .get(contentId, sourceId);
    if (!row)
      throw new ProgressiveStreamError(
        "STREAM_SOURCE_UNAVAILABLE",
        "A source torrent não pertence a este conteúdo.",
        true,
      );
    let selector;
    try {
      selector = JSON.parse(row.selector_json);
    } catch (error) {
      throw new ProgressiveStreamError(
        "STREAM_INVALID",
        "O seletor persistido da source é inválido.",
        false,
        error,
      );
    }
    let inferredFileId;
    if (!input.fileId && !selector?.fileId) {
      try {
        const files = JSON.parse(row.metadata_json)?.files ?? [];
        if (selector?.type === "largest-video")
          inferredFileId = files
            .filter((file) => file.kind === "video" && file.selectable === true)
            .sort(
              (left, right) =>
                right.sizeBytes - left.sizeBytes ||
                left.id.localeCompare(right.id),
            )[0]?.id;
      } catch {
        inferredFileId = undefined;
      }
    }
    const fileId = validId(
      input.fileId ?? selector?.fileId ?? inferredFileId,
      "arquivo",
    );
    if (input.fileId && input.fileId !== selector?.fileId)
      throw new ProgressiveStreamError(
        "STREAM_CONFLICT",
        "O arquivo não corresponde ao seletor confirmado.",
      );
    return { ...row, contentId, sourceId, fileId };
  }

  async rebind(row) {
    await this.daemon.start();
    try {
      await this.daemon.describeStream(row.torrent_id, row.fileId);
      return;
    } catch (error) {
      if (
        !["STREAM_SOURCE_UNAVAILABLE", "STREAM_NOT_FOUND"].includes(error?.code)
      )
        throw error;
    }
    const operationId = `operation:stream-rebind:${randomUUID()}`;
    const payload = {
      operationId,
      correlationId: `correlation:stream-rebind:${randomUUID()}`,
      inputLabel: row.input_label,
      softTimeoutMs: 5_000,
      hardTimeoutMs: 30_000,
      ...(row.input_type === "torrent-file" && row.managed_torrent_path
        ? { type: "torrent-file", path: row.managed_torrent_path }
        : {
            type: "magnet",
            magnet: `magnet:?xt=urn:btih:${row.info_hash}`,
          }),
    };
    await this.daemon.inspect(payload);
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      const snapshot = await this.daemon.get(operationId);
      if (snapshot.state === "files-ready") return;
      if (["failed", "cancelled"].includes(snapshot.state))
        throw new ProgressiveStreamError(
          snapshot.failure?.code ?? "STREAM_SOURCE_UNAVAILABLE",
          snapshot.failure?.message ?? "A source não pôde ser restaurada.",
          snapshot.failure?.retryable === true,
        );
      await delay(100);
    }
    throw new ProgressiveStreamError(
      "STREAM_TIMEOUT",
      "A source não ficou pronta no tempo limite.",
      true,
    );
  }

  async resolve(input) {
    const row = this.row(input);
    await this.rebind(row);
    return {
      contentId: row.contentId,
      sourceId: row.sourceId,
      torrentId: row.torrent_id,
      fileId: row.fileId,
    };
  }

  close() {
    this.database.close();
  }
}

class ProgressiveStreamApplicationService extends EventEmitter {
  constructor(options) {
    super();
    if (!options?.daemon || !options?.sourceResolver || !options?.playerFactory)
      throw new ProgressiveStreamError(
        "STREAM_INVALID",
        "A configuração do streaming não é válida.",
      );
    this.daemon = options.daemon;
    this.sourceResolver = options.sourceResolver;
    this.playerFactory = options.playerFactory;
    this.fullscreen = options.fullscreen === true;
    this.pollIntervalMs = Math.max(250, options.pollIntervalMs ?? 250);
    this.sessions = new Map();
    this.cancelledRequests = new Set();
  }

  throwIfCancelled(requestId) {
    if (!this.cancelledRequests.delete(requestId)) return;
    throw new ProgressiveStreamError(
      "STREAM_CANCELLED",
      "A preparação foi cancelada.",
    );
  }

  subscribe(listener) {
    this.on("stream-event", listener);
    return () => this.off("stream-event", listener);
  }

  activeSourceIds() {
    return [...this.sessions.values()]
      .filter((session) => !session.stopped)
      .map((session) => session.sourceId);
  }

  publish(type, active, error) {
    const snapshot =
      active.geometry && active.schedule ? this.snapshot(active) : undefined;
    const event = {
      protocolVersion: PROTOCOL_VERSION,
      eventId: `stream-event:${randomUUID()}`,
      type,
      sequence: ++active.eventSequence,
      occurredAt: new Date().toISOString(),
      ...(snapshot ? { snapshot } : {}),
      ...(error ? { error: failure(error).error } : {}),
    };
    this.emit("stream-event", event);
    return event;
  }

  snapshot(active) {
    return {
      schemaVersion: SCHEMA_VERSION,
      protocolVersion: PROTOCOL_VERSION,
      streamSessionId: active.streamSessionId,
      contentId: active.contentId,
      sourceId: active.sourceId,
      fileId: active.fileId,
      mode: active.mode,
      state: active.state,
      seekGeneration: active.seekGeneration,
      positionSeconds: active.positionSeconds,
      metadata: {
        durationSeconds: active.durationSeconds,
        sizeBytes: active.geometry.fileSizeBytes,
        bitrateBitsPerSecond: active.mediaBitrateBitsPerSecond,
        mappingConfidence: active.mappingConfidence,
      },
      buffer: {
        seconds: active.bufferedSeconds,
        bytes: active.bufferedBytes,
        targetSeconds: active.schedule.targetSeconds,
        zone: active.schedule.zone,
        throughputBitsPerSecond: active.throughputBitsPerSecond,
        mediaBitrateBitsPerSecond: active.mediaBitrateBitsPerSecond,
        streamingRatio:
          active.mediaBitrateBitsPerSecond > 0
            ? active.throughputBitsPerSecond / active.mediaBitrateBitsPerSecond
            : undefined,
        hotWindowReady: active.hotWindowReady,
        warmWindowReady: active.warmWindowReady,
      },
      delivery: { kind: "partial-file", ready: active.deliveryReady },
      protected: true,
      startedAt: active.startedAt,
      updatedAt: new Date().toISOString(),
    };
  }

  schedule(active) {
    return calculateStreamSchedule({
      mode: active.mode,
      ...active.geometry,
      durationSeconds: active.durationSeconds,
      positionSeconds: active.positionSeconds,
      seekGeneration: active.seekGeneration,
      bufferedSeconds: active.bufferedSeconds,
      mediaBitrateBitsPerSecond: active.mediaBitrateBitsPerSecond,
      throughputBitsPerSecond: active.throughputBitsPerSecond,
      tailRequired: active.tailRequired,
    });
  }

  daemonSchedule(active) {
    return {
      torrentId: active.torrentId,
      fileId: active.fileId,
      streamSessionId: active.streamSessionId,
      seekGeneration: active.seekGeneration,
      scheduleSequence: active.scheduleSequence,
      mode: active.mode,
      assignments: active.schedule.assignments,
      cache: active.schedule.cache,
    };
  }

  async prepare(input) {
    const feedbackStart = Date.now();
    let provisional;
    try {
      const requestId = validId(input?.requestId, "solicitação");
      const contentId = validId(input?.contentId, "conteúdo");
      const sourceId = validId(input?.sourceId, "source");
      const requestedFileId =
        input?.fileId === undefined
          ? undefined
          : validId(input.fileId, "arquivo");
      if (!new Set(["stream-only", "keep", "download"]).has(input?.mode))
        throw new ProgressiveStreamError(
          "STREAM_INVALID",
          "O modo de streaming não é válido.",
        );
      const durationSeconds = position(input?.durationSeconds, "duração");
      if (durationSeconds === 0)
        throw new ProgressiveStreamError(
          "STREAM_METADATA_INCOMPLETE",
          "A duração é necessária para preparar o streaming.",
        );
      this.throwIfCancelled(requestId);
      provisional = {
        streamSessionId: `stream-session:${randomUUID()}`,
        requestId,
        contentId,
        sourceId,
        fileId: requestedFileId,
        mode: input.mode,
        state: "preparing",
        seekGeneration: 0,
        scheduleSequence: 0,
        positionSeconds: position(input.startPositionSeconds ?? 0),
        durationSeconds,
        mediaBitrateBitsPerSecond: position(
          input.mediaBitrateBitsPerSecond ?? 0,
          "bitrate",
        ),
        throughputBitsPerSecond: position(
          input.throughputBitsPerSecond ?? 0,
          "throughput",
        ),
        bufferedSeconds: 0,
        bufferedBytes: 0,
        hotWindowReady: false,
        warmWindowReady: false,
        deliveryReady: false,
        mappingConfidence: "estimated",
        tailRequired: input.tailRequired === true,
        startedAt: new Date().toISOString(),
        eventSequence: 0,
        pollToken: 0,
        stopped: false,
        playerStarted: false,
        playerLoaded: false,
      };
      // This synchronous event is the UI feedback budget boundary.
      provisional.feedbackMs = Date.now() - feedbackStart;
      this.publish("stream.preparing", provisional);
      const resolved = await this.sourceResolver.resolve({
        contentId,
        sourceId,
        fileId: requestedFileId,
      });
      this.throwIfCancelled(requestId);
      provisional.torrentId = validId(resolved?.torrentId, "torrent");
      provisional.fileId = validId(
        resolved?.fileId ?? requestedFileId,
        "arquivo",
      );
      provisional.geometry = await this.daemon.describeStream(
        provisional.torrentId,
        provisional.fileId,
      );
      this.throwIfCancelled(requestId);
      provisional.schedule = this.schedule(provisional);
      provisional.player = this.playerFactory();
      this.sessions.set(provisional.streamSessionId, provisional);
      await this.daemon.applyStreamSchedule(this.daemonSchedule(provisional));
      provisional.state = "buffering";
      this.publish("stream.file-resolved", provisional);
      void this.pollDelivery(provisional, provisional.seekGeneration);
      return { ok: true, value: this.snapshot(provisional) };
    } catch (error) {
      const normalized = normalizeError(error);
      if (provisional?.streamSessionId) {
        provisional.state =
          normalized.code === "STREAM_CANCELLED" ? "cancelled" : "failed";
        if (normalized.code !== "STREAM_CANCELLED")
          this.publish("stream.failed", provisional, normalized);
      }
      return failure(normalized);
    }
  }

  async pollDelivery(active, generation) {
    const token = ++active.pollToken;
    while (
      !active.stopped &&
      active.seekGeneration === generation &&
      active.pollToken === token
    ) {
      try {
        const delivery = await this.daemon.getStreamDelivery(
          active.streamSessionId,
        );
        if (
          active.stopped ||
          active.seekGeneration !== generation ||
          active.pollToken !== token
        )
          return;
        active.hotWindowReady = delivery.ready === true;
        active.deliveryReady = delivery.ready === true;
        active.bufferedBytes = Math.max(
          0,
          Math.min(
            active.geometry.fileSizeBytes,
            Number(delivery.completedRequiredPieceCount ?? 0) *
              active.geometry.pieceLengthBytes,
          ),
        );
        active.bufferedSeconds =
          active.mediaBitrateBitsPerSecond > 0
            ? (active.bufferedBytes * 8) / active.mediaBitrateBitsPerSecond
            : 0;
        active.schedule = this.schedule(active);
        if (!delivery.ready) {
          active.state = "buffering";
          this.publish("stream.buffer-updated", active);
          await delay(this.pollIntervalMs);
          continue;
        }
        if (!active.playerStarted) {
          await active.player.start({ fullscreen: this.fullscreen });
          active.playerStarted = true;
        }
        if (!active.playerLoaded) {
          await active.player.load(delivery.managedPath, {
            startPositionSeconds: active.positionSeconds,
          });
          active.playerLoaded = true;
        } else if (active.pendingPlayerSeek === generation) {
          await active.player.seek(active.positionSeconds);
        }
        if (
          active.stopped ||
          active.seekGeneration !== generation ||
          active.pollToken !== token
        )
          return;
        active.pendingPlayerSeek = undefined;
        active.state = "ready";
        this.publish("stream.ready", active);
        return;
      } catch (error) {
        if (active.stopped || active.seekGeneration !== generation) return;
        active.state = "failed";
        this.publish("stream.failed", active, error);
        return;
      }
    }
  }

  requireSession(streamSessionId) {
    const id = validId(streamSessionId, "sessão");
    const active = this.sessions.get(id);
    if (!active || active.stopped)
      throw new ProgressiveStreamError(
        "STREAM_NOT_FOUND",
        "A sessão de streaming não foi encontrada.",
      );
    return active;
  }

  async setPosition(input) {
    try {
      const active = this.requireSession(input?.streamSessionId);
      if (input.seekGeneration !== active.seekGeneration)
        throw new ProgressiveStreamError(
          "STREAM_CONFLICT",
          "A geração de streaming foi substituída.",
        );
      active.positionSeconds = position(input.positionSeconds);
      active.scheduleSequence += 1;
      active.schedule = this.schedule(active);
      await this.daemon.applyStreamSchedule(this.daemonSchedule(active));
      return { ok: true, value: this.snapshot(active) };
    } catch (error) {
      return failure(error);
    }
  }

  async seek(input) {
    try {
      const active = this.requireSession(input?.streamSessionId);
      const generation = input?.seekGeneration;
      if (
        !Number.isSafeInteger(generation) ||
        generation <= active.seekGeneration
      )
        throw new ProgressiveStreamError(
          "STREAM_CONFLICT",
          "O seek não possui uma geração mais nova.",
        );
      active.seekGeneration = generation;
      active.scheduleSequence = 0;
      active.positionSeconds = position(input.positionSeconds);
      active.state = "buffering";
      active.deliveryReady = false;
      active.hotWindowReady = false;
      active.pendingPlayerSeek = generation;
      active.schedule = this.schedule(active);
      this.publish("stream.buffer-updated", active);
      const applied = await this.daemon.applyStreamSchedule(
        this.daemonSchedule(active),
      );
      if (
        active.stopped ||
        active.seekGeneration !== generation ||
        applied?.stale === true
      )
        return { ok: true, value: this.snapshot(active) };
      void this.pollDelivery(active, generation);
      return { ok: true, value: this.snapshot(active) };
    } catch (error) {
      return failure(error);
    }
  }

  async playerCommand(input, operation) {
    try {
      const active = this.requireSession(input?.streamSessionId);
      if (
        input?.mutation?.expectedSeekGeneration !== undefined &&
        input.mutation.expectedSeekGeneration !== active.seekGeneration
      )
        throw new ProgressiveStreamError(
          "STREAM_CONFLICT",
          "A sessão de streaming foi substituída.",
        );
      if (!active.playerStarted)
        throw new ProgressiveStreamError(
          "STREAM_CONFLICT",
          "O player ainda está preparando a mídia.",
          true,
        );
      await operation(active.player);
      return { ok: true, value: this.snapshot(active) };
    } catch (error) {
      return failure(error);
    }
  }

  setPaused(input) {
    return this.playerCommand(input, (player) =>
      player.setPaused(input?.paused === true),
    );
  }

  setVolume(input) {
    const volume = input?.volumePercent;
    if (!Number.isFinite(volume) || volume < 0 || volume > 100)
      return Promise.resolve(
        failure(
          new ProgressiveStreamError(
            "STREAM_INVALID",
            "O volume deve estar entre 0 e 100.",
          ),
        ),
      );
    return this.playerCommand(input, (player) => player.setVolume(volume));
  }

  setMuted(input) {
    return this.playerCommand(input, (player) =>
      player.setMuted(input?.muted === true),
    );
  }

  selectAudio(input) {
    return this.playerCommand(input, (player) =>
      player.selectAudio(validId(input?.trackId, "faixa de áudio")),
    );
  }

  selectSubtitle(input) {
    return this.playerCommand(input, (player) =>
      player.selectSubtitle(
        input?.trackId === undefined
          ? undefined
          : validId(input.trackId, "faixa de legenda"),
      ),
    );
  }

  async stop(input) {
    try {
      const active = this.requireSession(input?.streamSessionId);
      if (
        input?.mutation?.expectedSeekGeneration !== undefined &&
        input.mutation.expectedSeekGeneration !== active.seekGeneration
      )
        throw new ProgressiveStreamError(
          "STREAM_CONFLICT",
          "A sessão de streaming foi substituída.",
        );
      active.stopped = true;
      active.pollToken += 1;
      active.state = "stopping";
      await this.daemon.stopStream(
        active.streamSessionId,
        active.seekGeneration,
      );
      if (active.playerStarted) await active.player.stop().catch(() => {});
      active.state = "stopped";
      this.publish("stream.stopped", active);
      this.sessions.delete(active.streamSessionId);
      return { ok: true, value: this.snapshot(active) };
    } catch (error) {
      return failure(error);
    }
  }

  async cancel(input) {
    try {
      const requestId = validId(input?.requestId, "solicitação");
      this.cancelledRequests.add(requestId);
      const active = [...this.sessions.values()].find(
        (session) => session.requestId === requestId,
      );
      if (!active) return { ok: true, value: { requestId, cancelled: false } };
      await this.stop({
        streamSessionId: active.streamSessionId,
        mutation: { expectedSeekGeneration: active.seekGeneration },
      });
      return { ok: true, value: { requestId, cancelled: true } };
    } catch (error) {
      return failure(error);
    }
  }

  async close() {
    await Promise.all(
      [...this.sessions.values()].map((active) =>
        this.stop({
          streamSessionId: active.streamSessionId,
          mutation: { expectedSeekGeneration: active.seekGeneration },
        }),
      ),
    );
    this.sourceResolver.close?.();
  }
}

module.exports = {
  ProgressiveStreamApplicationService,
  ProgressiveStreamError,
  TorrentStreamSourceResolver,
  failure,
};
