"use strict";

const { Buffer } = require("node:buffer");
const { DatabaseSync } = require("node:sqlite");

const PROTOCOL_VERSION = 1;
const SCHEMA_VERSION = 1;
const LIMITS = Object.freeze({
  drafts: 128,
  memberships: 5_000,
  sections: 256,
  collections: 256,
});

class LibraryDraftError extends Error {
  constructor(code, publicMessage, retryable = false, cause) {
    super(publicMessage, cause ? { cause } : undefined);
    this.name = "LibraryDraftError";
    this.code = code;
    this.publicMessage = publicMessage;
    this.retryable = retryable;
  }
}
function failure(error) {
  const known = error instanceof LibraryDraftError;
  return {
    ok: false,
    error: {
      code: known ? error.code : "DRAFT_STORAGE_FAILED",
      message: known
        ? error.publicMessage
        : "Não foi possível salvar a curadoria local.",
      recoverable: known ? error.retryable : true,
      retryable: known ? error.retryable : true,
    },
  };
}
function id(value, label) {
  if (
    typeof value !== "string" ||
    value.length < 2 ||
    value.length > 256 ||
    value.includes("\0")
  )
    throw new LibraryDraftError(
      "DRAFT_INVALID",
      `A identidade de ${label} não é válida.`,
    );
  return value;
}
function text(value, maximum, label, required = false) {
  if (
    typeof value !== "string" ||
    Buffer.byteLength(value, "utf8") > maximum ||
    (required && !value.trim())
  )
    throw new LibraryDraftError("DRAFT_INVALID", `${label} não é válido.`);
  return value;
}
function parse(value, fallback = {}) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

class LibraryDraftApplicationService {
  constructor(databasePath) {
    this.database = new DatabaseSync(databasePath);
    this.database.exec("PRAGMA journal_mode=WAL");
    this.database.exec("PRAGMA busy_timeout=5000");
    this.database.exec(`BEGIN IMMEDIATE;
      CREATE TABLE IF NOT EXISTS library_drafts(
        id TEXT PRIMARY KEY, revision INTEGER NOT NULL, draft_json TEXT NOT NULL,
        private INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS library_draft_idempotency(
        idempotency_key TEXT PRIMARY KEY, operation TEXT NOT NULL, result_json TEXT NOT NULL, created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS library_fork_catalog(content_id TEXT PRIMARY KEY,content_json TEXT NOT NULL,ref_count INTEGER NOT NULL DEFAULT 1);
      COMMIT;`);
  }
  list() {
    try {
      return {
        ok: true,
        value: this.database
          .prepare(
            "SELECT draft_json FROM library_drafts ORDER BY created_at,id",
          )
          .all()
          .map((row) => parse(row.draft_json)),
      };
    } catch (error) {
      return failure(error);
    }
  }
  table(name) {
    return Boolean(
      this.database
        .prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?")
        .get(name),
    );
  }
  catalog() {
    try {
      if (!this.table("contents"))
        return {
          ok: true,
          value: this.database
            .prepare(
              "SELECT content_json FROM library_fork_catalog ORDER BY content_id",
            )
            .all()
            .map((row) => parse(row.content_json)),
        };
      const rows = this.database
        .prepare(
          `SELECT c.id,c.type,
          CASE c.type WHEN 'movie' THEN m.metadata_json WHEN 'series' THEN s.metadata_json END AS metadata_json
         FROM contents c LEFT JOIN movies m ON m.content_id=c.id LEFT JOIN series s ON s.content_id=c.id
         WHERE c.type IN ('movie','series') ORDER BY c.created_at,c.id`,
        )
        .all();
      const hasLocal = this.table("content_sources") && this.table("sources");
      const hasTorrent =
        this.table("content_source_selectors") && this.table("torrent_sources");
      const value = rows.map((row) => {
        const metadata = parse(row.metadata_json);
        const sources = [];
        if (hasLocal)
          for (const source of this.database
            .prepare(
              `SELECT s.id,s.descriptor_json,s.managed_path FROM content_sources cs JOIN sources s ON s.id=cs.source_id WHERE cs.content_id=? ORDER BY cs.created_at,s.id`,
            )
            .all(row.id)) {
            const descriptor = parse(source.descriptor_json);
            sources.push({
              id: source.id,
              name: descriptor.name ?? source.id,
              local: Boolean(source.managed_path),
              origin: "Catálogo local",
            });
          }
        if (hasTorrent)
          for (const source of this.database
            .prepare(
              `SELECT css.source_id,css.selector_json,ts.input_label FROM content_source_selectors css JOIN torrent_sources ts ON ts.source_id=css.source_id WHERE css.content_id=? ORDER BY css.created_at,css.source_id`,
            )
            .all(row.id)) {
            const selector = parse(source.selector_json);
            sources.push({
              id: source.source_id,
              name: source.input_label,
              local: false,
              origin: "Source selecionada",
              selector: selector.fileId,
            });
          }
        return {
          id: row.id,
          title: metadata.title ?? row.id,
          synopsis: metadata.synopsis,
          poster: metadata.poster,
          sources: [
            ...new Map(sources.map((source) => [source.id, source])).values(),
          ],
        };
      });
      const external = this.database
        .prepare(
          "SELECT content_json FROM library_fork_catalog ORDER BY content_id",
        )
        .all()
        .map((row) => parse(row.content_json));
      return {
        ok: true,
        value: [
          ...new Map(
            [...value, ...external].map((item) => [item.id, item]),
          ).values(),
        ],
      };
    } catch (error) {
      return failure(error);
    }
  }
  validate(draft) {
    if (!draft || typeof draft !== "object" || Array.isArray(draft))
      throw new LibraryDraftError("DRAFT_INVALID", "O rascunho não é válido.");
    const allowed = new Set([
      "provenance",
      "id",
      "revision",
      "name",
      "description",
      "author",
      "avatar",
      "logo",
      "banner",
      "accent",
      "memberships",
      "collections",
      "sections",
    ]);
    if (Object.keys(draft).some((key) => !allowed.has(key)))
      throw new LibraryDraftError(
        "DRAFT_INVALID",
        "O rascunho contém estado não exportável.",
      );
    id(draft.id, "rascunho");
    if (!Number.isSafeInteger(draft.revision) || draft.revision < 0)
      throw new LibraryDraftError("DRAFT_INVALID", "A revisão não é válida.");
    text(draft.name, 160, "O nome", true);
    text(draft.description, 20_000, "A descrição");
    text(draft.author, 512, "O autor");
    for (const key of ["avatar", "logo", "banner"])
      text(draft[key], 2_048, key);
    if (
      typeof draft.accent !== "string" ||
      !/^#[0-9a-f]{6}$/i.test(draft.accent)
    )
      throw new LibraryDraftError(
        "DRAFT_INVALID",
        "A cor de destaque não é válida.",
      );
    if (
      !Array.isArray(draft.memberships) ||
      draft.memberships.length > LIMITS.memberships ||
      !Array.isArray(draft.collections) ||
      draft.collections.length > LIMITS.collections ||
      !Array.isArray(draft.sections) ||
      draft.sections.length > LIMITS.sections
    )
      throw new LibraryDraftError(
        "DRAFT_INVALID",
        "A curadoria excede os limites locais.",
      );
    const contentIds = new Set();
    for (const membership of draft.memberships) {
      const contentId = id(membership.contentId, "conteúdo");
      if (
        contentIds.has(contentId) ||
        !this.catalog().value?.some((item) => item.id === contentId)
      )
        throw new LibraryDraftError(
          "DRAFT_INVALID",
          "Um conteúdo da curadoria é inválido ou duplicado.",
        );
      contentIds.add(contentId);
      text(membership.titleOverride, 512, "O título customizado");
      if (
        !Array.isArray(membership.sourceIds) ||
        new Set(membership.sourceIds).size !== membership.sourceIds.length
      )
        throw new LibraryDraftError(
          "DRAFT_INVALID",
          "As sources selecionadas não são válidas.",
        );
      const catalog = this.catalog();
      const available = new Set(
        (catalog.ok
          ? (catalog.value.find((item) => item.id === contentId)?.sources ?? [])
          : []
        ).map((source) => source.id),
      );
      if (membership.sourceIds.some((sourceId) => !available.has(sourceId)))
        throw new LibraryDraftError(
          "DRAFT_INVALID",
          "Uma source não pertence ao conteúdo selecionado.",
        );
    }
    const collectionIds = new Set();
    for (const collection of draft.collections) {
      const collectionId = id(collection.id, "coleção");
      if (collectionIds.has(collectionId))
        throw new LibraryDraftError(
          "DRAFT_INVALID",
          "A coleção está duplicada.",
        );
      collectionIds.add(collectionId);
      text(collection.name, 512, "O nome da coleção", true);
      if (
        !Array.isArray(collection.items) ||
        new Set(collection.items).size !== collection.items.length ||
        collection.items.some((contentId) => !contentIds.has(contentId))
      )
        throw new LibraryDraftError(
          "DRAFT_INVALID",
          "Os itens da coleção não são válidos.",
        );
    }
    const sectionIds = new Set();
    for (const section of draft.sections) {
      const sectionId = id(section.id, "seção");
      if (sectionIds.has(sectionId))
        throw new LibraryDraftError("DRAFT_INVALID", "A seção está duplicada.");
      sectionIds.add(sectionId);
      text(section.title, 512, "O título da seção", true);
      if (
        !["hero", "carousel", "grid", "continue"].includes(section.type) ||
        (section.type !== "continue" &&
          !collectionIds.has(section.collectionId))
      )
        throw new LibraryDraftError(
          "DRAFT_INVALID",
          "A seção visual não é válida.",
        );
    }
  }
  fork(snapshot, name, provenance, operationId) {
    try {
      if (!snapshot?.draft || !name?.trim() || name.length > 80)
        throw new LibraryDraftError(
          "DRAFT_INVALID",
          "Informe um nome para a cópia (até 80 caracteres).",
        );
      const replay = this.database
        .prepare(
          "SELECT result_json FROM library_draft_idempotency WHERE idempotency_key=? AND operation='fork'",
        )
        .get(operationId);
      if (replay) return { ok: true, value: parse(replay.result_json) };
      const newId = `library:${operationId.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 48)}`;
      const ids = new Map(
        snapshot.draft.collections.map((c, i) => [
          c.id,
          `${newId}:collection:${i}`,
        ]),
      );
      const draft = {
        ...structuredClone(snapshot.draft),
        id: newId,
        name: name.trim(),
        revision: 1,
        collections: snapshot.draft.collections.map((c) => ({
          ...c,
          id: ids.get(c.id),
        })),
        sections: snapshot.draft.sections.map((s, i) => ({
          ...s,
          id: `${newId}:section:${i}`,
          collectionId: ids.get(s.collectionId) ?? "",
        })),
      };
      delete draft.provenance;
      if (provenance)
        draft.provenance = {
          libraryId: snapshot.draft.id,
          version: snapshot.version,
        };
      this.database.exec("BEGIN IMMEDIATE");
      try {
        for (const item of snapshot.catalog)
          this.database
            .prepare(
              "INSERT INTO library_fork_catalog VALUES(?,?,1) ON CONFLICT(content_id) DO UPDATE SET ref_count=ref_count+1",
            )
            .run(item.id, JSON.stringify(item));
        this.database
          .prepare(
            "INSERT INTO library_drafts VALUES(?,?,?,1,unixepoch(),unixepoch())",
          )
          .run(draft.id, draft.revision, JSON.stringify(draft));
        this.database
          .prepare(
            "INSERT INTO library_draft_idempotency VALUES(?,?,?,unixepoch())",
          )
          .run(operationId, "fork", JSON.stringify(draft));
        this.database.exec("COMMIT");
      } catch (error) {
        this.database.exec("ROLLBACK");
        throw error;
      }
      return { ok: true, value: draft };
    } catch (error) {
      return failure(error);
    }
  }
  save(input) {
    try {
      const key = id(input?.mutation?.idempotencyKey, "idempotência");
      const replay = this.database
        .prepare(
          "SELECT operation,result_json FROM library_draft_idempotency WHERE idempotency_key=?",
        )
        .get(key);
      if (replay) {
        if (replay.operation !== "save")
          throw new LibraryDraftError(
            "DRAFT_CONFLICT",
            "A chave já foi usada.",
          );
        return { ok: true, value: parse(replay.result_json) };
      }
      this.validate(input.draft);
      const existing = this.database
        .prepare("SELECT revision FROM library_drafts WHERE id=?")
        .get(input.draft.id);
      if (existing && Number(existing.revision) !== input.draft.revision)
        throw new LibraryDraftError(
          "DRAFT_CONFLICT",
          "Revisão alterada; reabra a versão salva.",
          true,
        );
      if (
        !existing &&
        Number(
          this.database
            .prepare("SELECT COUNT(*) AS count FROM library_drafts")
            .get().count,
        ) >= LIMITS.drafts
      )
        throw new LibraryDraftError(
          "DRAFT_INVALID",
          "O limite local de rascunhos foi atingido.",
        );
      const value = structuredClone({
        ...input.draft,
        revision: input.draft.revision + 1,
      });
      this.database.exec("BEGIN IMMEDIATE");
      try {
        this.database
          .prepare(
            `INSERT INTO library_drafts(id,revision,draft_json,private,created_at,updated_at) VALUES(?,?,?,1,unixepoch(),unixepoch())
           ON CONFLICT(id) DO UPDATE SET revision=excluded.revision,draft_json=excluded.draft_json,updated_at=unixepoch()`,
          )
          .run(value.id, value.revision, JSON.stringify(value));
        this.database
          .prepare(
            "INSERT INTO library_draft_idempotency VALUES(?,?,?,unixepoch())",
          )
          .run(key, "save", JSON.stringify(value));
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
  close() {
    this.database.close();
  }
}

module.exports = {
  LIMITS,
  LibraryDraftApplicationService,
  LibraryDraftError,
  PROTOCOL_VERSION,
  SCHEMA_VERSION,
  failure,
};
