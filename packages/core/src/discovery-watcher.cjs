"use strict";

const { Buffer } = require("node:buffer");
const { createHash } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { clearTimeout, setImmediate, setTimeout } = require("node:timers");
const { Worker } = require("node:worker_threads");

const DATABASE_SCHEMA_VERSION = 10;
const WATCHER_COALESCE_MS = 150;
const WATCHER_BATCH_MAXIMUM = 1_000;
const WATCHER_PATH_BYTES = 4_096;
const HYDRATION_TIMEOUT_MS = 15_000;
const HYDRATION_CONCURRENCY = 4;

class DiscoveryWatcherError extends Error {
  constructor(code, publicMessage, retryable = false, cause) {
    super(publicMessage, cause ? { cause } : undefined);
    this.name = "DiscoveryWatcherError";
    this.code = code;
    this.publicMessage = publicMessage;
    this.retryable = retryable;
  }
}

function failure(error) {
  const known = error instanceof DiscoveryWatcherError;
  return {
    code: known ? error.code : "DISCOVERY_STORAGE_FAILED",
    message: known
      ? error.publicMessage
      : "A alteração será tentada novamente sem apagar o catálogo atual.",
    recoverable: known ? error.retryable : true,
    retryable: known ? error.retryable : true,
  };
}

function validateId(value, label) {
  if (
    typeof value !== "string" ||
    value.length < 3 ||
    value.length > 160 ||
    value.includes("\0") ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]+$/.test(value)
  )
    throw new DiscoveryWatcherError(
      "DISCOVERY_INVALID",
      `A identidade de ${label} não é válida.`,
    );
  return value;
}

function isInside(root, candidate) {
  const relative = path.relative(root, candidate);
  return (
    relative !== "" &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

function normalizeRelative(value) {
  if (Buffer.isBuffer(value)) value = value.toString("utf8");
  if (
    typeof value !== "string" ||
    !value ||
    value.includes("\0") ||
    Buffer.byteLength(value, "utf8") > WATCHER_PATH_BYTES ||
    path.isAbsolute(value)
  )
    throw new DiscoveryWatcherError(
      "DISCOVERY_UNAUTHORIZED",
      "O watcher recebeu um caminho fora da biblioteca.",
    );
  const normalized = path.normalize(value);
  if (
    normalized === "." ||
    normalized === ".." ||
    normalized.startsWith(`..${path.sep}`)
  )
    throw new DiscoveryWatcherError(
      "DISCOVERY_UNAUTHORIZED",
      "O watcher recebeu um caminho fora da biblioteca.",
    );
  return normalized.split(path.sep).join("/");
}

function hydrationKey(
  libraryId,
  relativePath,
  previousRelativePath,
  reason,
  fingerprint,
) {
  return `watch:${createHash("sha256")
    .update(libraryId)
    .update("\0")
    .update(previousRelativePath ?? "")
    .update("\0")
    .update(relativePath)
    .update("\0")
    .update(reason)
    .update("\0")
    .update(fingerprint ?? "missing")
    .digest("hex")}`;
}

async function mapLimit(items, limit, mapper) {
  const output = new Array(items.length);
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (cursor < items.length) {
        const index = cursor;
        cursor += 1;
        output[index] = await mapper(items[index], index);
      }
    },
  );
  await Promise.all(workers);
  return output;
}

class DiscoveryWatcher {
  constructor(options) {
    if (
      !options ||
      typeof options.databasePath !== "string" ||
      !path.isAbsolute(options.databasePath) ||
      !options.index ||
      typeof options.index.apply !== "function" ||
      typeof options.resolveDocument !== "function"
    )
      throw new DiscoveryWatcherError(
        "DISCOVERY_INVALID",
        "A configuração do watcher não é válida.",
      );
    this.databasePath = options.databasePath;
    this.index = options.index;
    this.resolveDocument = options.resolveDocument;
    this.onStatus =
      typeof options.onStatus === "function" ? options.onStatus : () => {};
    this.coalesceMs = Number.isInteger(options.coalesceMs)
      ? Math.max(0, Math.min(options.coalesceMs, 5_000))
      : WATCHER_COALESCE_MS;
    this.database = new DatabaseSync(this.databasePath);
    this.database.exec("PRAGMA journal_mode = WAL");
    this.database.exec("PRAGMA busy_timeout = 5000");
    this.database.exec("PRAGMA foreign_keys = ON");
    this.pending = new Map();
    this.watchHandles = [];
    this.timer = undefined;
    this.processing = Promise.resolve();
    this.closed = false;
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
    const current = Number(
      this.database
        .prepare("SELECT MAX(version) AS version FROM schema_migrations")
        .get()?.version ?? 0,
    );
    if (current > DATABASE_SCHEMA_VERSION)
      throw new DiscoveryWatcherError(
        "DISCOVERY_PROTOCOL_UNSUPPORTED",
        "O watcher pertence a uma versão mais nova do Ushark.",
      );
    const base = this.database
      .prepare(
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'discovery_documents'",
      )
      .get();
    if (!base)
      throw new DiscoveryWatcherError(
        "DISCOVERY_INDEX_UNAVAILABLE",
        "Crie o índice local antes de iniciar o watcher.",
        true,
      );
    this.database.exec(`
      BEGIN IMMEDIATE;
      CREATE TABLE IF NOT EXISTS discovery_watch_files (
        library_id TEXT NOT NULL REFERENCES local_libraries(id) ON DELETE CASCADE,
        relative_path TEXT NOT NULL,
        fingerprint TEXT,
        size_bytes INTEGER,
        modified_at_ms REAL,
        content_id TEXT REFERENCES contents(id) ON DELETE SET NULL,
        status TEXT NOT NULL CHECK(status IN ('indexed', 'pending')),
        updated_at INTEGER NOT NULL,
        PRIMARY KEY(library_id, relative_path)
      );
      CREATE INDEX IF NOT EXISTS idx_discovery_watch_fingerprint
        ON discovery_watch_files(library_id, fingerprint, relative_path);
      DROP INDEX IF EXISTS idx_discovery_watch_content;
      INSERT OR IGNORE INTO schema_migrations(version, name, applied_at)
      VALUES (9, 'm04_discovery_watcher', unixepoch());
      COMMIT;
    `);
  }

  library(libraryId) {
    validateId(libraryId, "biblioteca");
    const row = this.database
      .prepare("SELECT root_path FROM local_libraries WHERE id = ?")
      .get(libraryId);
    if (!row)
      throw new DiscoveryWatcherError(
        "DISCOVERY_NOT_FOUND",
        "A biblioteca local não foi encontrada.",
      );
    const root = fs.realpathSync(row.root_path);
    return { libraryId, root };
  }

  emit(value) {
    try {
      this.onStatus({
        libraryId: this.libraryId,
        reprocessedCount: 0,
        occurredAt: new Date().toISOString(),
        ...value,
      });
    } catch {
      // Observer failures must never stop filesystem processing.
    }
  }

  start(libraryId) {
    if (this.closed)
      throw new DiscoveryWatcherError(
        "DISCOVERY_INDEX_UNAVAILABLE",
        "O watcher já foi encerrado.",
      );
    this.stopWatching();
    const library = this.library(libraryId);
    this.libraryId = library.libraryId;
    this.root = library.root;
    try {
      const watcher = fs.watch(
        this.root,
        { recursive: true, persistent: false },
        (eventType, filename) => {
          if (!filename) {
            void this.scan();
            return;
          }
          this.notifyPath(filename, eventType);
        },
      );
      watcher.on("error", (error) =>
        this.emit({ status: "error", error: failure(error) }),
      );
      this.watchHandles.push(watcher);
    } catch (error) {
      if (error?.code !== "ERR_FEATURE_UNAVAILABLE_ON_PLATFORM") throw error;
      void this.openFallbackWatchers().catch((fallbackError) =>
        this.emit({ status: "error", error: failure(fallbackError) }),
      );
    }
    this.emit({ status: "watching" });
    setImmediate(() => void this.scan());
    return { libraryId: this.libraryId, rootPathExposed: false };
  }

  async openFallbackWatchers() {
    const directories = [this.root];
    for (let index = 0; index < directories.length; index += 1) {
      const directory = directories[index];
      const entries = await fs.promises.readdir(directory, {
        withFileTypes: true,
      });
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
        const child = path.join(directory, entry.name);
        if (isInside(this.root, child)) directories.push(child);
      }
    }
    if (this.closed) return;
    for (const directory of directories) {
      const prefix = path.relative(this.root, directory);
      const watcher = fs.watch(
        directory,
        { persistent: false },
        (eventType, filename) => {
          if (!filename) {
            void this.scan();
            return;
          }
          this.notifyPath(path.join(prefix, filename.toString()), eventType);
          if (eventType === "rename")
            setImmediate(() => this.refreshFallback());
        },
      );
      watcher.on("error", (error) =>
        this.emit({ status: "error", error: failure(error) }),
      );
      this.watchHandles.push(watcher);
    }
  }

  refreshFallback() {
    if (this.closed || !this.root) return;
    this.stopWatching();
    void this.openFallbackWatchers().catch((error) =>
      this.emit({ status: "error", error: failure(error) }),
    );
  }

  stopWatching() {
    for (const watcher of this.watchHandles) watcher.close();
    this.watchHandles = [];
  }

  notifyPath(relativePath, eventType = "change") {
    try {
      if (!this.root || !this.libraryId)
        throw new DiscoveryWatcherError(
          "DISCOVERY_INDEX_UNAVAILABLE",
          "Inicie o watcher antes de enviar eventos.",
        );
      const normalized = normalizeRelative(relativePath);
      const candidate = path.resolve(this.root, normalized);
      if (!isInside(this.root, candidate))
        throw new DiscoveryWatcherError(
          "DISCOVERY_UNAUTHORIZED",
          "O watcher recebeu um caminho fora da biblioteca.",
        );
      this.pending.set(
        normalized,
        eventType === "rename" ? "rename" : "change",
      );
      this.schedule();
      return true;
    } catch (error) {
      this.emit({
        status: "rejected",
        error: failure(error),
      });
      return false;
    }
  }

  schedule() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = undefined;
      this.processing = this.processing
        .then(() => this.processPending())
        .catch((error) =>
          this.emit({ status: "error", error: failure(error) }),
        );
    }, this.coalesceMs);
  }

  async hydrate(relativePath) {
    const candidate = path.resolve(this.root, relativePath);
    try {
      const stat = fs.lstatSync(candidate);
      if (stat.isSymbolicLink())
        throw new DiscoveryWatcherError(
          "DISCOVERY_UNAUTHORIZED",
          "Links simbólicos não são indexados pela biblioteca.",
        );
      if (!stat.isFile()) return { state: "ignored", relativePath };
      const real = fs.realpathSync(candidate);
      if (!isInside(this.root, real))
        throw new DiscoveryWatcherError(
          "DISCOVERY_UNAUTHORIZED",
          "O arquivo está fora da raiz autorizada.",
        );
      const value = await new Promise((resolve, reject) => {
        const worker = new Worker(
          path.join(__dirname, "discovery-file-worker.cjs"),
          { workerData: { filePath: real } },
        );
        const timer = setTimeout(() => {
          void worker.terminate();
          reject(
            new DiscoveryWatcherError(
              "DISCOVERY_INDEX_UNAVAILABLE",
              "O arquivo ainda está sendo preparado.",
              true,
            ),
          );
        }, HYDRATION_TIMEOUT_MS);
        worker.once("message", (message) => {
          clearTimeout(timer);
          if (message?.ok) resolve(message.value);
          else
            reject(
              new DiscoveryWatcherError(
                "DISCOVERY_INDEX_UNAVAILABLE",
                message?.error?.code === "FILE_UNSTABLE"
                  ? "O arquivo ainda está sendo gravado."
                  : "O arquivo não pôde ser lido agora.",
                true,
              ),
            );
        });
        worker.once("error", (error) => {
          clearTimeout(timer);
          reject(error);
        });
      });
      return { state: "present", relativePath, ...value };
    } catch (error) {
      if (error?.code === "ENOENT") return { state: "missing", relativePath };
      if (error instanceof DiscoveryWatcherError) throw error;
      throw new DiscoveryWatcherError(
        "DISCOVERY_INDEX_UNAVAILABLE",
        "O arquivo não pôde ser hidratado agora.",
        true,
        error,
      );
    }
  }

  mappingsForPaths(relativePaths) {
    if (!relativePaths.length) return [];
    const placeholders = relativePaths.map(() => "?").join(", ");
    return this.database
      .prepare(
        `SELECT * FROM discovery_watch_files
         WHERE library_id = ? AND relative_path IN (${placeholders})`,
      )
      .all(this.libraryId, ...relativePaths);
  }

  mappingsForFingerprints(fingerprints) {
    if (!fingerprints.length) return [];
    const placeholders = fingerprints.map(() => "?").join(", ");
    return this.database
      .prepare(
        `SELECT * FROM discovery_watch_files
         WHERE library_id = ? AND fingerprint IN (${placeholders})`,
      )
      .all(this.libraryId, ...fingerprints);
  }

  saveMapping(snapshot, contentId, status, previousRelativePath) {
    this.database.exec("BEGIN IMMEDIATE");
    try {
      if (
        previousRelativePath &&
        previousRelativePath !== snapshot.relativePath
      )
        this.database
          .prepare(
            "DELETE FROM discovery_watch_files WHERE library_id = ? AND relative_path = ?",
          )
          .run(this.libraryId, previousRelativePath);
      this.database
        .prepare(
          `INSERT INTO discovery_watch_files(
             library_id, relative_path, fingerprint, size_bytes, modified_at_ms,
             content_id, status, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch())
           ON CONFLICT(library_id, relative_path) DO UPDATE SET
             fingerprint = excluded.fingerprint,
             size_bytes = excluded.size_bytes,
             modified_at_ms = excluded.modified_at_ms,
             content_id = excluded.content_id,
             status = excluded.status,
             updated_at = unixepoch()`,
        )
        .run(
          this.libraryId,
          snapshot.relativePath,
          snapshot.fingerprint,
          snapshot.sizeBytes,
          snapshot.modifiedAtMs,
          contentId ?? null,
          status,
        );
      this.database.exec("COMMIT");
      this.secureDatabaseFiles();
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  async processPresent(snapshot, byPath, byFingerprint, matchedPrevious) {
    const current = byPath.get(snapshot.relativePath);
    const renamed = current
      ? undefined
      : (byFingerprint.get(snapshot.fingerprint) ?? []).find(
          (mapping) =>
            mapping.relative_path !== snapshot.relativePath &&
            !fs.existsSync(path.resolve(this.root, mapping.relative_path)),
        );
    const previous = current ?? renamed;
    const reason = renamed
      ? "file-renamed"
      : current
        ? "file-changed"
        : "file-added";
    if (renamed) matchedPrevious.add(renamed.relative_path);
    const input = {
      libraryId: this.libraryId,
      relativePath: snapshot.relativePath,
      previousRelativePath: renamed?.relative_path,
      previousContentId: previous?.content_id ?? undefined,
      reason,
      fingerprint: snapshot.fingerprint,
      sizeBytes: snapshot.sizeBytes,
      modifiedAtMs: snapshot.modifiedAtMs,
    };
    const document = await this.resolveDocument(input);
    if (!document) {
      this.saveMapping(
        snapshot,
        previous?.content_id,
        "pending",
        renamed?.relative_path,
      );
      this.emit({
        relativePath: snapshot.relativePath,
        previousRelativePath: renamed?.relative_path,
        contentId: previous?.content_id ?? undefined,
        reason,
        status: "pending",
      });
      return;
    }
    const result = await this.index.apply({
      libraryId: this.libraryId,
      upserts: [document],
      removals: [],
      reason,
      mutation: {
        idempotencyKey: hydrationKey(
          this.libraryId,
          snapshot.relativePath,
          renamed?.relative_path,
          reason,
          snapshot.fingerprint,
        ),
      },
    });
    if (!result?.ok)
      throw new DiscoveryWatcherError(
        result?.error?.code ?? "DISCOVERY_STORAGE_FAILED",
        result?.error?.message ?? "O índice não aceitou a alteração.",
        result?.error?.retryable === true,
      );
    const contentId = document.content.contentId;
    this.saveMapping(snapshot, contentId, "indexed", renamed?.relative_path);
    this.emit({
      relativePath: snapshot.relativePath,
      previousRelativePath: renamed?.relative_path,
      contentId,
      reason,
      status: "indexed",
      reprocessedCount: 1,
      invalidation: result.value,
    });
  }

  async processMissing(mapping, matchedPrevious) {
    if (!mapping || matchedPrevious.has(mapping.relative_path)) return;
    if (mapping.content_id) {
      const result = await this.index.apply({
        libraryId: this.libraryId,
        upserts: [],
        removals: [mapping.content_id],
        reason: "file-removed",
        mutation: {
          idempotencyKey: hydrationKey(
            this.libraryId,
            mapping.relative_path,
            undefined,
            "file-removed",
            mapping.fingerprint,
          ),
        },
      });
      if (!result?.ok)
        throw new DiscoveryWatcherError(
          result?.error?.code ?? "DISCOVERY_STORAGE_FAILED",
          result?.error?.message ?? "O índice não aceitou a remoção.",
          result?.error?.retryable === true,
        );
    }
    this.database
      .prepare(
        "DELETE FROM discovery_watch_files WHERE library_id = ? AND relative_path = ?",
      )
      .run(this.libraryId, mapping.relative_path);
    this.secureDatabaseFiles();
    this.emit({
      relativePath: mapping.relative_path,
      contentId: mapping.content_id ?? undefined,
      reason: "file-removed",
      status: "removed",
      reprocessedCount: mapping.content_id ? 1 : 0,
    });
  }

  async processPending() {
    if (!this.pending.size || this.closed) return;
    const entries = [...this.pending.keys()].slice(0, WATCHER_BATCH_MAXIMUM);
    for (const relativePath of entries) this.pending.delete(relativePath);
    const existingMappings = this.mappingsForPaths(entries);
    const byPath = new Map(
      existingMappings.map((mapping) => [mapping.relative_path, mapping]),
    );
    const hydrated = await mapLimit(
      entries,
      HYDRATION_CONCURRENCY,
      async (relativePath) => {
        try {
          return await this.hydrate(relativePath);
        } catch (error) {
          this.emit({
            relativePath,
            status:
              error instanceof DiscoveryWatcherError &&
              error.code === "DISCOVERY_UNAUTHORIZED"
                ? "rejected"
                : "pending",
            error: failure(error),
          });
          return { state: "failed", relativePath };
        }
      },
    );
    const present = hydrated.filter((item) => item.state === "present");
    const fingerprints = [...new Set(present.map((item) => item.fingerprint))];
    const byFingerprint = new Map();
    for (const mapping of this.mappingsForFingerprints(fingerprints)) {
      const current = byFingerprint.get(mapping.fingerprint) ?? [];
      current.push(mapping);
      byFingerprint.set(mapping.fingerprint, current);
    }
    const matchedPrevious = new Set();
    for (const snapshot of present) {
      try {
        await this.processPresent(
          snapshot,
          byPath,
          byFingerprint,
          matchedPrevious,
        );
      } catch (error) {
        this.emit({
          relativePath: snapshot.relativePath,
          status: "error",
          error: failure(error),
        });
      }
    }
    for (const snapshot of hydrated.filter(
      (item) => item.state === "missing",
    )) {
      try {
        await this.processMissing(
          byPath.get(snapshot.relativePath),
          matchedPrevious,
        );
      } catch (error) {
        this.emit({
          relativePath: snapshot.relativePath,
          status: "error",
          error: failure(error),
        });
      }
    }
    if (this.pending.size) this.schedule();
  }

  async scan() {
    if (!this.root || this.closed) return;
    const discovered = [];
    const directories = [this.root];
    while (directories.length && discovered.length < WATCHER_BATCH_MAXIMUM) {
      const directory = directories.shift();
      const entries = await fs.promises.readdir(directory, {
        withFileTypes: true,
      });
      for (const entry of entries) {
        if (entry.isSymbolicLink()) continue;
        const candidate = path.join(directory, entry.name);
        if (entry.isDirectory()) directories.push(candidate);
        else if (entry.isFile())
          discovered.push(path.relative(this.root, candidate));
        if (discovered.length >= WATCHER_BATCH_MAXIMUM) break;
      }
    }
    const known = this.database
      .prepare(
        "SELECT relative_path FROM discovery_watch_files WHERE library_id = ? LIMIT 1000",
      )
      .all(this.libraryId)
      .map((row) => row.relative_path);
    for (const relativePath of [...new Set([...discovered, ...known])])
      this.notifyPath(relativePath, "change");
  }

  async flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
    this.processing = this.processing.then(() => this.processPending());
    await this.processing;
  }

  stop() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.stopWatching();
  }

  close() {
    if (this.closed) return;
    this.stop();
    this.closed = true;
    this.database.close();
  }
}

module.exports = {
  DATABASE_SCHEMA_VERSION,
  DiscoveryWatcher,
  DiscoveryWatcherError,
  WATCHER_COALESCE_MS,
};
