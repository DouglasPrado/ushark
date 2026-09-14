"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const MOVIE_CATALOG_SCHEMA_VERSION = 1;
const DATABASE_SCHEMA_VERSION = 10;

const LIMITS = Object.freeze({
  title: 160,
  originalTitle: 160,
  synopsis: 20_000,
  genres: 32,
  cast: 256,
  sourceName: 512,
  externalId: 128,
});

class MovieCatalogStoreError extends Error {
  constructor(code, publicMessage, retryable = false, cause) {
    super(publicMessage, cause ? { cause } : undefined);
    this.name = "MovieCatalogStoreError";
    this.code = code;
    this.publicMessage = publicMessage;
    this.retryable = retryable;
  }
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function validateId(value, kind) {
  if (
    typeof value !== "string" ||
    value.length < 3 ||
    value.length > 160 ||
    value.includes("\0") ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]+$/.test(value)
  )
    throw new MovieCatalogStoreError(
      "CATALOG_INVALID",
      `A identidade de ${kind} não é válida.`,
    );
  return value;
}

function optionalString(value, maximum, field) {
  if (value === undefined) return undefined;
  if (
    typeof value !== "string" ||
    value.length > maximum ||
    value.includes("\0")
  )
    throw new MovieCatalogStoreError(
      "CATALOG_INVALID",
      `O campo ${field} não é válido.`,
    );
  return value;
}

function stringList(value, maximum, itemMaximum, field) {
  if (
    !Array.isArray(value) ||
    value.length > maximum ||
    value.some(
      (item) =>
        typeof item !== "string" ||
        item.length > itemMaximum ||
        item.includes("\0"),
    )
  )
    throw new MovieCatalogStoreError(
      "CATALOG_INVALID",
      `O campo ${field} não é válido.`,
    );
  return [...new Set(value)];
}

function validateMetadata(value) {
  if (!isPlainObject(value))
    throw new MovieCatalogStoreError(
      "CATALOG_INVALID",
      "Os dados do filme não são válidos.",
    );
  const id = validateId(value.id, "conteúdo");
  if (
    typeof value.title !== "string" ||
    !value.title.trim() ||
    value.title.length > LIMITS.title ||
    value.title.includes("\0")
  )
    throw new MovieCatalogStoreError(
      "CATALOG_INVALID",
      "Dê um título ao filme (até 160 caracteres).",
    );
  if (
    value.year !== undefined &&
    (!Number.isInteger(value.year) || value.year < 1870 || value.year > 2200)
  )
    throw new MovieCatalogStoreError(
      "CATALOG_INVALID",
      "O ano do filme não é válido.",
    );
  if (
    value.duration !== undefined &&
    (!Number.isInteger(value.duration) ||
      value.duration < 1 ||
      value.duration > 100_000)
  )
    throw new MovieCatalogStoreError(
      "CATALOG_INVALID",
      "A duração do filme não é válida.",
    );
  const externalIds = value.externalIds;
  if (externalIds !== undefined && !isPlainObject(externalIds))
    throw new MovieCatalogStoreError(
      "CATALOG_INVALID",
      "Os IDs externos não são válidos.",
    );
  return {
    id,
    title: value.title.trim(),
    originalTitle: optionalString(
      value.originalTitle,
      LIMITS.originalTitle,
      "título original",
    ),
    year: value.year,
    synopsis: optionalString(value.synopsis, LIMITS.synopsis, "sinopse"),
    duration: value.duration,
    genres: stringList(value.genres, LIMITS.genres, 80, "gêneros"),
    cast: stringList(value.cast, LIMITS.cast, 160, "elenco"),
    poster: optionalString(value.poster, 4096, "poster"),
    backdrop: optionalString(value.backdrop, 4096, "backdrop"),
    externalIds:
      externalIds === undefined
        ? undefined
        : {
            tmdb: optionalString(
              externalIds.tmdb,
              LIMITS.externalId,
              "TMDB ID",
            ),
            imdb: optionalString(
              externalIds.imdb,
              LIMITS.externalId,
              "IMDb ID",
            ),
          },
    ratings: isPlainObject(value.ratings)
      ? structuredClone(value.ratings)
      : undefined,
  };
}

function validateSource(value) {
  if (!isPlainObject(value))
    throw new MovieCatalogStoreError(
      "CATALOG_INVALID",
      "A source não é válida.",
    );
  const availability = new Set([
    "declared",
    "available",
    "missing",
    "unavailable",
    "error",
  ]);
  if (!availability.has(value.availability))
    throw new MovieCatalogStoreError(
      "CATALOG_INVALID",
      "O estado da source não é válido.",
    );
  if (
    typeof value.name !== "string" ||
    !value.name.trim() ||
    value.name.length > LIMITS.sourceName ||
    value.name.includes("\0")
  )
    throw new MovieCatalogStoreError(
      "CATALOG_INVALID",
      "O nome da source não é válido.",
    );
  return {
    id: validateId(value.id, "source"),
    name: value.name.trim(),
    resolution: optionalString(value.resolution, 32, "resolução"),
    videoCodec: optionalString(value.videoCodec, 64, "codec de vídeo"),
    audioCodec: optionalString(value.audioCodec, 64, "codec de áudio"),
    hdr: optionalString(value.hdr, 32, "HDR"),
    channels: optionalString(value.channels, 32, "canais"),
    size: optionalString(value.size, 64, "tamanho"),
    bitrate: optionalString(value.bitrate, 64, "bitrate"),
    availability: value.availability,
    fileAvailable: value.availability === "available",
    managedFile: value.managedFile === true,
  };
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return structuredClone(fallback);
  }
}

function success(value) {
  return { ok: true, value };
}

function failure(error) {
  const known = error instanceof MovieCatalogStoreError;
  return {
    ok: false,
    error: {
      code: known ? error.code : "CATALOG_STORAGE_FAILED",
      message: known
        ? error.publicMessage
        : "Não foi possível salvar. O catálogo anterior foi preservado.",
      retryable: known ? error.retryable : true,
    },
  };
}

class MovieCatalogStore {
  constructor(databasePath, options = {}) {
    if (typeof databasePath !== "string" || !path.isAbsolute(databasePath))
      throw new MovieCatalogStoreError(
        "CATALOG_INVALID",
        "O banco local do catálogo não é válido.",
      );
    this.databasePath = databasePath;
    this.managedLibraryRoot = options.managedLibraryRoot
      ? path.resolve(options.managedLibraryRoot)
      : undefined;
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
    for (const file of [
      this.databasePath,
      `${this.databasePath}-wal`,
      `${this.databasePath}-shm`,
    ])
      if (fs.existsSync(file)) fs.chmodSync(file, 0o600);
  }

  migrate() {
    const base = this.database
      .prepare(
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'local_libraries'",
      )
      .get();
    if (!base)
      throw new MovieCatalogStoreError(
        "CATALOG_STORAGE_FAILED",
        "Conclua a configuração da biblioteca antes de abrir o catálogo.",
      );
    const current = this.database
      .prepare("SELECT MAX(version) AS version FROM schema_migrations")
      .get();
    if (Number(current?.version ?? 0) > DATABASE_SCHEMA_VERSION)
      throw new MovieCatalogStoreError(
        "CATALOG_PROTOCOL_UNSUPPORTED",
        "O banco local pertence a uma versão mais nova do Ushark.",
      );
    this.database.exec(`
      BEGIN IMMEDIATE;
      CREATE TABLE IF NOT EXISTS contents (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK(type = 'movie'),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS movies (
        content_id TEXT PRIMARY KEY REFERENCES contents(id) ON DELETE CASCADE,
        metadata_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sources (
        id TEXT PRIMARY KEY,
        descriptor_json TEXT NOT NULL,
        managed_path TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS content_sources (
        content_id TEXT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
        source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
        created_at INTEGER NOT NULL,
        PRIMARY KEY(content_id, source_id)
      );
      CREATE TABLE IF NOT EXISTS library_memberships (
        library_id TEXT NOT NULL REFERENCES local_libraries(id) ON DELETE CASCADE,
        content_id TEXT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
        order_index INTEGER NOT NULL,
        title_override TEXT,
        preserved_overrides_json TEXT NOT NULL DEFAULT '[]',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY(library_id, content_id)
      );
      CREATE INDEX IF NOT EXISTS idx_library_memberships_order
        ON library_memberships(library_id, order_index, content_id);
      CREATE TABLE IF NOT EXISTS user_content_state (
        content_id TEXT PRIMARY KEY REFERENCES contents(id) ON DELETE CASCADE,
        favorite INTEGER NOT NULL DEFAULT 0,
        progress INTEGER NOT NULL DEFAULT 0,
        history_json TEXT NOT NULL DEFAULT '[]',
        preferences_json TEXT NOT NULL DEFAULT '[]',
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS catalog_revisions (
        library_id TEXT PRIMARY KEY REFERENCES local_libraries(id) ON DELETE CASCADE,
        revision INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS catalog_idempotency (
        idempotency_key TEXT PRIMARY KEY,
        operation TEXT NOT NULL,
        result_json TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      INSERT OR IGNORE INTO schema_migrations(version, name, applied_at)
      VALUES (2, 'm02_movie_catalog', unixepoch());
      COMMIT;
    `);
  }

  requireLibrary(libraryId) {
    validateId(libraryId, "biblioteca");
    const row = this.database
      .prepare("SELECT 1 FROM local_libraries WHERE id = ?")
      .get(libraryId);
    if (!row)
      throw new MovieCatalogStoreError(
        "CATALOG_NOT_FOUND",
        "A biblioteca configurada não foi encontrada.",
      );
  }

  revision(libraryId) {
    return Number(
      this.database
        .prepare("SELECT revision FROM catalog_revisions WHERE library_id = ?")
        .get(libraryId)?.revision ?? 0,
    );
  }

  bumpRevision(libraryId) {
    this.database
      .prepare(
        `INSERT INTO catalog_revisions(library_id, revision) VALUES (?, 1)
         ON CONFLICT(library_id) DO UPDATE SET revision = revision + 1`,
      )
      .run(libraryId);
  }

  readMovie(contentId) {
    const row = this.database
      .prepare(
        `SELECT c.id, m.metadata_json, u.favorite, u.progress,
                u.history_json, u.preferences_json
         FROM contents c
         JOIN movies m ON m.content_id = c.id
         JOIN user_content_state u ON u.content_id = c.id
         WHERE c.id = ?`,
      )
      .get(contentId);
    if (!row) return undefined;
    const sources = this.database
      .prepare(
        `SELECT s.descriptor_json
         FROM content_sources cs JOIN sources s ON s.id = cs.source_id
         WHERE cs.content_id = ? ORDER BY cs.created_at, s.id`,
      )
      .all(contentId)
      .map((source) => parseJson(source.descriptor_json, {}));
    const memberships = this.database
      .prepare(
        `SELECT library_id, title_override, preserved_overrides_json
         FROM library_memberships WHERE content_id = ?
         ORDER BY order_index, library_id`,
      )
      .all(contentId)
      .map((membership) => ({
        libraryId: membership.library_id,
        titleOverride: membership.title_override ?? undefined,
        preservedOverrides: parseJson(membership.preserved_overrides_json, []),
      }));
    return {
      id: row.id,
      metadata: parseJson(row.metadata_json, {}),
      sources,
      memberships,
      personal: {
        favorite: row.favorite === 1,
        progress: Number(row.progress),
        history: parseJson(row.history_json, []),
        preferences: parseJson(row.preferences_json, []),
      },
    };
  }

  snapshot(libraryId) {
    this.requireLibrary(libraryId);
    const ids = this.database
      .prepare(
        `SELECT lm.content_id FROM library_memberships lm
         JOIN movies m ON m.content_id = lm.content_id
         WHERE lm.library_id = ? ORDER BY lm.order_index, lm.content_id`,
      )
      .all(libraryId);
    return {
      schemaVersion: MOVIE_CATALOG_SCHEMA_VERSION,
      libraryId,
      revision: this.revision(libraryId),
      providerState: "not-configured",
      movies: ids.map(({ content_id }) => this.readMovie(content_id)),
    };
  }

  read(input) {
    try {
      if (!isPlainObject(input))
        throw new MovieCatalogStoreError(
          "CATALOG_INVALID",
          "A consulta não é válida.",
        );
      return success(structuredClone(this.snapshot(input.libraryId)));
    } catch (error) {
      return failure(error);
    }
  }

  checkMutation(operation, mutation, libraryId) {
    if (
      !isPlainObject(mutation) ||
      typeof mutation.idempotencyKey !== "string" ||
      mutation.idempotencyKey.length < 8 ||
      mutation.idempotencyKey.length > 160
    )
      throw new MovieCatalogStoreError(
        "CATALOG_INVALID",
        "A chave idempotente da operação não é válida.",
      );
    const replay = this.database
      .prepare(
        "SELECT operation, result_json FROM catalog_idempotency WHERE idempotency_key = ?",
      )
      .get(mutation.idempotencyKey);
    if (replay) {
      if (replay.operation !== operation)
        throw new MovieCatalogStoreError(
          "CATALOG_CONFLICT",
          "A operação repetida não corresponde à intenção original.",
        );
      return parseJson(replay.result_json, undefined);
    }
    if (
      mutation.expectedRevision !== undefined &&
      mutation.expectedRevision !== this.revision(libraryId)
    )
      throw new MovieCatalogStoreError(
        "CATALOG_REVISION_CONFLICT",
        "O catálogo mudou. Recarregue antes de tentar novamente.",
        true,
      );
    return undefined;
  }

  rememberMutation(operation, key, value) {
    this.database
      .prepare(
        `INSERT INTO catalog_idempotency(idempotency_key, operation, result_json, created_at)
         VALUES (?, ?, ?, unixepoch())`,
      )
      .run(key, operation, JSON.stringify(value));
  }

  transaction(operation, input, mutate) {
    try {
      if (!isPlainObject(input))
        throw new MovieCatalogStoreError(
          "CATALOG_INVALID",
          "A operação do catálogo não é válida.",
        );
      this.requireLibrary(input.libraryId);
      const replay = this.checkMutation(
        operation,
        input.mutation,
        input.libraryId,
      );
      if (replay !== undefined) return success(structuredClone(replay));
      this.database.exec("BEGIN IMMEDIATE");
      try {
        const contentId = mutate();
        this.bumpRevision(input.libraryId);
        const value = {
          snapshot: this.snapshot(input.libraryId),
          movie: contentId ? this.readMovie(contentId) : undefined,
        };
        this.rememberMutation(operation, input.mutation.idempotencyKey, value);
        this.database.exec("COMMIT");
        this.secureDatabaseFiles();
        return success(structuredClone(value));
      } catch (error) {
        this.database.exec("ROLLBACK");
        throw error;
      }
    } catch (error) {
      return failure(error);
    }
  }

  ensureContent(contentId, metadata, overwrite) {
    const now = Math.floor(Date.now() / 1000);
    const exists = this.readMovie(contentId);
    if (!exists) {
      this.database
        .prepare(
          "INSERT INTO contents(id, type, created_at, updated_at) VALUES (?, 'movie', ?, ?)",
        )
        .run(contentId, now, now);
      this.database
        .prepare(
          "INSERT INTO movies(content_id, metadata_json, updated_at) VALUES (?, ?, ?)",
        )
        .run(contentId, JSON.stringify(metadata), now);
      this.database
        .prepare(
          `INSERT INTO user_content_state(
             content_id, favorite, progress, history_json, preferences_json, updated_at
           ) VALUES (?, 0, 0, '[]', '[]', ?)`,
        )
        .run(contentId, now);
    } else if (overwrite) {
      this.database
        .prepare(
          "UPDATE movies SET metadata_json = ?, updated_at = ? WHERE content_id = ?",
        )
        .run(JSON.stringify(metadata), now, contentId);
      this.database
        .prepare("UPDATE contents SET updated_at = ? WHERE id = ?")
        .run(now, contentId);
    }
  }

  ensureMembership(libraryId, contentId) {
    const now = Math.floor(Date.now() / 1000);
    const next = Number(
      this.database
        .prepare(
          "SELECT COALESCE(MAX(order_index), -1) + 1 AS value FROM library_memberships WHERE library_id = ?",
        )
        .get(libraryId).value,
    );
    this.database
      .prepare(
        `INSERT OR IGNORE INTO library_memberships(
           library_id, content_id, order_index, preserved_overrides_json, created_at, updated_at
         ) VALUES (?, ?, ?, '[]', ?, ?)`,
      )
      .run(libraryId, contentId, next, now, now);
  }

  upsertSource(contentId, source) {
    const now = Math.floor(Date.now() / 1000);
    this.database
      .prepare(
        `INSERT INTO sources(id, descriptor_json, managed_path, created_at, updated_at)
         VALUES (?, ?, NULL, ?, ?)
         ON CONFLICT(id) DO UPDATE SET descriptor_json = excluded.descriptor_json,
           updated_at = excluded.updated_at`,
      )
      .run(source.id, JSON.stringify(source), now, now);
    this.database
      .prepare(
        `INSERT OR IGNORE INTO content_sources(content_id, source_id, created_at)
         VALUES (?, ?, ?)`,
      )
      .run(contentId, source.id, now);
  }

  migrateContentSourceSelectors(sourceContentId, targetContentId, now) {
    const table = this.database
      .prepare(
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'content_source_selectors'",
      )
      .get();
    if (!table) return;
    const selectors = this.database
      .prepare(
        `SELECT content_source_id, source_id
         FROM content_source_selectors WHERE content_id = ?`,
      )
      .all(sourceContentId);
    const target = this.database.prepare(
      `SELECT content_source_id FROM content_source_selectors
       WHERE content_id = ? AND source_id = ?`,
    );
    const move = this.database.prepare(
      `UPDATE content_source_selectors
       SET content_id = ?, updated_at = ? WHERE content_source_id = ?`,
    );
    const removeDuplicate = this.database.prepare(
      "DELETE FROM content_source_selectors WHERE content_source_id = ?",
    );
    for (const selector of selectors) {
      if (target.get(targetContentId, selector.source_id))
        removeDuplicate.run(selector.content_source_id);
      else move.run(targetContentId, now, selector.content_source_id);
    }
  }

  merge(sourceId, targetId) {
    const source = this.readMovie(sourceId);
    const target = this.readMovie(targetId);
    if (!source || !target)
      throw new MovieCatalogStoreError(
        "CATALOG_NOT_FOUND",
        "Um dos filmes da união não foi encontrado.",
      );
    for (const [provider, value] of Object.entries(
      source.metadata.externalIds ?? {},
    )) {
      const targetValue = target.metadata.externalIds?.[provider];
      if (targetValue && value && targetValue !== value)
        throw new MovieCatalogStoreError(
          "IDENTITY_CONFLICT",
          "Os IDs externos entram em conflito. Revise a identificação.",
        );
    }
    const now = Math.floor(Date.now() / 1000);
    this.database
      .prepare(
        `INSERT OR IGNORE INTO content_sources(content_id, source_id, created_at)
         SELECT ?, source_id, ? FROM content_sources WHERE content_id = ?`,
      )
      .run(targetId, now, sourceId);
    this.migrateContentSourceSelectors(sourceId, targetId, now);
    for (const membership of source.memberships) {
      const existing = target.memberships.find(
        (candidate) => candidate.libraryId === membership.libraryId,
      );
      if (!existing) {
        const sourceRow = this.database
          .prepare(
            `SELECT order_index, title_override, preserved_overrides_json, created_at
             FROM library_memberships WHERE library_id = ? AND content_id = ?`,
          )
          .get(membership.libraryId, sourceId);
        this.database
          .prepare(
            `INSERT INTO library_memberships(
               library_id, content_id, order_index, title_override,
               preserved_overrides_json, created_at, updated_at
             ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            membership.libraryId,
            targetId,
            sourceRow.order_index,
            sourceRow.title_override,
            sourceRow.preserved_overrides_json,
            sourceRow.created_at,
            now,
          );
      } else {
        const preserved = new Set([
          ...existing.preservedOverrides,
          ...membership.preservedOverrides,
        ]);
        if (
          membership.titleOverride &&
          existing.titleOverride &&
          membership.titleOverride !== existing.titleOverride
        )
          preserved.add(membership.titleOverride);
        this.database
          .prepare(
            `UPDATE library_memberships
             SET title_override = COALESCE(title_override, ?),
                 preserved_overrides_json = ?, updated_at = ?
             WHERE library_id = ? AND content_id = ?`,
          )
          .run(
            membership.titleOverride ?? null,
            JSON.stringify([...preserved]),
            now,
            membership.libraryId,
            targetId,
          );
      }
    }
    this.database
      .prepare(
        `UPDATE user_content_state SET
           favorite = ?, progress = ?, history_json = ?, preferences_json = ?, updated_at = ?
         WHERE content_id = ?`,
      )
      .run(
        target.personal.favorite || source.personal.favorite ? 1 : 0,
        Math.max(target.personal.progress, source.personal.progress),
        JSON.stringify([
          ...new Set([...target.personal.history, ...source.personal.history]),
        ]),
        JSON.stringify([
          ...new Set([
            ...target.personal.preferences,
            ...source.personal.preferences,
          ]),
        ]),
        now,
        targetId,
      );
    this.database.prepare("DELETE FROM contents WHERE id = ?").run(sourceId);
  }

  save(input) {
    return this.transaction("save", input, () => {
      if (!isPlainObject(input.draft))
        throw new MovieCatalogStoreError(
          "CATALOG_INVALID",
          "O rascunho do filme não é válido.",
        );
      const metadata = validateMetadata(input.draft.metadata);
      const previousId = input.draft.editingId
        ? validateId(input.draft.editingId, "conteúdo")
        : undefined;
      const targetExists = !!this.readMovie(metadata.id);
      if (
        previousId &&
        previousId !== metadata.id &&
        targetExists &&
        input.draft.confirmMerge !== true
      )
        throw new MovieCatalogStoreError(
          "CATALOG_CONFLICT",
          "Revise a união com o filme existente antes de confirmar.",
        );
      this.ensureContent(
        metadata.id,
        metadata,
        !!previousId && previousId === metadata.id,
      );
      if (previousId && previousId !== metadata.id) {
        if (!this.readMovie(previousId))
          throw new MovieCatalogStoreError(
            "CATALOG_NOT_FOUND",
            "O filme original não foi encontrado.",
          );
        this.merge(previousId, metadata.id);
        this.ensureContent(metadata.id, metadata, true);
      }
      this.ensureMembership(input.libraryId, metadata.id);
      if (input.draft.source)
        this.upsertSource(metadata.id, validateSource(input.draft.source));
      return metadata.id;
    });
  }

  toggleFavorite(input) {
    return this.transaction("toggleFavorite", input, () => {
      const contentId = validateId(input.contentId, "conteúdo");
      if (!this.readMovie(contentId))
        throw new MovieCatalogStoreError(
          "CATALOG_NOT_FOUND",
          "O filme não foi encontrado.",
        );
      this.database
        .prepare(
          `UPDATE user_content_state SET favorite = CASE favorite WHEN 1 THEN 0 ELSE 1 END,
           updated_at = unixepoch() WHERE content_id = ?`,
        )
        .run(contentId);
      return contentId;
    });
  }

  addSource(input) {
    return this.transaction("addSource", input, () => {
      const contentId = validateId(input.contentId, "conteúdo");
      if (!this.readMovie(contentId))
        throw new MovieCatalogStoreError(
          "CATALOG_NOT_FOUND",
          "O filme não foi encontrado.",
        );
      this.upsertSource(contentId, validateSource(input.source));
      return contentId;
    });
  }

  removeSource(input) {
    return this.transaction("removeSource", input, () => {
      const contentId = validateId(input.contentId, "conteúdo");
      const sourceId = validateId(input.sourceId, "source");
      this.database
        .prepare(
          "DELETE FROM content_sources WHERE content_id = ? AND source_id = ?",
        )
        .run(contentId, sourceId);
      return contentId;
    });
  }

  removeMembership(input) {
    return this.transaction("removeMembership", input, () => {
      const contentId = validateId(input.contentId, "conteúdo");
      const membershipLibraryId = validateId(
        input.membershipLibraryId,
        "biblioteca",
      );
      this.database
        .prepare(
          "DELETE FROM library_memberships WHERE library_id = ? AND content_id = ?",
        )
        .run(membershipLibraryId, contentId);
      return contentId;
    });
  }

  resolveManagedFile(candidate) {
    if (!this.managedLibraryRoot)
      throw new MovieCatalogStoreError(
        "FILE_NOT_MANAGED",
        "Este arquivo não pertence a uma pasta gerenciada pelo Ushark.",
      );
    try {
      const root = fs.realpathSync(this.managedLibraryRoot);
      const target = fs.realpathSync(candidate);
      const relative = path.relative(root, target);
      if (
        !relative ||
        relative === ".." ||
        relative.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relative) ||
        !fs.statSync(target).isFile()
      )
        throw new Error("outside managed root");
      return target;
    } catch (error) {
      throw new MovieCatalogStoreError(
        "FILE_NOT_MANAGED",
        "Este arquivo não pertence a uma pasta gerenciada pelo Ushark.",
        false,
        error,
      );
    }
  }

  /** Core-only registration. Paths never cross the renderer contract. */
  registerManagedFile(sourceId, filePath) {
    const validatedSourceId = validateId(sourceId, "source");
    const managedPath = this.resolveManagedFile(filePath);
    const row = this.database
      .prepare("SELECT descriptor_json FROM sources WHERE id = ?")
      .get(validatedSourceId);
    if (!row)
      throw new MovieCatalogStoreError(
        "CATALOG_NOT_FOUND",
        "A source do arquivo não foi encontrada.",
      );
    const descriptor = parseJson(row.descriptor_json, {});
    descriptor.availability = "available";
    descriptor.fileAvailable = true;
    descriptor.managedFile = true;
    this.database
      .prepare(
        `UPDATE sources SET descriptor_json = ?, managed_path = ?, updated_at = unixepoch()
         WHERE id = ?`,
      )
      .run(JSON.stringify(descriptor), managedPath, validatedSourceId);
  }

  deleteManagedFile(input) {
    return this.transaction("deleteManagedFile", input, () => {
      if (input.confirm !== true)
        throw new MovieCatalogStoreError(
          "FILE_DELETE_NOT_CONFIRMED",
          "Confirme separadamente a exclusão do arquivo.",
        );
      const contentId = validateId(input.contentId, "conteúdo");
      const sourceId = validateId(input.sourceId, "source");
      const linked = this.database
        .prepare(
          `SELECT s.descriptor_json, s.managed_path
           FROM content_sources cs JOIN sources s ON s.id = cs.source_id
           WHERE cs.content_id = ? AND cs.source_id = ?`,
        )
        .get(contentId, sourceId);
      if (!linked?.managed_path)
        throw new MovieCatalogStoreError(
          "FILE_NOT_MANAGED",
          "Esta source não possui um arquivo gerenciado para excluir.",
        );
      const target = this.resolveManagedFile(linked.managed_path);
      try {
        fs.unlinkSync(target);
      } catch (error) {
        throw new MovieCatalogStoreError(
          "FILE_OPERATION_FAILED",
          "Não foi possível excluir o arquivo. A source foi preservada.",
          true,
          error,
        );
      }
      const descriptor = parseJson(linked.descriptor_json, {});
      descriptor.availability = "missing";
      descriptor.fileAvailable = false;
      descriptor.managedFile = false;
      this.database
        .prepare(
          `UPDATE sources SET descriptor_json = ?, managed_path = NULL,
           updated_at = unixepoch() WHERE id = ?`,
        )
        .run(JSON.stringify(descriptor), sourceId);
      return contentId;
    });
  }

  close() {
    this.database.close();
  }
}

module.exports = {
  DATABASE_SCHEMA_VERSION,
  MOVIE_CATALOG_SCHEMA_VERSION,
  MovieCatalogStore,
  MovieCatalogStoreError,
  validateMetadata,
  validateSource,
};
