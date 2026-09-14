"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");

const SCHEMA_VERSION = 1;
const MAX_CLEANUP = 256;
class StoragePolicyError extends Error {
  constructor(code, publicMessage, retryable = false, cause) {
    super(publicMessage, cause ? { cause } : undefined);
    this.name = "StoragePolicyError";
    this.code = code;
    this.publicMessage = publicMessage;
    this.retryable = retryable;
  }
}
function validId(value, label) {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > 256 ||
    value.includes("\0") ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]+$/.test(value)
  )
    throw new StoragePolicyError(
      "STORAGE_INVALID",
      `A identidade de ${label} não é válida.`,
    );
  return value;
}
function failure(error) {
  const known = error instanceof StoragePolicyError;
  return {
    ok: false,
    error: {
      code: known
        ? error.code
        : error?.code === "ENOSPC"
          ? "STORAGE_DISK_FULL"
          : error?.code === "EACCES"
            ? "STORAGE_PERMISSION_DENIED"
            : "STORAGE_WRITE_FAILED",
      message: known
        ? error.publicMessage
        : error?.code === "ENOSPC"
          ? "Sem espaço para concluir a operação; original preservado."
          : error?.code === "EACCES"
            ? "Permissão negada; estado anterior preservado."
            : "A operação de armazenamento falhou; estado anterior preservado.",
      recoverable: known ? error.retryable : true,
      retryable: known ? error.retryable : true,
    },
  };
}
function contained(root, candidate, mustExist = true) {
  const base = fs.realpathSync(root);
  if (!mustExist) {
    const lexical = path.join(
      fs.realpathSync(path.dirname(candidate)),
      path.basename(candidate),
    );
    const relative = path.relative(base, lexical);
    if (
      !relative ||
      relative === ".." ||
      relative.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relative)
    )
      throw new StoragePolicyError(
        "STORAGE_INVALID",
        "O arquivo está fora do armazenamento gerenciado.",
      );
    return lexical;
  }
  const lexical = path.resolve(candidate);
  const before = fs.lstatSync(lexical);
  if (!before.isFile() || before.isSymbolicLink())
    throw new StoragePolicyError(
      "STORAGE_INVALID",
      "O arquivo gerenciado não é regular.",
    );
  const real = fs.realpathSync(lexical);
  const relative = path.relative(base, real);
  if (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  )
    throw new StoragePolicyError(
      "STORAGE_INVALID",
      "O arquivo está fora do armazenamento gerenciado.",
    );
  return real;
}
class StoragePolicyService {
  constructor({
    databasePath,
    cacheRoot,
    libraryRoot,
    activeSourceIds = () => [],
    copyFile = fs.copyFileSync,
  }) {
    if (
      ![databasePath, cacheRoot, libraryRoot].every(
        (value) => typeof value === "string" && path.isAbsolute(value),
      )
    )
      throw new StoragePolicyError(
        "STORAGE_INVALID",
        "A configuração de armazenamento não é válida.",
      );
    this.databasePath = databasePath;
    this.cacheRoot = cacheRoot;
    this.libraryRoot = libraryRoot;
    this.activeSourceIds = activeSourceIds;
    this.copyFile = copyFile;
    fs.mkdirSync(cacheRoot, { recursive: true });
    fs.mkdirSync(libraryRoot, { recursive: true });
    this.database = new DatabaseSync(databasePath);
    this.database.exec("PRAGMA journal_mode=WAL");
    this.database.exec("PRAGMA busy_timeout=5000");
    this.database.exec("PRAGMA foreign_keys=ON");
    this.migrate();
  }
  migrate() {
    this.database.exec(`BEGIN IMMEDIATE;
    CREATE TABLE IF NOT EXISTS storage_entries (id TEXT PRIMARY KEY, content_id TEXT, source_id TEXT NOT NULL, name TEXT NOT NULL, managed_path TEXT NOT NULL UNIQUE, keep INTEGER NOT NULL DEFAULT 0, partial INTEGER NOT NULL DEFAULT 0, corrupt INTEGER NOT NULL DEFAULT 0, last_used INTEGER NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS storage_policy (singleton INTEGER PRIMARY KEY CHECK(singleton=1), limit_gb REAL NOT NULL, auto_cleanup INTEGER NOT NULL, retain_partial INTEGER NOT NULL, retain_favorites INTEGER NOT NULL, revision INTEGER NOT NULL, updated_at INTEGER NOT NULL);
    INSERT OR IGNORE INTO storage_policy(singleton,limit_gb,auto_cleanup,retain_partial,retain_favorites,revision,updated_at) VALUES(1,40,1,1,1,0,unixepoch());
    CREATE TABLE IF NOT EXISTS storage_idempotency (idempotency_key TEXT PRIMARY KEY, operation TEXT NOT NULL, result_json TEXT NOT NULL, created_at INTEGER NOT NULL);
    COMMIT;`);
  }
  policyRow() {
    return this.database
      .prepare("SELECT * FROM storage_policy WHERE singleton=1")
      .get();
  }
  policy() {
    const row = this.policyRow();
    return {
      limitGB: row.limit_gb,
      folder: "Cache",
      autoCleanup: Boolean(row.auto_cleanup),
      retainPartial: Boolean(row.retain_partial),
      retainFavorites: Boolean(row.retain_favorites),
    };
  }
  revision() {
    return Number(this.policyRow().revision);
  }
  bump() {
    this.database
      .prepare(
        "UPDATE storage_policy SET revision=revision+1,updated_at=unixepoch() WHERE singleton=1",
      )
      .run();
  }
  replay(key, operation) {
    const row = this.database
      .prepare(
        "SELECT operation,result_json FROM storage_idempotency WHERE idempotency_key=?",
      )
      .get(validId(key, "idempotência"));
    if (!row) return undefined;
    if (row.operation !== operation)
      throw new StoragePolicyError(
        "STORAGE_CONFLICT",
        "A chave de idempotência já foi usada em outra operação.",
      );
    return JSON.parse(row.result_json);
  }
  record(key, operation, result) {
    this.database
      .prepare(
        "INSERT INTO storage_idempotency(idempotency_key,operation,result_json,created_at) VALUES(?,?,?,unixepoch())",
      )
      .run(key, operation, JSON.stringify(result));
  }
  registerAsset(input) {
    const sourceId = validId(input.sourceId, "source");
    const id = validId(input.id ?? `storage:${sourceId}`, "item");
    const root = input.keep ? this.libraryRoot : this.cacheRoot;
    const managed = contained(root, input.managedPath);
    const stat = fs.statSync(managed);
    this.database
      .prepare(
        `INSERT INTO storage_entries(id,content_id,source_id,name,managed_path,keep,partial,corrupt,last_used,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,unixepoch(),unixepoch()) ON CONFLICT(id) DO UPDATE SET content_id=excluded.content_id,source_id=excluded.source_id,name=excluded.name,managed_path=excluded.managed_path,keep=excluded.keep,partial=excluded.partial,corrupt=excluded.corrupt,last_used=excluded.last_used,updated_at=unixepoch()`,
      )
      .run(
        id,
        input.contentId ?? null,
        sourceId,
        input.name,
        managed,
        Number(Boolean(input.keep)),
        Number(Boolean(input.partial)),
        Number(Boolean(input.corrupt)),
        input.lastUsed ?? Math.floor(Date.now() / 1000),
      );
    this.bump();
    return { id, bytes: stat.size };
  }
  favorite(contentId) {
    if (!contentId) return false;
    const row = this.database
      .prepare("SELECT favorite FROM user_content_state WHERE content_id=?")
      .get(contentId);
    return Boolean(row?.favorite);
  }
  reconcileDownloads() {
    if (
      !this.database
        .prepare(
          "SELECT 1 FROM sqlite_master WHERE type='table' AND name='downloads'",
        )
        .get() ||
      !this.database
        .prepare(
          "SELECT 1 FROM sqlite_master WHERE type='table' AND name='content_source_selectors'",
        )
        .get()
    )
      return;
    const rows = this.database
      .prepare(
        `SELECT d.id, d.content_id, d.source_id, d.source_name, d.file_id,
                d.state, d.updated_at, tr.metadata_json
         FROM downloads d
         JOIN content_source_selectors css
           ON css.content_id=d.content_id AND css.source_id=d.source_id
         JOIN torrent_sources ts ON ts.source_id=d.source_id
         JOIN torrent_runtimes tr ON tr.info_hash=ts.info_hash
         WHERE d.state != 'cancelled'`,
      )
      .all();
    for (const row of rows) {
      try {
        const file = (JSON.parse(row.metadata_json)?.files ?? []).find(
          (candidate) => candidate.id === row.file_id,
        );
        if (!file || typeof file.path !== "string") continue;
        const candidate = path.join(
          this.cacheRoot,
          ...file.path.replaceAll("\\", "/").split("/"),
        );
        if (!fs.existsSync(candidate)) continue;
        const managed = contained(this.cacheRoot, candidate);
        this.database
          .prepare(
            `INSERT INTO storage_entries(
               id,content_id,source_id,name,managed_path,keep,partial,corrupt,
               last_used,created_at,updated_at
             ) VALUES(?,?,?,?,?,0,?,0,?,unixepoch(),unixepoch())
             ON CONFLICT(id) DO UPDATE SET managed_path=excluded.managed_path,
               partial=excluded.partial,last_used=excluded.last_used,
               updated_at=unixepoch()`,
          )
          .run(
            row.id,
            row.content_id,
            row.source_id,
            row.source_name,
            managed,
            Number(row.state !== "complete"),
            row.updated_at,
          );
      } catch {
        // Malformed runtime metadata is isolated for a later repair pass.
      }
    }
  }
  rows() {
    this.reconcileDownloads();
    const active = new Set(this.activeSourceIds());
    return this.database
      .prepare("SELECT * FROM storage_entries ORDER BY last_used,id")
      .all()
      .map((row) => {
        let bytes = 0;
        let corrupt = Boolean(row.corrupt);
        try {
          bytes = fs.statSync(
            contained(
              row.keep ? this.libraryRoot : this.cacheRoot,
              row.managed_path,
            ),
          ).size;
        } catch {
          corrupt = true;
        }
        return {
          id: row.id,
          name: row.name,
          gb: bytes / 1024 ** 3,
          keep: Boolean(row.keep),
          active:
            active.has(row.source_id) ||
            Boolean(
              row.id.startsWith("download:") &&
              this.database
                .prepare(
                  "SELECT 1 FROM downloads WHERE id=? AND state='downloading'",
                )
                .get(row.id),
            ),
          favorite: this.favorite(row.content_id),
          partial: Boolean(row.partial),
          corrupt,
          lastUsed: row.last_used,
          volume: row.keep ? "Biblioteca" : "Cache",
          external: false,
          _bytes: bytes,
          _sourceId: row.source_id,
          _path: row.managed_path,
        };
      });
  }
  eligible(row, policy = this.policy()) {
    return (
      !row.active &&
      !row.keep &&
      !(row.favorite && policy.retainFavorites) &&
      !(row.partial && policy.retainPartial)
    );
  }
  snapshot() {
    const entries = this.rows();
    const policy = this.policy();
    const stat = fs.statfsSync(this.cacheRoot);
    const physical = {
      capacityBytes: Number(stat.blocks) * Number(stat.bsize),
      availableBytes: Number(stat.bavail) * Number(stat.bsize),
      usedManagedBytes: entries.reduce((sum, row) => sum + row._bytes, 0),
      eligibleBytes: entries
        .filter((row) => this.eligible(row, policy))
        .reduce((sum, row) => sum + row._bytes, 0),
    };
    return {
      schemaVersion: SCHEMA_VERSION,
      entries: entries.map((entry) => {
        const row = { ...entry };
        delete row._bytes;
        delete row._sourceId;
        delete row._path;
        return row;
      }),
      policy,
      physical,
      revision: this.revision(),
      updatedAt: new Date().toISOString(),
    };
  }
  read() {
    try {
      return { ok: true, value: this.snapshot() };
    } catch (error) {
      return failure(error);
    }
  }
  assertRevision(expected) {
    if (!Number.isInteger(expected) || expected !== this.revision())
      throw new StoragePolicyError(
        "STORAGE_CONFLICT",
        "O armazenamento mudou; revise o plano antes de aplicar.",
        true,
      );
  }
  clean(input) {
    try {
      const key = validId(input?.mutation?.idempotencyKey, "idempotência");
      const replay = this.replay(key, "clean");
      if (replay) return { ok: true, value: replay };
      this.assertRevision(input.expectedRevision);
      if (!Array.isArray(input.ids) || input.ids.length > MAX_CLEANUP)
        throw new StoragePolicyError(
          "STORAGE_INVALID",
          "O plano de limpeza não é válido.",
        );
      const ids = new Set(input.ids.map((id) => validId(id, "item")));
      const rows = this.rows().filter((row) => ids.has(row.id));
      const estimatedBytes = rows.reduce((sum, row) => sum + row._bytes, 0);
      let freedBytes = 0;
      for (const row of rows) {
        if (!this.eligible(row)) continue;
        const current = this.rows().find((item) => item.id === row.id);
        if (!current || !this.eligible(current)) continue;
        try {
          const target = contained(this.cacheRoot, current._path);
          const size = fs.statSync(target).size;
          fs.unlinkSync(target);
          freedBytes += size;
          this.database
            .prepare("DELETE FROM storage_entries WHERE id=?")
            .run(row.id);
          if (row.id.startsWith("download:"))
            this.database
              .prepare(
                "UPDATE downloads SET state='cancelled',bytes_completed=0,download_rate=0,updated_at=unixepoch() WHERE id=?",
              )
              .run(row.id);
        } catch (error) {
          if (error?.code !== "ENOENT") throw error;
          this.database
            .prepare("DELETE FROM storage_entries WHERE id=?")
            .run(row.id);
        }
      }
      this.bump();
      const result = { snapshot: this.snapshot(), estimatedBytes, freedBytes };
      this.record(key, "clean", result);
      return { ok: true, value: result };
    } catch (error) {
      return failure(error);
    }
  }
  retain(input) {
    try {
      const key = validId(input?.mutation?.idempotencyKey, "idempotência");
      const replay = this.replay(key, "retain");
      if (replay) return { ok: true, value: replay };
      this.assertRevision(input.expectedRevision);
      const id = validId(input.id, "item");
      const row = this.rows().find((item) => item.id === id);
      if (!row)
        throw new StoragePolicyError(
          "STORAGE_NOT_FOUND",
          "O item não foi encontrado.",
        );
      if (row.active)
        throw new StoragePolicyError(
          "STORAGE_BUSY",
          "O item está protegido por uma operação ativa.",
          true,
        );
      if (row.keep === input.keep) {
        const result = this.snapshot();
        this.record(key, "retain", result);
        return { ok: true, value: result };
      }
      const sourceRoot = row.keep ? this.libraryRoot : this.cacheRoot;
      const destinationRoot = input.keep ? this.libraryRoot : this.cacheRoot;
      const source = contained(sourceRoot, row._path);
      const extension = path.extname(source);
      const destination = contained(
        destinationRoot,
        path.join(
          destinationRoot,
          `${row.id.replaceAll(":", "-")}${extension}`,
        ),
        false,
      );
      const temporary = `${destination}.${randomUUID()}.tmp`;
      try {
        this.copyFile(source, temporary, fs.constants.COPYFILE_EXCL);
        const descriptor = fs.openSync(temporary, "r");
        try {
          fs.fsyncSync(descriptor);
        } finally {
          fs.closeSync(descriptor);
        }
        fs.renameSync(temporary, destination);
        this.database
          .prepare(
            "UPDATE storage_entries SET managed_path=?,keep=?,updated_at=unixepoch() WHERE id=?",
          )
          .run(destination, Number(Boolean(input.keep)), id);
        this.bump();
        fs.unlinkSync(source);
      } catch (error) {
        try {
          if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
        } catch {
          /* best effort temp cleanup */
        }
        throw error;
      }
      const result = this.snapshot();
      this.record(key, "retain", result);
      return { ok: true, value: result };
    } catch (error) {
      return failure(error);
    }
  }
  repair(input) {
    try {
      const key = validId(input?.mutation?.idempotencyKey, "idempotência");
      const replay = this.replay(key, "repair");
      if (replay) return { ok: true, value: replay };
      this.assertRevision(input.expectedRevision);
      const id = validId(input.id, "item");
      const row = this.rows().find((item) => item.id === id);
      if (!row)
        throw new StoragePolicyError(
          "STORAGE_NOT_FOUND",
          "O item não foi encontrado.",
        );
      if (row.active || row.keep)
        throw new StoragePolicyError(
          "STORAGE_BUSY",
          "O item está protegido.",
          true,
        );
      try {
        const target = contained(this.cacheRoot, row._path);
        fs.unlinkSync(target);
      } catch (error) {
        if (error?.code !== "ENOENT" && error?.code !== "STORAGE_INVALID")
          throw error;
      }
      this.database
        .prepare(
          "UPDATE storage_entries SET corrupt=0,partial=1,updated_at=unixepoch() WHERE id=?",
        )
        .run(id);
      this.bump();
      const result = this.snapshot();
      this.record(key, "repair", result);
      return { ok: true, value: result };
    } catch (error) {
      return failure(error);
    }
  }
  applyPolicy(input) {
    try {
      const key = validId(input?.mutation?.idempotencyKey, "idempotência");
      const replay = this.replay(key, "policy");
      if (replay) return { ok: true, value: replay };
      this.assertRevision(input.expectedRevision);
      const value = input.policy;
      if (
        !value ||
        !Number.isFinite(value.limitGB) ||
        value.limitGB < 1 ||
        value.limitGB > 500 ||
        value.folder !== "Cache" ||
        ![value.autoCleanup, value.retainPartial, value.retainFavorites].every(
          (item) => typeof item === "boolean",
        )
      )
        throw new StoragePolicyError(
          "STORAGE_INVALID",
          "A política de armazenamento não é válida.",
        );
      this.database
        .prepare(
          "UPDATE storage_policy SET limit_gb=?,auto_cleanup=?,retain_partial=?,retain_favorites=?,revision=revision+1,updated_at=unixepoch() WHERE singleton=1",
        )
        .run(
          value.limitGB,
          Number(value.autoCleanup),
          Number(value.retainPartial),
          Number(value.retainFavorites),
        );
      const result = this.snapshot();
      this.record(key, "policy", result);
      return { ok: true, value: result };
    } catch (error) {
      return failure(error);
    }
  }
  close() {
    this.database.close();
  }
}
module.exports = {
  MAX_CLEANUP,
  SCHEMA_VERSION,
  StoragePolicyError,
  StoragePolicyService,
  contained,
  failure,
};
