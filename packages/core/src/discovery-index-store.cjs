"use strict";

const { Buffer } = require("node:buffer");
const { randomUUID } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const DATABASE_SCHEMA_VERSION = 10;
const DISCOVERY_INDEX_SCHEMA_VERSION = 1;
const PAGE_DEFAULT = 24;
const PAGE_MAXIMUM = 128;
const HOME_SECTION_MAXIMUM = 24;
const SEARCH_QUERY_BYTES = 512;
const INDEX_BATCH_MAXIMUM = 1_000;
const RECENT_WINDOW_SECONDS = 30 * 24 * 60 * 60;

class DiscoveryIndexStoreError extends Error {
  constructor(code, publicMessage, retryable = false, cause) {
    super(publicMessage, cause ? { cause } : undefined);
    this.name = "DiscoveryIndexStoreError";
    this.code = code;
    this.publicMessage = publicMessage;
    this.retryable = retryable;
  }
}

function success(value) {
  return { ok: true, value };
}

function failure(error) {
  const known = error instanceof DiscoveryIndexStoreError;
  return {
    ok: false,
    error: {
      code: known ? error.code : "DISCOVERY_STORAGE_FAILED",
      message: known
        ? error.publicMessage
        : "Não foi possível abrir o índice local. O catálogo anterior foi preservado.",
      recoverable: known ? error.retryable : true,
      retryable: known ? error.retryable : true,
    },
  };
}

function isObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function validateId(value, label) {
  if (
    typeof value !== "string" ||
    value.length < 3 ||
    value.length > 160 ||
    value.includes("\0") ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]+$/.test(value)
  )
    throw new DiscoveryIndexStoreError(
      "DISCOVERY_INVALID",
      `A identidade de ${label} não é válida.`,
    );
  return value;
}

function pageLimit(value, maximum = PAGE_MAXIMUM) {
  if (value === undefined) return Math.min(PAGE_DEFAULT, maximum);
  if (!Number.isInteger(value) || value < 1 || value > maximum)
    throw new DiscoveryIndexStoreError(
      "DISCOVERY_INVALID",
      `A página deve conter de 1 a ${maximum} itens.`,
    );
  return value;
}

function titleSort(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function searchTokens(value) {
  if (
    typeof value !== "string" ||
    value.includes("\0") ||
    Buffer.byteLength(value, "utf8") > SEARCH_QUERY_BYTES
  )
    throw new DiscoveryIndexStoreError(
      "DISCOVERY_INVALID",
      "A busca deve conter no máximo 512 bytes.",
    );
  return titleSort(value)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

function ftsExpression(tokens) {
  return tokens
    .map((token) => `"${token.replaceAll('"', '""')}"*`)
    .join(" AND ");
}

function optionalText(value, maximumBytes, label) {
  if (value === undefined) return undefined;
  if (
    typeof value !== "string" ||
    value.includes("\0") ||
    Buffer.byteLength(value, "utf8") > maximumBytes
  )
    throw new DiscoveryIndexStoreError(
      "DISCOVERY_INVALID",
      `O campo ${label} não é válido.`,
    );
  return value;
}

function textList(value, maximumItems, maximumBytes, label) {
  if (
    !Array.isArray(value) ||
    value.length > maximumItems ||
    value.some(
      (item) =>
        typeof item !== "string" ||
        item.includes("\0") ||
        Buffer.byteLength(item, "utf8") > maximumBytes,
    )
  )
    throw new DiscoveryIndexStoreError(
      "DISCOVERY_INVALID",
      `O campo ${label} não é válido.`,
    );
  return [...new Set(value)];
}

function dateFromEpoch(value) {
  return new Date(Number(value ?? 0) * 1_000).toISOString();
}

function qualityFrom(value = "") {
  const match = String(value).match(
    /(?:^|[. _-])(2160p|1080p|720p)(?:[. _-]|$)/i,
  );
  const resolution = match?.[1]?.toLowerCase();
  return resolution === "2160p" ? "4K" : resolution;
}

function encodeCursor(value) {
  return { value: Buffer.from(JSON.stringify(value)).toString("base64url") };
}

function decodeCursor(input, revision) {
  if (input === undefined) return undefined;
  if (
    !isObject(input) ||
    typeof input.value !== "string" ||
    !input.value ||
    Buffer.byteLength(input.value, "utf8") > 1_024
  )
    throw new DiscoveryIndexStoreError(
      "DISCOVERY_INVALID",
      "O cursor da consulta não é válido.",
    );
  try {
    const parsed = JSON.parse(
      Buffer.from(input.value, "base64url").toString("utf8"),
    );
    if (
      !isObject(parsed) ||
      !Number.isInteger(parsed.revision) ||
      typeof parsed.position !== "number" ||
      !Number.isFinite(parsed.position) ||
      typeof parsed.title !== "string" ||
      typeof parsed.id !== "string"
    )
      throw new Error("cursor shape");
    if (parsed.revision !== revision)
      throw new DiscoveryIndexStoreError(
        "DISCOVERY_CURSOR_STALE",
        "O catálogo mudou. Reabra esta página para continuar.",
        true,
      );
    return parsed;
  } catch (error) {
    if (error instanceof DiscoveryIndexStoreError) throw error;
    throw new DiscoveryIndexStoreError(
      "DISCOVERY_INVALID",
      "O cursor da consulta não é válido.",
    );
  }
}

class DiscoveryIndexStore {
  constructor(databasePath) {
    if (typeof databasePath !== "string" || !path.isAbsolute(databasePath))
      throw new DiscoveryIndexStoreError(
        "DISCOVERY_INVALID",
        "O banco do índice local não é válido.",
      );
    this.databasePath = databasePath;
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath);
    this.database.exec("PRAGMA journal_mode = WAL");
    this.database.exec("PRAGMA busy_timeout = 5000");
    this.database.exec("PRAGMA foreign_keys = ON");
    this.projectionQueryCount = 0;
    this.lastSynchronizationDiagnostics = undefined;
    this.cancelledRequests = new Set();
    this.searchAvailable = true;
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
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'episodes'",
      )
      .get();
    if (!base)
      throw new DiscoveryIndexStoreError(
        "DISCOVERY_INDEX_UNAVAILABLE",
        "Conclua os catálogos locais antes de abrir a Home.",
        true,
      );
    const current = Number(
      this.database
        .prepare("SELECT MAX(version) AS version FROM schema_migrations")
        .get()?.version ?? 0,
    );
    if (current > DATABASE_SCHEMA_VERSION)
      throw new DiscoveryIndexStoreError(
        "DISCOVERY_PROTOCOL_UNSUPPORTED",
        "O índice local pertence a uma versão mais nova do Ushark.",
      );
    this.database.exec(`
      BEGIN IMMEDIATE;
      CREATE TABLE IF NOT EXISTS discovery_state (
        singleton INTEGER PRIMARY KEY CHECK(singleton = 1),
        revision INTEGER NOT NULL,
        indexed_at INTEGER NOT NULL
      );
      INSERT OR IGNORE INTO discovery_state(singleton, revision, indexed_at)
      VALUES (1, 0, unixepoch());
      CREATE TABLE IF NOT EXISTS discovery_documents (
        content_id TEXT PRIMARY KEY REFERENCES contents(id) ON DELETE CASCADE,
        content_type TEXT NOT NULL CHECK(content_type IN ('movie', 'series', 'episode')),
        title_sort TEXT NOT NULL,
        sort_position INTEGER NOT NULL,
        added_at INTEGER NOT NULL,
        last_played_at INTEGER,
        favorite INTEGER NOT NULL CHECK(favorite IN (0, 1)),
        progress_position INTEGER NOT NULL,
        progress_duration INTEGER NOT NULL,
        watched INTEGER NOT NULL CHECK(watched IN (0, 1)),
        snapshot_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_discovery_type_position
        ON discovery_documents(content_type, sort_position, title_sort, content_id);
      CREATE INDEX IF NOT EXISTS idx_discovery_continue
        ON discovery_documents(watched, progress_position, last_played_at DESC, content_id);
      CREATE INDEX IF NOT EXISTS idx_discovery_recent
        ON discovery_documents(added_at DESC, content_id);
      CREATE INDEX IF NOT EXISTS idx_discovery_favorite
        ON discovery_documents(favorite, title_sort, content_id);
      CREATE TABLE IF NOT EXISTS discovery_genres (
        content_id TEXT NOT NULL REFERENCES discovery_documents(content_id) ON DELETE CASCADE,
        genre TEXT NOT NULL,
        PRIMARY KEY(content_id, genre)
      );
      CREATE INDEX IF NOT EXISTS idx_discovery_genres_name
        ON discovery_genres(genre, content_id);
      CREATE TABLE IF NOT EXISTS discovery_origins (
        content_id TEXT NOT NULL REFERENCES discovery_documents(content_id) ON DELETE CASCADE,
        origin_id TEXT NOT NULL,
        origin_kind TEXT NOT NULL CHECK(origin_kind IN ('local', 'shared', 'subscription', 'collection')),
        name TEXT NOT NULL,
        available INTEGER NOT NULL CHECK(available IN (0, 1)),
        sort_position INTEGER NOT NULL,
        PRIMARY KEY(content_id, origin_id, origin_kind)
      );
      CREATE INDEX IF NOT EXISTS idx_discovery_origins_scope
        ON discovery_origins(origin_id, sort_position, content_id);
      CREATE TABLE IF NOT EXISTS discovery_idempotency (
        idempotency_key TEXT PRIMARY KEY,
        operation TEXT NOT NULL,
        result_json TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      INSERT OR IGNORE INTO schema_migrations(version, name, applied_at)
      VALUES (7, 'm04_discovery_projection', unixepoch());
      COMMIT;
    `);
    if (current < 8) {
      this.database.exec(`
        BEGIN IMMEDIATE;
        CREATE VIRTUAL TABLE discovery_search USING fts5(
          content_id UNINDEXED,
          title,
          original_title,
          synopsis,
          series_title,
          episode_title,
          origin_names,
          collection_names,
          tokenize = 'unicode61 remove_diacritics 2'
        );
        INSERT INTO discovery_search(
          rowid, content_id, title, original_title, synopsis, series_title,
          episode_title, origin_names, collection_names
        )
        SELECT d.rowid,
               d.content_id,
               COALESCE(json_extract(d.snapshot_json, '$.title'), ''),
               COALESCE(json_extract(d.snapshot_json, '$.originalTitle'), ''),
               COALESCE(json_extract(d.snapshot_json, '$.synopsis'), ''),
               COALESCE(json_extract(d.snapshot_json, '$.seriesTitle'), ''),
               CASE WHEN d.content_type = 'episode'
                    THEN COALESCE(json_extract(d.snapshot_json, '$.title'), '')
                    ELSE '' END,
               COALESCE((
                 SELECT group_concat(name, ' ')
                 FROM discovery_origins o
                 WHERE o.content_id = d.content_id
                   AND o.origin_kind != 'collection'
               ), ''),
               COALESCE((
                 SELECT group_concat(name, ' ')
                 FROM discovery_origins o
                 WHERE o.content_id = d.content_id
                   AND o.origin_kind = 'collection'
               ), '')
        FROM discovery_documents d;
        INSERT INTO schema_migrations(version, name, applied_at)
        VALUES (8, 'm04_discovery_fts5', unixepoch());
        COMMIT;
      `);
    } else {
      const searchTable = this.database
        .prepare(
          "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'discovery_search'",
        )
        .get();
      this.searchAvailable = !!searchTable;
    }
  }

  revision() {
    return Number(
      this.database
        .prepare("SELECT revision FROM discovery_state WHERE singleton = 1")
        .get().revision,
    );
  }

  requireLibrary(libraryId) {
    validateId(libraryId, "biblioteca");
    if (
      !this.database
        .prepare("SELECT 1 FROM local_libraries WHERE id = ?")
        .get(libraryId)
    )
      throw new DiscoveryIndexStoreError(
        "DISCOVERY_NOT_FOUND",
        "A biblioteca local não foi encontrada.",
      );
  }

  replay(mutation, operation) {
    if (
      !isObject(mutation) ||
      typeof mutation.idempotencyKey !== "string" ||
      mutation.idempotencyKey.length < 8 ||
      mutation.idempotencyKey.length > 160
    )
      throw new DiscoveryIndexStoreError(
        "DISCOVERY_INVALID",
        "A chave idempotente não é válida.",
      );
    const row = this.database
      .prepare(
        "SELECT operation, result_json FROM discovery_idempotency WHERE idempotency_key = ?",
      )
      .get(mutation.idempotencyKey);
    if (!row) {
      if (
        mutation.expectedRevision !== undefined &&
        mutation.expectedRevision !== this.revision()
      )
        throw new DiscoveryIndexStoreError(
          "DISCOVERY_CONFLICT",
          "O índice mudou. Recarregue antes de tentar novamente.",
          true,
        );
      return undefined;
    }
    if (row.operation !== operation)
      throw new DiscoveryIndexStoreError(
        "DISCOVERY_CONFLICT",
        "A operação repetida não corresponde à intenção original.",
      );
    return parseJson(row.result_json, undefined);
  }

  normalizeIndexDocument(value) {
    if (!isObject(value) || !isObject(value.content))
      throw new DiscoveryIndexStoreError(
        "DISCOVERY_INVALID",
        "O documento do índice não é válido.",
      );
    const content = structuredClone(value.content);
    content.contentId = validateId(content.contentId, "conteúdo");
    if (!["movie", "series", "episode"].includes(content.type))
      throw new DiscoveryIndexStoreError(
        "DISCOVERY_INVALID",
        "O tipo do conteúdo não é válido.",
      );
    content.title = optionalText(content.title, 512, "título")?.trim();
    if (!content.title)
      throw new DiscoveryIndexStoreError(
        "DISCOVERY_INVALID",
        "O documento precisa de um título.",
      );
    content.genres = textList(content.genres, 256, 160, "gêneros");
    content.cast = textList(content.cast, 256, 256, "elenco");
    if (
      !Array.isArray(content.memberships) ||
      content.memberships.length > 64 ||
      !Array.isArray(content.collections) ||
      content.collections.length > 64 ||
      !Array.isArray(content.sources) ||
      content.sources.length > 64 ||
      !isObject(content.progress)
    )
      throw new DiscoveryIndexStoreError(
        "DISCOVERY_INVALID",
        "As relações do documento não são válidas.",
      );
    for (const origin of [...content.memberships, ...content.collections]) {
      if (!isObject(origin))
        throw new DiscoveryIndexStoreError(
          "DISCOVERY_INVALID",
          "Uma origem do documento não é válida.",
        );
      origin.id = validateId(origin.id, "origem");
      origin.name = optionalText(origin.name, 512, "nome da origem")?.trim();
      if (
        !origin.name ||
        !["local", "shared", "subscription", "collection"].includes(
          origin.kind,
        ) ||
        typeof origin.available !== "boolean"
      )
        throw new DiscoveryIndexStoreError(
          "DISCOVERY_INVALID",
          "Uma origem do documento não é válida.",
        );
    }
    for (const source of content.sources) {
      if (!isObject(source))
        throw new DiscoveryIndexStoreError(
          "DISCOVERY_INVALID",
          "Uma source do documento não é válida.",
        );
      source.id = validateId(source.id, "source");
      source.quality = optionalText(source.quality, 32, "qualidade da source");
      if (
        !["available", "offline", "missing", "pending"].includes(
          source.availability,
        )
      )
        throw new DiscoveryIndexStoreError(
          "DISCOVERY_INVALID",
          "Uma source do documento não é válida.",
        );
    }
    for (const field of ["positionSeconds", "durationSeconds"])
      if (
        !Number.isInteger(content.progress[field]) ||
        content.progress[field] < 0
      )
        throw new DiscoveryIndexStoreError(
          "DISCOVERY_INVALID",
          "O progresso do documento não é válido.",
        );
    if (
      typeof content.progress.watched !== "boolean" ||
      typeof content.favorite !== "boolean" ||
      !Number.isFinite(Date.parse(content.addedAt)) ||
      (content.progress.lastPlayedAt !== undefined &&
        !Number.isFinite(Date.parse(content.progress.lastPlayedAt)))
    )
      throw new DiscoveryIndexStoreError(
        "DISCOVERY_INVALID",
        "O estado local do documento não é válido.",
      );
    const provided = isObject(value.searchText) ? value.searchText : {};
    return {
      content,
      searchText: {
        title: optionalText(
          provided.title ?? content.title,
          512,
          "busca por título",
        ),
        originalTitle: optionalText(
          provided.originalTitle ?? content.originalTitle,
          512,
          "busca por título original",
        ),
        synopsis: optionalText(
          provided.synopsis ?? content.synopsis,
          20_000,
          "busca por sinopse",
        ),
        seriesTitle: optionalText(
          provided.seriesTitle ?? content.seriesTitle,
          512,
          "busca por série",
        ),
        episodeTitle: optionalText(
          provided.episodeTitle ??
            (content.type === "episode" ? content.title : undefined),
          512,
          "busca por episódio",
        ),
        originNames: textList(
          provided.originNames ??
            content.memberships.map((origin) => origin.name),
          64,
          512,
          "nomes de origem",
        ),
        collectionNames: textList(
          provided.collectionNames ??
            content.collections.map((origin) => origin.name),
          64,
          512,
          "nomes de coleção",
        ),
      },
    };
  }

  searchTextFromSnapshot(snapshot) {
    return {
      title: snapshot.title,
      originalTitle: snapshot.originalTitle,
      synopsis: snapshot.synopsis,
      seriesTitle: snapshot.seriesTitle,
      episodeTitle: snapshot.type === "episode" ? snapshot.title : undefined,
      originNames: snapshot.memberships.map((origin) => origin.name),
      collectionNames: snapshot.collections.map((origin) => origin.name),
    };
  }

  watchedDocument(input) {
    if (
      !isObject(input) ||
      typeof input.relativePath !== "string" ||
      !input.relativePath ||
      input.relativePath.includes("\0") ||
      Buffer.byteLength(input.relativePath, "utf8") > 4_096 ||
      path.isAbsolute(input.relativePath) ||
      input.relativePath.split(/[\\/]+/).includes("..")
    )
      throw new DiscoveryIndexStoreError(
        "DISCOVERY_UNAUTHORIZED",
        "O arquivo observado não pertence à biblioteca.",
      );
    this.requireLibrary(input.libraryId);
    let contentId = input.previousContentId
      ? validateId(input.previousContentId, "conteúdo observado")
      : undefined;
    const filename = path.basename(input.relativePath);
    if (!contentId)
      contentId = this.database
        .prepare(
          `SELECT cs.content_id
           FROM content_sources cs
           JOIN sources s ON s.id = cs.source_id
           JOIN library_memberships lm ON lm.content_id = cs.content_id
           WHERE lm.library_id = ?
             AND json_extract(s.descriptor_json, '$.name') = ? COLLATE NOCASE
           ORDER BY cs.content_id LIMIT 1`,
        )
        .get(input.libraryId, filename)?.content_id;
    if (!contentId) {
      const selectorRows = this.database
        .prepare(
          `SELECT css.content_id, css.selector_json, tr.metadata_json
           FROM content_source_selectors css
           JOIN torrent_sources ts ON ts.source_id = css.source_id
           JOIN torrent_runtimes tr ON tr.info_hash = ts.info_hash
           LEFT JOIN episodes e ON e.content_id = css.content_id
           JOIN library_memberships lm
             ON lm.content_id = COALESCE(e.series_content_id, css.content_id)
           WHERE lm.library_id = ?
           ORDER BY css.content_id, css.source_id`,
        )
        .all(input.libraryId);
      contentId = selectorRows.find((row) => {
        const selector = parseJson(row.selector_json, {});
        const files = parseJson(row.metadata_json, {}).files ?? [];
        const selected = files.find((file) => file.id === selector.fileId);
        return (
          selected && path.basename(selected.path ?? selected.name) === filename
        );
      })?.content_id;
    }
    if (!contentId) return undefined;
    const row = this.database
      .prepare(
        `SELECT d.snapshot_json
         FROM discovery_documents d
         WHERE d.content_id = ?
           AND EXISTS (
             SELECT 1 FROM discovery_origins access
             WHERE access.content_id = d.content_id
               AND access.origin_id = ?
               AND access.origin_kind = 'local'
           )`,
      )
      .get(contentId, input.libraryId);
    const snapshot = row ? this.snapshot(row) : undefined;
    if (!snapshot) return undefined;
    return this.normalizeIndexDocument({
      content: snapshot,
      searchText: this.searchTextFromSnapshot(snapshot),
    });
  }

  writeSearchIndex(deleteSearch, insertSearch, snapshot, searchText) {
    deleteSearch.run(snapshot.contentId);
    insertSearch.run(
      snapshot.contentId,
      searchText.title ?? "",
      searchText.originalTitle ?? "",
      searchText.synopsis ?? "",
      searchText.seriesTitle ?? "",
      searchText.episodeTitle ?? "",
      searchText.originNames.join(" "),
      searchText.collectionNames.join(" "),
      snapshot.contentId,
    );
  }

  baseRows() {
    return this.projectionRows(
      `SELECT c.id, c.type, m.metadata_json AS movie_metadata,
              se.metadata_json AS series_metadata,
              e.metadata_json AS episode_metadata,
              e.series_content_id, parent.metadata_json AS parent_metadata,
              u.favorite, u.progress, u.history_json
       FROM contents c
       LEFT JOIN movies m ON m.content_id = c.id
       LEFT JOIN series se ON se.content_id = c.id
       LEFT JOIN episodes e ON e.content_id = c.id
       LEFT JOIN series parent ON parent.content_id = e.series_content_id
       LEFT JOIN user_content_state u ON u.content_id = c.id
       WHERE c.type IN ('movie', 'series', 'episode')
       ORDER BY c.id`,
    );
  }

  membershipRows() {
    return this.projectionRows(
      `SELECT lm.content_id, lm.library_id, lm.order_index, lm.created_at,
              l.name
       FROM library_memberships lm
       JOIN local_libraries l ON l.id = lm.library_id
       ORDER BY lm.content_id, lm.order_index, lm.library_id`,
    );
  }

  sourceRows() {
    const movie = this.projectionRows(
      `SELECT cs.content_id, s.id AS source_id, s.descriptor_json
       FROM content_sources cs
       JOIN sources s ON s.id = cs.source_id
       ORDER BY cs.content_id, s.id`,
    ).map((row) => ({ ...row, source_kind: "catalog" }));
    const torrent = this.projectionRows(
      `SELECT css.content_id, css.source_id, css.selector_json,
              ts.input_label, tr.metadata_json
       FROM content_source_selectors css
       JOIN torrent_sources ts ON ts.source_id = css.source_id
       JOIN torrent_runtimes tr ON tr.info_hash = ts.info_hash
       ORDER BY css.content_id, css.source_id`,
    ).map((row) => ({ ...row, source_kind: "torrent" }));
    return [...movie, ...torrent];
  }

  episodeAggregateRows() {
    return this.projectionRows(
      `SELECT series_content_id,
              COUNT(DISTINCT season_number) AS season_count,
              COUNT(*) AS episode_count
       FROM episodes
       GROUP BY series_content_id
       ORDER BY series_content_id`,
    );
  }

  projectionRows(sql, ...parameters) {
    this.projectionQueryCount += 1;
    return this.database.prepare(sql).all(...parameters);
  }

  catalogDocuments() {
    this.projectionQueryCount = 0;
    const memberships = new Map();
    for (const row of this.membershipRows()) {
      const current = memberships.get(row.content_id) ?? [];
      current.push({
        id: row.library_id,
        kind: "local",
        name: row.name,
        available: true,
        sortPosition: Number(row.order_index),
        addedAt: Number(row.created_at),
      });
      memberships.set(row.content_id, current);
    }
    const sources = new Map();
    for (const row of this.sourceRows()) {
      const current = sources.get(row.content_id) ?? [];
      if (row.source_kind === "catalog") {
        const descriptor = parseJson(row.descriptor_json, {});
        current.push({
          id: row.source_id,
          quality:
            descriptor.resolution === "2160p" ? "4K" : descriptor.resolution,
          availability:
            descriptor.fileAvailable === false ||
            descriptor.availability === "missing"
              ? "missing"
              : "available",
          localFileAvailable: descriptor.fileAvailable === true,
        });
      } else {
        const selector = parseJson(row.selector_json, {});
        const file = (parseJson(row.metadata_json, {}).files ?? []).find(
          (candidate) => candidate.id === selector.fileId,
        );
        current.push({
          id: row.source_id,
          quality: qualityFrom(file?.name),
          availability: "available",
          localFileAvailable: false,
        });
      }
      sources.set(row.content_id, current);
    }

    const rows = this.baseRows();
    const episodeAggregates = new Map(
      this.episodeAggregateRows().map((row) => [
        row.series_content_id,
        {
          seasonCount: Number(row.season_count),
          episodeCount: Number(row.episode_count),
        },
      ]),
    );
    for (const row of rows) {
      if (row.type !== "episode") continue;
      memberships.set(
        row.id,
        structuredClone(memberships.get(row.series_content_id) ?? []),
      );
    }
    for (const row of rows) {
      if (row.type !== "episode") continue;
      const current = sources.get(row.series_content_id) ?? [];
      current.push(...(sources.get(row.id) ?? []));
      sources.set(row.series_content_id, current);
    }

    return rows.flatMap((row) => {
      const originValues = memberships.get(row.id) ?? [];
      if (!originValues.length) return [];
      const movie = parseJson(row.movie_metadata, {});
      const series = parseJson(row.series_metadata, {});
      const episode = parseJson(row.episode_metadata, {});
      const parent = parseJson(row.parent_metadata, {});
      const metadata =
        row.type === "movie" ? movie : row.type === "series" ? series : episode;
      const title =
        row.type === "episode"
          ? (episode.title ??
            `Série · episódio ${row.id.split(":").at(-1) ?? ""}`)
          : metadata.title;
      if (typeof title !== "string" || !title.trim()) return [];
      const history = parseJson(row.history_json, []);
      const lastHistory = Array.isArray(history) ? history.at(-1) : undefined;
      const lastPlayedAt =
        typeof lastHistory?.endedAt === "string"
          ? Math.floor(Date.parse(lastHistory.endedAt) / 1_000)
          : typeof lastHistory?.startedAt === "string"
            ? Math.floor(Date.parse(lastHistory.startedAt) / 1_000)
            : undefined;
      const durationSeconds =
        row.type === "movie"
          ? Number(metadata.duration ?? 0) * 60
          : row.type === "episode"
            ? Number(metadata.runtimeSeconds ?? 0)
            : 0;
      const positionSeconds = Math.max(0, Number(row.progress ?? 0));
      const uniqueSources = [
        ...new Map(
          (sources.get(row.id) ?? []).map((source) => [source.id, source]),
        ).values(),
      ]
        .sort((left, right) => left.id.localeCompare(right.id))
        .slice(0, 64);
      const origins = originValues
        .map((origin) => ({
          id: origin.id,
          kind: origin.kind,
          name: origin.name,
          available: origin.available,
        }))
        .slice(0, 64);
      const addedAt = Math.min(...originValues.map((origin) => origin.addedAt));
      const sortPosition = Math.min(
        ...originValues.map((origin) => origin.sortPosition),
      );
      const aggregate = episodeAggregates.get(row.id);
      const seasonCount =
        row.type === "series" ? (aggregate?.seasonCount ?? 0) : undefined;
      const episodeCount =
        row.type === "series" ? (aggregate?.episodeCount ?? 0) : undefined;
      const snapshot = {
        contentId: row.id,
        type: row.type,
        title: title.trim(),
        originalTitle: metadata.originalTitle,
        seriesTitle: row.type === "episode" ? parent.title : undefined,
        synopsis: metadata.synopsis,
        poster: row.type === "episode" ? parent.poster : metadata.poster,
        backdrop:
          row.type === "episode"
            ? (metadata.still ?? parent.backdrop)
            : metadata.backdrop,
        year:
          row.type === "movie"
            ? metadata.year
            : row.type === "series"
              ? metadata.startYear
              : metadata.airDate
                ? Number(String(metadata.airDate).slice(0, 4))
                : undefined,
        endYear: row.type === "series" ? metadata.endYear : undefined,
        genres:
          row.type === "episode"
            ? (parent.genres ?? [])
            : (metadata.genres ?? []),
        cast:
          row.type === "episode" ? (parent.cast ?? []) : (metadata.cast ?? []),
        rating:
          row.type === "episode"
            ? parent.ratings?.imdb
            : metadata.ratings?.imdb,
        externalIds: metadata.externalIds,
        seasonCount,
        episodeCount,
        favorite: row.favorite === 1,
        progress: {
          positionSeconds,
          durationSeconds,
          watched:
            durationSeconds > 0 && positionSeconds >= durationSeconds * 0.95,
          lastPlayedAt:
            Number.isFinite(lastPlayedAt) && lastPlayedAt > 0
              ? dateFromEpoch(lastPlayedAt)
              : undefined,
        },
        addedAt: dateFromEpoch(addedAt),
        memberships: origins,
        collections: [],
        sources: uniqueSources,
      };
      return [
        {
          snapshot,
          titleSort: titleSort(snapshot.title),
          sortPosition,
          addedAt,
          lastPlayedAt:
            Number.isFinite(lastPlayedAt) && lastPlayedAt > 0
              ? lastPlayedAt
              : null,
        },
      ];
    });
  }

  synchronizeCatalog(input) {
    try {
      if (!isObject(input))
        throw new DiscoveryIndexStoreError(
          "DISCOVERY_INVALID",
          "A atualização do índice não é válida.",
        );
      this.requireLibrary(input.libraryId);
      const replay = this.replay(input.mutation, "synchronize-catalog");
      if (replay) return success(structuredClone(replay));
      if (!this.searchAvailable)
        throw new DiscoveryIndexStoreError(
          "DISCOVERY_INDEX_CORRUPT",
          "O índice de busca local precisa de recuperação.",
          true,
        );
      const startedAt = Date.now();
      const documents = this.catalogDocuments();
      const wanted = new Set(
        documents.map((document) => document.snapshot.contentId),
      );
      const current = new Map(
        this.database
          .prepare("SELECT content_id, snapshot_json FROM discovery_documents")
          .all()
          .map((row) => [row.content_id, row.snapshot_json]),
      );
      const changed = documents.filter(
        (document) =>
          current.get(document.snapshot.contentId) !==
          JSON.stringify(document.snapshot),
      );
      const removed = [...current.keys()].filter((id) => !wanted.has(id));
      const changedIds = [
        ...changed.map((document) => document.snapshot.contentId),
        ...removed,
      ];
      this.database.exec("BEGIN IMMEDIATE");
      try {
        const upsert = this.database.prepare(
          `INSERT INTO discovery_documents(
             content_id, content_type, title_sort, sort_position, added_at,
             last_played_at, favorite, progress_position, progress_duration,
             watched, snapshot_json, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())
           ON CONFLICT(content_id) DO UPDATE SET
             content_type = excluded.content_type,
             title_sort = excluded.title_sort,
             sort_position = excluded.sort_position,
             added_at = excluded.added_at,
             last_played_at = excluded.last_played_at,
             favorite = excluded.favorite,
             progress_position = excluded.progress_position,
             progress_duration = excluded.progress_duration,
             watched = excluded.watched,
             snapshot_json = excluded.snapshot_json,
             updated_at = unixepoch()`,
        );
        const deleteGenres = this.database.prepare(
          "DELETE FROM discovery_genres WHERE content_id = ?",
        );
        const insertGenre = this.database.prepare(
          "INSERT INTO discovery_genres(content_id, genre) VALUES (?, ?)",
        );
        const deleteOrigins = this.database.prepare(
          "DELETE FROM discovery_origins WHERE content_id = ?",
        );
        const insertOrigin = this.database.prepare(
          `INSERT INTO discovery_origins(
             content_id, origin_id, origin_kind, name, available, sort_position
           ) VALUES (?, ?, ?, ?, ?, ?)`,
        );
        const deleteSearch = this.database.prepare(
          `DELETE FROM discovery_search
           WHERE rowid = (
             SELECT rowid FROM discovery_documents WHERE content_id = ?
           )`,
        );
        const insertSearch = this.database.prepare(
          `INSERT INTO discovery_search(
             rowid, content_id, title, original_title, synopsis, series_title,
             episode_title, origin_names, collection_names
           )
           SELECT rowid, ?, ?, ?, ?, ?, ?, ?, ?
           FROM discovery_documents WHERE content_id = ?`,
        );
        for (const document of changed) {
          const snapshot = document.snapshot;
          upsert.run(
            snapshot.contentId,
            snapshot.type,
            document.titleSort,
            document.sortPosition,
            document.addedAt,
            document.lastPlayedAt,
            snapshot.favorite ? 1 : 0,
            snapshot.progress.positionSeconds,
            snapshot.progress.durationSeconds,
            snapshot.progress.watched ? 1 : 0,
            JSON.stringify(snapshot),
          );
          deleteGenres.run(snapshot.contentId);
          for (const genre of [...new Set(snapshot.genres)].slice(0, 256))
            insertGenre.run(snapshot.contentId, genre);
          deleteOrigins.run(snapshot.contentId);
          for (const origin of snapshot.memberships)
            insertOrigin.run(
              snapshot.contentId,
              origin.id,
              origin.kind,
              origin.name,
              origin.available ? 1 : 0,
              document.sortPosition,
            );
          for (const origin of snapshot.collections)
            insertOrigin.run(
              snapshot.contentId,
              origin.id,
              origin.kind,
              origin.name,
              origin.available ? 1 : 0,
              document.sortPosition,
            );
          this.writeSearchIndex(
            deleteSearch,
            insertSearch,
            snapshot,
            this.searchTextFromSnapshot(snapshot),
          );
        }
        const remove = this.database.prepare(
          "DELETE FROM discovery_documents WHERE content_id = ?",
        );
        for (const id of removed) {
          deleteSearch.run(id);
          remove.run(id);
        }
        if (changedIds.length)
          this.database
            .prepare(
              `UPDATE discovery_state
               SET revision = revision + 1, indexed_at = unixepoch()
               WHERE singleton = 1`,
            )
            .run();
        const result = {
          protocolVersion: 1,
          eventId: `event:${randomUUID()}`,
          revision: this.revision(),
          reason: "catalog",
          contentIds: changedIds.slice(0, 1_000),
          scopeIds: [
            ...new Set(
              documents.flatMap((document) =>
                document.snapshot.memberships.map((origin) => origin.id),
              ),
            ),
          ].slice(0, 1_000),
          occurredAt: new Date().toISOString(),
        };
        this.database
          .prepare(
            `INSERT INTO discovery_idempotency(
               idempotency_key, operation, result_json, created_at
             ) VALUES (?, 'synchronize-catalog', ?, unixepoch())`,
          )
          .run(input.mutation.idempotencyKey, JSON.stringify(result));
        this.database.exec("COMMIT");
        this.lastSynchronizationDiagnostics = {
          projectionQueryCount: this.projectionQueryCount,
          projectedContentCount: documents.length,
          changedContentCount: changed.length,
          removedContentCount: removed.length,
          durationMs: Date.now() - startedAt,
        };
        this.secureDatabaseFiles();
        return success(structuredClone(result));
      } catch (error) {
        this.database.exec("ROLLBACK");
        throw error;
      }
    } catch (error) {
      return failure(error);
    }
  }

  snapshot(row) {
    return parseJson(row.snapshot_json, undefined);
  }

  diagnostics() {
    return this.lastSynchronizationDiagnostics
      ? structuredClone(this.lastSynchronizationDiagnostics)
      : undefined;
  }

  apply(input) {
    try {
      if (
        !isObject(input) ||
        !Array.isArray(input.upserts) ||
        !Array.isArray(input.removals) ||
        input.upserts.length + input.removals.length > INDEX_BATCH_MAXIMUM ||
        Buffer.byteLength(JSON.stringify(input), "utf8") > 1_024 * 1_024 ||
        ![
          "catalog",
          "file-added",
          "file-changed",
          "file-renamed",
          "file-removed",
          "origin",
          "progress",
          "recovery",
        ].includes(input.reason)
      )
        throw new DiscoveryIndexStoreError(
          "DISCOVERY_INVALID",
          "O lote incremental não é válido.",
        );
      this.requireLibrary(input.libraryId);
      const replay = this.replay(input.mutation, "apply-index");
      if (replay) return success(structuredClone(replay));
      if (!this.searchAvailable)
        throw new DiscoveryIndexStoreError(
          "DISCOVERY_INDEX_CORRUPT",
          "O índice de busca local precisa de recuperação.",
          true,
        );
      const upserts = input.upserts.map((document) =>
        this.normalizeIndexDocument(document),
      );
      const removals = input.removals.map((id) =>
        validateId(id, "conteúdo removido"),
      );
      const identities = [
        ...upserts.map((document) => document.content.contentId),
        ...removals,
      ];
      if (new Set(identities).size !== identities.length)
        throw new DiscoveryIndexStoreError(
          "DISCOVERY_INVALID",
          "O lote incremental repete uma identidade.",
        );
      const placeholders = identities.map(() => "?").join(", ");
      const existing = new Map(
        identities.length
          ? this.database
              .prepare(
                `SELECT content_id, sort_position, added_at, snapshot_json
                 FROM discovery_documents
                 WHERE content_id IN (${placeholders})`,
              )
              .all(...identities)
              .map((row) => [row.content_id, row])
          : [],
      );
      const previousOrigins = new Map();
      const previousOriginRows = identities.length
        ? this.database
            .prepare(
              `SELECT content_id, origin_id FROM discovery_origins
               WHERE content_id IN (${placeholders})`,
            )
            .all(...identities)
        : [];
      for (const row of previousOriginRows) {
        const currentOrigins = previousOrigins.get(row.content_id) ?? [];
        currentOrigins.push(row.origin_id);
        previousOrigins.set(row.content_id, currentOrigins);
      }
      let nextPosition = Number(
        this.database
          .prepare(
            "SELECT COALESCE(MAX(sort_position), -1) + 1 AS position FROM discovery_documents",
          )
          .get().position,
      );
      const upsertIds = new Set(
        upserts.map((document) => document.content.contentId),
      );
      const changedIds = identities.filter(
        (id) => existing.has(id) || upsertIds.has(id),
      );
      const scopeIds = new Set(
        identities.flatMap((id) => previousOrigins.get(id) ?? []),
      );
      this.database.exec("BEGIN IMMEDIATE");
      try {
        const upsert = this.database.prepare(
          `INSERT INTO discovery_documents(
             content_id, content_type, title_sort, sort_position, added_at,
             last_played_at, favorite, progress_position, progress_duration,
             watched, snapshot_json, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())
           ON CONFLICT(content_id) DO UPDATE SET
             content_type = excluded.content_type,
             title_sort = excluded.title_sort,
             sort_position = excluded.sort_position,
             added_at = excluded.added_at,
             last_played_at = excluded.last_played_at,
             favorite = excluded.favorite,
             progress_position = excluded.progress_position,
             progress_duration = excluded.progress_duration,
             watched = excluded.watched,
             snapshot_json = excluded.snapshot_json,
             updated_at = unixepoch()`,
        );
        const deleteGenres = this.database.prepare(
          "DELETE FROM discovery_genres WHERE content_id = ?",
        );
        const insertGenre = this.database.prepare(
          "INSERT INTO discovery_genres(content_id, genre) VALUES (?, ?)",
        );
        const deleteOrigins = this.database.prepare(
          "DELETE FROM discovery_origins WHERE content_id = ?",
        );
        const insertOrigin = this.database.prepare(
          `INSERT INTO discovery_origins(
             content_id, origin_id, origin_kind, name, available, sort_position
           ) VALUES (?, ?, ?, ?, ?, ?)`,
        );
        const deleteSearch = this.database.prepare(
          `DELETE FROM discovery_search
           WHERE rowid = (
             SELECT rowid FROM discovery_documents WHERE content_id = ?
           )`,
        );
        const insertSearch = this.database.prepare(
          `INSERT INTO discovery_search(
             rowid, content_id, title, original_title, synopsis, series_title,
             episode_title, origin_names, collection_names
           )
           SELECT rowid, ?, ?, ?, ?, ?, ?, ?, ?
           FROM discovery_documents WHERE content_id = ?`,
        );
        const removeDocument = this.database.prepare(
          "DELETE FROM discovery_documents WHERE content_id = ?",
        );
        for (const document of upserts) {
          const snapshot = document.content;
          const previous = existing.get(snapshot.contentId);
          const sortPosition = previous
            ? Number(previous.sort_position)
            : nextPosition++;
          const addedAt = previous
            ? Number(previous.added_at)
            : Math.floor(Date.parse(snapshot.addedAt) / 1_000);
          const parsedLastPlayedAt = snapshot.progress.lastPlayedAt
            ? Math.floor(Date.parse(snapshot.progress.lastPlayedAt) / 1_000)
            : null;
          const lastPlayedAt = Number.isFinite(parsedLastPlayedAt)
            ? parsedLastPlayedAt
            : null;
          upsert.run(
            snapshot.contentId,
            snapshot.type,
            titleSort(snapshot.title),
            sortPosition,
            addedAt,
            lastPlayedAt,
            snapshot.favorite ? 1 : 0,
            snapshot.progress.positionSeconds,
            snapshot.progress.durationSeconds,
            snapshot.progress.watched ? 1 : 0,
            JSON.stringify(snapshot),
          );
          deleteGenres.run(snapshot.contentId);
          for (const genre of snapshot.genres)
            insertGenre.run(snapshot.contentId, genre);
          deleteOrigins.run(snapshot.contentId);
          for (const origin of [
            ...snapshot.memberships,
            ...snapshot.collections,
          ]) {
            insertOrigin.run(
              snapshot.contentId,
              origin.id,
              origin.kind,
              origin.name,
              origin.available ? 1 : 0,
              sortPosition,
            );
            scopeIds.add(origin.id);
          }
          this.writeSearchIndex(
            deleteSearch,
            insertSearch,
            snapshot,
            document.searchText,
          );
        }
        for (const id of removals) {
          deleteSearch.run(id);
          removeDocument.run(id);
        }
        if (changedIds.length)
          this.database
            .prepare(
              `UPDATE discovery_state
               SET revision = revision + 1, indexed_at = unixepoch()
               WHERE singleton = 1`,
            )
            .run();
        const result = {
          protocolVersion: 1,
          eventId: `event:${randomUUID()}`,
          revision: this.revision(),
          reason: input.reason,
          contentIds: changedIds,
          scopeIds: [...scopeIds].slice(0, INDEX_BATCH_MAXIMUM),
          occurredAt: new Date().toISOString(),
        };
        this.database
          .prepare(
            `INSERT INTO discovery_idempotency(
               idempotency_key, operation, result_json, created_at
             ) VALUES (?, 'apply-index', ?, unixepoch())`,
          )
          .run(input.mutation.idempotencyKey, JSON.stringify(result));
        this.database.exec("COMMIT");
        this.secureDatabaseFiles();
        return success(structuredClone(result));
      } catch (error) {
        this.database.exec("ROLLBACK");
        throw error;
      }
    } catch (error) {
      return failure(error);
    }
  }

  rebuildSearchIndex(input) {
    try {
      if (!isObject(input))
        throw new DiscoveryIndexStoreError(
          "DISCOVERY_INVALID",
          "A recuperação do índice não é válida.",
        );
      this.requireLibrary(input.libraryId);
      const replay = this.replay(input.mutation, "rebuild-search-index");
      if (replay) return success(structuredClone(replay));
      const rows = this.database
        .prepare(
          "SELECT snapshot_json FROM discovery_documents ORDER BY content_id",
        )
        .all();
      this.database.exec("BEGIN IMMEDIATE");
      try {
        if (!this.searchAvailable)
          this.database.exec(`
            CREATE VIRTUAL TABLE discovery_search USING fts5(
              content_id UNINDEXED,
              title,
              original_title,
              synopsis,
              series_title,
              episode_title,
              origin_names,
              collection_names,
              tokenize = 'unicode61 remove_diacritics 2'
            );
          `);
        const deleteSearch = this.database.prepare(
          `DELETE FROM discovery_search
           WHERE rowid = (
             SELECT rowid FROM discovery_documents WHERE content_id = ?
           )`,
        );
        const insertSearch = this.database.prepare(
          `INSERT INTO discovery_search(
             rowid, content_id, title, original_title, synopsis, series_title,
             episode_title, origin_names, collection_names
           )
           SELECT rowid, ?, ?, ?, ?, ?, ?, ?, ?
           FROM discovery_documents WHERE content_id = ?`,
        );
        this.database.exec("DELETE FROM discovery_search");
        for (const row of rows) {
          const snapshot = this.snapshot(row);
          if (!snapshot)
            throw new DiscoveryIndexStoreError(
              "DISCOVERY_INDEX_CORRUPT",
              "Um documento local não pôde ser recuperado.",
              true,
            );
          this.writeSearchIndex(
            deleteSearch,
            insertSearch,
            snapshot,
            this.searchTextFromSnapshot(snapshot),
          );
        }
        this.database
          .prepare(
            `UPDATE discovery_state
             SET revision = revision + 1, indexed_at = unixepoch()
             WHERE singleton = 1`,
          )
          .run();
        const result = {
          protocolVersion: 1,
          eventId: `event:${randomUUID()}`,
          revision: this.revision(),
          reason: "recovery",
          contentIds: [],
          scopeIds: [],
          occurredAt: new Date().toISOString(),
        };
        this.database
          .prepare(
            `INSERT INTO discovery_idempotency(
               idempotency_key, operation, result_json, created_at
             ) VALUES (?, 'rebuild-search-index', ?, unixepoch())`,
          )
          .run(input.mutation.idempotencyKey, JSON.stringify(result));
        this.database.exec("COMMIT");
        this.searchAvailable = true;
        this.secureDatabaseFiles();
        return success(structuredClone(result));
      } catch (error) {
        this.database.exec("ROLLBACK");
        throw error;
      }
    } catch (error) {
      return failure(error);
    }
  }

  documents(libraryId, where, params, order, limit) {
    return this.database
      .prepare(
        `SELECT snapshot_json FROM discovery_documents
         WHERE EXISTS (
           SELECT 1 FROM discovery_origins access
           WHERE access.content_id = discovery_documents.content_id
             AND access.origin_id = ?
             AND access.origin_kind = 'local'
         ) AND ${where} ORDER BY ${order} LIMIT ?`,
      )
      .all(libraryId, ...params, limit)
      .map((row) => this.snapshot(row))
      .filter(Boolean);
  }

  facets(libraryId) {
    const genres = this.database
      .prepare(
        `SELECT DISTINCT genre
         FROM discovery_genres
         WHERE EXISTS (
           SELECT 1 FROM discovery_origins access
           WHERE access.content_id = discovery_genres.content_id
             AND access.origin_id = ?
             AND access.origin_kind = 'local'
         )
         ORDER BY genre LIMIT 256`,
      )
      .all(libraryId)
      .map((row) => row.genre);
    const origins = this.database
      .prepare(
        `SELECT origin_id, origin_kind, name, MIN(available) AS available
         FROM discovery_origins
         WHERE EXISTS (
           SELECT 1 FROM discovery_origins access
           WHERE access.content_id = discovery_origins.content_id
             AND access.origin_id = ?
             AND access.origin_kind = 'local'
         )
         GROUP BY origin_id, origin_kind, name
         ORDER BY name, origin_id LIMIT 512`,
      )
      .all(libraryId)
      .map((row) => ({
        id: row.origin_id,
        kind: row.origin_kind,
        name: row.name,
        available: row.available === 1,
      }));
    return {
      genres,
      collections: origins
        .filter((origin) => origin.kind === "collection")
        .slice(0, 256),
      libraries: origins
        .filter((origin) => origin.kind !== "collection")
        .slice(0, 256),
    };
  }

  cancelRequest(input) {
    try {
      if (!isObject(input))
        throw new DiscoveryIndexStoreError(
          "DISCOVERY_INVALID",
          "O cancelamento da busca não é válido.",
        );
      const requestId = validateId(input.requestId, "requisição");
      if (this.cancelledRequests.size >= 1_000)
        this.cancelledRequests.delete(
          this.cancelledRequests.values().next().value,
        );
      this.cancelledRequests.add(requestId);
      return success({ requestId, cancelled: true });
    } catch (error) {
      return failure(error);
    }
  }

  search(input) {
    try {
      if (!isObject(input))
        throw new DiscoveryIndexStoreError(
          "DISCOVERY_INVALID",
          "A consulta de busca não é válida.",
        );
      this.requireLibrary(input.libraryId);
      const requestId = validateId(input.requestId, "requisição");
      if (this.cancelledRequests.delete(requestId))
        throw new DiscoveryIndexStoreError(
          "DISCOVERY_CANCELLED",
          "A busca foi cancelada.",
        );
      if (!this.searchAvailable)
        throw new DiscoveryIndexStoreError(
          "DISCOVERY_INDEX_CORRUPT",
          "O índice de busca local precisa de recuperação.",
          true,
        );
      const query = optionalText(input.query, SEARCH_QUERY_BYTES, "busca");
      const tokens = searchTokens(query);
      const expression = ftsExpression(tokens);
      const limit = pageLimit(input.limit);
      const revision = this.revision();
      const cursor = decodeCursor(input.cursor, revision);
      if (
        input.type !== undefined &&
        !["movie", "series", "episode"].includes(input.type)
      )
        throw new DiscoveryIndexStoreError(
          "DISCOVERY_INVALID",
          "O filtro de tipo não é válido.",
        );
      for (const field of ["favorite", "recent", "continuing"])
        if (input[field] !== undefined && typeof input[field] !== "boolean")
          throw new DiscoveryIndexStoreError(
            "DISCOVERY_INVALID",
            "Um filtro booleano não é válido.",
          );
      const genre = optionalText(input.genre, 160, "gênero");
      const collectionId =
        input.collectionId === undefined
          ? undefined
          : validateId(input.collectionId, "coleção");
      const scopeId =
        input.scopeId === undefined
          ? undefined
          : validateId(input.scopeId, "origem");
      const where = [
        `EXISTS (
          SELECT 1 FROM discovery_origins access
          WHERE access.content_id = d.content_id
            AND access.origin_id = ?
            AND access.origin_kind = 'local'
        )`,
      ];
      const filters = [input.libraryId];
      if (input.type !== undefined) {
        where.push("d.content_type = ?");
        filters.push(input.type);
      }
      if (input.favorite === true) where.push("d.favorite = 1");
      if (input.recent === true) {
        where.push("d.added_at >= unixepoch() - ?");
        filters.push(RECENT_WINDOW_SECONDS);
      }
      if (input.continuing === true)
        where.push(
          "d.watched = 0 AND d.progress_position > 0 AND d.progress_duration > d.progress_position",
        );
      if (genre !== undefined && genre.trim()) {
        where.push(
          `EXISTS (
            SELECT 1 FROM discovery_genres genre_filter
            WHERE genre_filter.content_id = d.content_id
              AND genre_filter.genre = ? COLLATE NOCASE
          )`,
        );
        filters.push(genre.trim());
      }
      if (collectionId !== undefined) {
        where.push(
          `EXISTS (
            SELECT 1 FROM discovery_origins collection_filter
            WHERE collection_filter.content_id = d.content_id
              AND collection_filter.origin_id = ?
              AND collection_filter.origin_kind = 'collection'
          )`,
        );
        filters.push(collectionId);
      }
      if (scopeId !== undefined) {
        where.push(
          `EXISTS (
            SELECT 1 FROM discovery_origins scope_filter
            WHERE scope_filter.content_id = d.content_id
              AND scope_filter.origin_id = ?
          )`,
        );
        filters.push(scopeId);
      }
      const from = tokens.length
        ? "FROM discovery_search JOIN discovery_documents d ON d.content_id = discovery_search.content_id"
        : "FROM discovery_documents d";
      const rank = tokens.length
        ? "bm25(discovery_search)"
        : "CAST(d.sort_position AS REAL)";
      const match = tokens.length ? ["discovery_search MATCH ?"] : [];
      const baseParameters = tokens.length
        ? [expression, ...filters]
        : [...filters];
      const baseWhere = [...match, ...where].join(" AND ");
      const cursorWhere = cursor
        ? `WHERE rank > ? OR
           (rank = ? AND title_sort > ?) OR
           (rank = ? AND title_sort = ? AND content_id > ?)`
        : "";
      const cursorParameters = cursor
        ? [
            cursor.position,
            cursor.position,
            cursor.title,
            cursor.position,
            cursor.title,
            cursor.id,
          ]
        : [];
      const rows = this.database
        .prepare(
          `WITH matched AS (
             SELECT d.content_id, d.title_sort, d.snapshot_json,
                    ${rank} AS rank
             ${from}
             WHERE ${baseWhere}
           )
           SELECT content_id, title_sort, snapshot_json, rank
           FROM matched ${cursorWhere}
           ORDER BY rank, title_sort, content_id LIMIT ?`,
        )
        .all(...baseParameters, ...cursorParameters, limit + 1);
      if (this.cancelledRequests.delete(requestId))
        throw new DiscoveryIndexStoreError(
          "DISCOVERY_CANCELLED",
          "A busca foi cancelada.",
        );
      const visible = rows.slice(0, limit);
      const last = visible.at(-1);
      const total = Number(
        this.database
          .prepare(
            `SELECT COUNT(DISTINCT d.content_id) AS total ${from} WHERE ${baseWhere}`,
          )
          .get(...baseParameters).total,
      );
      return success({
        schemaVersion: DISCOVERY_INDEX_SCHEMA_VERSION,
        libraryId: input.libraryId,
        revision,
        requestId,
        query,
        page: {
          items: visible.map((row) => this.snapshot(row)).filter(Boolean),
          nextCursor:
            rows.length > limit && last
              ? encodeCursor({
                  revision,
                  position: Number(last.rank),
                  title: last.title_sort,
                  id: last.content_id,
                })
              : undefined,
          total,
        },
        facets: this.facets(input.libraryId),
      });
    } catch (error) {
      return failure(error);
    }
  }

  readHome(input) {
    try {
      if (!isObject(input))
        throw new DiscoveryIndexStoreError(
          "DISCOVERY_INVALID",
          "A consulta da Home não é válida.",
        );
      this.requireLibrary(input.libraryId);
      const limit = pageLimit(input.sectionLimit, HOME_SECTION_MAXIMUM);
      const hero = this.documents(
        input.libraryId,
        "content_type IN ('movie', 'series')",
        [],
        "sort_position, title_sort, content_id",
        1,
      )[0];
      const candidates = [
        {
          id: "continue-watching",
          kind: "continue-watching",
          title: "Continuar assistindo",
          items: this.documents(
            input.libraryId,
            "watched = 0 AND progress_position > 0 AND progress_duration > progress_position",
            [],
            "COALESCE(last_played_at, 0) DESC, content_id",
            limit,
          ),
        },
        {
          id: "movies",
          kind: "movies",
          title: "Filmes para descobrir",
          items: this.documents(
            input.libraryId,
            "content_type = 'movie'",
            [],
            "sort_position, title_sort, content_id",
            limit,
          ),
        },
        {
          id: "series",
          kind: "series",
          title: "Séries",
          items: this.documents(
            input.libraryId,
            "content_type = 'series'",
            [],
            "sort_position, title_sort, content_id",
            limit,
          ),
        },
        {
          id: "recent",
          kind: "recent",
          title: "Adicionados recentemente",
          items: this.documents(
            input.libraryId,
            "1 = 1",
            [],
            "added_at DESC, content_id",
            limit,
          ),
        },
      ];
      return success({
        schemaVersion: DISCOVERY_INDEX_SCHEMA_VERSION,
        libraryId: input.libraryId,
        revision: this.revision(),
        offline: false,
        hero,
        sections: candidates.filter((section) => section.items.length),
        facets: this.facets(input.libraryId),
      });
    } catch (error) {
      return failure(error);
    }
  }

  readScope(input) {
    try {
      if (!isObject(input))
        throw new DiscoveryIndexStoreError(
          "DISCOVERY_INVALID",
          "A consulta da origem não é válida.",
        );
      this.requireLibrary(input.libraryId);
      const scopeId = validateId(input.scopeId, "origem");
      const limit = pageLimit(input.limit);
      const revision = this.revision();
      const cursor = decodeCursor(input.cursor, revision);
      const scope = this.database
        .prepare(
          `SELECT origin_id, origin_kind, name, MIN(available) AS available
           FROM discovery_origins WHERE origin_id = ?
           GROUP BY origin_id, origin_kind, name
           ORDER BY origin_kind LIMIT 1`,
        )
        .get(scopeId);
      if (!scope)
        throw new DiscoveryIndexStoreError(
          "DISCOVERY_NOT_FOUND",
          "A origem solicitada não foi encontrada.",
        );
      const accessible = this.database
        .prepare(
          `SELECT 1
           FROM discovery_origins scoped
           WHERE scoped.origin_id = ?
             AND EXISTS (
               SELECT 1 FROM discovery_origins access
               WHERE access.content_id = scoped.content_id
                 AND access.origin_id = ?
                 AND access.origin_kind = 'local'
             )
           LIMIT 1`,
        )
        .get(scopeId, input.libraryId);
      if (!accessible)
        throw new DiscoveryIndexStoreError(
          "DISCOVERY_UNAUTHORIZED",
          "Esta origem não pertence à biblioteca selecionada.",
        );
      const params = [scopeId];
      let cursorClause = "";
      if (cursor) {
        cursorClause = `AND (
          d.sort_position > ? OR
          (d.sort_position = ? AND d.title_sort > ?) OR
          (d.sort_position = ? AND d.title_sort = ? AND d.content_id > ?)
        )`;
        params.push(
          cursor.position,
          cursor.position,
          cursor.title,
          cursor.position,
          cursor.title,
          cursor.id,
        );
      }
      const rows = this.database
        .prepare(
          `SELECT d.content_id, d.sort_position, d.title_sort, d.snapshot_json
           FROM discovery_origins o
           JOIN discovery_documents d ON d.content_id = o.content_id
           WHERE o.origin_id = ?
             AND EXISTS (
               SELECT 1 FROM discovery_origins access
               WHERE access.content_id = d.content_id
                 AND access.origin_id = ?
                 AND access.origin_kind = 'local'
             ) ${cursorClause}
           ORDER BY d.sort_position, d.title_sort, d.content_id LIMIT ?`,
        )
        .all(params[0], input.libraryId, ...params.slice(1), limit + 1);
      const visible = rows.slice(0, limit);
      const last = visible.at(-1);
      const total = Number(
        this.database
          .prepare(
            `SELECT COUNT(DISTINCT scoped.content_id) AS total
             FROM discovery_origins scoped
             WHERE scoped.origin_id = ?
               AND EXISTS (
                 SELECT 1 FROM discovery_origins access
                 WHERE access.content_id = scoped.content_id
                   AND access.origin_id = ?
                   AND access.origin_kind = 'local'
               )`,
          )
          .get(scopeId, input.libraryId).total,
      );
      return success({
        schemaVersion: DISCOVERY_INDEX_SCHEMA_VERSION,
        libraryId: input.libraryId,
        revision,
        scope: {
          id: scope.origin_id,
          kind: scope.origin_kind,
          name: scope.name,
          available: scope.available === 1,
        },
        page: {
          items: visible.map((row) => this.snapshot(row)),
          nextCursor:
            rows.length > limit && last
              ? encodeCursor({
                  revision,
                  position: Number(last.sort_position),
                  title: last.title_sort,
                  id: last.content_id,
                })
              : undefined,
          total,
        },
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
  DISCOVERY_INDEX_SCHEMA_VERSION,
  DiscoveryIndexStore,
  DiscoveryIndexStoreError,
};
