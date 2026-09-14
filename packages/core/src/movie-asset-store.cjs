"use strict";

const { createHash, randomUUID } = require("node:crypto");
const { Buffer } = require("node:buffer");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { clearTimeout, setTimeout } = require("node:timers");
const { URL } = require("node:url");

const { AbortController } = globalThis;

const DATABASE_SCHEMA_VERSION = 10;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_UPLOADED_IMAGE_BYTES = 12 * 1024 * 1024;
const ALLOWED_HOST = "image.tmdb.org";

class MovieAssetError extends Error {
  constructor(code, publicMessage, retryable = false, cause) {
    super(publicMessage, cause ? { cause } : undefined);
    this.name = "MovieAssetError";
    this.code = code;
    this.publicMessage = publicMessage;
    this.retryable = retryable;
  }
}

function validateRemoteImageUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch (error) {
    throw new MovieAssetError(
      "CATALOG_INVALID",
      "A URL da imagem não é válida.",
      false,
      error,
    );
  }
  if (
    url.protocol !== "https:" ||
    url.hostname !== ALLOWED_HOST ||
    url.port ||
    url.username ||
    url.password ||
    !url.pathname.startsWith("/t/p/")
  )
    throw new MovieAssetError(
      "CATALOG_UNAUTHORIZED",
      "A origem da imagem não é permitida.",
    );
  return url;
}

function identifyImage(bytes) {
  if (
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return { extension: ".png", mediaType: "image/png" };
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  )
    return { extension: ".jpg", mediaType: "image/jpeg" };
  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  )
    return { extension: ".webp", mediaType: "image/webp" };
  if (
    bytes.length >= 6 &&
    ["GIF87a", "GIF89a"].includes(bytes.subarray(0, 6).toString("ascii"))
  )
    return { extension: ".gif", mediaType: "image/gif" };
  throw new MovieAssetError(
    "PROVIDER_FAILED",
    "A imagem recebida possui um formato não permitido.",
  );
}

class MovieAssetStore {
  constructor(databasePath, cacheRoot, options = {}) {
    if (
      typeof databasePath !== "string" ||
      !path.isAbsolute(databasePath) ||
      typeof cacheRoot !== "string" ||
      !path.isAbsolute(cacheRoot)
    )
      throw new MovieAssetError(
        "CATALOG_INVALID",
        "O cache de imagens não é válido.",
      );
    this.databasePath = databasePath;
    this.cacheRoot = path.resolve(cacheRoot);
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch;
    this.timeoutMs = options.timeoutMs ?? 8000;
    fs.mkdirSync(this.cacheRoot, { recursive: true, mode: 0o700 });
    this.database = new DatabaseSync(databasePath);
    this.database.exec("PRAGMA journal_mode = WAL");
    this.database.exec("PRAGMA busy_timeout = 5000");
    this.migrate();
  }

  migrate() {
    const current = this.database
      .prepare("SELECT MAX(version) AS version FROM schema_migrations")
      .get();
    if (Number(current?.version ?? 0) > DATABASE_SCHEMA_VERSION)
      throw new MovieAssetError(
        "CATALOG_PROTOCOL_UNSUPPORTED",
        "O banco local pertence a uma versão mais nova do Ushark.",
      );
    this.database.exec(`
      BEGIN IMMEDIATE;
      CREATE TABLE IF NOT EXISTS movie_asset_cache (
        remote_url TEXT PRIMARY KEY,
        asset_id TEXT NOT NULL UNIQUE,
        media_type TEXT NOT NULL,
        byte_length INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      INSERT OR IGNORE INTO schema_migrations(version, name, applied_at)
      VALUES (4, 'm02_movie_asset_cache', unixepoch());
      COMMIT;
    `);
  }

  descriptor(row) {
    return {
      assetId: row.asset_id,
      uri: `ushark-asset://${row.asset_id}`,
      mediaType: row.media_type,
      byteLength: Number(row.byte_length),
    };
  }

  cached(url) {
    const row = this.database
      .prepare(
        "SELECT asset_id, media_type, byte_length FROM movie_asset_cache WHERE remote_url = ?",
      )
      .get(url.href);
    if (!row) return undefined;
    const matches = fs
      .readdirSync(this.cacheRoot)
      .find((name) => name.startsWith(`${row.asset_id}.`));
    if (!matches) return undefined;
    return this.descriptor(row);
  }

  cachedByAssetId(assetId) {
    const row = this.database
      .prepare(
        "SELECT asset_id, media_type, byte_length FROM movie_asset_cache WHERE asset_id = ?",
      )
      .get(assetId);
    return row ? this.descriptor(row) : undefined;
  }

  cacheUploadedImage(value, fileName, claimedMediaType) {
    if (
      typeof value !== "string" ||
      typeof fileName !== "string" ||
      !fileName ||
      fileName.includes("\0") ||
      Buffer.byteLength(fileName, "utf8") > 255 ||
      typeof claimedMediaType !== "string"
    )
      throw new MovieAssetError(
        "CATALOG_INVALID",
        "A imagem do episódio não é válida.",
      );
    const matched = value.match(
      /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/]+={0,2})$/,
    );
    if (!matched || matched[1] !== claimedMediaType)
      throw new MovieAssetError(
        "CATALOG_INVALID",
        "O formato declarado da imagem não corresponde ao arquivo.",
      );
    if (matched[2].length > Math.ceil(MAX_UPLOADED_IMAGE_BYTES / 3) * 4 + 4)
      throw new MovieAssetError(
        "CATALOG_INVALID",
        "A imagem precisa ter até 12 MB.",
      );
    const bytes = Buffer.from(matched[2], "base64");
    if (!bytes.length || bytes.length > MAX_UPLOADED_IMAGE_BYTES)
      throw new MovieAssetError(
        "CATALOG_INVALID",
        "A imagem precisa ter até 12 MB e não pode estar vazia.",
      );
    const identified = identifyImage(bytes);
    if (
      identified.mediaType !== claimedMediaType ||
      (identified.extension === ".jpg"
        ? !/\.jpe?g$/i.test(fileName)
        : !fileName.toLowerCase().endsWith(identified.extension))
    )
      throw new MovieAssetError(
        "CATALOG_INVALID",
        "A extensão, o tipo e o conteúdo da imagem precisam corresponder.",
      );
    const assetId = createHash("sha256").update(bytes).digest("hex");
    const existing = this.cachedByAssetId(assetId);
    const target = path.join(
      this.cacheRoot,
      `${assetId}${identified.extension}`,
    );
    if (!fs.existsSync(target)) {
      const temporary = path.join(this.cacheRoot, `.partial-${randomUUID()}`);
      try {
        fs.writeFileSync(temporary, bytes, { flag: "wx", mode: 0o600 });
        fs.renameSync(temporary, target);
      } finally {
        if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
      }
    }
    if (!existing)
      this.database
        .prepare(
          `INSERT INTO movie_asset_cache(
             remote_url, asset_id, media_type, byte_length, updated_at
           ) VALUES (?, ?, ?, ?, unixepoch())`,
        )
        .run(`upload:${assetId}`, assetId, identified.mediaType, bytes.length);
    return {
      assetId,
      uri: `ushark-asset://${assetId}`,
      mediaType: identified.mediaType,
      byteLength: bytes.length,
      fileName,
    };
  }

  async cacheRemoteImage(value, signal) {
    const url = validateRemoteImageUrl(value);
    const existing = this.cached(url);
    if (existing) return existing;
    const controller = new AbortController();
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, this.timeoutMs);
    const abort = () => controller.abort();
    signal?.addEventListener("abort", abort, { once: true });
    try {
      const response = await this.fetchImpl(url, {
        method: "GET",
        redirect: "error",
        signal: controller.signal,
        headers: { accept: "image/avif,image/webp,image/png,image/jpeg" },
      });
      if (!response?.ok)
        throw new MovieAssetError(
          "PROVIDER_FAILED",
          "Não foi possível baixar a imagem.",
          response?.status === 429 || response?.status >= 500,
        );
      const declaredLength = Number(response.headers?.get("content-length"));
      if (Number.isFinite(declaredLength) && declaredLength > MAX_IMAGE_BYTES)
        throw new MovieAssetError(
          "PROVIDER_FAILED",
          "A imagem excede o limite de 20 MB.",
        );
      const bytes = Buffer.from(await response.arrayBuffer());
      if (!bytes.length || bytes.length > MAX_IMAGE_BYTES)
        throw new MovieAssetError(
          "PROVIDER_FAILED",
          "A imagem excede o limite permitido.",
        );
      const identified = identifyImage(bytes);
      const assetId = createHash("sha256").update(bytes).digest("hex");
      const target = path.join(
        this.cacheRoot,
        `${assetId}${identified.extension}`,
      );
      if (!fs.existsSync(target)) {
        const temporary = path.join(this.cacheRoot, `.partial-${randomUUID()}`);
        try {
          fs.writeFileSync(temporary, bytes, { flag: "wx", mode: 0o600 });
          fs.renameSync(temporary, target);
        } finally {
          if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
        }
      }
      this.database
        .prepare(
          `INSERT INTO movie_asset_cache(
             remote_url, asset_id, media_type, byte_length, updated_at
           ) VALUES (?, ?, ?, ?, unixepoch())
           ON CONFLICT(remote_url) DO UPDATE SET asset_id = excluded.asset_id,
             media_type = excluded.media_type, byte_length = excluded.byte_length,
             updated_at = excluded.updated_at`,
        )
        .run(url.href, assetId, identified.mediaType, bytes.length);
      return {
        assetId,
        uri: `ushark-asset://${assetId}`,
        mediaType: identified.mediaType,
        byteLength: bytes.length,
      };
    } catch (error) {
      if (error instanceof MovieAssetError) throw error;
      if (signal?.aborted)
        throw new MovieAssetError(
          "PROVIDER_CANCELLED",
          "O download foi cancelado.",
        );
      if (timedOut)
        throw new MovieAssetError(
          "PROVIDER_TIMEOUT",
          "O download da imagem demorou demais.",
          true,
        );
      throw new MovieAssetError(
        "PROVIDER_OFFLINE",
        "A imagem está indisponível. O catálogo continua acessível.",
        true,
        error,
      );
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abort);
    }
  }

  resolveUri(value) {
    let url;
    try {
      url = new URL(value);
    } catch {
      return undefined;
    }
    if (
      url.protocol !== "ushark-asset:" ||
      (url.pathname !== "" && url.pathname !== "/") ||
      url.search ||
      url.hash
    )
      return undefined;
    const assetId = url.hostname;
    if (!/^[a-f0-9]{64}$/.test(assetId)) return undefined;
    const row = this.database
      .prepare(
        "SELECT asset_id, media_type, byte_length FROM movie_asset_cache WHERE asset_id = ?",
      )
      .get(assetId);
    if (!row) return undefined;
    const filename = fs
      .readdirSync(this.cacheRoot)
      .find((name) => name.startsWith(`${assetId}.`));
    if (!filename) return undefined;
    return {
      ...this.descriptor(row),
      path: path.join(this.cacheRoot, filename),
    };
  }

  close() {
    this.database.close();
  }
}

module.exports = {
  ALLOWED_HOST,
  DATABASE_SCHEMA_VERSION,
  MAX_IMAGE_BYTES,
  MAX_UPLOADED_IMAGE_BYTES,
  MovieAssetError,
  MovieAssetStore,
  identifyImage,
  validateRemoteImageUrl,
};
