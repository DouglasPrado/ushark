"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { Buffer } = require("node:buffer");
const { createHash, randomUUID } = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");

const PROTOCOL_VERSION = 1;
const SCHEMA = "1.0";
const LIMITS = Object.freeze({
  bytes: 2 * 1024 * 1024,
  depth: 24,
  items: 5_000,
  assets: 256,
  stringBytes: 20_000,
});

class LibraryPackageError extends Error {
  constructor(code, publicMessage, retryable = false, cause) {
    super(publicMessage, cause ? { cause } : undefined);
    this.name = "LibraryPackageError";
    this.code = code;
    this.publicMessage = publicMessage;
    this.retryable = retryable;
  }
}
function failure(error) {
  const known = error instanceof LibraryPackageError;
  return {
    ok: false,
    error: {
      code: known ? error.code : "PACKAGE_STORAGE_FAILED",
      message: known
        ? error.publicMessage
        : "Não foi possível operar o pacote local.",
      recoverable: known ? error.retryable : true,
      retryable: known ? error.retryable : true,
    },
  };
}
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
function payload(snapshot) {
  return {
    key: snapshot.key,
    schema: snapshot.schema,
    version: snapshot.version,
    draft: snapshot.draft,
    catalog: snapshot.catalog,
    warnings: snapshot.warnings ?? [],
  };
}
function digest(snapshot) {
  return createHash("sha256")
    .update(canonical(payload(snapshot)))
    .digest("hex");
}
function depth(value, level = 0) {
  if (level > LIMITS.depth)
    throw new LibraryPackageError(
      "PACKAGE_INVALID",
      "O pacote excede a profundidade JSON permitida.",
    );
  if (typeof value === "string") {
    if (Buffer.byteLength(value, "utf8") > LIMITS.stringBytes)
      throw new LibraryPackageError(
        "PACKAGE_INVALID",
        "Uma string do pacote excede o limite.",
      );
    if (
      /<\/?(?:script|style|html)|javascript:|data:text\/(?:html|css)/i.test(
        value,
      )
    )
      throw new LibraryPackageError(
        "PACKAGE_INVALID",
        "Conteúdo executável, HTML ou CSS foi rejeitado.",
      );
  }
  if (Array.isArray(value)) for (const item of value) depth(item, level + 1);
  else if (value && typeof value === "object")
    for (const item of Object.values(value)) depth(item, level + 1);
}
function asset(value) {
  if (!value) return;
  if (
    typeof value !== "string" ||
    value.includes("..") ||
    value.includes("\\") ||
    value.includes("\0")
  )
    throw new LibraryPackageError(
      "PACKAGE_INVALID",
      "Referência de asset inválida.",
    );
  if (/^\/movie-art\/[A-Za-z0-9._-]+\.(?:svg|png|jpe?g|webp)$/i.test(value))
    return;
  if (/^ipfs:\/\/[A-Za-z0-9]+(?:\/[A-Za-z0-9._/-]+)?$/.test(value)) return;
  try {
    if (new URL(value).protocol === "https:") return;
  } catch {
    /* rejected below */
  }
  throw new LibraryPackageError(
    "PACKAGE_INVALID",
    "Protocolo ou path de asset não permitido.",
  );
}
function validate(snapshot, { allowSignature = false } = {}) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot))
    throw new LibraryPackageError("PACKAGE_INVALID", "Manifest inválido.");
  depth(snapshot);
  const [major, minor] = String(snapshot.schema ?? "")
    .split(".")
    .map(Number);
  if (major !== 1)
    throw new LibraryPackageError(
      "PACKAGE_PROTOCOL_UNSUPPORTED",
      "Schema major incompatível.",
    );
  if (!Number.isInteger(minor) || minor < 0)
    throw new LibraryPackageError(
      "PACKAGE_INVALID",
      "Versão de schema inválida.",
    );
  if (
    !Number.isSafeInteger(snapshot.version) ||
    snapshot.version < 1 ||
    snapshot.key !== `${snapshot.draft?.id}@${snapshot.version}`
  )
    throw new LibraryPackageError(
      "PACKAGE_INVALID",
      "Identidade ou versão do pacote inválida.",
    );
  if (
    !Array.isArray(snapshot.catalog) ||
    snapshot.catalog.length > LIMITS.items ||
    !Array.isArray(snapshot.draft?.memberships) ||
    snapshot.draft.memberships.length > LIMITS.items
  )
    throw new LibraryPackageError(
      "PACKAGE_INVALID",
      "Quantidade de conteúdos excede o limite.",
    );
  const catalog = new Map(snapshot.catalog.map((item) => [item.id, item]));
  if (catalog.size !== snapshot.catalog.length)
    throw new LibraryPackageError(
      "PACKAGE_INVALID",
      "Conteúdo duplicado no pacote.",
    );
  for (const membership of snapshot.draft.memberships) {
    const item = catalog.get(membership.contentId);
    if (
      !item ||
      !Array.isArray(membership.sourceIds) ||
      membership.sourceIds.some(
        (sourceId) => !item.sources?.some((source) => source.id === sourceId),
      )
    )
      throw new LibraryPackageError(
        "PACKAGE_INVALID",
        "Referências de conteúdo/source inconsistentes.",
      );
  }
  const collections = new Map(
    (snapshot.draft.collections ?? []).map((item) => [item.id, item]),
  );
  if (
    collections.size !== snapshot.draft.collections.length ||
    snapshot.draft.collections.some((collection) =>
      collection.items.some((id) => !catalog.has(id)),
    )
  )
    throw new LibraryPackageError("PACKAGE_INVALID", "Coleções inválidas.");
  if (
    (snapshot.draft.sections ?? []).some(
      (section) =>
        section.type !== "continue" && !collections.has(section.collectionId),
    )
  )
    throw new LibraryPackageError("PACKAGE_INVALID", "Seções inválidas.");
  const assets = [
    snapshot.draft.avatar,
    snapshot.draft.logo,
    snapshot.draft.banner,
    ...snapshot.catalog.map((item) => item.poster),
  ].filter(Boolean);
  if (assets.length > LIMITS.assets)
    throw new LibraryPackageError(
      "PACKAGE_INVALID",
      "Quantidade de assets excede o limite.",
    );
  assets.forEach(asset);
  if (snapshot.signature && !allowSignature)
    throw new LibraryPackageError(
      "PACKAGE_SIGNATURE_UNSUPPORTED",
      "Assinatura presente sem verificação suportada.",
    );
  if (snapshot.integrity !== digest(snapshot))
    throw new LibraryPackageError(
      "PACKAGE_INTEGRITY_FAILED",
      "Hash de integridade divergente.",
    );
  return {
    ...structuredClone(snapshot),
    warnings:
      minor > 0
        ? [
            ...new Set([
              ...(snapshot.warnings ?? []),
              "Schema minor compatível; extensões desconhecidas foram ignoradas.",
            ]),
          ]
        : [...(snapshot.warnings ?? [])],
  };
}

class LibraryPackageApplicationService {
  constructor({ databasePath, exportRoot, catalogProvider }) {
    this.database = new DatabaseSync(databasePath);
    this.database.exec("PRAGMA journal_mode=WAL");
    this.database.exec("PRAGMA busy_timeout=5000");
    this.exportRoot = exportRoot;
    this.catalogProvider = catalogProvider;
    fs.mkdirSync(exportRoot, { recursive: true });
    this.database.exec(`BEGIN IMMEDIATE;
      CREATE TABLE IF NOT EXISTS library_packages(package_key TEXT PRIMARY KEY, direction TEXT NOT NULL CHECK(direction IN ('export','import')), integrity TEXT NOT NULL, snapshot_json TEXT NOT NULL, file_path TEXT, created_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS library_package_idempotency(idempotency_key TEXT PRIMARY KEY,operation TEXT NOT NULL,result_json TEXT NOT NULL,created_at INTEGER NOT NULL);
      COMMIT;`);
  }
  list() {
    try {
      const rows = this.database
        .prepare(
          "SELECT direction,snapshot_json,file_path FROM library_packages ORDER BY created_at,package_key",
        )
        .all();
      const project = (direction) =>
        rows
          .filter((row) => row.direction === direction)
          .map((row) => ({
            ...JSON.parse(row.snapshot_json),
            ...(row.file_path
              ? { fileName: path.basename(row.file_path) }
              : {}),
          }));
      return {
        ok: true,
        value: { exports: project("export"), received: project("import") },
      };
    } catch (error) {
      return failure(error);
    }
  }
  export(input, targetPath) {
    try {
      const row = this.database
        .prepare("SELECT revision,draft_json FROM library_drafts WHERE id=?")
        .get(input?.draftId);
      if (!row || Number(row.revision) !== input.revision)
        throw new LibraryPackageError(
          "PACKAGE_CONFLICT",
          "O draft mudou; reabra antes de exportar.",
          true,
        );
      const draft = JSON.parse(row.draft_json);
      const catalogResult = this.catalogProvider();
      if (!catalogResult.ok)
        throw new LibraryPackageError(
          "PACKAGE_STORAGE_FAILED",
          catalogResult.error.message,
          true,
        );
      const catalog = catalogResult.value
        .filter((item) =>
          draft.memberships.some(
            (membership) => membership.contentId === item.id,
          ),
        )
        .map((item) => ({
          ...item,
          sources: item.sources
            .filter((source) =>
              draft.memberships
                .find((membership) => membership.contentId === item.id)
                ?.sourceIds.includes(source.id),
            )
            .map((source) => ({ ...source, local: false })),
        }));
      const version =
        Number(
          this.database
            .prepare(
              "SELECT COUNT(*) AS count FROM library_packages WHERE direction='export' AND package_key LIKE ?",
            )
            .get(`${draft.id}@%`).count,
        ) + 1;
      const base = {
        key: `${draft.id}@${version}`,
        schema: SCHEMA,
        version,
        draft,
        catalog,
        warnings: [],
      };
      const snapshot = {
        ...base,
        integrity: digest(base),
        fileName: `${draft.id.replaceAll(":", "-")}-v${version}.tslib`,
      };
      validate(snapshot, { allowSignature: true });
      const destination =
        targetPath ?? path.join(this.exportRoot, snapshot.fileName);
      if (path.extname(destination).toLowerCase() !== ".tslib")
        throw new LibraryPackageError(
          "PACKAGE_INVALID",
          "Use a extensão .tslib.",
        );
      const bytes = Buffer.from(
        `${canonical({ ...payload(snapshot), integrity: snapshot.integrity, ...(snapshot.signature ? { signature: snapshot.signature } : {}) })}\n`,
        "utf8",
      );
      if (bytes.length > LIMITS.bytes)
        throw new LibraryPackageError(
          "PACKAGE_INVALID",
          "O manifest excede 2 MiB.",
        );
      const temporary = `${destination}.${randomUUID()}.tmp`;
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      try {
        fs.writeFileSync(temporary, bytes, { flag: "wx", mode: 0o600 });
        fs.renameSync(temporary, destination);
      } catch (error) {
        try {
          fs.unlinkSync(temporary);
        } catch {
          /* best effort */
        }
        throw error;
      }
      this.database
        .prepare("INSERT INTO library_packages VALUES(?,?,?,?,?,unixepoch())")
        .run(
          snapshot.key,
          "export",
          snapshot.integrity,
          JSON.stringify(snapshot),
          destination,
        );
      return { ok: true, value: snapshot };
    } catch (error) {
      return failure(error);
    }
  }
  stageSnapshot(snapshot) {
    try {
      const validated = validate(snapshot, { allowSignature: true });
      if (validated.signature && this.signatureVerifier) {
        const result = this.signatureVerifier(validated);
        if (!["first", "known", "changed"].includes(result.status))
          throw new LibraryPackageError(
            "PACKAGE_INTEGRITY_FAILED",
            result.message,
          );
      } else if (validated.signature && !this.signatureVerifier)
        throw new LibraryPackageError(
          "PACKAGE_SIGNATURE_UNSUPPORTED",
          "Assinatura presente sem verificador disponível.",
        );
      return { ok: true, value: validated };
    } catch (error) {
      return failure(error);
    }
  }
  stageFile(candidate) {
    try {
      if (path.extname(candidate).toLowerCase() !== ".tslib")
        throw new LibraryPackageError(
          "PACKAGE_INVALID",
          "O arquivo não possui extensão .tslib.",
        );
      const stat = fs.lstatSync(candidate);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size > LIMITS.bytes)
        throw new LibraryPackageError(
          "PACKAGE_INVALID",
          "Arquivo inválido, link simbólico ou acima de 2 MiB.",
        );
      const snapshot = JSON.parse(fs.readFileSync(candidate, "utf8"));
      return this.stageSnapshot({
        ...snapshot,
        fileName: path.basename(candidate),
      });
    } catch (error) {
      return failure(error);
    }
  }
  commit(input) {
    try {
      const key = input?.mutation?.idempotencyKey;
      if (typeof key !== "string" || key.length < 2 || key.length > 256)
        throw new LibraryPackageError(
          "PACKAGE_INVALID",
          "Idempotência inválida.",
        );
      const replay = this.database
        .prepare(
          "SELECT operation,result_json FROM library_package_idempotency WHERE idempotency_key=?",
        )
        .get(key);
      if (replay) {
        if (replay.operation !== "commit")
          throw new LibraryPackageError(
            "PACKAGE_CONFLICT",
            "A chave de idempotência já pertence a outra operação.",
          );
        return { ok: true, value: JSON.parse(replay.result_json) };
      }
      const staged = this.stageSnapshot(input.snapshot);
      if (!staged.ok)
        throw new LibraryPackageError(
          staged.error.code,
          staged.error.message,
          staged.error.retryable,
        );
      const snapshot = staged.value;
      const existing = this.database
        .prepare(
          "SELECT integrity FROM library_packages WHERE package_key=? AND direction='import'",
        )
        .get(snapshot.key);
      if (existing && existing.integrity !== snapshot.integrity)
        throw new LibraryPackageError(
          "PACKAGE_CONFLICT",
          "Mesma identidade/versão possui conteúdo diferente.",
        );
      const value = {
        snapshot,
        message: existing
          ? "Este pacote já foi importado. Nenhuma duplicação."
          : "Biblioteca importada no perfil local.",
      };
      this.database.exec("BEGIN IMMEDIATE");
      try {
        if (!existing)
          this.database
            .prepare(
              "INSERT INTO library_packages VALUES(?,?,?,?,NULL,unixepoch())",
            )
            .run(
              snapshot.key,
              "import",
              snapshot.integrity,
              JSON.stringify(snapshot),
            );
        this.database
          .prepare(
            "INSERT INTO library_package_idempotency VALUES(?,?,?,unixepoch())",
          )
          .run(key, "commit", JSON.stringify(value));
        this.database.exec("COMMIT");
      } catch (error) {
        this.database.exec("ROLLBACK");
        throw error;
      }
      return { ok: true, value };
    } catch (error) {
      return failure(error);
    }
  }
  setSignatureVerifier(verifier) {
    this.signatureVerifier = verifier;
  }
  attachSignature(snapshot) {
    try {
      const validated = validate(snapshot, { allowSignature: true });
      if (!validated.signature || !this.signatureVerifier)
        throw new LibraryPackageError(
          "PACKAGE_SIGNATURE_UNSUPPORTED",
          "Assinatura ou verificador indisponível.",
        );
      const verified = this.signatureVerifier(validated);
      if (!["first", "known", "changed"].includes(verified.status))
        throw new LibraryPackageError(
          "PACKAGE_INTEGRITY_FAILED",
          verified.message,
        );
      const row = this.database
        .prepare(
          "SELECT file_path FROM library_packages WHERE package_key=? AND direction='export'",
        )
        .get(validated.key);
      if (!row)
        throw new LibraryPackageError(
          "PACKAGE_NOT_FOUND",
          "Exportação não encontrada.",
        );
      const bytes = Buffer.from(
        `${canonical({ ...payload(validated), integrity: validated.integrity, signature: validated.signature })}\n`,
        "utf8",
      );
      const temporary = `${row.file_path}.${randomUUID()}.tmp`;
      fs.writeFileSync(temporary, bytes, { flag: "wx", mode: 0o600 });
      fs.renameSync(temporary, row.file_path);
      this.database
        .prepare(
          "UPDATE library_packages SET snapshot_json=? WHERE package_key=? AND direction='export'",
        )
        .run(JSON.stringify(validated), validated.key);
      return { ok: true, value: validated };
    } catch (error) {
      return failure(error);
    }
  }
  close() {
    this.database.close();
  }
}

module.exports = {
  LIMITS,
  LibraryPackageApplicationService,
  LibraryPackageError,
  PROTOCOL_VERSION,
  SCHEMA,
  canonical,
  digest,
  failure,
  validate,
};
