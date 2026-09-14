"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { Buffer } = require("node:buffer");
const { DatabaseSync } = require("node:sqlite");
const { clearTimeout, setTimeout } = require("node:timers");
const { URLSearchParams } = require("node:url");

const { AbortController } = globalThis;

const DATABASE_SCHEMA_VERSION = 10;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

class MetadataProviderError extends Error {
  constructor(code, publicMessage, retryable = false, cause) {
    super(publicMessage, cause ? { cause } : undefined);
    this.name = "MetadataProviderError";
    this.code = code;
    this.publicMessage = publicMessage;
    this.retryable = retryable;
  }
}

function normalizeQuery(value) {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length > 160 ||
    value.includes("\0")
  )
    throw new MetadataProviderError(
      "CATALOG_INVALID",
      "Digite um título válido (até 160 caracteres).",
    );
  return value.trim().replace(/\s+/g, " ");
}

function safeText(value, maximum) {
  return typeof value === "string" && value.length <= maximum
    ? value
    : undefined;
}

function imageUrl(value, size) {
  if (typeof value !== "string" || !/^\/[A-Za-z0-9._/-]+$/.test(value))
    return undefined;
  return `${TMDB_IMAGE_BASE_URL}/${size}${value}`;
}

function yearFrom(value) {
  if (typeof value !== "string") return undefined;
  const year = Number(value.slice(0, 4));
  return Number.isInteger(year) && year >= 1870 && year <= 2200
    ? year
    : undefined;
}

function mapSearchMovie(value) {
  if (!value || typeof value !== "object") return undefined;
  const providerId =
    typeof value.id === "number" || typeof value.id === "string"
      ? String(value.id)
      : undefined;
  const title = safeText(value.title, 160);
  if (!providerId || !/^\d{1,20}$/.test(providerId) || !title?.trim())
    return undefined;
  return {
    id: `movie:tmdb:${providerId}`,
    title: title.trim(),
    originalTitle: safeText(value.original_title, 160),
    year: yearFrom(value.release_date),
    synopsis: safeText(value.overview, 20_000),
    genres: [],
    cast: [],
    poster: imageUrl(value.poster_path, "w500"),
    backdrop: imageUrl(value.backdrop_path, "w1280"),
    externalIds: { tmdb: providerId },
  };
}

function mapDetailsMovie(value, previous) {
  const mapped = mapSearchMovie(value);
  if (!mapped)
    throw new MetadataProviderError(
      "PROVIDER_FAILED",
      "O provider retornou dados incompatíveis.",
      true,
    );
  const genres = Array.isArray(value.genres)
    ? value.genres
        .map((genre) => safeText(genre?.name, 80))
        .filter(Boolean)
        .slice(0, 32)
    : previous.genres;
  const runtime = Number(value.runtime);
  const imdb = safeText(value.external_ids?.imdb_id, 128);
  return {
    ...previous,
    ...mapped,
    id: previous.id,
    duration:
      Number.isInteger(runtime) && runtime > 0 && runtime <= 100_000
        ? runtime
        : previous.duration,
    genres,
    cast: previous.cast,
    externalIds: {
      ...previous.externalIds,
      tmdb: mapped.externalIds.tmdb,
      imdb: imdb ?? previous.externalIds?.imdb,
    },
  };
}

function mapSearchSeries(value) {
  if (!value || typeof value !== "object") return undefined;
  const providerId =
    typeof value.id === "number" || typeof value.id === "string"
      ? String(value.id)
      : undefined;
  const title = safeText(value.name, 512);
  if (!providerId || !/^\d{1,20}$/.test(providerId) || !title?.trim())
    return undefined;
  return {
    contentId: `series:tmdb:${providerId}`,
    title: title.trim(),
    originalTitle: safeText(value.original_name, 512),
    synopsis: safeText(value.overview, 20_000),
    startYear: yearFrom(value.first_air_date),
    genres: [],
    cast: [],
    poster: imageUrl(value.poster_path, "w500"),
    backdrop: imageUrl(value.backdrop_path, "w1280"),
    externalIds: { tmdb: providerId },
  };
}

function mapDetailsSeries(value, previous) {
  const mapped = mapSearchSeries(value);
  if (!mapped)
    throw new MetadataProviderError(
      "PROVIDER_FAILED",
      "O provider retornou dados de série incompatíveis.",
      true,
    );
  const genres = Array.isArray(value.genres)
    ? value.genres
        .map((genre) => safeText(genre?.name, 160))
        .filter(Boolean)
        .slice(0, 32)
    : previous.genres;
  const imdb = safeText(value.external_ids?.imdb_id, 128);
  return {
    ...previous,
    title: mapped.title,
    originalTitle: mapped.originalTitle ?? previous.originalTitle,
    synopsis: mapped.synopsis ?? previous.synopsis,
    startYear: mapped.startYear ?? previous.startYear,
    endYear: yearFrom(value.last_air_date) ?? previous.endYear,
    status: safeText(value.status, 128) ?? previous.status,
    genres,
    cast: previous.cast,
    poster: mapped.poster ?? previous.poster,
    backdrop: mapped.backdrop ?? previous.backdrop,
    externalIds: {
      ...previous.externalIds,
      tmdb: mapped.externalIds.tmdb,
      imdb: imdb ?? previous.externalIds?.imdb,
    },
  };
}

function mapSeasonEpisodes(value) {
  if (!value || typeof value !== "object" || !Array.isArray(value.episodes))
    throw new MetadataProviderError(
      "PROVIDER_FAILED",
      "O provider retornou episódios incompatíveis.",
      true,
    );
  return value.episodes
    .slice(0, 10_000)
    .map((episode) => {
      const providerId =
        typeof episode?.id === "number" || typeof episode?.id === "string"
          ? String(episode.id)
          : undefined;
      const seasonNumber = Number(episode?.season_number);
      const episodeNumber = Number(episode?.episode_number);
      if (
        !providerId ||
        !/^\d{1,20}$/.test(providerId) ||
        !Number.isInteger(seasonNumber) ||
        seasonNumber < 0 ||
        seasonNumber > 999 ||
        !Number.isInteger(episodeNumber) ||
        episodeNumber < 1 ||
        episodeNumber > 9_999
      )
        return undefined;
      const runtime = Number(episode.runtime);
      return {
        providerId,
        seasonNumber,
        episodeNumber,
        metadata: {
          title: safeText(episode.name, 512),
          synopsis: safeText(episode.overview, 20_000),
          runtimeSeconds:
            Number.isInteger(runtime) && runtime > 0 && runtime <= 100_000
              ? runtime * 60
              : undefined,
          airDate:
            typeof episode.air_date === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(episode.air_date)
              ? episode.air_date
              : undefined,
          still: imageUrl(episode.still_path, "w500"),
          externalIds: { tmdb: providerId },
        },
      };
    })
    .filter(Boolean);
}

class SqliteMetadataCache {
  constructor(databasePath) {
    if (typeof databasePath !== "string" || !path.isAbsolute(databasePath))
      throw new MetadataProviderError(
        "CATALOG_INVALID",
        "O cache local de metadata não é válido.",
      );
    this.databasePath = databasePath;
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath);
    if (process.platform !== "win32") fs.chmodSync(databasePath, 0o600);
    this.database.exec("PRAGMA journal_mode = WAL");
    this.database.exec("PRAGMA busy_timeout = 5000");
    this.migrate();
  }

  migrate() {
    const current = this.database
      .prepare("SELECT MAX(version) AS version FROM schema_migrations")
      .get();
    if (Number(current?.version ?? 0) > DATABASE_SCHEMA_VERSION)
      throw new MetadataProviderError(
        "CATALOG_PROTOCOL_UNSUPPORTED",
        "O banco local pertence a uma versão mais nova do Ushark.",
      );
    this.database.exec(`
      BEGIN IMMEDIATE;
      CREATE TABLE IF NOT EXISTS metadata_provider_cache (
        cache_key TEXT PRIMARY KEY,
        payload_json TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      INSERT OR IGNORE INTO schema_migrations(version, name, applied_at)
      VALUES (3, 'm02_metadata_provider_cache', unixepoch());
      COMMIT;
    `);
  }

  read(key) {
    const row = this.database
      .prepare(
        "SELECT payload_json, expires_at FROM metadata_provider_cache WHERE cache_key = ?",
      )
      .get(key);
    if (!row) return undefined;
    try {
      return {
        value: JSON.parse(row.payload_json),
        fresh: Number(row.expires_at) > Math.floor(Date.now() / 1000),
      };
    } catch {
      return undefined;
    }
  }

  write(key, value, ttlSeconds) {
    const now = Math.floor(Date.now() / 1000);
    this.database
      .prepare(
        `INSERT INTO metadata_provider_cache(cache_key, payload_json, expires_at, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(cache_key) DO UPDATE SET payload_json = excluded.payload_json,
           expires_at = excluded.expires_at, updated_at = excluded.updated_at`,
      )
      .run(key, JSON.stringify(value), now + ttlSeconds, now);
  }

  close() {
    this.database.close();
  }
}

class TmdbMetadataProvider {
  constructor(options) {
    this.accessToken = options?.accessToken;
    this.fetchImpl = options?.fetchImpl ?? globalThis.fetch;
    this.timeoutMs = options?.timeoutMs ?? 5000;
    this.cache = options?.cache;
    this.state = this.accessToken ? "available" : "not-configured";
  }

  get providerState() {
    return this.state;
  }

  async request(endpoint, signal) {
    if (!this.accessToken)
      throw new MetadataProviderError(
        "PROVIDER_NOT_CONFIGURED",
        "Configure o token TMDB para buscar metadata. O catálogo local continua disponível.",
      );
    const controller = new AbortController();
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, this.timeoutMs);
    const abort = () => controller.abort();
    signal?.addEventListener("abort", abort, { once: true });
    try {
      const response = await this.fetchImpl(`${TMDB_BASE_URL}${endpoint}`, {
        method: "GET",
        redirect: "error",
        signal: controller.signal,
        headers: {
          accept: "application/json",
          authorization: `Bearer ${this.accessToken}`,
        },
      });
      if (!response?.ok)
        throw new MetadataProviderError(
          "PROVIDER_FAILED",
          response?.status === 401 || response?.status === 403
            ? "O token TMDB foi recusado."
            : "O provider de metadata está indisponível.",
          response?.status === 429 || response?.status >= 500,
        );
      const payload = await response.text();
      if (Buffer.byteLength(payload, "utf8") > MAX_RESPONSE_BYTES)
        throw new MetadataProviderError(
          "PROVIDER_FAILED",
          "A resposta do provider excede o limite permitido.",
        );
      try {
        return JSON.parse(payload);
      } catch (error) {
        throw new MetadataProviderError(
          "PROVIDER_FAILED",
          "O provider retornou uma resposta inválida.",
          true,
          error,
        );
      }
    } catch (error) {
      if (error instanceof MetadataProviderError) throw error;
      if (signal?.aborted)
        throw new MetadataProviderError(
          "PROVIDER_CANCELLED",
          "A busca foi cancelada.",
        );
      if (timedOut)
        throw new MetadataProviderError(
          "PROVIDER_TIMEOUT",
          "A busca demorou demais. Tente novamente.",
          true,
        );
      throw new MetadataProviderError(
        "PROVIDER_OFFLINE",
        "A busca está indisponível. O catálogo local continua acessível.",
        true,
        error,
      );
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abort);
    }
  }

  async searchWithState(title, year, signal) {
    const query = normalizeQuery(title);
    if (
      year !== undefined &&
      (!Number.isInteger(year) || year < 1870 || year > 2200)
    )
      throw new MetadataProviderError(
        "CATALOG_INVALID",
        "O ano da busca não é válido.",
      );
    const key = `tmdb:search:${query.toLocaleLowerCase("pt-BR")}:${year ?? ""}`;
    const cached = this.cache?.read(key);
    if (cached?.fresh) {
      this.state = this.accessToken ? "available" : "not-configured";
      return { state: this.state, results: structuredClone(cached.value) };
    }
    try {
      const params = new URLSearchParams({
        query,
        language: "pt-BR",
        include_adult: "false",
      });
      if (year !== undefined) params.set("year", String(year));
      const payload = await this.request(`/search/movie?${params}`, signal);
      if (!Array.isArray(payload?.results))
        throw new MetadataProviderError(
          "PROVIDER_FAILED",
          "O provider retornou uma lista inválida.",
          true,
        );
      const results = payload.results
        .slice(0, 50)
        .map(mapSearchMovie)
        .filter(Boolean);
      this.cache?.write(key, results, 24 * 60 * 60);
      this.state = "available";
      return { state: this.state, results };
    } catch (error) {
      if (cached) {
        this.state = "degraded";
        return { state: this.state, results: structuredClone(cached.value) };
      }
      this.state = this.accessToken ? "offline" : "not-configured";
      throw error;
    }
  }

  async search(title, year, signal) {
    return (await this.searchWithState(title, year, signal)).results;
  }

  async searchSeriesWithState(title, startYear, signal) {
    const query = normalizeQuery(title);
    if (
      startYear !== undefined &&
      (!Number.isInteger(startYear) || startYear < 1870 || startYear > 2200)
    )
      throw new MetadataProviderError(
        "CATALOG_INVALID",
        "O ano da busca não é válido.",
      );
    const key = `tmdb:series:search:${query.toLocaleLowerCase("pt-BR")}:${startYear ?? ""}`;
    const cached = this.cache?.read(key);
    if (cached?.fresh) {
      this.state = this.accessToken ? "available" : "not-configured";
      return { state: this.state, results: structuredClone(cached.value) };
    }
    try {
      const params = new URLSearchParams({
        query,
        language: "pt-BR",
        include_adult: "false",
      });
      if (startYear !== undefined)
        params.set("first_air_date_year", String(startYear));
      const payload = await this.request(`/search/tv?${params}`, signal);
      if (!Array.isArray(payload?.results))
        throw new MetadataProviderError(
          "PROVIDER_FAILED",
          "O provider retornou uma lista inválida.",
          true,
        );
      const results = payload.results
        .slice(0, 50)
        .map(mapSearchSeries)
        .filter(Boolean);
      this.cache?.write(key, results, 24 * 60 * 60);
      this.state = "available";
      return { state: this.state, results };
    } catch (error) {
      if (cached) {
        this.state = "degraded";
        return { state: this.state, results: structuredClone(cached.value) };
      }
      this.state = this.accessToken ? "offline" : "not-configured";
      throw error;
    }
  }

  async refreshWithState(metadata, signal) {
    const tmdbId = metadata?.externalIds?.tmdb;
    if (typeof tmdbId !== "string" || !/^\d{1,20}$/.test(tmdbId))
      throw new MetadataProviderError(
        "CATALOG_INVALID",
        "Este filme não possui um ID TMDB válido para atualização.",
      );
    const key = `tmdb:details:${tmdbId}`;
    const cached = this.cache?.read(key);
    if (cached?.fresh)
      return {
        state: this.accessToken ? "available" : "not-configured",
        metadata: mapDetailsMovie(cached.value, metadata),
      };
    try {
      const payload = await this.request(
        `/movie/${tmdbId}?language=pt-BR&append_to_response=external_ids`,
        signal,
      );
      this.cache?.write(key, payload, 7 * 24 * 60 * 60);
      this.state = "available";
      return {
        state: this.state,
        metadata: mapDetailsMovie(payload, metadata),
      };
    } catch (error) {
      if (cached) {
        this.state = "degraded";
        return {
          state: this.state,
          metadata: mapDetailsMovie(cached.value, metadata),
        };
      }
      this.state = this.accessToken ? "offline" : "not-configured";
      throw error;
    }
  }

  async refresh(metadata, signal) {
    return (await this.refreshWithState(metadata, signal)).metadata;
  }

  async refreshSeriesHierarchyWithState(metadata, seasonNumbers, signal) {
    const tmdbId = metadata?.externalIds?.tmdb;
    if (typeof tmdbId !== "string" || !/^\d{1,20}$/.test(tmdbId))
      throw new MetadataProviderError(
        "CATALOG_INVALID",
        "Esta série não possui um ID TMDB válido para atualização.",
      );
    if (
      !Array.isArray(seasonNumbers) ||
      seasonNumbers.length > 100 ||
      seasonNumbers.some(
        (season) => !Number.isInteger(season) || season < 0 || season > 999,
      )
    )
      throw new MetadataProviderError(
        "CATALOG_INVALID",
        "As temporadas para atualização não são válidas.",
      );
    const detailsKey = `tmdb:series:details:${tmdbId}`;
    const detailsCached = this.cache?.read(detailsKey);
    let details;
    let state = "available";
    try {
      if (detailsCached?.fresh) details = detailsCached.value;
      else {
        details = await this.request(
          `/tv/${tmdbId}?language=pt-BR&append_to_response=external_ids`,
          signal,
        );
        this.cache?.write(detailsKey, details, 7 * 24 * 60 * 60);
      }
    } catch (error) {
      if (!detailsCached) {
        this.state = this.accessToken ? "offline" : "not-configured";
        throw error;
      }
      details = detailsCached.value;
      state = "degraded";
    }

    const episodes = [];
    for (const seasonNumber of [...new Set(seasonNumbers)].sort(
      (a, b) => a - b,
    )) {
      const seasonKey = `tmdb:series:season:${tmdbId}:${seasonNumber}`;
      const seasonCached = this.cache?.read(seasonKey);
      let payload;
      try {
        if (seasonCached?.fresh) payload = seasonCached.value;
        else {
          payload = await this.request(
            `/tv/${tmdbId}/season/${seasonNumber}?language=pt-BR`,
            signal,
          );
          this.cache?.write(seasonKey, payload, 7 * 24 * 60 * 60);
        }
      } catch (error) {
        if (!seasonCached) {
          this.state = this.accessToken ? "offline" : "not-configured";
          throw error;
        }
        payload = seasonCached.value;
        state = "degraded";
      }
      episodes.push(...mapSeasonEpisodes(payload));
    }
    this.state = state;
    return {
      state,
      metadata: mapDetailsSeries(details, metadata),
      episodes,
    };
  }
}

module.exports = {
  DATABASE_SCHEMA_VERSION,
  MAX_RESPONSE_BYTES,
  MetadataProviderError,
  SqliteMetadataCache,
  TmdbMetadataProvider,
  mapDetailsMovie,
  mapDetailsSeries,
  mapSeasonEpisodes,
  mapSearchMovie,
  mapSearchSeries,
};
