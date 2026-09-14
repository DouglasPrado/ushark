"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { createHash, randomUUID } = require("node:crypto");
const { EventEmitter } = require("node:events");
const { DatabaseSync } = require("node:sqlite");

const PROTOCOL_VERSION = 1;
const SCHEMA_VERSION = 1;
const MAX_ITEMS = 256;
const DEFAULT_LIMITS = Object.freeze({
  download: 8,
  upload: 1,
  sessions: 4,
  concurrent: 2,
  probes: 1,
});

class DownloadError extends Error {
  constructor(code, publicMessage, retryable = false, cause) {
    super(publicMessage, cause ? { cause } : undefined);
    this.name = "DownloadError";
    this.code = code;
    this.publicMessage = publicMessage;
    this.retryable = retryable;
  }
}

function validId(value, label) {
  if (
    typeof value !== "string" ||
    value.length < 3 ||
    value.length > 256 ||
    value.includes("\0") ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]+$/.test(value)
  )
    throw new DownloadError(
      "DOWNLOAD_INVALID",
      `A identidade de ${label} não é válida.`,
    );
  return value;
}

function normalizeError(error) {
  if (error instanceof DownloadError) return error;
  const code =
    typeof error?.code === "string" && error.code.startsWith("DOWNLOAD_")
      ? error.code
      : error?.code === "STREAM_SOURCE_UNAVAILABLE"
        ? "DOWNLOAD_SOURCE_UNAVAILABLE"
        : "DOWNLOAD_STORAGE_FAILED";
  return new DownloadError(
    code,
    error?.publicMessage ??
      "A operação de download falhou e o estado anterior foi preservado.",
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

function validateLimits(value) {
  if (
    !value ||
    Object.values(value).some((item) => !Number.isFinite(item) || item < 0) ||
    ![value.sessions, value.concurrent, value.probes].every(Number.isInteger) ||
    value.sessions < 1 ||
    value.concurrent < 1 ||
    value.concurrent > value.sessions ||
    value.sessions > 32 ||
    value.concurrent > 16 ||
    value.probes > 3 ||
    value.download > 1024 ||
    value.upload > 1024
  )
    throw new DownloadError(
      "DOWNLOAD_INVALID",
      "Os limites de download não são válidos.",
    );
  return {
    download: value.download,
    upload: value.upload,
    sessions: value.sessions,
    concurrent: value.concurrent,
    probes: value.probes,
  };
}

class DownloadStore {
  constructor(databasePath) {
    if (typeof databasePath !== "string" || !path.isAbsolute(databasePath))
      throw new DownloadError(
        "DOWNLOAD_INVALID",
        "O banco local de downloads não é válido.",
      );
    this.databasePath = databasePath;
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath);
    this.database.exec("PRAGMA journal_mode=WAL");
    this.database.exec("PRAGMA busy_timeout=5000");
    this.database.exec("PRAGMA foreign_keys=ON");
    this.migrate();
    this.secure();
  }
  secure() {
    if (process.platform === "win32") return;
    for (const file of [
      this.databasePath,
      `${this.databasePath}-wal`,
      `${this.databasePath}-shm`,
    ])
      if (fs.existsSync(file)) fs.chmodSync(file, 0o600);
  }
  migrate() {
    if (
      !this.database
        .prepare(
          "SELECT 1 FROM sqlite_master WHERE type='table' AND name='contents'",
        )
        .get()
    )
      throw new DownloadError(
        "DOWNLOAD_STORAGE_FAILED",
        "Conclua o catálogo local antes de gerenciar downloads.",
      );
    this.database.exec(`BEGIN IMMEDIATE;
      CREATE TABLE IF NOT EXISTS downloads (
        id TEXT PRIMARY KEY, identity_key TEXT NOT NULL UNIQUE, content_id TEXT NOT NULL REFERENCES contents(id) ON DELETE RESTRICT,
        source_id TEXT NOT NULL, file_id TEXT NOT NULL, content_title TEXT NOT NULL, source_name TEXT NOT NULL,
        destination TEXT NOT NULL CHECK(destination IN ('library','cache')), state TEXT NOT NULL,
        bytes_completed INTEGER NOT NULL DEFAULT 0, bytes_total INTEGER NOT NULL DEFAULT 0,
        download_rate INTEGER NOT NULL DEFAULT 0, connected_peers INTEGER NOT NULL DEFAULT 0,
        priority INTEGER NOT NULL DEFAULT 1, resume_version INTEGER NOT NULL DEFAULT 1,
        playback_yielding INTEGER NOT NULL DEFAULT 0, runtime_bound INTEGER NOT NULL DEFAULT 0,
        error_json TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_downloads_state_priority ON downloads(state,priority DESC,created_at);
      CREATE TABLE IF NOT EXISTS download_settings (singleton INTEGER PRIMARY KEY CHECK(singleton=1), limits_json TEXT NOT NULL, updated_at INTEGER NOT NULL);
      INSERT OR IGNORE INTO download_settings(singleton,limits_json,updated_at) VALUES(1,'${JSON.stringify(DEFAULT_LIMITS)}',unixepoch());
      CREATE TABLE IF NOT EXISTS download_idempotency (idempotency_key TEXT PRIMARY KEY, operation TEXT NOT NULL, result_json TEXT NOT NULL, created_at INTEGER NOT NULL);
      COMMIT;`);
  }
  transaction(operation) {
    this.database.exec("BEGIN IMMEDIATE");
    try {
      const value = operation();
      this.database.exec("COMMIT");
      return value;
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }
  replay(key, operation) {
    const row = this.database
      .prepare(
        "SELECT operation,result_json FROM download_idempotency WHERE idempotency_key=?",
      )
      .get(validId(key, "idempotência"));
    if (!row) return undefined;
    if (row.operation !== operation)
      throw new DownloadError(
        "DOWNLOAD_CONFLICT",
        "A chave de idempotência já foi usada em outra operação.",
      );
    return JSON.parse(row.result_json);
  }
  record(key, operation, result) {
    this.database
      .prepare(
        "INSERT INTO download_idempotency(idempotency_key,operation,result_json,created_at) VALUES(?,?,?,unixepoch())",
      )
      .run(key, operation, JSON.stringify(result));
  }
  snapshot(row) {
    return {
      schemaVersion: SCHEMA_VERSION,
      id: row.id,
      contentId: row.content_id,
      contentTitle: row.content_title,
      sourceId: row.source_id,
      sourceName: row.source_name,
      fileId: row.file_id,
      destination: row.destination,
      state: row.state,
      bytesCompleted: row.bytes_completed,
      bytesTotal: row.bytes_total,
      downloadRateBytesPerSecond: row.download_rate,
      connectedPeers: row.connected_peers,
      priority: row.priority,
      resumeVersion: row.resume_version,
      playbackYielding: Boolean(row.playback_yielding),
      createdAt: new Date(row.created_at * 1000).toISOString(),
      updatedAt: new Date(row.updated_at * 1000).toISOString(),
      ...(row.error_json ? { error: JSON.parse(row.error_json) } : {}),
    };
  }
  get(id) {
    const row = this.database
      .prepare("SELECT * FROM downloads WHERE id=?")
      .get(validId(id, "download"));
    return row ? this.snapshot(row) : undefined;
  }
  list() {
    return this.database
      .prepare(
        "SELECT * FROM downloads ORDER BY CASE state WHEN 'downloading' THEN 0 WHEN 'queued' THEN 1 WHEN 'paused' THEN 2 ELSE 3 END, priority DESC, created_at",
      )
      .all()
      .map((row) => this.snapshot(row));
  }
  enqueue(input) {
    const key = validId(input?.mutation?.idempotencyKey, "idempotência");
    const replay = this.replay(key, "enqueue");
    if (replay) return replay;
    const contentId = validId(input.contentId, "conteúdo");
    const sourceId = validId(input.sourceId, "source");
    const fileId = validId(input.fileId ?? "file:main", "arquivo");
    if (
      !["library", "cache"].includes(input.destination) ||
      typeof input.contentTitle !== "string" ||
      !input.contentTitle.trim() ||
      typeof input.sourceName !== "string" ||
      !input.sourceName.trim()
    )
      throw new DownloadError(
        "DOWNLOAD_INVALID",
        "Os dados do download não são válidos.",
      );
    const content = this.database
      .prepare("SELECT 1 FROM contents WHERE id=?")
      .get(contentId);
    if (!content)
      throw new DownloadError(
        "DOWNLOAD_NOT_FOUND",
        "O conteúdo não foi encontrado.",
      );
    const count = Number(
      this.database.prepare("SELECT COUNT(*) AS count FROM downloads").get()
        .count,
    );
    if (count >= MAX_ITEMS)
      throw new DownloadError(
        "DOWNLOAD_CONFLICT",
        "A fila atingiu o limite local.",
        true,
      );
    const identity = `${contentId}\0${sourceId}\0${fileId}`;
    const id = `download:${createHash("sha256").update(identity).digest("hex").slice(0, 24)}`;
    return this.transaction(() => {
      this.database
        .prepare(
          `INSERT INTO downloads(id,identity_key,content_id,source_id,file_id,content_title,source_name,destination,state,bytes_total,created_at,updated_at)
        VALUES(?,?,?,?,?,?,?,?,'queued',?,unixepoch(),unixepoch()) ON CONFLICT(identity_key) DO UPDATE SET state=CASE WHEN downloads.state='cancelled' THEN 'queued' ELSE downloads.state END,destination=excluded.destination,updated_at=unixepoch()`,
        )
        .run(
          id,
          identity,
          contentId,
          sourceId,
          fileId,
          input.contentTitle.trim(),
          input.sourceName.trim(),
          input.destination,
          Number.isSafeInteger(input.sizeBytes) && input.sizeBytes >= 0
            ? input.sizeBytes
            : 0,
        );
      const result = this.get(id);
      this.record(key, "enqueue", result);
      return result;
    });
  }
  update(id, changes) {
    const current = this.get(id);
    if (!current)
      throw new DownloadError(
        "DOWNLOAD_NOT_FOUND",
        "O download não foi encontrado.",
      );
    const allowed = {
      state: "state",
      bytesCompleted: "bytes_completed",
      bytesTotal: "bytes_total",
      downloadRateBytesPerSecond: "download_rate",
      connectedPeers: "connected_peers",
      priority: "priority",
      playbackYielding: "playback_yielding",
      runtimeBound: "runtime_bound",
      error: "error_json",
    };
    const assignments = [];
    const values = [];
    for (const [key, value] of Object.entries(changes))
      if (allowed[key]) {
        assignments.push(`${allowed[key]}=?`);
        values.push(
          key === "error"
            ? value
              ? JSON.stringify(value)
              : null
            : key === "playbackYielding" || key === "runtimeBound"
              ? Number(value)
              : value,
        );
      }
    if (assignments.length)
      this.database
        .prepare(
          `UPDATE downloads SET ${assignments.join(",")},updated_at=unixepoch() WHERE id=?`,
        )
        .run(...values, id);
    return this.get(id);
  }
  remove(id) {
    validId(id, "download");
    this.database.prepare("DELETE FROM downloads WHERE id=?").run(id);
  }
  limits() {
    return validateLimits(
      JSON.parse(
        this.database
          .prepare(
            "SELECT limits_json FROM download_settings WHERE singleton=1",
          )
          .get().limits_json,
      ),
    );
  }
  setLimits(value, mutation) {
    const key = validId(mutation?.idempotencyKey, "idempotência");
    const replay = this.replay(key, "limits");
    if (replay) return replay;
    const limits = validateLimits(value);
    return this.transaction(() => {
      this.database
        .prepare(
          "UPDATE download_settings SET limits_json=?,updated_at=unixepoch() WHERE singleton=1",
        )
        .run(JSON.stringify(limits));
      this.record(key, "limits", limits);
      return limits;
    });
  }
  close() {
    this.database.close();
  }
}

class DownloadApplicationService extends EventEmitter {
  constructor({ store, daemon, sourceResolver }) {
    super();
    this.store = store;
    this.daemon = daemon;
    this.sourceResolver = sourceResolver;
    this.sequence = 0;
    this.bound = new Set();
    this.ticking = false;
  }
  subscribe(listener) {
    this.on("download-event", listener);
    return () => this.off("download-event", listener);
  }
  publish(type, snapshot, error, downloadId) {
    this.emit("download-event", {
      protocolVersion: PROTOCOL_VERSION,
      eventId: `download-event:${randomUUID()}`,
      sequence: ++this.sequence,
      type,
      occurredAt: new Date().toISOString(),
      ...(snapshot ? { snapshot } : {}),
      ...(snapshot || downloadId
        ? { downloadId: snapshot?.id ?? downloadId }
        : {}),
      ...(error ? { error } : {}),
    });
  }
  list() {
    try {
      return {
        ok: true,
        value: { items: this.store.list(), limits: this.store.limits() },
      };
    } catch (error) {
      return failure(error);
    }
  }
  enqueue(input) {
    try {
      const snapshot = this.store.enqueue(input);
      this.publish("download.queued", snapshot);
      return { ok: true, value: snapshot };
    } catch (error) {
      return failure(error);
    }
  }
  async bind(snapshot) {
    if (this.bound.has(snapshot.id)) return;
    await this.daemon.start();
    const resolved = await this.sourceResolver.resolve({
      contentId: snapshot.contentId,
      sourceId: snapshot.sourceId,
      ...(snapshot.fileId === "file:main" ? {} : { fileId: snapshot.fileId }),
    });
    await this.daemon.startDownload({
      downloadId: snapshot.id,
      torrentId: resolved.torrentId,
      fileId: resolved.fileId,
      priority: snapshot.priority,
    });
    this.bound.add(snapshot.id);
    this.store.update(snapshot.id, { runtimeBound: true });
  }
  async command(input) {
    try {
      const id = validId(input?.downloadId, "download");
      const key = validId(input?.mutation?.idempotencyKey, "idempotência");
      const operation = `command:${input.action}`;
      const replay = this.store.replay(key, operation);
      if (replay) return { ok: true, value: replay };
      let snapshot = this.store.get(id);
      if (!snapshot)
        throw new DownloadError(
          "DOWNLOAD_NOT_FOUND",
          "O download não foi encontrado.",
        );
      if (!["pause", "resume", "cancel"].includes(input.action))
        throw new DownloadError(
          "DOWNLOAD_INVALID",
          "O comando de download não é válido.",
        );
      if (input.action === "resume") {
        snapshot = this.store.update(id, { state: "queued", error: undefined });
      } else {
        if (this.bound.has(id))
          await this.daemon.downloadCommand(id, input.action);
        snapshot = this.store.update(id, {
          state: input.action === "pause" ? "paused" : "cancelled",
          downloadRateBytesPerSecond: 0,
        });
      }
      this.store.record(key, operation, snapshot);
      this.publish(
        input.action === "pause"
          ? "download.paused"
          : input.action === "cancel"
            ? "download.cancelled"
            : "download.queued",
        snapshot,
      );
      return { ok: true, value: snapshot };
    } catch (error) {
      return failure(error);
    }
  }
  async setPriority(input) {
    try {
      const id = validId(input?.downloadId, "download");
      const priority = input?.priority;
      if (![0, 1, 2].includes(priority))
        throw new DownloadError(
          "DOWNLOAD_INVALID",
          "A prioridade não é válida.",
        );
      let snapshot = this.store.get(id);
      if (!snapshot)
        throw new DownloadError(
          "DOWNLOAD_NOT_FOUND",
          "O download não foi encontrado.",
        );
      if (this.bound.has(id))
        await this.daemon.setDownloadPriority(id, priority);
      snapshot = this.store.update(id, { priority });
      return { ok: true, value: snapshot };
    } catch (error) {
      return failure(error);
    }
  }
  async removeData(input) {
    try {
      const id = validId(input?.downloadId, "download");
      if (input?.confirmed !== true)
        throw new DownloadError(
          "DOWNLOAD_INVALID",
          "A remoção exige confirmação explícita.",
        );
      if (!this.store.get(id))
        throw new DownloadError(
          "DOWNLOAD_NOT_FOUND",
          "O download não foi encontrado.",
        );
      if (this.bound.has(id)) await this.daemon.removeDownloadData(id, true);
      this.bound.delete(id);
      this.store.remove(id);
      const value = { downloadId: id, removed: true };
      this.publish("download.removed", undefined, undefined, id);
      return { ok: true, value };
    } catch (error) {
      return failure(error);
    }
  }
  async setLimits(input) {
    try {
      const limits = this.store.setLimits(input?.limits, input?.mutation);
      await this.daemon.start();
      await this.daemon.configureDownloads({
        downloadLimitBytesPerSecond: Math.round(limits.download * 1024 ** 2),
        uploadLimitBytesPerSecond: Math.round(limits.upload * 1024 ** 2),
        playbackActive: false,
      });
      return { ok: true, value: limits };
    } catch (error) {
      return failure(error);
    }
  }
  async tick(input = {}) {
    if (this.ticking) return { ok: true, value: { items: this.store.list() } };
    this.ticking = true;
    try {
      const limits = this.store.limits();
      const candidates = this.store
        .list()
        .filter((item) => ["queued", "downloading"].includes(item.state))
        .sort(
          (left, right) =>
            right.priority - left.priority ||
            left.createdAt.localeCompare(right.createdAt),
        );
      // Reading an empty queue must remain a local operation. Starting the
      // torrent runtime here made unrelated local-playback sessions surface a
      // daemon error every second on installations without torrentd.
      if (!candidates.length)
        return { ok: true, value: { items: this.store.list() } };
      await this.daemon.start();
      await this.daemon.configureDownloads({
        downloadLimitBytesPerSecond: Math.round(limits.download * 1024 ** 2),
        uploadLimitBytesPerSecond: Math.round(limits.upload * 1024 ** 2),
        playbackActive: input.playbackActive === true,
      });
      for (const [index, item] of candidates.entries()) {
        if (index >= limits.concurrent || index >= limits.sessions) {
          if (this.bound.has(item.id))
            await this.daemon.downloadCommand(item.id, "pause");
          if (item.state !== "queued")
            this.store.update(item.id, {
              state: "queued",
              downloadRateBytesPerSecond: 0,
            });
          continue;
        }
        try {
          const alreadyBound = this.bound.has(item.id);
          await this.bind(item);
          if (alreadyBound && item.state === "queued")
            await this.daemon.downloadCommand(item.id, "resume");
          const status = await this.daemon.downloadStatus(item.id);
          const state =
            status.state === "complete" ? "complete" : "downloading";
          const snapshot = this.store.update(item.id, {
            state,
            bytesCompleted: status.bytesCompleted,
            bytesTotal: status.bytesTotal,
            downloadRateBytesPerSecond: status.downloadRateBytesPerSecond,
            connectedPeers: status.connectedPeers,
            playbackYielding: status.playbackYielding,
            error: status.error,
          });
          this.publish(
            state === "complete" ? "download.completed" : "download.updated",
            snapshot,
          );
          if (state === "complete")
            await this.daemon.saveDownloadResume(item.id);
        } catch (error) {
          const normalized = normalizeError(error);
          const snapshot = this.store.update(item.id, {
            state: "error",
            downloadRateBytesPerSecond: 0,
            error: failure(normalized).error,
          });
          this.publish("download.failed", snapshot, failure(normalized).error);
        }
      }
      return { ok: true, value: { items: this.store.list() } };
    } catch (error) {
      return failure(error);
    } finally {
      this.ticking = false;
    }
  }
  async close() {
    for (const id of this.bound) {
      try {
        await this.daemon.saveDownloadResume(id);
      } catch {
        // Shutdown remains bounded; the persisted queue records retry on restart.
      }
    }
  }
}

module.exports = {
  DEFAULT_LIMITS,
  DownloadApplicationService,
  DownloadError,
  DownloadStore,
  MAX_ITEMS,
  PROTOCOL_VERSION,
  SCHEMA_VERSION,
  failure,
  validateLimits,
};
