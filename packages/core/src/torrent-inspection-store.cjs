"use strict";

const { Buffer } = require("node:buffer");
const { randomUUID } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const DATABASE_SCHEMA_VERSION = 10;
const TORRENT_SCHEMA_VERSION = 1;
const INFO_HASH = /^[a-f0-9]{40}$/;

class TorrentInspectionStoreError extends Error {
  constructor(code, publicMessage, retryable = false, cause) {
    super(publicMessage, cause ? { cause } : undefined);
    this.name = "TorrentInspectionStoreError";
    this.code = code;
    this.publicMessage = publicMessage;
    this.retryable = retryable;
  }
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function validateId(value, label) {
  if (
    typeof value !== "string" ||
    value.length < 3 ||
    value.length > 160 ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]+$/.test(value)
  )
    throw new TorrentInspectionStoreError(
      "TORRENT_INPUT_INVALID",
      `A identidade de ${label} não é válida.`,
    );
  return value;
}

function validateInfoHash(value) {
  if (typeof value !== "string" || !INFO_HASH.test(value))
    throw new TorrentInspectionStoreError(
      "TORRENT_INPUT_INVALID",
      "O infoHash não é válido.",
    );
  return value;
}

function validateInputType(value) {
  if (value !== "magnet" && value !== "torrent-file")
    throw new TorrentInspectionStoreError(
      "TORRENT_INPUT_INVALID",
      "O tipo de entrada torrent não é válido.",
    );
  return value;
}

function validateLabel(value) {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    Buffer.byteLength(value, "utf8") > 512 ||
    value.includes("\0")
  )
    throw new TorrentInspectionStoreError(
      "TORRENT_INPUT_INVALID",
      "O nome seguro da entrada não é válido.",
    );
  return value.trim();
}

function validateMutation(value) {
  if (!isPlainObject(value))
    throw new TorrentInspectionStoreError(
      "TORRENT_INPUT_INVALID",
      "A mutação torrent não é válida.",
    );
  return validateId(value.idempotencyKey, "idempotência");
}

function validateFiles(value) {
  if (!Array.isArray(value) || value.length > 10_000)
    throw new TorrentInspectionStoreError(
      "TORRENT_INPUT_INVALID",
      "A lista de arquivos torrent não é válida.",
    );
  const ids = new Set();
  for (const file of value) {
    if (
      !isPlainObject(file) ||
      typeof file.id !== "string" ||
      ids.has(file.id) ||
      typeof file.path !== "string" ||
      !Number.isSafeInteger(file.sizeBytes) ||
      file.sizeBytes < 0
    )
      throw new TorrentInspectionStoreError(
        "TORRENT_INPUT_INVALID",
        "Um arquivo torrent não é válido.",
      );
    ids.add(file.id);
  }
  return structuredClone(value);
}

function validateSelector(value, files) {
  if (!isPlainObject(value) || typeof value.type !== "string")
    throw new TorrentInspectionStoreError(
      "TORRENT_INPUT_INVALID",
      "O selector torrent não é válido.",
    );
  if (value.type === "largest-video") {
    if (
      !files.some((file) => file.kind === "video" && file.selectable === true)
    )
      throw new TorrentInspectionStoreError(
        "TORRENT_INPUT_INVALID",
        "O torrent não possui vídeo principal selecionável.",
      );
    return { type: "largest-video" };
  }
  if (value.type === "episode") {
    if (
      !Number.isInteger(value.season) ||
      value.season < 0 ||
      !Number.isInteger(value.episode) ||
      value.episode < 0
    )
      throw new TorrentInspectionStoreError(
        "TORRENT_INPUT_INVALID",
        "O selector de episódio não é válido.",
      );
    if (value.fileId !== undefined) validateSelectedFile(value.fileId, files);
    return {
      type: "episode",
      season: value.season,
      episode: value.episode,
      fileId: value.fileId,
    };
  }
  if (value.type === "manual" || value.type === "filename") {
    validateSelectedFile(value.fileId, files);
    return { type: value.type, fileId: value.fileId };
  }
  throw new TorrentInspectionStoreError(
    "TORRENT_INPUT_INVALID",
    "O tipo de selector torrent não é suportado.",
  );
}

function validateSelectedFile(fileId, files) {
  const file = files.find((candidate) => candidate.id === fileId);
  if (!file || file.kind !== "video" || file.selectable !== true)
    throw new TorrentInspectionStoreError(
      "TORRENT_INPUT_INVALID",
      "Escolha um arquivo de vídeo válido; samples e extras não são automáticos.",
    );
}

function success(value) {
  return { ok: true, value };
}

function failure(error) {
  const known = error instanceof TorrentInspectionStoreError;
  return {
    ok: false,
    error: {
      code: known ? error.code : "TORRENT_STORAGE_FAILED",
      message: known
        ? error.publicMessage
        : "Não foi possível salvar o torrent. O estado anterior foi preservado.",
      recoverable: known ? error.retryable : true,
      retryable: known ? error.retryable : true,
    },
  };
}

class TorrentInspectionStore {
  constructor(databasePath) {
    if (typeof databasePath !== "string" || !path.isAbsolute(databasePath))
      throw new TorrentInspectionStoreError(
        "TORRENT_INPUT_INVALID",
        "O banco local de torrents não é válido.",
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
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'contents'",
      )
      .get();
    if (!base)
      throw new TorrentInspectionStoreError(
        "TORRENT_STORAGE_FAILED",
        "Conclua o catálogo local antes de abrir torrents.",
      );
    const current = this.database
      .prepare("SELECT MAX(version) AS version FROM schema_migrations")
      .get();
    if (Number(current?.version ?? 0) > DATABASE_SCHEMA_VERSION)
      throw new TorrentInspectionStoreError(
        "TORRENT_PROTOCOL_UNSUPPORTED",
        "O banco local pertence a uma versão mais nova do Ushark.",
      );
    this.database.exec(`
      BEGIN IMMEDIATE;
      CREATE TABLE IF NOT EXISTS torrent_runtimes (
        info_hash TEXT PRIMARY KEY,
        torrent_id TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        metadata_json TEXT NOT NULL,
        managed_torrent_path TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS torrent_sources (
        source_id TEXT PRIMARY KEY,
        info_hash TEXT NOT NULL UNIQUE REFERENCES torrent_runtimes(info_hash) ON DELETE RESTRICT,
        input_type TEXT NOT NULL CHECK(input_type IN ('magnet', 'torrent-file')),
        input_label TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS content_source_selectors (
        content_source_id TEXT PRIMARY KEY,
        content_id TEXT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
        source_id TEXT NOT NULL REFERENCES torrent_sources(source_id) ON DELETE RESTRICT,
        selector_json TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(content_id, source_id)
      );
      CREATE TABLE IF NOT EXISTS torrent_pending (
        pending_id TEXT PRIMARY KEY,
        operation_id TEXT NOT NULL UNIQUE,
        input_type TEXT NOT NULL CHECK(input_type IN ('magnet', 'torrent-file')),
        input_label TEXT NOT NULL,
        private_input TEXT NOT NULL,
        snapshot_json TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS torrent_idempotency (
        idempotency_key TEXT PRIMARY KEY,
        operation TEXT NOT NULL,
        result_json TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      INSERT OR IGNORE INTO schema_migrations(version, name, applied_at)
      VALUES (5, 'm06_torrent_inspection', unixepoch());
      COMMIT;
    `);
  }

  replay(key, operation) {
    const row = this.database
      .prepare(
        "SELECT operation, result_json FROM torrent_idempotency WHERE idempotency_key = ?",
      )
      .get(key);
    if (!row) return undefined;
    if (row.operation !== operation)
      throw new TorrentInspectionStoreError(
        "TORRENT_INPUT_INVALID",
        "A chave de idempotência já pertence a outra operação.",
      );
    return JSON.parse(row.result_json);
  }

  remember(key, operation, result) {
    this.database
      .prepare(
        "INSERT INTO torrent_idempotency(idempotency_key, operation, result_json, created_at) VALUES (?, ?, ?, unixepoch())",
      )
      .run(key, operation, JSON.stringify(result));
  }

  publicPending(row) {
    const snapshot = JSON.parse(row.snapshot_json);
    return {
      schemaVersion: TORRENT_SCHEMA_VERSION,
      pendingId: row.pending_id,
      inputType: row.input_type,
      inputLabel: row.input_label,
      attempts: Number(row.attempts),
      operation: snapshot,
    };
  }

  savePending(input) {
    try {
      const key = validateMutation(input.mutation);
      const replay = this.replay(key, "save-pending");
      if (replay) return success(replay);
      const requestedPendingId = input.pendingId
        ? validateId(input.pendingId, "pendência")
        : `pending:${randomUUID()}`;
      const operationId = validateId(input.operationId, "operação");
      const existingPending = this.database
        .prepare(
          "SELECT pending_id FROM torrent_pending WHERE operation_id = ?",
        )
        .get(operationId);
      const pendingId = existingPending?.pending_id ?? requestedPendingId;
      const inputType = validateInputType(input.inputType);
      const inputLabel = validateLabel(input.inputLabel);
      if (
        typeof input.privateInput !== "string" ||
        !input.privateInput ||
        Buffer.byteLength(input.privateInput, "utf8") > 10 * 1024 * 1024
      )
        throw new TorrentInspectionStoreError(
          "TORRENT_INPUT_INVALID",
          "A entrada privada da pendência não é válida.",
        );
      if (!isPlainObject(input.snapshot))
        throw new TorrentInspectionStoreError(
          "TORRENT_INPUT_INVALID",
          "O snapshot da pendência não é válido.",
        );
      const snapshot = structuredClone(input.snapshot);
      delete snapshot.magnet;
      delete snapshot.path;
      const result = {
        schemaVersion: TORRENT_SCHEMA_VERSION,
        pendingId,
        inputType,
        inputLabel,
        attempts: 0,
        operation: snapshot,
      };
      this.database.exec("BEGIN IMMEDIATE");
      try {
        this.database
          .prepare(
            `INSERT INTO torrent_pending(
               pending_id, operation_id, input_type, input_label, private_input,
               snapshot_json, attempts, created_at, updated_at
             ) VALUES (?, ?, ?, ?, ?, ?, 0, unixepoch(), unixepoch())
             ON CONFLICT(operation_id) DO UPDATE SET
               input_label = excluded.input_label,
               private_input = excluded.private_input,
               snapshot_json = excluded.snapshot_json,
               updated_at = unixepoch()`,
          )
          .run(
            pendingId,
            operationId,
            inputType,
            inputLabel,
            input.privateInput,
            JSON.stringify(snapshot),
          );
        this.remember(key, "save-pending", result);
        this.database.exec("COMMIT");
      } catch (error) {
        this.database.exec("ROLLBACK");
        throw error;
      }
      return success(result);
    } catch (error) {
      return failure(error);
    }
  }

  listPending() {
    try {
      const rows = this.database
        .prepare(
          `SELECT pending_id, input_type, input_label, snapshot_json, attempts
           FROM torrent_pending ORDER BY created_at, pending_id`,
        )
        .all();
      return success(rows.map((row) => this.publicPending(row)));
    } catch (error) {
      return failure(error);
    }
  }

  loadPendingForRetry(input) {
    try {
      const pendingId = validateId(input.pendingId, "pendência");
      const key = validateMutation(input.mutation);
      const replay = this.replay(key, "retry-pending");
      if (replay) return success(replay);
      const row = this.database
        .prepare(
          `SELECT pending_id, operation_id, input_type, input_label, private_input,
                  snapshot_json, attempts
           FROM torrent_pending WHERE pending_id = ?`,
        )
        .get(pendingId);
      if (!row)
        throw new TorrentInspectionStoreError(
          "TORRENT_NOT_FOUND",
          "A tentativa pendente não foi encontrada.",
        );
      const result = {
        pendingId: row.pending_id,
        operationId: row.operation_id,
        inputType: row.input_type,
        inputLabel: row.input_label,
        privateInput: row.private_input,
        attempts: Number(row.attempts) + 1,
      };
      this.database.exec("BEGIN IMMEDIATE");
      try {
        this.database
          .prepare(
            "UPDATE torrent_pending SET attempts = attempts + 1, updated_at = unixepoch() WHERE pending_id = ?",
          )
          .run(pendingId);
        this.remember(key, "retry-pending", result);
        this.database.exec("COMMIT");
      } catch (error) {
        this.database.exec("ROLLBACK");
        throw error;
      }
      return success(result);
    } catch (error) {
      return failure(error);
    }
  }

  removePending(input) {
    try {
      const pendingId = validateId(input.pendingId, "pendência");
      const key = validateMutation(input.mutation);
      const replay = this.replay(key, "remove-pending");
      if (replay) return success(replay);
      const result = { pendingId, removed: false };
      this.database.exec("BEGIN IMMEDIATE");
      try {
        const deleted = this.database
          .prepare("DELETE FROM torrent_pending WHERE pending_id = ?")
          .run(pendingId);
        result.removed = Number(deleted.changes) > 0;
        this.remember(key, "remove-pending", result);
        this.database.exec("COMMIT");
      } catch (error) {
        this.database.exec("ROLLBACK");
        throw error;
      }
      return success(result);
    } catch (error) {
      return failure(error);
    }
  }

  confirmSource(input) {
    try {
      const key = validateMutation(input.mutation);
      const replay = this.replay(key, "confirm-source");
      if (replay) return success(replay);
      const contentId = validateId(input.contentId, "conteúdo");
      const operationId = validateId(input.operationId, "operação");
      const infoHash = validateInfoHash(input.infoHash);
      const inputType = validateInputType(input.inputType);
      const inputLabel = validateLabel(input.inputLabel);
      const files = validateFiles(input.files);
      const selector = validateSelector(input.selector, files);
      const displayName = validateLabel(input.displayName);
      const content = this.database
        .prepare("SELECT 1 FROM contents WHERE id = ?")
        .get(contentId);
      if (!content)
        throw new TorrentInspectionStoreError(
          "TORRENT_NOT_FOUND",
          "O conteúdo selecionado não foi encontrado.",
        );
      const existingSource = this.database
        .prepare("SELECT source_id FROM torrent_sources WHERE info_hash = ?")
        .get(infoHash);
      const sourceId =
        existingSource?.source_id ?? `source:torrent:${randomUUID()}`;
      const existingRelation = this.database
        .prepare(
          "SELECT content_source_id FROM content_source_selectors WHERE content_id = ? AND source_id = ?",
        )
        .get(contentId, sourceId);
      const contentSourceId =
        existingRelation?.content_source_id ?? `content-source:${randomUUID()}`;
      const runtime = { infoHash, torrentId: `torrent:${infoHash}` };
      const result = {
        contentSourceId,
        contentId,
        sourceId,
        selector,
        runtime,
        operationId,
      };
      this.database.exec("BEGIN IMMEDIATE");
      try {
        this.database
          .prepare(
            `INSERT INTO torrent_runtimes(
               info_hash, torrent_id, display_name, metadata_json,
               managed_torrent_path, created_at, updated_at
             ) VALUES (?, ?, ?, ?, ?, unixepoch(), unixepoch())
             ON CONFLICT(info_hash) DO UPDATE SET
               display_name = excluded.display_name,
               metadata_json = excluded.metadata_json,
               managed_torrent_path = COALESCE(
                 torrent_runtimes.managed_torrent_path,
                 excluded.managed_torrent_path
               ),
               updated_at = unixepoch()`,
          )
          .run(
            infoHash,
            runtime.torrentId,
            displayName,
            JSON.stringify({ files }),
            input.managedTorrentPath ?? null,
          );
        this.database
          .prepare(
            `INSERT INTO torrent_sources(
               source_id, info_hash, input_type, input_label, created_at, updated_at
             ) VALUES (?, ?, ?, ?, unixepoch(), unixepoch())
             ON CONFLICT(info_hash) DO UPDATE SET
               input_label = excluded.input_label,
               updated_at = unixepoch()`,
          )
          .run(sourceId, infoHash, inputType, inputLabel);
        this.database
          .prepare(
            `INSERT INTO content_source_selectors(
               content_source_id, content_id, source_id, selector_json,
               created_at, updated_at
             ) VALUES (?, ?, ?, ?, unixepoch(), unixepoch())
             ON CONFLICT(content_id, source_id) DO UPDATE SET
               selector_json = excluded.selector_json,
               updated_at = unixepoch()`,
          )
          .run(contentSourceId, contentId, sourceId, JSON.stringify(selector));
        this.database
          .prepare("DELETE FROM torrent_pending WHERE operation_id = ?")
          .run(operationId);
        this.remember(key, "confirm-source", result);
        this.database.exec("COMMIT");
      } catch (error) {
        this.database.exec("ROLLBACK");
        throw error;
      }
      return success(result);
    } catch (error) {
      return failure(error);
    }
  }

  snapshot() {
    try {
      const runtimes = this.database
        .prepare(
          "SELECT info_hash, torrent_id, display_name FROM torrent_runtimes ORDER BY info_hash",
        )
        .all()
        .map((row) => ({
          infoHash: row.info_hash,
          torrentId: row.torrent_id,
          displayName: row.display_name,
        }));
      const sources = this.database
        .prepare(
          "SELECT source_id, info_hash, input_type, input_label FROM torrent_sources ORDER BY source_id",
        )
        .all()
        .map((row) => ({
          sourceId: row.source_id,
          infoHash: row.info_hash,
          inputType: row.input_type,
          inputLabel: row.input_label,
        }));
      const contentSources = this.database
        .prepare(
          `SELECT content_source_id, content_id, source_id, selector_json
           FROM content_source_selectors ORDER BY content_id, source_id`,
        )
        .all()
        .map((row) => ({
          contentSourceId: row.content_source_id,
          contentId: row.content_id,
          sourceId: row.source_id,
          selector: JSON.parse(row.selector_json),
        }));
      return success({
        schemaVersion: TORRENT_SCHEMA_VERSION,
        runtimes,
        sources,
        contentSources,
      });
    } catch (error) {
      return failure(error);
    }
  }

  close() {
    this.database.close();
  }
}

module.exports = {
  DATABASE_SCHEMA_VERSION,
  TORRENT_SCHEMA_VERSION,
  TorrentInspectionStore,
  TorrentInspectionStoreError,
};
