"use strict";

const { AbortController } = globalThis;

class MovieCatalogServiceError extends Error {
  constructor(code, publicMessage, retryable = false, cause) {
    super(publicMessage, cause ? { cause } : undefined);
    this.name = "MovieCatalogServiceError";
    this.code = code;
    this.publicMessage = publicMessage;
    this.retryable = retryable;
  }
}

function success(value) {
  return { ok: true, value };
}

function failure(error) {
  const known =
    error &&
    typeof error.code === "string" &&
    typeof error.publicMessage === "string";
  return {
    ok: false,
    error: {
      code: known ? error.code : "CATALOG_STORAGE_FAILED",
      message: known
        ? error.publicMessage
        : "Não foi possível acessar o catálogo local.",
      retryable: known ? error.retryable === true : true,
    },
  };
}

function isObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

class MovieCatalogApplicationService {
  constructor({ store, provider, assets }) {
    this.store = store;
    this.provider = provider;
    this.assets = assets;
    this.searches = new Map();
  }

  read(input) {
    const result = this.store.read(input);
    if (result.ok) result.value.providerState = this.provider.providerState;
    return Promise.resolve(result);
  }

  async localizeAsset(value, signal) {
    if (value === undefined) return undefined;
    if (
      typeof value !== "string" ||
      value.length > 4096 ||
      value.includes("\0")
    )
      throw new MovieCatalogServiceError(
        "CATALOG_INVALID",
        "A referência da imagem não é válida.",
      );
    if (value.startsWith("./movie-art/") || value.startsWith("ushark-asset://"))
      return value;
    try {
      return (await this.assets.cacheRemoteImage(value, signal)).uri;
    } catch (error) {
      if (error?.code === "CATALOG_UNAUTHORIZED") throw error;
      return undefined;
    }
  }

  async localizeMetadata(metadata, signal) {
    if (!isObject(metadata))
      throw new MovieCatalogServiceError(
        "CATALOG_INVALID",
        "Os dados do filme não são válidos.",
      );
    const [poster, backdrop] = await Promise.all([
      this.localizeAsset(metadata.poster, signal),
      this.localizeAsset(metadata.backdrop, signal),
    ]);
    return { ...structuredClone(metadata), poster, backdrop };
  }

  async searchMetadata(input) {
    try {
      if (
        !isObject(input) ||
        typeof input.requestId !== "string" ||
        input.requestId.length < 8 ||
        input.requestId.length > 160
      )
        throw new MovieCatalogServiceError(
          "CATALOG_INVALID",
          "A identidade da busca não é válida.",
        );
      const controller = new AbortController();
      this.searches.get(input.requestId)?.abort();
      this.searches.set(input.requestId, controller);
      try {
        const response = await this.provider.searchWithState(
          input.query,
          input.year,
          controller.signal,
        );
        const results = [];
        for (const metadata of response.results.slice(0, 50))
          results.push(
            await this.localizeMetadata(metadata, controller.signal),
          );
        return success({
          requestId: input.requestId,
          providerState: response.state,
          results,
        });
      } finally {
        if (this.searches.get(input.requestId) === controller)
          this.searches.delete(input.requestId);
      }
    } catch (error) {
      return failure(error);
    }
  }

  async cancelMetadataRequest(input) {
    try {
      if (
        !isObject(input) ||
        typeof input.requestId !== "string" ||
        input.requestId.length < 8 ||
        input.requestId.length > 160
      )
        throw new MovieCatalogServiceError(
          "CATALOG_INVALID",
          "A identidade da busca não é válida.",
        );
      const controller = this.searches.get(input.requestId);
      controller?.abort();
      this.searches.delete(input.requestId);
      return success({ requestId: input.requestId, cancelled: !!controller });
    } catch (error) {
      return failure(error);
    }
  }

  async save(input) {
    try {
      const localized = {
        ...input,
        draft: {
          ...input.draft,
          metadata: await this.localizeMetadata(input.draft.metadata),
        },
      };
      return this.store.save(localized);
    } catch (error) {
      return failure(error);
    }
  }

  toggleFavorite(input) {
    return Promise.resolve(this.store.toggleFavorite(input));
  }

  async refreshMetadata(input) {
    try {
      const read = this.store.read({ libraryId: input.libraryId });
      if (!read.ok) return read;
      const movie = read.value.movies.find(
        (candidate) => candidate.id === input.contentId,
      );
      if (!movie)
        throw new MovieCatalogServiceError(
          "CATALOG_NOT_FOUND",
          "O filme não foi encontrado.",
        );
      const refreshed = await this.provider.refreshWithState(movie.metadata);
      const metadata = await this.localizeMetadata(refreshed.metadata);
      return this.store.save({
        libraryId: input.libraryId,
        draft: { metadata, editingId: movie.id },
        mutation: input.mutation,
      });
    } catch (error) {
      return failure(error);
    }
  }

  addSource(input) {
    return Promise.resolve(this.store.addSource(input));
  }

  removeSource(input) {
    return Promise.resolve(this.store.removeSource(input));
  }

  removeMembership(input) {
    return Promise.resolve(this.store.removeMembership(input));
  }

  deleteManagedFile(input) {
    return Promise.resolve(this.store.deleteManagedFile(input));
  }

  close() {
    for (const controller of this.searches.values()) controller.abort();
    this.searches.clear();
  }
}

module.exports = { MovieCatalogApplicationService, MovieCatalogServiceError };
