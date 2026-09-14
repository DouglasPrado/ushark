"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const DATABASE_SCHEMA_VERSION = 10;
const PLAYBACK_SCHEMA_VERSION = 1;
const HISTORY_MAXIMUM = 500;

class PlaybackStoreError extends Error {
  constructor(code, publicMessage, retryable = false, cause) {
    super(publicMessage, cause ? { cause } : undefined);
    this.name = "PlaybackStoreError";
    this.code = code;
    this.publicMessage = publicMessage;
    this.retryable = retryable;
  }
}

function success(value) {
  return { ok: true, value };
}

function failure(error) {
  const known = error instanceof PlaybackStoreError;
  return {
    ok: false,
    error: {
      code: known ? error.code : "PLAYBACK_STORAGE_FAILED",
      message: known
        ? error.publicMessage
        : "Não foi possível salvar o estado de reprodução.",
      recoverable: known ? error.retryable : true,
      retryable: known ? error.retryable : true,
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
    throw new PlaybackStoreError(
      "PLAYBACK_INVALID",
      `A identidade de ${label} não é válida.`,
    );
  return value;
}

function position(value, label = "posição") {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0)
    throw new PlaybackStoreError(
      "PLAYBACK_INVALID",
      `A ${label} de reprodução não é válida.`,
    );
  return value;
}

function optionalDuration(value) {
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0)
    throw new PlaybackStoreError(
      "PLAYBACK_INVALID",
      "A duração da mídia não é válida.",
    );
  return value;
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return structuredClone(fallback);
  }
}

function iso(epochSeconds) {
  return new Date(Number(epochSeconds) * 1_000).toISOString();
}

class PlaybackStore {
  constructor(databasePath) {
    if (typeof databasePath !== "string" || !path.isAbsolute(databasePath))
      throw new PlaybackStoreError(
        "PLAYBACK_INVALID",
        "O banco local de reprodução não é válido.",
      );
    this.databasePath = databasePath;
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath);
    if (process.platform !== "win32") fs.chmodSync(databasePath, 0o600);
    this.database.exec("PRAGMA journal_mode = WAL");
    this.database.exec("PRAGMA busy_timeout = 5000");
    this.database.exec("PRAGMA foreign_keys = ON");
    this.migrate();
    this.secureDatabaseFiles();
  }

  secureDatabaseFiles() {
    if (process.platform === "win32") return;
    for (const candidate of [
      this.databasePath,
      `${this.databasePath}-wal`,
      `${this.databasePath}-shm`,
    ])
      if (fs.existsSync(candidate)) fs.chmodSync(candidate, 0o600);
  }

  migrate() {
    const base = this.database
      .prepare(
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'user_content_state'",
      )
      .get();
    if (!base)
      throw new PlaybackStoreError(
        "PLAYBACK_STORAGE_FAILED",
        "Conclua o catálogo local antes de abrir o player.",
      );
    const current = Number(
      this.database
        .prepare("SELECT MAX(version) AS version FROM schema_migrations")
        .get()?.version ?? 0,
    );
    if (current > DATABASE_SCHEMA_VERSION)
      throw new PlaybackStoreError(
        "PLAYBACK_PROTOCOL_UNSUPPORTED",
        "O banco local pertence a uma versão mais nova do Ushark.",
      );
    this.database.exec(`
      BEGIN IMMEDIATE;
      CREATE TABLE IF NOT EXISTS playback_sessions (
        id TEXT PRIMARY KEY,
        generation INTEGER NOT NULL,
        content_id TEXT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
        source_id TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        first_frame_at INTEGER,
        ended_at INTEGER,
        start_position REAL NOT NULL,
        end_position REAL NOT NULL,
        duration REAL,
        status TEXT NOT NULL CHECK(status IN (
          'launching', 'playing', 'paused', 'seeking', 'ended', 'stopped', 'error'
        )),
        reason TEXT,
        startup_ms INTEGER,
        metrics_json TEXT NOT NULL DEFAULT '{}',
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_playback_sessions_content_started
        ON playback_sessions(content_id, started_at DESC, id);
      CREATE INDEX IF NOT EXISTS idx_playback_sessions_open
        ON playback_sessions(ended_at, status, id);
      CREATE TABLE IF NOT EXISTS playback_progress (
        content_id TEXT PRIMARY KEY REFERENCES contents(id) ON DELETE CASCADE,
        position REAL NOT NULL,
        duration REAL,
        watched INTEGER NOT NULL CHECK(watched IN (0, 1)),
        completed_at INTEGER,
        last_played_at INTEGER NOT NULL,
        revision INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS playback_idempotency (
        idempotency_key TEXT PRIMARY KEY,
        operation TEXT NOT NULL,
        result_json TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      INSERT OR IGNORE INTO schema_migrations(version, name, applied_at)
      VALUES (10, 'm05_playback_state', unixepoch());
      COMMIT;
    `);
  }

  requireContentAndSource(contentId, sourceId) {
    validateId(contentId, "conteúdo");
    validateId(sourceId, "source");
    const content = this.database
      .prepare("SELECT id FROM contents WHERE id = ?")
      .get(contentId);
    if (!content)
      throw new PlaybackStoreError(
        "PLAYBACK_NOT_FOUND",
        "O conteúdo não foi encontrado.",
      );
    const linked = this.database
      .prepare(
        `SELECT 1 FROM content_sources WHERE content_id = ? AND source_id = ?
         UNION ALL
         SELECT 1 FROM content_source_selectors WHERE content_id = ? AND source_id = ?
         LIMIT 1`,
      )
      .get(contentId, sourceId, contentId, sourceId);
    if (!linked)
      throw new PlaybackStoreError(
        "PLAYBACK_SOURCE_UNAVAILABLE",
        "A source selecionada não pertence a este conteúdo.",
        true,
      );
  }

  begin(input) {
    try {
      const sessionId = validateId(input?.sessionId, "sessão");
      const contentId = validateId(input?.contentId, "conteúdo");
      const sourceId = validateId(input?.sourceId, "source");
      const startPosition = position(input?.startPositionSeconds ?? 0);
      if (!Number.isInteger(input?.generation) || input.generation < 1)
        throw new PlaybackStoreError(
          "PLAYBACK_INVALID",
          "A geração da sessão não é válida.",
        );
      this.requireContentAndSource(contentId, sourceId);
      this.database
        .prepare(
          `INSERT INTO playback_sessions(
             id, generation, content_id, source_id, started_at,
             start_position, end_position, status, updated_at
           ) VALUES (?, ?, ?, ?, unixepoch(), ?, ?, 'launching', unixepoch())`,
        )
        .run(
          sessionId,
          input.generation,
          contentId,
          sourceId,
          startPosition,
          startPosition,
        );
      return success(this.readSessionValue(sessionId));
    } catch (error) {
      return failure(error);
    }
  }

  markFirstFrame(input) {
    try {
      const session = this.requireOpenSession(input);
      const startupMs = Math.max(0, Date.now() - session.started_at * 1_000);
      this.database
        .prepare(
          `UPDATE playback_sessions SET status = 'playing',
             first_frame_at = COALESCE(first_frame_at, unixepoch()),
             startup_ms = COALESCE(startup_ms, ?), updated_at = unixepoch()
           WHERE id = ? AND generation = ?`,
        )
        .run(startupMs, session.id, session.generation);
      return success(this.readSessionValue(session.id));
    } catch (error) {
      return failure(error);
    }
  }

  setState(input) {
    try {
      const session = this.requireOpenSession(input);
      if (!["playing", "paused", "seeking"].includes(input?.state))
        throw new PlaybackStoreError(
          "PLAYBACK_INVALID",
          "O estado do player não é válido.",
        );
      this.database
        .prepare(
          "UPDATE playback_sessions SET status = ?, updated_at = unixepoch() WHERE id = ? AND generation = ?",
        )
        .run(input.state, session.id, session.generation);
      return success(this.readSessionValue(session.id));
    } catch (error) {
      return failure(error);
    }
  }

  requireOpenSession(input) {
    const sessionId = validateId(input?.sessionId, "sessão");
    if (!Number.isInteger(input?.generation) || input.generation < 1)
      throw new PlaybackStoreError(
        "PLAYBACK_INVALID",
        "A geração da sessão não é válida.",
      );
    const session = this.database
      .prepare("SELECT * FROM playback_sessions WHERE id = ?")
      .get(sessionId);
    if (!session)
      throw new PlaybackStoreError(
        "PLAYBACK_NOT_FOUND",
        "A sessão de reprodução não foi encontrada.",
      );
    if (session.generation !== input.generation)
      throw new PlaybackStoreError(
        "PLAYBACK_CONFLICT",
        "A sessão de reprodução foi substituída.",
      );
    if (session.ended_at !== null)
      throw new PlaybackStoreError(
        "PLAYBACK_CONFLICT",
        "A sessão de reprodução já foi encerrada.",
      );
    return session;
  }

  persist(input) {
    try {
      const key = validateId(input?.idempotencyKey, "operação");
      const replay = this.database
        .prepare(
          "SELECT result_json FROM playback_idempotency WHERE idempotency_key = ? AND operation = 'persist'",
        )
        .get(key);
      if (replay) return success(parseJson(replay.result_json, {}));
      const session = this.requireOpenSession(input);
      const currentPosition = position(input.positionSeconds);
      const duration = optionalDuration(input.durationSeconds);
      const now = Math.floor(Date.now() / 1_000);
      this.database.exec("BEGIN IMMEDIATE");
      try {
        this.database
          .prepare(
            `UPDATE playback_sessions SET end_position = ?, duration = ?,
               metrics_json = ?, updated_at = ?
             WHERE id = ? AND generation = ?`,
          )
          .run(
            currentPosition,
            duration ?? null,
            JSON.stringify(input.metrics ?? {}),
            now,
            session.id,
            session.generation,
          );
        const previous = this.database
          .prepare(
            "SELECT revision, watched, completed_at FROM playback_progress WHERE content_id = ?",
          )
          .get(session.content_id);
        const watched = previous?.watched === 1;
        const revision = Number(previous?.revision ?? 0) + 1;
        this.database
          .prepare(
            `INSERT INTO playback_progress(
               content_id, position, duration, watched, completed_at,
               last_played_at, revision
             ) VALUES (?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(content_id) DO UPDATE SET
               position = excluded.position,
               duration = COALESCE(excluded.duration, playback_progress.duration),
               watched = MAX(playback_progress.watched, excluded.watched),
               completed_at = COALESCE(playback_progress.completed_at, excluded.completed_at),
               last_played_at = excluded.last_played_at,
               revision = excluded.revision`,
          )
          .run(
            session.content_id,
            currentPosition,
            duration ?? null,
            watched ? 1 : 0,
            previous?.completed_at ?? null,
            now,
            revision,
          );
        this.database
          .prepare(
            "UPDATE user_content_state SET progress = ?, updated_at = ? WHERE content_id = ?",
          )
          .run(Math.round(currentPosition), now, session.content_id);
        const snapshot = this.readProgressValue(session.content_id);
        this.database
          .prepare(
            `INSERT INTO playback_idempotency(
               idempotency_key, operation, result_json, created_at
             ) VALUES (?, 'persist', ?, ?)`,
          )
          .run(key, JSON.stringify(snapshot), now);
        this.database.exec("COMMIT");
        return success(snapshot);
      } catch (error) {
        this.database.exec("ROLLBACK");
        throw error;
      }
    } catch (error) {
      return failure(error);
    }
  }

  stop(input) {
    try {
      const key = validateId(input?.idempotencyKey, "operação");
      const replay = this.database
        .prepare(
          "SELECT result_json FROM playback_idempotency WHERE idempotency_key = ? AND operation = 'stop'",
        )
        .get(key);
      if (replay) return success(parseJson(replay.result_json, {}));
      const session = this.requireOpenSession(input);
      const currentPosition = position(input.positionSeconds);
      const duration = optionalDuration(input.durationSeconds);
      if (!["user", "ended", "error", "shutdown"].includes(input.reason))
        throw new PlaybackStoreError(
          "PLAYBACK_INVALID",
          "O motivo de encerramento não é válido.",
        );
      const watched =
        input.reason === "ended" ||
        (duration !== undefined && currentPosition >= duration * 0.9);
      const now = Math.floor(Date.now() / 1_000);
      this.database.exec("BEGIN IMMEDIATE");
      try {
        this.database
          .prepare(
            `UPDATE playback_sessions SET status = ?, reason = ?, ended_at = ?,
               end_position = ?, duration = ?, metrics_json = ?, updated_at = ?
             WHERE id = ? AND generation = ?`,
          )
          .run(
            input.reason === "ended"
              ? "ended"
              : input.reason === "error"
                ? "error"
                : "stopped",
            input.reason,
            now,
            currentPosition,
            duration ?? null,
            JSON.stringify(input.metrics ?? {}),
            now,
            session.id,
            session.generation,
          );
        const previous = this.database
          .prepare(
            "SELECT revision, watched, completed_at FROM playback_progress WHERE content_id = ?",
          )
          .get(session.content_id);
        const completed = watched || previous?.watched === 1;
        const revision = Number(previous?.revision ?? 0) + 1;
        this.database
          .prepare(
            `INSERT INTO playback_progress(
               content_id, position, duration, watched, completed_at,
               last_played_at, revision
             ) VALUES (?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(content_id) DO UPDATE SET
               position = excluded.position,
               duration = COALESCE(excluded.duration, playback_progress.duration),
               watched = MAX(playback_progress.watched, excluded.watched),
               completed_at = COALESCE(playback_progress.completed_at, excluded.completed_at),
               last_played_at = excluded.last_played_at,
               revision = excluded.revision`,
          )
          .run(
            session.content_id,
            currentPosition,
            duration ?? null,
            completed ? 1 : 0,
            completed ? (previous?.completed_at ?? now) : null,
            now,
            revision,
          );
        const state = this.database
          .prepare(
            "SELECT history_json FROM user_content_state WHERE content_id = ?",
          )
          .get(session.content_id);
        const history = parseJson(state?.history_json, []);
        const entries = Array.isArray(history) ? history : [];
        entries.push({
          sessionId: session.id,
          sourceId: session.source_id,
          startedAt: iso(session.started_at),
          endedAt: iso(now),
          positionSeconds: currentPosition,
          durationSeconds: duration,
          watched: completed,
          reason: input.reason,
        });
        this.database
          .prepare(
            `UPDATE user_content_state SET progress = ?, history_json = ?,
               updated_at = ? WHERE content_id = ?`,
          )
          .run(
            Math.round(currentPosition),
            JSON.stringify(entries.slice(-HISTORY_MAXIMUM)),
            now,
            session.content_id,
          );
        const snapshot = this.readProgressValue(session.content_id);
        this.database
          .prepare(
            `INSERT INTO playback_idempotency(
               idempotency_key, operation, result_json, created_at
             ) VALUES (?, 'stop', ?, ?)`,
          )
          .run(key, JSON.stringify(snapshot), now);
        this.database.exec("COMMIT");
        return success(snapshot);
      } catch (error) {
        this.database.exec("ROLLBACK");
        throw error;
      }
    } catch (error) {
      return failure(error);
    }
  }

  recoverInterrupted() {
    try {
      const result = this.database
        .prepare(
          `UPDATE playback_sessions SET status = 'error', reason = 'error',
             ended_at = unixepoch(), updated_at = unixepoch()
           WHERE ended_at IS NULL`,
        )
        .run();
      return success({ recoveredSessions: Number(result.changes) });
    } catch (error) {
      return failure(error);
    }
  }

  readSessionValue(sessionId) {
    const row = this.database
      .prepare("SELECT * FROM playback_sessions WHERE id = ?")
      .get(sessionId);
    if (!row)
      throw new PlaybackStoreError(
        "PLAYBACK_NOT_FOUND",
        "A sessão de reprodução não foi encontrada.",
      );
    return {
      schemaVersion: PLAYBACK_SCHEMA_VERSION,
      sessionId: row.id,
      generation: row.generation,
      contentId: row.content_id,
      sourceId: row.source_id,
      state: row.status,
      positionSeconds: Number(row.end_position),
      durationSeconds: row.duration === null ? undefined : Number(row.duration),
      startedAt: iso(row.started_at),
      firstFrameAt:
        row.first_frame_at === null ? undefined : iso(row.first_frame_at),
      endedAt: row.ended_at === null ? undefined : iso(row.ended_at),
      startupMs: row.startup_ms === null ? undefined : row.startup_ms,
      metrics: parseJson(row.metrics_json, {}),
      reason: row.reason ?? undefined,
    };
  }

  readSession(input) {
    try {
      return success(
        this.readSessionValue(validateId(input?.sessionId, "sessão")),
      );
    } catch (error) {
      return failure(error);
    }
  }

  readProgressValue(contentId) {
    const row = this.database
      .prepare("SELECT * FROM playback_progress WHERE content_id = ?")
      .get(contentId);
    if (!row) return undefined;
    return {
      schemaVersion: PLAYBACK_SCHEMA_VERSION,
      contentId: row.content_id,
      positionSeconds: Number(row.position),
      durationSeconds: row.duration === null ? undefined : Number(row.duration),
      watched: row.watched === 1,
      completedAt:
        row.completed_at === null ? undefined : iso(row.completed_at),
      lastPlayedAt: iso(row.last_played_at),
      revision: row.revision,
    };
  }

  readProgress(input) {
    try {
      const contentId = validateId(input?.contentId, "conteúdo");
      return success(this.readProgressValue(contentId));
    } catch (error) {
      return failure(error);
    }
  }

  close() {
    this.secureDatabaseFiles();
    this.database.close();
  }
}

class PlaybackProgressJournal {
  constructor(store, options = {}) {
    this.store = store;
    this.intervalMs = options.intervalMs ?? 5_000;
    this.now = options.now ?? Date.now;
    this.entries = new Map();
  }

  record(input, options = {}) {
    const sessionId = validateId(input?.sessionId, "sessão");
    const generation = input?.generation;
    const key = `${sessionId}\0${generation}`;
    const entry = this.entries.get(key) ?? {
      sequence: 0,
      lastPersistedAt: Number.NEGATIVE_INFINITY,
      latest: undefined,
    };
    entry.latest = structuredClone(input);
    const now = this.now();
    if (!options.force && now - entry.lastPersistedAt < this.intervalMs) {
      this.entries.set(key, entry);
      return success({ persisted: false });
    }
    entry.sequence += 1;
    const result = this.store.persist({
      ...entry.latest,
      idempotencyKey: `playback-progress:${sessionId}:${generation}:${entry.sequence}`,
    });
    if (result.ok) entry.lastPersistedAt = now;
    this.entries.set(key, entry);
    return result.ok
      ? success({ persisted: true, progress: result.value })
      : result;
  }

  flush(input) {
    return this.record(input, { force: true });
  }

  stop(input) {
    const sessionId = validateId(input?.sessionId, "sessão");
    const generation = input?.generation;
    const key = `${sessionId}\0${generation}`;
    const result = this.store.stop(input);
    if (result.ok) this.entries.delete(key);
    return result;
  }
}

module.exports = {
  DATABASE_SCHEMA_VERSION,
  HISTORY_MAXIMUM,
  PLAYBACK_SCHEMA_VERSION,
  PlaybackProgressJournal,
  PlaybackStore,
  PlaybackStoreError,
};
