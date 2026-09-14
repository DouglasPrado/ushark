"use strict";

const { Buffer } = require("node:buffer");
const { randomUUID } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { mapEpisodeFiles } = require("./episode-mapper.cjs");

const DATABASE_SCHEMA_VERSION = 10;
const SERIES_SCHEMA_VERSION = 1;

const LIMITS = Object.freeze({
  titleBytes: 512,
  synopsisBytes: 20_000,
  externalIdBytes: 128,
  seasonNumber: 999,
  episodeNumber: 9_999,
  pageDefault: 64,
  pageMaximum: 128,
  cursorBytes: 512,
  hierarchyEpisodes: 50_000,
});

class SeriesCatalogStoreError extends Error {
  constructor(code, publicMessage, retryable = false, cause) {
    super(publicMessage, cause ? { cause } : undefined);
    this.name = "SeriesCatalogStoreError";
    this.code = code;
    this.publicMessage = publicMessage;
    this.retryable = retryable;
  }
}

function success(value) {
  return { ok: true, value };
}

function failure(error) {
  const known = error instanceof SeriesCatalogStoreError;
  return {
    ok: false,
    error: {
      code: known ? error.code : "SERIES_STORAGE_FAILED",
      message: known
        ? error.publicMessage
        : "Não foi possível atualizar as séries. O estado anterior foi preservado.",
      recoverable: known ? error.retryable : true,
      retryable: known ? error.retryable : true,
    },
  };
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function utf8Length(value) {
  return Buffer.byteLength(value, "utf8");
}

function validateId(value, label) {
  if (
    typeof value !== "string" ||
    value.length < 3 ||
    value.length > 160 ||
    value.includes("\0") ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]+$/.test(value)
  )
    throw new SeriesCatalogStoreError(
      "SERIES_INVALID",
      `A identidade de ${label} não é válida.`,
    );
  return value;
}

function optionalString(value, maximumBytes, label) {
  if (value === undefined) return undefined;
  if (
    typeof value !== "string" ||
    value.includes("\0") ||
    utf8Length(value) > maximumBytes
  )
    throw new SeriesCatalogStoreError(
      "SERIES_INVALID",
      `O campo ${label} não é válido.`,
    );
  return value;
}

function stringList(value, maximumItems, maximumBytes, label) {
  if (
    !Array.isArray(value) ||
    value.length > maximumItems ||
    value.some(
      (item) =>
        typeof item !== "string" ||
        item.includes("\0") ||
        utf8Length(item) > maximumBytes,
    )
  )
    throw new SeriesCatalogStoreError(
      "SERIES_INVALID",
      `O campo ${label} não é válido.`,
    );
  return [...new Set(value)];
}

function optionalYear(value, label) {
  if (value === undefined) return undefined;
  if (!Number.isInteger(value) || value < 1870 || value > 2200)
    throw new SeriesCatalogStoreError(
      "SERIES_INVALID",
      `O campo ${label} não é válido.`,
    );
  return value;
}

function validateExternalIds(value) {
  if (value === undefined) return undefined;
  if (!isPlainObject(value))
    throw new SeriesCatalogStoreError(
      "SERIES_INVALID",
      "Os IDs externos não são válidos.",
    );
  return {
    tmdb: optionalString(value.tmdb, LIMITS.externalIdBytes, "TMDB ID"),
    imdb: optionalString(value.imdb, LIMITS.externalIdBytes, "IMDb ID"),
  };
}

function validateSeriesMetadata(value) {
  if (!isPlainObject(value))
    throw new SeriesCatalogStoreError(
      "SERIES_INVALID",
      "A metadata da série não é válida.",
    );
  if (
    typeof value.title !== "string" ||
    !value.title.trim() ||
    value.title.includes("\0") ||
    utf8Length(value.title) > LIMITS.titleBytes
  )
    throw new SeriesCatalogStoreError(
      "SERIES_INVALID",
      "Dê um título à série (até 512 bytes).",
    );
  const startYear = optionalYear(value.startYear, "ano inicial");
  const endYear = optionalYear(value.endYear, "ano final");
  if (startYear !== undefined && endYear !== undefined && endYear < startYear)
    throw new SeriesCatalogStoreError(
      "SERIES_INVALID",
      "O período da série não é válido.",
    );
  return {
    title: value.title.trim(),
    originalTitle: optionalString(
      value.originalTitle,
      LIMITS.titleBytes,
      "título original",
    ),
    synopsis: optionalString(value.synopsis, LIMITS.synopsisBytes, "sinopse"),
    startYear,
    endYear,
    status: optionalString(value.status, 128, "status"),
    genres: stringList(value.genres ?? [], 32, 160, "gêneros"),
    cast: stringList(value.cast ?? [], 256, 256, "elenco"),
    poster: optionalString(value.poster, 4_096, "poster"),
    backdrop: optionalString(value.backdrop, 4_096, "backdrop"),
    externalIds: validateExternalIds(value.externalIds),
  };
}

function validateEpisodeMetadata(value) {
  if (value === undefined) return {};
  if (!isPlainObject(value))
    throw new SeriesCatalogStoreError(
      "SERIES_INVALID",
      "A metadata do episódio não é válida.",
    );
  if (
    value.runtimeSeconds !== undefined &&
    (!Number.isInteger(value.runtimeSeconds) ||
      value.runtimeSeconds < 1 ||
      value.runtimeSeconds > 100_000)
  )
    throw new SeriesCatalogStoreError(
      "SERIES_INVALID",
      "A duração do episódio não é válida.",
    );
  if (
    value.airDate !== undefined &&
    (typeof value.airDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value.airDate))
  )
    throw new SeriesCatalogStoreError(
      "SERIES_INVALID",
      "A data do episódio não é válida.",
    );
  return {
    title: optionalString(value.title, LIMITS.titleBytes, "título do episódio"),
    synopsis: optionalString(
      value.synopsis,
      LIMITS.synopsisBytes,
      "sinopse do episódio",
    ),
    runtimeSeconds: value.runtimeSeconds,
    airDate: value.airDate,
    still: optionalString(value.still, 4_096, "imagem do episódio"),
    externalIds: validateExternalIds(value.externalIds),
  };
}

function validateEpisodeNumber(value, maximum, label, minimum) {
  if (!Number.isInteger(value) || value < minimum || value > maximum)
    throw new SeriesCatalogStoreError(
      "SERIES_INVALID",
      `O número de ${label} não é válido.`,
    );
  return value;
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function encodeCursor(parts) {
  return Buffer.from(JSON.stringify(parts), "utf8").toString("base64url");
}

function decodeCursor(cursor, shape) {
  if (cursor === undefined) return undefined;
  const value = isPlainObject(cursor) ? cursor.value : undefined;
  if (
    typeof value !== "string" ||
    !value ||
    utf8Length(value) > LIMITS.cursorBytes
  )
    throw new SeriesCatalogStoreError(
      "SERIES_INVALID",
      "O cursor da consulta não é válido.",
    );
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (!shape(parsed)) throw new Error("cursor shape");
    return parsed;
  } catch {
    throw new SeriesCatalogStoreError(
      "SERIES_INVALID",
      "O cursor da consulta não é válido.",
    );
  }
}

function pageLimit(value) {
  if (value === undefined) return LIMITS.pageDefault;
  if (!Number.isInteger(value) || value < 1 || value > LIMITS.pageMaximum)
    throw new SeriesCatalogStoreError(
      "SERIES_INVALID",
      `A página deve conter de 1 a ${LIMITS.pageMaximum} itens.`,
    );
  return value;
}

class SeriesCatalogStore {
  constructor(databasePath) {
    if (typeof databasePath !== "string" || !path.isAbsolute(databasePath))
      throw new SeriesCatalogStoreError(
        "SERIES_INVALID",
        "O banco local de séries não é válido.",
      );
    this.databasePath = databasePath;
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath);
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

  migrateContents() {
    const table = this.database
      .prepare(
        "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'contents'",
      )
      .get();
    if (!table) {
      this.database.exec(`
        CREATE TABLE contents (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL CHECK(type IN ('movie', 'series', 'episode', 'local-video')),
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);
      return;
    }
    if (!/CHECK\s*\(\s*type\s*=\s*'movie'\s*\)/i.test(table.sql ?? "")) return;

    this.database.exec("PRAGMA foreign_keys = OFF");
    try {
      this.database.exec(`
        BEGIN IMMEDIATE;
        CREATE TABLE contents_v6 (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL CHECK(type IN ('movie', 'series', 'episode', 'local-video')),
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        INSERT INTO contents_v6(id, type, created_at, updated_at)
          SELECT id, type, created_at, updated_at FROM contents;
        DROP TABLE contents;
        ALTER TABLE contents_v6 RENAME TO contents;
        COMMIT;
      `);
    } catch (error) {
      try {
        this.database.exec("ROLLBACK");
      } catch {
        // The failed statement may already have ended the migration transaction.
      }
      throw error;
    } finally {
      this.database.exec("PRAGMA foreign_keys = ON");
    }
    const violations = this.database.prepare("PRAGMA foreign_key_check").all();
    if (violations.length)
      throw new SeriesCatalogStoreError(
        "SERIES_STORAGE_FAILED",
        "A migração do catálogo encontrou relações inválidas.",
      );
  }

  migrate() {
    const base = this.database
      .prepare(
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'local_libraries'",
      )
      .get();
    if (!base)
      throw new SeriesCatalogStoreError(
        "SERIES_STORAGE_FAILED",
        "Conclua a configuração da biblioteca antes de abrir séries.",
      );
    const current = this.database
      .prepare("SELECT MAX(version) AS version FROM schema_migrations")
      .get();
    if (Number(current?.version ?? 0) > DATABASE_SCHEMA_VERSION)
      throw new SeriesCatalogStoreError(
        "SERIES_PROTOCOL_UNSUPPORTED",
        "O banco local pertence a uma versão mais nova do Ushark.",
      );

    this.migrateContents();
    this.database.exec(`
      BEGIN IMMEDIATE;
      CREATE TABLE IF NOT EXISTS series (
        content_id TEXT PRIMARY KEY REFERENCES contents(id) ON DELETE CASCADE,
        metadata_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS episodes (
        content_id TEXT PRIMARY KEY REFERENCES contents(id) ON DELETE CASCADE,
        series_content_id TEXT NOT NULL REFERENCES series(content_id) ON DELETE CASCADE,
        season_number INTEGER NOT NULL CHECK(season_number BETWEEN 0 AND 999),
        episode_number INTEGER NOT NULL CHECK(episode_number BETWEEN 1 AND 9999),
        metadata_json TEXT NOT NULL DEFAULT '{}',
        artwork_json TEXT,
        updated_at INTEGER NOT NULL,
        UNIQUE(series_content_id, season_number, episode_number)
      );
      CREATE INDEX IF NOT EXISTS idx_episodes_series_order
        ON episodes(series_content_id, season_number, episode_number, content_id);
      CREATE INDEX IF NOT EXISTS idx_contents_type
        ON contents(type, id);
      CREATE TABLE IF NOT EXISTS series_import_reviews (
        review_id TEXT PRIMARY KEY,
        operation_id TEXT NOT NULL UNIQUE,
        library_id TEXT NOT NULL REFERENCES local_libraries(id) ON DELETE CASCADE,
        series_content_id TEXT REFERENCES series(content_id) ON DELETE SET NULL,
        source_id TEXT,
        title TEXT NOT NULL,
        state TEXT NOT NULL CHECK(state IN ('draft', 'ready', 'confirmed', 'failed')),
        revision INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_series_import_reviews_library
        ON series_import_reviews(library_id, updated_at, review_id);
      CREATE TABLE IF NOT EXISTS series_review_files (
        review_id TEXT NOT NULL REFERENCES series_import_reviews(review_id) ON DELETE CASCADE,
        file_id TEXT NOT NULL,
        order_index INTEGER NOT NULL,
        path TEXT NOT NULL,
        name TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        base_mapping_state TEXT NOT NULL CHECK(base_mapping_state IN (
          'identified', 'ambiguous', 'unidentified', 'multiple-episodes', 'manual', 'skipped'
        )),
        inference_pattern TEXT NOT NULL,
        suggestions_json TEXT NOT NULL,
        season_number INTEGER,
        episode_number INTEGER,
        selector_type TEXT CHECK(selector_type IN ('episode', 'filename', 'manual')),
        subtitle_candidates_json TEXT NOT NULL DEFAULT '[]',
        selected_subtitle_file_id TEXT,
        PRIMARY KEY(review_id, file_id),
        UNIQUE(review_id, order_index)
      );
      CREATE INDEX IF NOT EXISTS idx_series_review_files_page
        ON series_review_files(review_id, order_index, file_id);
      CREATE TABLE IF NOT EXISTS series_idempotency (
        idempotency_key TEXT PRIMARY KEY,
        operation TEXT NOT NULL,
        result_json TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      INSERT OR IGNORE INTO schema_migrations(version, name, applied_at)
      VALUES (6, 'm03_series_hierarchy', unixepoch());
      COMMIT;
    `);
    const selectorColumns = this.database
      .prepare("PRAGMA table_info(content_source_selectors)")
      .all()
      .map((column) => column.name);
    if (!selectorColumns.includes("selected_subtitle_file_id"))
      this.database.exec(
        "ALTER TABLE content_source_selectors ADD COLUMN selected_subtitle_file_id TEXT",
      );
  }

  requireLibrary(libraryId) {
    validateId(libraryId, "biblioteca");
    if (
      !this.database
        .prepare("SELECT 1 FROM local_libraries WHERE id = ?")
        .get(libraryId)
    )
      throw new SeriesCatalogStoreError(
        "SERIES_NOT_FOUND",
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

  checkMutation(operation, mutation, libraryId) {
    if (
      !isPlainObject(mutation) ||
      typeof mutation.idempotencyKey !== "string" ||
      mutation.idempotencyKey.length < 8 ||
      utf8Length(mutation.idempotencyKey) > 160
    )
      throw new SeriesCatalogStoreError(
        "SERIES_INVALID",
        "A chave idempotente da operação não é válida.",
      );
    const replay = this.database
      .prepare(
        "SELECT operation, result_json FROM series_idempotency WHERE idempotency_key = ?",
      )
      .get(mutation.idempotencyKey);
    if (replay) {
      if (replay.operation !== operation)
        throw new SeriesCatalogStoreError(
          "SERIES_CONFLICT",
          "A operação repetida não corresponde à intenção original.",
        );
      return parseJson(replay.result_json, undefined);
    }
    if (
      mutation.expectedRevision !== undefined &&
      mutation.expectedRevision !== this.revision(libraryId)
    )
      throw new SeriesCatalogStoreError(
        "SERIES_REVISION_CONFLICT",
        "O catálogo mudou. Recarregue antes de tentar novamente.",
        true,
      );
    return undefined;
  }

  rememberMutation(operation, key, value) {
    this.database
      .prepare(
        `INSERT INTO series_idempotency(idempotency_key, operation, result_json, created_at)
         VALUES (?, ?, ?, unixepoch())`,
      )
      .run(key, operation, JSON.stringify(value));
  }

  checkReplay(operation, mutation) {
    if (
      !isPlainObject(mutation) ||
      typeof mutation.idempotencyKey !== "string" ||
      mutation.idempotencyKey.length < 8 ||
      utf8Length(mutation.idempotencyKey) > 160
    )
      throw new SeriesCatalogStoreError(
        "SERIES_INVALID",
        "A chave idempotente da operação não é válida.",
      );
    const replay = this.database
      .prepare(
        "SELECT operation, result_json FROM series_idempotency WHERE idempotency_key = ?",
      )
      .get(mutation.idempotencyKey);
    if (!replay) return undefined;
    if (replay.operation !== operation)
      throw new SeriesCatalogStoreError(
        "SERIES_CONFLICT",
        "A operação repetida não corresponde à intenção original.",
      );
    return parseJson(replay.result_json, undefined);
  }

  readSeriesValue(seriesId) {
    const row = this.database
      .prepare(
        `SELECT s.content_id, s.metadata_json, COUNT(e.content_id) AS episode_count
         FROM series s
         LEFT JOIN episodes e ON e.series_content_id = s.content_id
         WHERE s.content_id = ?
         GROUP BY s.content_id`,
      )
      .get(seriesId);
    if (!row) return undefined;
    const seasons = this.database
      .prepare(
        `SELECT season_number, COUNT(*) AS episode_count,
                SUM(CASE WHEN EXISTS (
                  SELECT 1 FROM content_source_selectors css
                  WHERE css.content_id = episodes.content_id
                ) THEN 1 ELSE 0 END) AS mapped_count
         FROM episodes WHERE series_content_id = ?
         GROUP BY season_number ORDER BY season_number`,
      )
      .all(seriesId)
      .map((season) => ({
        seasonNumber: Number(season.season_number),
        episodeCount: Number(season.episode_count),
        mappedEpisodeCount: Number(season.mapped_count),
      }));
    return {
      id: row.content_id,
      metadata: parseJson(row.metadata_json, {}),
      seasons,
      episodeCount: Number(row.episode_count),
    };
  }

  assertSeriesInLibrary(libraryId, seriesId) {
    this.requireLibrary(libraryId);
    validateId(seriesId, "série");
    const exists = this.database
      .prepare(
        `SELECT 1 FROM series s
         JOIN library_memberships lm ON lm.content_id = s.content_id
         WHERE lm.library_id = ? AND s.content_id = ?`,
      )
      .get(libraryId, seriesId);
    if (!exists)
      throw new SeriesCatalogStoreError(
        "SERIES_NOT_FOUND",
        "A série não foi encontrada nesta biblioteca.",
      );
  }

  catalogSnapshot(input) {
    if (!isPlainObject(input))
      throw new SeriesCatalogStoreError(
        "SERIES_INVALID",
        "A consulta de séries não é válida.",
      );
    this.requireLibrary(input.libraryId);
    const limit = pageLimit(input.limit);
    const cursor = decodeCursor(
      input.cursor,
      (value) =>
        isPlainObject(value) &&
        Number.isInteger(value.order) &&
        typeof value.id === "string",
    );
    const params = [input.libraryId];
    let cursorClause = "";
    if (cursor) {
      cursorClause =
        "AND (lm.order_index > ? OR (lm.order_index = ? AND s.content_id > ?))";
      params.push(cursor.order, cursor.order, cursor.id);
    }
    params.push(limit + 1);
    const rows = this.database
      .prepare(
        `SELECT s.content_id, lm.order_index
         FROM library_memberships lm
         JOIN series s ON s.content_id = lm.content_id
         WHERE lm.library_id = ? ${cursorClause}
         ORDER BY lm.order_index, s.content_id LIMIT ?`,
      )
      .all(...params);
    const hasMore = rows.length > limit;
    const visible = rows.slice(0, limit);
    const last = visible.at(-1);
    return {
      schemaVersion: SERIES_SCHEMA_VERSION,
      libraryId: input.libraryId,
      revision: this.revision(input.libraryId),
      providerState: "not-configured",
      series: {
        items: visible.map((row) => this.readSeriesValue(row.content_id)),
        nextCursor:
          hasMore && last
            ? {
                value: encodeCursor({
                  order: last.order_index,
                  id: last.content_id,
                }),
              }
            : undefined,
        total: Number(
          this.database
            .prepare(
              `SELECT COUNT(*) AS total FROM library_memberships lm
               JOIN series s ON s.content_id = lm.content_id
               WHERE lm.library_id = ?`,
            )
            .get(input.libraryId).total,
        ),
      },
    };
  }

  readCatalog(input) {
    try {
      return success(structuredClone(this.catalogSnapshot(input)));
    } catch (error) {
      return failure(error);
    }
  }

  readSeries(input) {
    try {
      if (!isPlainObject(input))
        throw new SeriesCatalogStoreError(
          "SERIES_INVALID",
          "A consulta da série não é válida.",
        );
      this.assertSeriesInLibrary(input.libraryId, input.seriesId);
      return success(structuredClone(this.readSeriesValue(input.seriesId)));
    } catch (error) {
      return failure(error);
    }
  }

  sourceRelations(episodeId) {
    return this.database
      .prepare(
        `SELECT css.content_source_id, css.source_id, css.selector_json,
                css.selected_subtitle_file_id, ts.input_label,
                tr.metadata_json
         FROM content_source_selectors css
         JOIN torrent_sources ts ON ts.source_id = css.source_id
         JOIN torrent_runtimes tr ON tr.info_hash = ts.info_hash
         WHERE css.content_id = ? ORDER BY css.created_at, css.source_id`,
      )
      .all(episodeId)
      .map((relation) => {
        const selector = parseJson(relation.selector_json, {});
        const sourceFiles = parseJson(relation.metadata_json, {}).files ?? [];
        const selected = sourceFiles.find(
          (file) => file.id === selector.fileId,
        );
        return {
          contentSourceId: relation.content_source_id,
          episodeId,
          sourceId: relation.source_id,
          sourceName: relation.input_label,
          selector,
          resolvedFileId: selector.fileId,
          selectedSubtitleFileId:
            relation.selected_subtitle_file_id ?? undefined,
          fileName: selected?.name,
        };
      });
  }

  episodeValue(row) {
    return {
      id: row.content_id,
      seriesId: row.series_content_id,
      seasonNumber: Number(row.season_number),
      episodeNumber: Number(row.episode_number),
      metadata: parseJson(row.metadata_json, {}),
      artwork: row.artwork_json
        ? parseJson(row.artwork_json, undefined)
        : undefined,
      sources: this.sourceRelations(row.content_id),
    };
  }

  readEpisodes(input) {
    try {
      if (!isPlainObject(input))
        throw new SeriesCatalogStoreError(
          "SERIES_INVALID",
          "A consulta de episódios não é válida.",
        );
      this.assertSeriesInLibrary(input.libraryId, input.seriesId);
      const limit = pageLimit(input.limit);
      const season =
        input.seasonNumber === undefined
          ? undefined
          : validateEpisodeNumber(
              input.seasonNumber,
              LIMITS.seasonNumber,
              "temporada",
              0,
            );
      const cursor = decodeCursor(
        input.cursor,
        (value) =>
          isPlainObject(value) &&
          Number.isInteger(value.season) &&
          Number.isInteger(value.episode) &&
          typeof value.id === "string",
      );
      const params = [input.seriesId];
      let seasonClause = "";
      let cursorClause = "";
      if (season !== undefined) {
        seasonClause = "AND e.season_number = ?";
        params.push(season);
      }
      if (cursor) {
        cursorClause = `AND (
          e.season_number > ? OR
          (e.season_number = ? AND e.episode_number > ?) OR
          (e.season_number = ? AND e.episode_number = ? AND e.content_id > ?)
        )`;
        params.push(
          cursor.season,
          cursor.season,
          cursor.episode,
          cursor.season,
          cursor.episode,
          cursor.id,
        );
      }
      params.push(limit + 1);
      const rows = this.database
        .prepare(
          `SELECT e.content_id, e.series_content_id, e.season_number,
                  e.episode_number, e.metadata_json, e.artwork_json
           FROM episodes e WHERE e.series_content_id = ?
           ${seasonClause} ${cursorClause}
           ORDER BY e.season_number, e.episode_number, e.content_id LIMIT ?`,
        )
        .all(...params);
      const hasMore = rows.length > limit;
      const visible = rows.slice(0, limit);
      const last = visible.at(-1);
      const totalParams =
        season === undefined ? [input.seriesId] : [input.seriesId, season];
      const total = this.database
        .prepare(
          `SELECT COUNT(*) AS total FROM episodes
           WHERE series_content_id = ? ${season === undefined ? "" : "AND season_number = ?"}`,
        )
        .get(...totalParams);
      return success({
        items: visible.map((row) => this.episodeValue(row)),
        nextCursor:
          hasMore && last
            ? {
                value: encodeCursor({
                  season: last.season_number,
                  episode: last.episode_number,
                  id: last.content_id,
                }),
              }
            : undefined,
        total: Number(total.total),
      });
    } catch (error) {
      return failure(error);
    }
  }

  reviewFiles(reviewId) {
    const rows = this.database
      .prepare(
        `SELECT file_id, order_index, path, name, size_bytes,
                base_mapping_state, inference_pattern, suggestions_json,
                season_number, episode_number, selector_type,
                subtitle_candidates_json, selected_subtitle_file_id
         FROM series_review_files WHERE review_id = ?
         ORDER BY order_index, file_id`,
      )
      .all(reviewId);
    const coordinates = new Map();
    for (const row of rows) {
      if (
        !["identified", "manual"].includes(row.base_mapping_state) ||
        row.season_number === null ||
        row.episode_number === null
      )
        continue;
      const key = `${row.season_number}:${row.episode_number}`;
      coordinates.set(key, (coordinates.get(key) ?? 0) + 1);
    }
    return rows.map((row) => {
      const coordinateKey = `${row.season_number}:${row.episode_number}`;
      const collision =
        ["identified", "manual"].includes(row.base_mapping_state) &&
        coordinates.get(coordinateKey) > 1;
      const assigned =
        row.season_number === null || row.episode_number === null
          ? undefined
          : this.database
              .prepare(
                `SELECT content_id FROM episodes
                 WHERE series_content_id = (
                   SELECT series_content_id FROM series_import_reviews WHERE review_id = ?
                 ) AND season_number = ? AND episode_number = ?`,
              )
              .get(reviewId, row.season_number, row.episode_number)?.content_id;
      return {
        fileId: row.file_id,
        orderIndex: Number(row.order_index),
        path: row.path,
        name: row.name,
        sizeBytes: Number(row.size_bytes),
        mappingState: collision ? "conflict" : row.base_mapping_state,
        inferencePattern: row.inference_pattern,
        suggestions: parseJson(row.suggestions_json, []),
        assignedEpisodeId: assigned,
        seasonNumber:
          row.season_number === null ? undefined : Number(row.season_number),
        episodeNumber:
          row.episode_number === null ? undefined : Number(row.episode_number),
        selectorType: row.selector_type ?? undefined,
        subtitleCandidates: parseJson(row.subtitle_candidates_json, []),
        selectedSubtitleFileId: row.selected_subtitle_file_id ?? undefined,
      };
    });
  }

  reviewSnapshot(reviewId, cursorInput, limitInput) {
    validateId(reviewId, "revisão");
    const review = this.database
      .prepare(
        `SELECT review_id, operation_id, library_id, series_content_id, source_id,
                title, state, revision, updated_at
         FROM series_import_reviews WHERE review_id = ?`,
      )
      .get(reviewId);
    if (!review)
      throw new SeriesCatalogStoreError(
        "SERIES_NOT_FOUND",
        "A revisão da série não foi encontrada.",
      );
    const limit = pageLimit(limitInput);
    const cursor = decodeCursor(
      cursorInput,
      (value) =>
        isPlainObject(value) &&
        Number.isInteger(value.order) &&
        typeof value.id === "string",
    );
    const all = this.reviewFiles(reviewId);
    const start = cursor
      ? all.findIndex(
          (file) =>
            file.orderIndex > cursor.order ||
            (file.orderIndex === cursor.order && file.fileId > cursor.id),
        )
      : 0;
    const normalizedStart = start < 0 ? all.length : start;
    const visible = all.slice(normalizedStart, normalizedStart + limit);
    const hasMore = normalizedStart + visible.length < all.length;
    const last = visible.at(-1);
    const issueCount = all.filter((file) =>
      ["ambiguous", "unidentified", "conflict", "multiple-episodes"].includes(
        file.mappingState,
      ),
    ).length;
    const mappedCount = all.filter((file) =>
      ["identified", "manual"].includes(file.mappingState),
    ).length;
    const derivedState =
      review.state === "confirmed" || review.state === "failed"
        ? review.state
        : issueCount === 0 && mappedCount > 0
          ? "ready"
          : "draft";
    return {
      schemaVersion: SERIES_SCHEMA_VERSION,
      reviewId: review.review_id,
      operationId: review.operation_id,
      libraryId: review.library_id,
      seriesId: review.series_content_id ?? undefined,
      sourceId: review.source_id ?? undefined,
      title: review.title,
      state: derivedState,
      revision: Number(review.revision),
      mappedCount,
      issueCount,
      files: {
        items: visible.map((file) => {
          const item = { ...file };
          delete item.orderIndex;
          return item;
        }),
        nextCursor:
          hasMore && last
            ? {
                value: encodeCursor({
                  order: last.orderIndex,
                  id: last.fileId,
                }),
              }
            : undefined,
        total: all.length,
      },
      updatedAt: new Date(Number(review.updated_at) * 1_000).toISOString(),
    };
  }

  createReview(input) {
    try {
      if (!isPlainObject(input))
        throw new SeriesCatalogStoreError(
          "SERIES_INVALID",
          "A revisão da série não é válida.",
        );
      this.requireLibrary(input.libraryId);
      const replay = this.checkMutation(
        "create-review",
        input.mutation,
        input.libraryId,
      );
      if (replay !== undefined) return success(structuredClone(replay));
      const operationId = validateId(input.operationId, "operação");
      const title = validateSeriesMetadata({
        title: input.title,
        genres: [],
        cast: [],
      }).title;
      const seriesId =
        input.seriesId === undefined
          ? undefined
          : validateId(input.seriesId, "série");
      if (seriesId && !this.readSeriesValue(seriesId))
        throw new SeriesCatalogStoreError(
          "SERIES_NOT_FOUND",
          "A série escolhida para a revisão não foi encontrada.",
        );
      if (!Array.isArray(input.files) || input.files.length > 10_000)
        throw new SeriesCatalogStoreError(
          "SERIES_INVALID",
          "A lista de arquivos da revisão não é válida.",
        );
      for (const file of input.files) {
        if (
          !isPlainObject(file) ||
          typeof file.id !== "string" ||
          typeof file.path !== "string" ||
          typeof file.name !== "string" ||
          !Number.isSafeInteger(file.sizeBytes) ||
          file.sizeBytes < 0
        )
          throw new SeriesCatalogStoreError(
            "SERIES_INVALID",
            "Um arquivo da revisão não é válido.",
          );
      }
      const mapped = mapEpisodeFiles(input.files);
      if (!mapped.some((file) => file.baseMappingState !== "skipped"))
        throw new SeriesCatalogStoreError(
          "SERIES_IMPORT_INCOMPLETE",
          "Nenhum arquivo de episódio selecionável foi encontrado.",
        );
      const existing = this.database
        .prepare(
          "SELECT review_id FROM series_import_reviews WHERE operation_id = ?",
        )
        .get(operationId);
      if (existing) return success(this.reviewSnapshot(existing.review_id));
      const reviewId = `review:${randomUUID()}`;
      this.database.exec("BEGIN IMMEDIATE");
      try {
        this.database
          .prepare(
            `INSERT INTO series_import_reviews(
               review_id, operation_id, library_id, series_content_id, title,
               state, revision, created_at, updated_at
             ) VALUES (?, ?, ?, ?, ?, 'draft', 0, unixepoch(), unixepoch())`,
          )
          .run(reviewId, operationId, input.libraryId, seriesId ?? null, title);
        const insert = this.database.prepare(
          `INSERT INTO series_review_files(
             review_id, file_id, order_index, path, name, size_bytes,
             base_mapping_state, inference_pattern, suggestions_json,
             season_number, episode_number, selector_type,
             subtitle_candidates_json, selected_subtitle_file_id
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        );
        mapped.forEach((file, orderIndex) =>
          insert.run(
            reviewId,
            file.fileId,
            orderIndex,
            file.path,
            file.name,
            file.sizeBytes,
            file.baseMappingState,
            file.inferencePattern,
            JSON.stringify(file.suggestions),
            file.seasonNumber ?? null,
            file.episodeNumber ?? null,
            file.selectorType ?? null,
            JSON.stringify(file.subtitleCandidates),
            null,
          ),
        );
        const value = this.reviewSnapshot(reviewId);
        this.rememberMutation(
          "create-review",
          input.mutation.idempotencyKey,
          value,
        );
        this.database.exec("COMMIT");
        return success(structuredClone(value));
      } catch (error) {
        this.database.exec("ROLLBACK");
        throw error;
      }
    } catch (error) {
      return failure(error);
    }
  }

  readReview(input) {
    try {
      if (!isPlainObject(input))
        throw new SeriesCatalogStoreError(
          "SERIES_INVALID",
          "A consulta da revisão não é válida.",
        );
      return success(
        structuredClone(
          this.reviewSnapshot(input.reviewId, input.cursor, input.limit),
        ),
      );
    } catch (error) {
      return failure(error);
    }
  }

  readSourceReview(input) {
    try {
      if (!isPlainObject(input))
        throw new SeriesCatalogStoreError(
          "SERIES_INVALID",
          "A consulta da revisão não é válida.",
        );
      const sourceId = validateId(input.sourceId, "source");
      const row = this.database
        .prepare(
          `SELECT review_id FROM series_import_reviews
           WHERE source_id = ? ORDER BY updated_at DESC, review_id DESC LIMIT 1`,
        )
        .get(sourceId);
      if (!row)
        throw new SeriesCatalogStoreError(
          "SERIES_NOT_FOUND",
          "A revisão desta source não foi encontrada.",
        );
      return success(
        this.reviewSnapshot(row.review_id, input.cursor, input.limit),
      );
    } catch (error) {
      return failure(error);
    }
  }

  attachReviewSeries(reviewIdInput, seriesIdInput) {
    try {
      const reviewId = validateId(reviewIdInput, "revisão");
      const seriesId = validateId(seriesIdInput, "série");
      if (!this.readSeriesValue(seriesId))
        throw new SeriesCatalogStoreError(
          "SERIES_NOT_FOUND",
          "A série da revisão não foi encontrada.",
        );
      const review = this.database
        .prepare(
          "SELECT series_content_id, state FROM series_import_reviews WHERE review_id = ?",
        )
        .get(reviewId);
      if (!review)
        throw new SeriesCatalogStoreError(
          "SERIES_NOT_FOUND",
          "A revisão da série não foi encontrada.",
        );
      if (review.series_content_id && review.series_content_id !== seriesId)
        throw new SeriesCatalogStoreError(
          "SERIES_IDENTITY_CONFLICT",
          "A revisão já pertence a outra série.",
        );
      this.database
        .prepare(
          `UPDATE series_import_reviews SET series_content_id = ?,
           updated_at = unixepoch() WHERE review_id = ?`,
        )
        .run(seriesId, reviewId);
      return success(this.reviewSnapshot(reviewId));
    } catch (error) {
      return failure(error);
    }
  }

  updateReviewTitle(reviewIdInput, titleInput) {
    try {
      const reviewId = validateId(reviewIdInput, "revisão");
      const title = validateSeriesMetadata({
        title: titleInput,
        genres: [],
        cast: [],
      }).title;
      const updated = this.database
        .prepare(
          `UPDATE series_import_reviews SET title = ?, updated_at = unixepoch()
           WHERE review_id = ? AND state != 'confirmed'`,
        )
        .run(title, reviewId);
      if (!updated.changes)
        throw new SeriesCatalogStoreError(
          "SERIES_CONFLICT",
          "A revisão não pode mais alterar o título.",
        );
      return success(this.reviewSnapshot(reviewId));
    } catch (error) {
      return failure(error);
    }
  }

  correctMapping(input) {
    try {
      if (!isPlainObject(input) || !isPlainObject(input.action))
        throw new SeriesCatalogStoreError(
          "SERIES_INVALID",
          "A correção do episódio não é válida.",
        );
      const replay = this.checkReplay("correct-mapping", input.mutation);
      if (replay !== undefined) return success(structuredClone(replay));
      const reviewId = validateId(input.reviewId, "revisão");
      const fileId = validateId(input.fileId, "arquivo");
      const review = this.database
        .prepare(
          "SELECT state, revision FROM series_import_reviews WHERE review_id = ?",
        )
        .get(reviewId);
      if (!review)
        throw new SeriesCatalogStoreError(
          "SERIES_NOT_FOUND",
          "A revisão da série não foi encontrada.",
        );
      if (review.state === "confirmed")
        throw new SeriesCatalogStoreError(
          "SERIES_CONFLICT",
          "A revisão confirmada não pode mais ser alterada.",
        );
      if (
        input.mutation.expectedRevision !== undefined &&
        input.mutation.expectedRevision !== Number(review.revision)
      )
        throw new SeriesCatalogStoreError(
          "SERIES_REVISION_CONFLICT",
          "A revisão mudou. Recarregue antes de tentar novamente.",
          true,
        );
      const file = this.database
        .prepare(
          `SELECT subtitle_candidates_json FROM series_review_files
           WHERE review_id = ? AND file_id = ?`,
        )
        .get(reviewId, fileId);
      if (!file)
        throw new SeriesCatalogStoreError(
          "SERIES_NOT_FOUND",
          "O arquivo da revisão não foi encontrado.",
        );
      const subtitleCandidates = parseJson(file.subtitle_candidates_json, []);
      if (
        input.selectedSubtitleFileId !== undefined &&
        !subtitleCandidates.includes(input.selectedSubtitleFileId)
      )
        throw new SeriesCatalogStoreError(
          "SERIES_INVALID",
          "A legenda escolhida não pertence ao episódio nesta source.",
        );

      this.database.exec("BEGIN IMMEDIATE");
      try {
        if (input.action.type === "skip") {
          this.database
            .prepare(
              `UPDATE series_review_files SET
                 base_mapping_state = 'skipped', season_number = NULL,
                 episode_number = NULL, selector_type = NULL,
                 selected_subtitle_file_id = NULL
               WHERE review_id = ? AND file_id = ?`,
            )
            .run(reviewId, fileId);
        } else if (input.action.type === "assign") {
          const seasonNumber = validateEpisodeNumber(
            input.action.seasonNumber,
            LIMITS.seasonNumber,
            "temporada",
            0,
          );
          const episodeNumber = validateEpisodeNumber(
            input.action.episodeNumber,
            LIMITS.episodeNumber,
            "episódio",
            1,
          );
          if (
            !["episode", "filename", "manual"].includes(
              input.action.selectorType,
            )
          )
            throw new SeriesCatalogStoreError(
              "SERIES_INVALID",
              "O selector do episódio não é válido.",
            );
          this.database
            .prepare(
              `UPDATE series_review_files SET
                 base_mapping_state = 'manual', season_number = ?,
                 episode_number = ?, selector_type = ?,
                 selected_subtitle_file_id = ?
               WHERE review_id = ? AND file_id = ?`,
            )
            .run(
              seasonNumber,
              episodeNumber,
              input.action.selectorType,
              input.selectedSubtitleFileId ?? null,
              reviewId,
              fileId,
            );
        } else {
          throw new SeriesCatalogStoreError(
            "SERIES_INVALID",
            "A ação da correção não é válida.",
          );
        }
        this.database
          .prepare(
            `UPDATE series_import_reviews
             SET revision = revision + 1, updated_at = unixepoch()
             WHERE review_id = ?`,
          )
          .run(reviewId);
        const value = this.reviewSnapshot(reviewId);
        this.rememberMutation(
          "correct-mapping",
          input.mutation.idempotencyKey,
          value,
        );
        this.database.exec("COMMIT");
        return success(structuredClone(value));
      } catch (error) {
        this.database.exec("ROLLBACK");
        throw error;
      }
    } catch (error) {
      return failure(error);
    }
  }

  persistEpisodeMappings(input) {
    try {
      if (!isPlainObject(input))
        throw new SeriesCatalogStoreError(
          "SERIES_INVALID",
          "Os vínculos de episódios não são válidos.",
        );
      const replay = this.checkReplay(
        "persist-episode-mappings",
        input.mutation,
      );
      if (replay !== undefined) return success(structuredClone(replay));
      const reviewId = validateId(input.reviewId, "revisão");
      const sourceId = validateId(input.sourceId, "source");
      const review = this.reviewSnapshot(reviewId, undefined, 128);
      if (review.state !== "ready" || review.issueCount > 0)
        throw new SeriesCatalogStoreError(
          "SERIES_IMPORT_INCOMPLETE",
          "Resolva as pendências antes de confirmar os episódios.",
        );
      const source = this.database
        .prepare(
          `SELECT ts.source_id, tr.metadata_json
           FROM torrent_sources ts
           JOIN torrent_runtimes tr ON tr.info_hash = ts.info_hash
           WHERE ts.source_id = ?`,
        )
        .get(sourceId);
      if (!source)
        throw new SeriesCatalogStoreError(
          "SERIES_NOT_FOUND",
          "A source torrent não foi encontrada.",
        );
      const sourceFiles = parseJson(source.metadata_json, {}).files ?? [];
      const filesById = new Map(sourceFiles.map((file) => [file.id, file]));
      const mappings = this.reviewFiles(reviewId).filter((file) =>
        ["identified", "manual"].includes(file.mappingState),
      );

      this.database.exec("BEGIN IMMEDIATE");
      try {
        const relations = [];
        for (const mapping of mappings) {
          const episode = this.database
            .prepare(
              `SELECT content_id FROM episodes
               WHERE series_content_id = (
                 SELECT series_content_id FROM series_import_reviews WHERE review_id = ?
               ) AND season_number = ? AND episode_number = ?`,
            )
            .get(reviewId, mapping.seasonNumber, mapping.episodeNumber);
          if (!episode)
            throw new SeriesCatalogStoreError(
              "SERIES_IMPORT_INCOMPLETE",
              "Crie a hierarquia dos episódios antes de persistir os selectors.",
            );
          const selected = filesById.get(mapping.fileId);
          if (
            !selected ||
            selected.kind !== "video" ||
            selected.selectable !== true
          )
            throw new SeriesCatalogStoreError(
              "SERIES_SOURCE_CHANGED",
              "Um arquivo selecionado não está mais disponível nesta source.",
              true,
            );
          if (
            mapping.selectedSubtitleFileId &&
            !filesById.has(mapping.selectedSubtitleFileId)
          )
            throw new SeriesCatalogStoreError(
              "SERIES_SOURCE_CHANGED",
              "A legenda selecionada não está mais disponível nesta source.",
              true,
            );
          const existing = this.database
            .prepare(
              `SELECT content_source_id FROM content_source_selectors
               WHERE content_id = ? AND source_id = ?`,
            )
            .get(episode.content_id, sourceId);
          const contentSourceId =
            existing?.content_source_id ?? `content-source:${randomUUID()}`;
          const selector =
            mapping.selectorType === "episode"
              ? {
                  type: "episode",
                  season: mapping.seasonNumber,
                  episode: mapping.episodeNumber,
                  fileId: mapping.fileId,
                }
              : { type: mapping.selectorType, fileId: mapping.fileId };
          this.database
            .prepare(
              `INSERT INTO content_source_selectors(
                 content_source_id, content_id, source_id, selector_json,
                 selected_subtitle_file_id, created_at, updated_at
               ) VALUES (?, ?, ?, ?, ?, unixepoch(), unixepoch())
               ON CONFLICT(content_id, source_id) DO UPDATE SET
                 selector_json = excluded.selector_json,
                 selected_subtitle_file_id = excluded.selected_subtitle_file_id,
                 updated_at = unixepoch()`,
            )
            .run(
              contentSourceId,
              episode.content_id,
              sourceId,
              JSON.stringify(selector),
              mapping.selectedSubtitleFileId ?? null,
            );
          relations.push({
            contentSourceId,
            episodeId: episode.content_id,
            sourceId,
            selector,
            resolvedFileId: mapping.fileId,
            selectedSubtitleFileId: mapping.selectedSubtitleFileId,
          });
        }
        this.database
          .prepare(
            `UPDATE series_import_reviews SET source_id = ?, state = 'confirmed',
             revision = revision + 1, updated_at = unixepoch()
             WHERE review_id = ?`,
          )
          .run(sourceId, reviewId);
        const value = {
          review: this.reviewSnapshot(reviewId),
          relations,
        };
        this.rememberMutation(
          "persist-episode-mappings",
          input.mutation.idempotencyKey,
          value,
        );
        this.database.exec("COMMIT");
        return success(structuredClone(value));
      } catch (error) {
        this.database.exec("ROLLBACK");
        throw error;
      }
    } catch (error) {
      return failure(error);
    }
  }

  setEpisodeArtwork(input) {
    try {
      if (!isPlainObject(input))
        throw new SeriesCatalogStoreError(
          "SERIES_INVALID",
          "A atualização da imagem não é válida.",
        );
      this.requireLibrary(input.libraryId);
      const episodeId = validateId(input.episodeId, "episódio");
      const replay = this.checkMutation(
        "set-episode-artwork",
        input.mutation,
        input.libraryId,
      );
      if (replay !== undefined) return success(structuredClone(replay));
      const episode = this.database
        .prepare(
          `SELECT e.content_id, e.series_content_id, e.season_number,
                  e.episode_number, e.metadata_json, e.artwork_json
           FROM episodes e
           JOIN library_memberships lm ON lm.content_id = e.series_content_id
           WHERE lm.library_id = ? AND e.content_id = ?`,
        )
        .get(input.libraryId, episodeId);
      if (!episode)
        throw new SeriesCatalogStoreError(
          "SERIES_NOT_FOUND",
          "O episódio não foi encontrado nesta biblioteca.",
        );
      let artwork = null;
      if (input.artwork !== null) {
        if (!isPlainObject(input.artwork))
          throw new SeriesCatalogStoreError(
            "SERIES_INVALID",
            "A imagem do episódio não é válida.",
          );
        const src = optionalString(input.artwork.src, 256, "imagem");
        const fileName = optionalString(
          input.artwork.fileName,
          255,
          "nome da imagem",
        );
        if (
          !src ||
          !/^ushark-asset:\/\/[a-f0-9]{64}$/.test(src) ||
          !fileName ||
          !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
            input.artwork.mimeType,
          )
        )
          throw new SeriesCatalogStoreError(
            "SERIES_INVALID",
            "A imagem persistida do episódio não é válida.",
          );
        artwork = { src, fileName, mimeType: input.artwork.mimeType };
      }

      this.database.exec("BEGIN IMMEDIATE");
      try {
        this.database
          .prepare(
            `UPDATE episodes SET artwork_json = ?, updated_at = unixepoch()
             WHERE content_id = ?`,
          )
          .run(artwork ? JSON.stringify(artwork) : null, episodeId);
        this.bumpRevision(input.libraryId);
        const value = this.episodeValue({
          ...episode,
          artwork_json: artwork ? JSON.stringify(artwork) : null,
        });
        this.rememberMutation(
          "set-episode-artwork",
          input.mutation.idempotencyKey,
          value,
        );
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

  upsertHierarchy(input) {
    try {
      if (!isPlainObject(input) || !isPlainObject(input.series))
        throw new SeriesCatalogStoreError(
          "SERIES_INVALID",
          "A hierarquia da série não é válida.",
        );
      this.requireLibrary(input.libraryId);
      const replay = this.checkMutation(
        "upsert-hierarchy",
        input.mutation,
        input.libraryId,
      );
      if (replay !== undefined) return success(structuredClone(replay));
      const seriesId = validateId(input.series.id, "série");
      const metadata = validateSeriesMetadata(input.series.metadata);
      if (
        !Array.isArray(input.episodes) ||
        input.episodes.length > LIMITS.hierarchyEpisodes
      )
        throw new SeriesCatalogStoreError(
          "SERIES_INVALID",
          "A lista de episódios não é válida.",
        );
      const identities = new Set();
      const coordinates = new Set();
      const episodes = input.episodes.map((episode) => {
        if (!isPlainObject(episode))
          throw new SeriesCatalogStoreError(
            "SERIES_INVALID",
            "Um episódio não é válido.",
          );
        const id = validateId(episode.id, "episódio");
        const seasonNumber = validateEpisodeNumber(
          episode.seasonNumber,
          LIMITS.seasonNumber,
          "temporada",
          0,
        );
        const episodeNumber = validateEpisodeNumber(
          episode.episodeNumber,
          LIMITS.episodeNumber,
          "episódio",
          1,
        );
        const coordinate = `${seasonNumber}:${episodeNumber}`;
        if (identities.has(id) || coordinates.has(coordinate))
          throw new SeriesCatalogStoreError(
            "SERIES_EPISODE_COLLISION",
            "Dois episódios da mesma atualização possuem a mesma identidade.",
          );
        identities.add(id);
        coordinates.add(coordinate);
        return {
          id,
          seasonNumber,
          episodeNumber,
          metadata: validateEpisodeMetadata(episode.metadata),
        };
      });

      this.database.exec("BEGIN IMMEDIATE");
      try {
        const existingSeriesContent = this.database
          .prepare("SELECT type FROM contents WHERE id = ?")
          .get(seriesId);
        if (existingSeriesContent && existingSeriesContent.type !== "series")
          throw new SeriesCatalogStoreError(
            "SERIES_IDENTITY_CONFLICT",
            "A identidade da série já pertence a outro tipo de conteúdo.",
          );
        this.database
          .prepare(
            `INSERT INTO contents(id, type, created_at, updated_at)
             VALUES (?, 'series', unixepoch(), unixepoch())
             ON CONFLICT(id) DO UPDATE SET updated_at = unixepoch()`,
          )
          .run(seriesId);
        this.database
          .prepare(
            `INSERT INTO series(content_id, metadata_json, updated_at)
             VALUES (?, ?, unixepoch())
             ON CONFLICT(content_id) DO UPDATE SET
               metadata_json = excluded.metadata_json,
               updated_at = unixepoch()`,
          )
          .run(seriesId, JSON.stringify(metadata));
        const nextOrder = Number(
          this.database
            .prepare(
              "SELECT COALESCE(MAX(order_index), -1) + 1 AS value FROM library_memberships WHERE library_id = ?",
            )
            .get(input.libraryId).value,
        );
        this.database
          .prepare(
            `INSERT OR IGNORE INTO library_memberships(
               library_id, content_id, order_index, preserved_overrides_json,
               created_at, updated_at
             ) VALUES (?, ?, ?, '[]', unixepoch(), unixepoch())`,
          )
          .run(input.libraryId, seriesId, nextOrder);
        this.database
          .prepare(
            `INSERT OR IGNORE INTO user_content_state(
               content_id, favorite, progress, history_json, preferences_json, updated_at
             ) VALUES (?, 0, 0, '[]', '[]', unixepoch())`,
          )
          .run(seriesId);

        const contentById = this.database.prepare(
          "SELECT type FROM contents WHERE id = ?",
        );
        const episodeById = this.database.prepare(
          `SELECT series_content_id, season_number, episode_number
           FROM episodes WHERE content_id = ?`,
        );
        const episodeByCoordinate = this.database.prepare(
          `SELECT content_id FROM episodes
           WHERE series_content_id = ? AND season_number = ? AND episode_number = ?`,
        );
        const insertContent = this.database.prepare(
          `INSERT INTO contents(id, type, created_at, updated_at)
           VALUES (?, 'episode', unixepoch(), unixepoch())
           ON CONFLICT(id) DO UPDATE SET updated_at = unixepoch()`,
        );
        const insertEpisode = this.database.prepare(
          `INSERT INTO episodes(
             content_id, series_content_id, season_number, episode_number,
             metadata_json, updated_at
           ) VALUES (?, ?, ?, ?, ?, unixepoch())
           ON CONFLICT(content_id) DO UPDATE SET
             metadata_json = excluded.metadata_json,
             updated_at = unixepoch()`,
        );
        const insertState = this.database.prepare(
          `INSERT OR IGNORE INTO user_content_state(
             content_id, favorite, progress, history_json, preferences_json, updated_at
           ) VALUES (?, 0, 0, '[]', '[]', unixepoch())`,
        );
        for (const episode of episodes) {
          const existingContent = contentById.get(episode.id);
          if (existingContent && existingContent.type !== "episode")
            throw new SeriesCatalogStoreError(
              "SERIES_IDENTITY_CONFLICT",
              "A identidade de um episódio já pertence a outro conteúdo.",
            );
          const existingEpisode = episodeById.get(episode.id);
          if (
            existingEpisode &&
            (existingEpisode.series_content_id !== seriesId ||
              Number(existingEpisode.season_number) !== episode.seasonNumber ||
              Number(existingEpisode.episode_number) !== episode.episodeNumber)
          )
            throw new SeriesCatalogStoreError(
              "SERIES_IDENTITY_CONFLICT",
              "A identidade de um episódio não pode mudar de série ou número.",
            );
          const coordinate = episodeByCoordinate.get(
            seriesId,
            episode.seasonNumber,
            episode.episodeNumber,
          );
          if (coordinate && coordinate.content_id !== episode.id)
            throw new SeriesCatalogStoreError(
              "SERIES_EPISODE_COLLISION",
              "Já existe outro episódio para esta temporada e número.",
            );
          insertContent.run(episode.id);
          insertEpisode.run(
            episode.id,
            seriesId,
            episode.seasonNumber,
            episode.episodeNumber,
            JSON.stringify(episode.metadata),
          );
          insertState.run(episode.id);
        }

        this.bumpRevision(input.libraryId);
        const value = {
          snapshot: this.catalogSnapshot({ libraryId: input.libraryId }),
          series: this.readSeriesValue(seriesId),
        };
        this.rememberMutation(
          "upsert-hierarchy",
          input.mutation.idempotencyKey,
          value,
        );
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

  close() {
    this.database.close();
  }
}

module.exports = {
  DATABASE_SCHEMA_VERSION,
  SERIES_SCHEMA_VERSION,
  SeriesCatalogStore,
  SeriesCatalogStoreError,
};
