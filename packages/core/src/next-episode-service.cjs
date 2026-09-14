"use strict";

const { randomUUID } = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");

const PROTOCOL_VERSION = 1;
const SCHEMA_VERSION = 1;
const COUNTDOWN_SECONDS = 5;

class NextEpisodeError extends Error {
  constructor(code, publicMessage, retryable = false, cause) {
    super(publicMessage, cause ? { cause } : undefined);
    this.name = "NextEpisodeError";
    this.code = code;
    this.publicMessage = publicMessage;
    this.retryable = retryable;
  }
}

function failure(error) {
  const known = error instanceof NextEpisodeError;
  return {
    ok: false,
    error: {
      code: known ? error.code : "NEXT_STORAGE_FAILED",
      message: known
        ? error.publicMessage
        : "Não foi possível preparar o próximo episódio.",
      recoverable: known ? error.retryable : true,
      retryable: known ? error.retryable : true,
    },
  };
}

function validId(value, label) {
  if (
    typeof value !== "string" ||
    value.length < 2 ||
    value.length > 256 ||
    value.includes("\0")
  )
    throw new NextEpisodeError(
      "NEXT_INVALID",
      `A identidade de ${label} não é válida.`,
    );
  return value;
}

function parse(value, fallback = {}) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

class NextEpisodeApplicationService {
  constructor({ databasePath, preferences, selectionService }) {
    this.database = new DatabaseSync(databasePath);
    this.database.exec("PRAGMA journal_mode=WAL");
    this.database.exec("PRAGMA busy_timeout=5000");
    this.preferences = preferences;
    this.selectionService = selectionService;
    this.activePreparation = undefined;
    this.database.exec(`BEGIN IMMEDIATE;
      CREATE TABLE IF NOT EXISTS next_episode_sessions (
        session_id TEXT PRIMARY KEY,
        current_episode_id TEXT NOT NULL,
        next_episode_id TEXT,
        state TEXT NOT NULL CHECK(state IN ('resolved','preparing','ready','cancelled','started')),
        generation INTEGER NOT NULL,
        snapshot_json TEXT NOT NULL,
        selected_source_id TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_next_episode_current ON next_episode_sessions(current_episode_id,updated_at);
      CREATE TABLE IF NOT EXISTS next_episode_idempotency (
        idempotency_key TEXT PRIMARY KEY,
        operation TEXT NOT NULL,
        result_json TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      COMMIT;`);
  }

  episode(id) {
    return this.database
      .prepare(
        `SELECT e.content_id,e.series_content_id,e.season_number,e.episode_number,
                e.metadata_json,s.metadata_json AS series_metadata
         FROM episodes e JOIN series s ON s.content_id=e.series_content_id
         WHERE e.content_id=?`,
      )
      .get(id);
  }

  sources(episodeId) {
    const hasStorage = this.database
      .prepare(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name='storage_entries'",
      )
      .get();
    const hasDownloads = this.database
      .prepare(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name='downloads'",
      )
      .get();
    return this.database
      .prepare(
        `SELECT css.source_id,css.selector_json,ts.input_label,tr.metadata_json,
                ${hasStorage ? "EXISTS(SELECT 1 FROM storage_entries se WHERE se.source_id=css.source_id AND se.keep=1)" : "0"} AS kept,
                ${hasDownloads ? "EXISTS(SELECT 1 FROM downloads d WHERE d.content_id=css.content_id AND d.source_id=css.source_id AND d.state='complete')" : "0"} AS downloaded
         FROM content_source_selectors css
         JOIN torrent_sources ts ON ts.source_id=css.source_id
         JOIN torrent_runtimes tr ON tr.info_hash=ts.info_hash
         WHERE css.content_id=? ORDER BY css.created_at,css.source_id`,
      )
      .all(episodeId)
      .map((row) => {
        const selector = parse(row.selector_json);
        const file = (parse(row.metadata_json).files ?? []).find(
          (candidate) => candidate.id === selector.fileId,
        );
        return {
          sourceId: row.source_id,
          name: row.input_label,
          fileId: selector.fileId,
          completedLocal: Boolean(row.kept || row.downloaded),
          sizeBytes: file?.sizeBytes,
        };
      });
  }

  resolveValue(contentId) {
    const current = this.episode(contentId);
    if (!current) return { kind: "not-episode", message: "" };
    if (Number(current.season_number) === 0)
      return {
        kind: "series-end",
        message: "Especial concluído. Escolha outro episódio na série.",
      };
    const same = this.database
      .prepare(
        `SELECT content_id FROM episodes WHERE series_content_id=? AND season_number=? AND episode_number=?`,
      )
      .get(
        current.series_content_id,
        current.season_number,
        Number(current.episode_number) + 1,
      );
    const hasLaterSameSeason = this.database
      .prepare(
        `SELECT 1 FROM episodes WHERE series_content_id=? AND season_number=? AND episode_number>? LIMIT 1`,
      )
      .get(
        current.series_content_id,
        current.season_number,
        Number(current.episode_number) + 1,
      );
    if (!same && hasLaterSameSeason)
      return {
        kind: "missing",
        message:
          "Próximo episódio ausente. A sequência não será pulada automaticamente.",
      };
    const next =
      same ??
      this.database
        .prepare(
          `SELECT content_id FROM episodes WHERE series_content_id=? AND season_number=? AND episode_number=1`,
        )
        .get(current.series_content_id, Number(current.season_number) + 1);
    if (!next)
      return {
        kind: "series-end",
        message: "Fim de série. Nenhum próximo episódio cadastrado.",
      };
    const nextEpisode = this.episode(next.content_id);
    const metadata = parse(nextEpisode.metadata_json);
    const duration = Number(metadata.runtimeSeconds);
    if (!Number.isFinite(duration) || duration <= 0)
      return {
        kind: "missing",
        message: "O próximo episódio não possui duração válida.",
      };
    const candidates = this.sources(next.content_id);
    if (!candidates.length)
      return {
        kind: "missing",
        message: "Próximo episódio cadastrado, mas sem fonte disponível.",
      };
    const override = this.database
      .prepare("SELECT source_id FROM user_source_overrides WHERE content_id=?")
      .get(next.content_id)?.source_id;
    const ordered = [...candidates].sort(
      (left, right) =>
        Number(right.completedLocal) - Number(left.completedLocal) ||
        left.sourceId.localeCompare(right.sourceId),
    );
    const selected =
      ordered.find((item) => item.sourceId === override) ?? ordered[0];
    const seriesTitle = parse(current.series_metadata).title;
    const playback = (candidate) => ({
      id: next.content_id,
      title: `${seriesTitle} · S${nextEpisode.season_number}E${nextEpisode.episode_number}`,
      duration,
      sourceId: candidate.sourceId,
      sourceName: candidate.name,
      selector: candidate.fileId,
      available: true,
      progressive: !candidate.completedLocal,
    });
    const preferences = this.preferences();
    return {
      kind: same ? "next" : "season-end",
      message: same
        ? "Próximo episódio"
        : "Fim de temporada · próxima temporada disponível",
      next: playback(selected),
      choices: ordered.map(playback),
      requiresSourceChoice: !preferences.autoSelect && !override,
      _candidates: candidates,
    };
  }

  publicSnapshot(snapshot) {
    const publicValue = { ...snapshot };
    delete publicValue._candidates;
    return publicValue;
  }

  resolve(input) {
    try {
      const contentId = validId(input?.contentId, "episódio");
      const result = this.resolveValue(contentId);
      const existing = this.database
        .prepare(
          `SELECT snapshot_json FROM next_episode_sessions
           WHERE current_episode_id=? AND state IN ('resolved','preparing','ready')
           ORDER BY updated_at DESC LIMIT 1`,
        )
        .get(contentId);
      if (existing) return { ok: true, value: parse(existing.snapshot_json) };
      const sessionId = `next-session:${randomUUID()}`;
      const now = new Date().toISOString();
      const snapshot = this.publicSnapshot({
        ...result,
        schemaVersion: SCHEMA_VERSION,
        sessionId,
        generation: 1,
        currentEpisodeId: contentId,
        state: "resolved",
        countdownSeconds: COUNTDOWN_SECONDS,
        updatedAt: now,
      });
      this.database
        .prepare(
          `INSERT INTO next_episode_sessions(session_id,current_episode_id,next_episode_id,state,generation,snapshot_json,created_at,updated_at)
           VALUES(?,?,?,?,?,?,unixepoch(),unixepoch())`,
        )
        .run(
          sessionId,
          contentId,
          result.next?.id ?? null,
          "resolved",
          1,
          JSON.stringify(snapshot),
        );
      return { ok: true, value: snapshot };
    } catch (error) {
      return failure(error);
    }
  }

  row(sessionId, generation) {
    const row = this.database
      .prepare("SELECT * FROM next_episode_sessions WHERE session_id=?")
      .get(validId(sessionId, "sessão"));
    if (!row)
      throw new NextEpisodeError(
        "NEXT_NOT_FOUND",
        "A sequência não foi encontrada.",
      );
    if (row.generation !== generation)
      throw new NextEpisodeError(
        "NEXT_CONFLICT",
        "A geração da sequência mudou.",
        true,
      );
    return row;
  }

  replay(key, operation) {
    const row = this.database
      .prepare(
        "SELECT operation,result_json FROM next_episode_idempotency WHERE idempotency_key=?",
      )
      .get(validId(key, "idempotência"));
    if (!row) return undefined;
    if (row.operation !== operation)
      throw new NextEpisodeError(
        "NEXT_CONFLICT",
        "A chave já foi usada em outra operação.",
      );
    return parse(row.result_json);
  }

  save(row, state, selectedSourceId, key, operation) {
    const snapshot = {
      ...parse(row.snapshot_json),
      state,
      ...(selectedSourceId ? { selectedSourceId } : {}),
      updatedAt: new Date().toISOString(),
    };
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database
        .prepare(
          "UPDATE next_episode_sessions SET state=?,selected_source_id=?,snapshot_json=?,updated_at=unixepoch() WHERE session_id=?",
        )
        .run(
          state,
          selectedSourceId ?? row.selected_source_id,
          JSON.stringify(snapshot),
          row.session_id,
        );
      this.database
        .prepare(
          "INSERT INTO next_episode_idempotency(idempotency_key,operation,result_json,created_at) VALUES(?,?,?,unixepoch())",
        )
        .run(key, operation, JSON.stringify(snapshot));
      this.database.exec("COMMIT");
      return snapshot;
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  async prepare(input) {
    try {
      const key = validId(input?.mutation?.idempotencyKey, "idempotência");
      const replay = this.replay(key, "prepare");
      if (replay) return { ok: true, value: replay };
      const row = this.row(input.sessionId, input.generation);
      if (["cancelled", "started"].includes(row.state))
        throw new NextEpisodeError(
          "NEXT_CONFLICT",
          "A sequência já foi encerrada.",
        );
      const sourceId = validId(input.sourceId, "source");
      const value = parse(row.snapshot_json);
      const resolved = this.resolveValue(row.current_episode_id);
      const candidate = resolved._candidates?.find(
        (item) => item.sourceId === sourceId,
      );
      if (!candidate)
        throw new NextEpisodeError(
          "NEXT_INVALID",
          "A source não pertence ao próximo episódio.",
        );
      if (
        this.activePreparation &&
        this.activePreparation.sessionId !== row.session_id
      )
        throw new NextEpisodeError(
          "NEXT_CONFLICT",
          "Outro próximo episódio já está em preparação.",
          true,
        );
      const requestId = `next-selection:${randomUUID()}`;
      this.activePreparation = { sessionId: row.session_id, requestId };
      this.database
        .prepare(
          "UPDATE next_episode_sessions SET state='preparing',updated_at=unixepoch() WHERE session_id=?",
        )
        .run(row.session_id);
      try {
        let selectedSourceId = sourceId;
        if (!candidate.completedLocal) {
          const preferences = this.preferences();
          const selection = await this.selectionService.preflight({
            requestId,
            contentId: value.next.id,
            context: "next-episode",
            strategy: ["balanced", "quality", "fast", "smallest"].includes(
              preferences.strategy,
            )
              ? preferences.strategy
              : "balanced",
            resolutionLimit: ["720p", "1080p", "2160p"].includes(
              preferences.resolution,
            )
              ? preferences.resolution
              : "2160p",
            candidates: resolved._candidates,
          });
          if (!selection.ok || !selection.value.selectedSourceId)
            throw new NextEpisodeError(
              "NEXT_PREPARATION_FAILED",
              selection.error?.message ??
                "Nenhuma source viável foi encontrada.",
              true,
            );
          selectedSourceId = selection.value.selectedSourceId;
        }
        const current = this.row(input.sessionId, input.generation);
        if (current.state === "cancelled")
          throw new NextEpisodeError(
            "NEXT_CANCELLED",
            "O próximo episódio foi cancelado.",
          );
        const selectedPlayback = value.choices?.find(
          (choice) => choice.sourceId === selectedSourceId,
        );
        if (selectedPlayback)
          current.snapshot_json = JSON.stringify({
            ...parse(current.snapshot_json),
            next: selectedPlayback,
          });
        return {
          ok: true,
          value: this.save(current, "ready", selectedSourceId, key, "prepare"),
        };
      } finally {
        if (this.activePreparation?.sessionId === row.session_id)
          this.activePreparation = undefined;
      }
    } catch (error) {
      return failure(error);
    }
  }

  transition(input, operation, state) {
    try {
      const key = validId(input?.mutation?.idempotencyKey, "idempotência");
      const replay = this.replay(key, operation);
      if (replay) return { ok: true, value: replay };
      const row = this.row(input.sessionId, input.generation);
      if (operation === "start" && row.state !== "ready")
        throw new NextEpisodeError(
          row.state === "cancelled" ? "NEXT_CANCELLED" : "NEXT_CONFLICT",
          row.state === "cancelled"
            ? "O próximo episódio foi cancelado."
            : "O próximo episódio ainda não está pronto.",
        );
      if (operation === "cancel" && row.state === "started")
        throw new NextEpisodeError(
          "NEXT_CONFLICT",
          "O próximo episódio já iniciou.",
        );
      return {
        ok: true,
        value: this.save(row, state, undefined, key, operation),
      };
    } catch (error) {
      return failure(error);
    }
  }

  cancel(input) {
    if (this.activePreparation?.sessionId === input?.sessionId)
      this.selectionService.cancel({
        requestId: this.activePreparation.requestId,
      });
    return this.transition(input, "cancel", "cancelled");
  }

  claimStart(input) {
    return this.transition(input, "start", "started");
  }

  close() {
    this.database.close();
  }
}

module.exports = {
  COUNTDOWN_SECONDS,
  NextEpisodeApplicationService,
  NextEpisodeError,
  PROTOCOL_VERSION,
  SCHEMA_VERSION,
  failure,
};
