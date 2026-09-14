"use strict";

const { createHash } = require("node:crypto");
const { AbortController } = globalThis;

class SeriesCatalogServiceError extends Error {
  constructor(code, publicMessage, retryable = false, cause) {
    super(publicMessage, cause ? { cause } : undefined);
    this.name = "SeriesCatalogServiceError";
    this.code = code;
    this.publicMessage = publicMessage;
    this.retryable = retryable;
  }
}

function success(value) {
  return { ok: true, value };
}

function mappedCode(code) {
  const codes = {
    CATALOG_INVALID: "SERIES_INVALID",
    PROVIDER_CANCELLED: "SERIES_PROVIDER_CANCELLED",
    PROVIDER_FAILED: "SERIES_PROVIDER_FAILED",
    PROVIDER_NOT_CONFIGURED: "SERIES_PROVIDER_NOT_CONFIGURED",
    PROVIDER_OFFLINE: "SERIES_PROVIDER_OFFLINE",
    PROVIDER_TIMEOUT: "SERIES_PROVIDER_TIMEOUT",
  };
  return codes[code] ?? code;
}

function failure(error) {
  const known =
    error &&
    typeof error.code === "string" &&
    (typeof error.publicMessage === "string" ||
      typeof error.message === "string");
  return {
    ok: false,
    error: {
      code: known ? mappedCode(error.code) : "SERIES_STORAGE_FAILED",
      message: known
        ? (error.publicMessage ?? error.message)
        : "Não foi possível acessar as séries locais.",
      recoverable: known ? error.retryable === true : true,
      retryable: known ? error.retryable === true : true,
    },
  };
}

function isObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function derivedKey(prefix, value) {
  return `${prefix}:${createHash("sha256").update(value).digest("hex").slice(0, 40)}`;
}

class SeriesCatalogApplicationService {
  constructor({ store, provider, assets, torrent }) {
    if (!store || !provider || !assets)
      throw new Error("series catalog dependencies are required");
    this.store = store;
    this.provider = provider;
    this.assets = assets;
    this.torrent = torrent;
    this.requests = new Map();
  }

  readCatalog(input) {
    const result = this.store.readCatalog(input);
    if (result.ok) result.value.providerState = this.provider.providerState;
    return Promise.resolve(result);
  }

  readSeries(input) {
    return Promise.resolve(this.store.readSeries(input));
  }

  readEpisodes(input) {
    return Promise.resolve(this.store.readEpisodes(input));
  }

  requireTorrent() {
    if (!this.torrent)
      throw new SeriesCatalogServiceError(
        "SERIES_IMPORT_INCOMPLETE",
        "A inspeção torrent não está disponível para esta operação.",
        true,
      );
    return this.torrent;
  }

  async torrentSnapshot(operationId) {
    const torrent = this.requireTorrent();
    const result = await torrent.get({ operationId });
    if (!result.ok)
      throw new SeriesCatalogServiceError(
        result.error.code === "TORRENT_NOT_FOUND"
          ? "SERIES_SOURCE_CHANGED"
          : "SERIES_IMPORT_INCOMPLETE",
        result.error.message,
        result.error.retryable,
      );
    if (result.value.state !== "files-ready" || !result.value.runtime)
      throw new SeriesCatalogServiceError(
        "SERIES_IMPORT_INCOMPLETE",
        "Resolva a metadata torrent antes de revisar a série.",
        true,
      );
    const files = [...result.value.files];
    let cursor = files.length;
    while (
      !result.value.filesComplete &&
      cursor < result.value.totalFileCount
    ) {
      const page = await torrent.getFiles({ operationId, cursor, limit: 128 });
      if (!page.ok)
        throw new SeriesCatalogServiceError(
          "SERIES_IMPORT_INCOMPLETE",
          page.error.message,
          page.error.retryable,
        );
      files.push(...page.value.files);
      if (page.value.nextCursor === undefined) break;
      cursor = page.value.nextCursor;
    }
    return { snapshot: result.value, files };
  }

  async beginReview(input) {
    try {
      if (!isObject(input) || !Array.isArray(input.fileIds))
        throw new SeriesCatalogServiceError(
          "SERIES_INVALID",
          "A revisão da série não é válida.",
        );
      const inspected = await this.torrentSnapshot(input.operationId);
      const selected = new Set(input.fileIds);
      if (!selected.size)
        throw new SeriesCatalogServiceError(
          "SERIES_IMPORT_INCOMPLETE",
          "Escolha pelo menos um episódio para revisar.",
        );
      const selectedFiles = inspected.files.filter(
        (file) =>
          selected.has(file.id) ||
          ["srt", "ass", "ssa", "vtt"].includes(
            file.extension.toLowerCase().replace(/^\./, ""),
          ),
      );
      if (
        selectedFiles.filter((file) => selected.has(file.id)).length !==
        selected.size
      )
        throw new SeriesCatalogServiceError(
          "SERIES_SOURCE_CHANGED",
          "Um arquivo escolhido não está mais disponível nesta source.",
          true,
        );
      return this.store.createReview({
        libraryId: input.libraryId,
        operationId: input.operationId,
        title: input.title ?? inspected.snapshot.displayName,
        seriesId: input.seriesId,
        files: selectedFiles,
        mutation: input.mutation,
      });
    } catch (error) {
      return failure(error);
    }
  }

  readReview(input) {
    return Promise.resolve(this.store.readReview(input));
  }

  readSourceReview(input) {
    return Promise.resolve(this.store.readSourceReview(input));
  }

  correctMapping(input) {
    return Promise.resolve(this.store.correctMapping(input));
  }

  allReviewFiles(reviewId) {
    const files = [];
    let cursor;
    let head;
    do {
      const page = this.store.readReview({ reviewId, cursor, limit: 128 });
      if (!page.ok) return page;
      head = page.value;
      files.push(...page.value.files.items);
      cursor = page.value.files.nextCursor;
    } while (cursor);
    return success({ ...head, files: { items: files, total: files.length } });
  }

  async confirmImport(input) {
    try {
      if (!isObject(input))
        throw new SeriesCatalogServiceError(
          "SERIES_INVALID",
          "A confirmação da série não é válida.",
        );
      const loaded = this.allReviewFiles(input.reviewId);
      if (!loaded.ok) return loaded;
      const review = loaded.value;
      if (review.state === "confirmed" && review.seriesId) {
        const snapshot = this.store.readCatalog({
          libraryId: review.libraryId,
        });
        const series = this.store.readSeries({
          libraryId: review.libraryId,
          seriesId: review.seriesId,
        });
        if (!snapshot.ok) return snapshot;
        if (!series.ok) return series;
        snapshot.value.providerState = this.provider.providerState;
        return success({
          snapshot: snapshot.value,
          series: series.value,
          review,
        });
      }
      if (review.state !== "ready")
        throw new SeriesCatalogServiceError(
          "SERIES_IMPORT_INCOMPLETE",
          "Resolva as pendências antes de confirmar a série.",
        );
      if (input.title !== undefined) {
        const titled = this.store.updateReviewTitle(
          review.reviewId,
          input.title,
        );
        if (!titled.ok) return titled;
        review.title = titled.value.title;
      }
      const seriesId =
        review.seriesId ?? `series:local:${review.reviewId.slice(7)}`;
      const currentSeries = review.seriesId
        ? this.store.readSeries({
            libraryId: review.libraryId,
            seriesId: review.seriesId,
          })
        : undefined;
      if (currentSeries && !currentSeries.ok) return currentSeries;
      const existing = review.seriesId
        ? this.allEpisodes(review.libraryId, review.seriesId)
        : success([]);
      if (!existing.ok) return existing;
      const byCoordinate = new Map(
        existing.value.map((episode) => [
          `${episode.seasonNumber}:${episode.episodeNumber}`,
          episode,
        ]),
      );
      const mapped = review.files.items.filter((file) =>
        ["identified", "manual"].includes(file.mappingState),
      );
      const hierarchyEpisodes = mapped.map((file) => {
        const key = `${file.seasonNumber}:${file.episodeNumber}`;
        return {
          id:
            byCoordinate.get(key)?.id ??
            `${seriesId}:${file.seasonNumber}:${file.episodeNumber}`,
          seasonNumber: file.seasonNumber,
          episodeNumber: file.episodeNumber,
          metadata: byCoordinate.get(key)?.metadata ?? {},
        };
      });
      const hierarchy = this.store.upsertHierarchy({
        libraryId: review.libraryId,
        series: {
          id: seriesId,
          metadata: currentSeries?.value.metadata ?? {
            title: input.title ?? review.title,
            genres: [],
            cast: [],
          },
        },
        episodes: hierarchyEpisodes,
        mutation: {
          idempotencyKey: derivedKey(
            "series-hierarchy",
            input.mutation.idempotencyKey,
          ),
        },
      });
      if (!hierarchy.ok) return hierarchy;
      const attached = this.store.attachReviewSeries(review.reviewId, seriesId);
      if (!attached.ok) return attached;

      await this.torrentSnapshot(review.operationId);
      const first = mapped[0];
      const firstEpisode = hierarchyEpisodes[0];
      if (!firstEpisode)
        throw new SeriesCatalogServiceError(
          "SERIES_IMPORT_INCOMPLETE",
          "O primeiro episódio não pôde ser preparado para a source.",
          true,
        );
      const source = await this.requireTorrent().confirm({
        operationId: review.operationId,
        contentId: firstEpisode.id,
        selector: {
          type: first.selectorType,
          ...(first.selectorType === "episode"
            ? {
                season: first.seasonNumber,
                episode: first.episodeNumber,
                fileId: first.fileId,
              }
            : { fileId: first.fileId }),
        },
        mutation: {
          idempotencyKey: derivedKey(
            "series-source",
            input.mutation.idempotencyKey,
          ),
        },
      });
      if (!source.ok)
        throw new SeriesCatalogServiceError(
          "SERIES_IMPORT_INCOMPLETE",
          source.error.message,
          source.error.retryable,
        );
      const persisted = this.store.persistEpisodeMappings({
        reviewId: review.reviewId,
        sourceId: source.value.sourceId,
        mutation: {
          idempotencyKey: derivedKey(
            "series-selectors",
            input.mutation.idempotencyKey,
          ),
        },
      });
      if (!persisted.ok) return persisted;
      const snapshot = this.store.readCatalog({ libraryId: review.libraryId });
      const series = this.store.readSeries({
        libraryId: review.libraryId,
        seriesId,
      });
      if (!snapshot.ok) return snapshot;
      if (!series.ok) return series;
      snapshot.value.providerState = this.provider.providerState;
      return success({
        snapshot: snapshot.value,
        series: series.value,
        review: persisted.value.review,
      });
    } catch (error) {
      return failure(error);
    }
  }

  async setEpisodeArtwork(input) {
    try {
      if (!isObject(input))
        throw new SeriesCatalogServiceError(
          "SERIES_INVALID",
          "A atualização da imagem não é válida.",
        );
      if (input.artwork === null)
        return this.store.setEpisodeArtwork({ ...input, artwork: null });
      if (!isObject(input.artwork))
        throw new SeriesCatalogServiceError(
          "SERIES_INVALID",
          "A imagem do episódio não é válida.",
        );
      const cached = this.assets.cacheUploadedImage(
        input.artwork.src,
        input.artwork.fileName,
        input.artwork.mimeType,
      );
      return this.store.setEpisodeArtwork({
        ...input,
        artwork: {
          src: cached.uri,
          fileName: cached.fileName,
          mimeType: cached.mediaType,
        },
      });
    } catch (error) {
      return failure(error);
    }
  }

  async localizeAsset(value, signal) {
    if (value === undefined) return undefined;
    if (
      typeof value !== "string" ||
      value.length > 4_096 ||
      value.includes("\0")
    )
      throw new SeriesCatalogServiceError(
        "SERIES_INVALID",
        "A referência da imagem não é válida.",
      );
    if (
      value.startsWith("./series-art/") ||
      value.startsWith("ushark-asset://")
    )
      return value;
    try {
      return (await this.assets.cacheRemoteImage(value, signal)).uri;
    } catch (error) {
      if (error?.code === "CATALOG_UNAUTHORIZED") throw error;
      return undefined;
    }
  }

  async localizeSeriesMetadata(metadata, signal) {
    if (!isObject(metadata))
      throw new SeriesCatalogServiceError(
        "SERIES_INVALID",
        "A metadata da série não é válida.",
      );
    const [poster, backdrop] = await Promise.all([
      this.localizeAsset(metadata.poster, signal),
      this.localizeAsset(metadata.backdrop, signal),
    ]);
    return { ...structuredClone(metadata), poster, backdrop };
  }

  async localizeEpisodeMetadata(metadata, signal) {
    if (!isObject(metadata))
      throw new SeriesCatalogServiceError(
        "SERIES_INVALID",
        "A metadata do episódio não é válida.",
      );
    return {
      ...structuredClone(metadata),
      still: await this.localizeAsset(metadata.still, signal),
    };
  }

  controller(requestId) {
    if (
      typeof requestId !== "string" ||
      requestId.length < 8 ||
      requestId.length > 160
    )
      throw new SeriesCatalogServiceError(
        "SERIES_INVALID",
        "A identidade da requisição não é válida.",
      );
    this.requests.get(requestId)?.abort();
    const controller = new AbortController();
    this.requests.set(requestId, controller);
    return controller;
  }

  release(requestId, controller) {
    if (this.requests.get(requestId) === controller)
      this.requests.delete(requestId);
  }

  async searchMetadata(input) {
    try {
      if (!isObject(input))
        throw new SeriesCatalogServiceError(
          "SERIES_INVALID",
          "A busca de séries não é válida.",
        );
      const controller = this.controller(input.requestId);
      try {
        const response = await this.provider.searchSeriesWithState(
          input.query,
          input.startYear,
          controller.signal,
        );
        const results = [];
        for (const metadata of response.results.slice(0, 50))
          results.push(
            await this.localizeSeriesMetadata(metadata, controller.signal),
          );
        return success({
          requestId: input.requestId,
          providerState: response.state,
          results,
        });
      } finally {
        this.release(input.requestId, controller);
      }
    } catch (error) {
      return failure(error);
    }
  }

  async cancelMetadataRequest(input) {
    try {
      if (!isObject(input) || typeof input.requestId !== "string")
        throw new SeriesCatalogServiceError(
          "SERIES_INVALID",
          "A requisição para cancelar não é válida.",
        );
      const controller = this.requests.get(input.requestId);
      controller?.abort();
      this.requests.delete(input.requestId);
      return success({ requestId: input.requestId, cancelled: !!controller });
    } catch (error) {
      return failure(error);
    }
  }

  allEpisodes(libraryId, seriesId) {
    const episodes = [];
    let cursor;
    do {
      const page = this.store.readEpisodes({
        libraryId,
        seriesId,
        cursor,
        limit: 128,
      });
      if (!page.ok) return page;
      episodes.push(...page.value.items);
      cursor = page.value.nextCursor;
    } while (cursor);
    return success(episodes);
  }

  async refreshMetadata(input) {
    try {
      if (!isObject(input))
        throw new SeriesCatalogServiceError(
          "SERIES_INVALID",
          "A atualização da série não é válida.",
        );
      const current = this.store.readSeries({
        libraryId: input.libraryId,
        seriesId: input.seriesId,
      });
      if (!current.ok) return current;
      const existing = this.allEpisodes(input.libraryId, input.seriesId);
      if (!existing.ok) return existing;
      const controller = this.controller(input.requestId);
      try {
        const refreshed = await this.provider.refreshSeriesHierarchyWithState(
          current.value.metadata,
          current.value.seasons.map((season) => season.seasonNumber),
          controller.signal,
        );
        const metadata = await this.localizeSeriesMetadata(
          refreshed.metadata,
          controller.signal,
        );
        const existingByCoordinate = new Map(
          existing.value.map((episode) => [
            `${episode.seasonNumber}:${episode.episodeNumber}`,
            episode,
          ]),
        );
        const episodes = [];
        for (const episode of refreshed.episodes) {
          const previous = existingByCoordinate.get(
            `${episode.seasonNumber}:${episode.episodeNumber}`,
          );
          episodes.push({
            id: previous?.id ?? `episode:tmdb:${episode.providerId}`,
            seasonNumber: episode.seasonNumber,
            episodeNumber: episode.episodeNumber,
            metadata: {
              ...previous?.metadata,
              ...(await this.localizeEpisodeMetadata(
                episode.metadata,
                controller.signal,
              )),
            },
          });
        }
        const result = this.store.upsertHierarchy({
          libraryId: input.libraryId,
          series: { id: input.seriesId, metadata },
          episodes,
          mutation: input.mutation,
        });
        if (!result.ok) return result;
        return success(result.value.series);
      } finally {
        this.release(input.requestId, controller);
      }
    } catch (error) {
      return failure(error);
    }
  }

  close() {
    for (const controller of this.requests.values()) controller.abort();
    this.requests.clear();
  }
}

module.exports = {
  SeriesCatalogApplicationService,
  SeriesCatalogServiceError,
};
