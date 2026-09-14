import type {
  MetadataProvider,
  Movie,
  MovieCatalog,
  MovieCatalogCommandResult,
  MovieCatalogDesktopApi,
  MovieCatalogResult,
  MovieCatalogSnapshot,
  MovieDraft,
  MovieMetadata,
  MovieSource,
} from "@ushark/types/movies";

function unwrap<T>(result: MovieCatalogResult<T>): T {
  if (result.ok) return result.value;
  throw new Error(result.error.message);
}

export class DesktopMovieCatalog implements MovieCatalog {
  private movies = new Map<string, Movie>();
  private libraryId?: string;
  private revision?: number;

  constructor(private readonly api: MovieCatalogDesktopApi) {}

  private apply(snapshot: MovieCatalogSnapshot) {
    this.libraryId = snapshot.libraryId;
    this.revision = snapshot.revision;
    this.movies = new Map(
      snapshot.movies.map((movie) => [movie.id, structuredClone(movie)]),
    );
  }

  private mutation() {
    return {
      idempotencyKey: crypto.randomUUID(),
      expectedRevision: this.revision,
    };
  }

  private activeLibraryId() {
    if (!this.libraryId)
      throw new Error("Abra a biblioteca antes de alterar o catálogo.");
    return this.libraryId;
  }

  private command(value: MovieCatalogCommandResult) {
    this.apply(value.snapshot);
    return value.movie;
  }

  async list(libraryId: string) {
    const snapshot = unwrap(await this.api.read({ libraryId }));
    this.apply(snapshot);
    return structuredClone(snapshot.movies);
  }

  find(id: string) {
    const movie = this.movies.get(id);
    return movie ? structuredClone(movie) : undefined;
  }

  async save(draft: MovieDraft, libraryId: string) {
    this.libraryId = libraryId;
    const result = this.command(
      unwrap(
        await this.api.save({
          libraryId,
          draft,
          mutation: this.mutation(),
        }),
      ),
    );
    if (!result) throw new Error("O filme salvo não foi encontrado.");
    return structuredClone(result);
  }

  async favorite(id: string) {
    this.command(
      unwrap(
        await this.api.toggleFavorite({
          libraryId: this.activeLibraryId(),
          contentId: id,
          mutation: this.mutation(),
        }),
      ),
    );
  }

  async refresh(id: string) {
    this.command(
      unwrap(
        await this.api.refreshMetadata({
          libraryId: this.activeLibraryId(),
          contentId: id,
          mutation: this.mutation(),
        }),
      ),
    );
  }

  async addSource(id: string, source: MovieSource) {
    this.command(
      unwrap(
        await this.api.addSource({
          libraryId: this.activeLibraryId(),
          contentId: id,
          source,
          mutation: this.mutation(),
        }),
      ),
    );
  }

  async removeSource(id: string, sourceId: string) {
    this.command(
      unwrap(
        await this.api.removeSource({
          libraryId: this.activeLibraryId(),
          contentId: id,
          sourceId,
          mutation: this.mutation(),
        }),
      ),
    );
  }

  async removeMembership(id: string, libraryId: string) {
    this.command(
      unwrap(
        await this.api.removeMembership({
          libraryId: this.activeLibraryId(),
          contentId: id,
          membershipLibraryId: libraryId,
          mutation: this.mutation(),
        }),
      ),
    );
  }

  async deleteFile(id: string, sourceId: string) {
    this.command(
      unwrap(
        await this.api.deleteManagedFile({
          libraryId: this.activeLibraryId(),
          contentId: id,
          sourceId,
          confirm: true,
          mutation: this.mutation(),
        }),
      ),
    );
  }
}

export class DesktopMetadataProvider implements MetadataProvider {
  constructor(
    private readonly api: MovieCatalogDesktopApi,
    private readonly libraryId: () => string,
  ) {}

  async search(title: string, year?: number, signal?: AbortSignal) {
    const requestId = crypto.randomUUID();
    const abort = () => {
      void this.api.cancelMetadataRequest({ requestId });
    };
    signal?.addEventListener("abort", abort, { once: true });
    try {
      if (signal?.aborted)
        throw new DOMException("Busca cancelada", "AbortError");
      const result = unwrap(
        await this.api.searchMetadata({
          libraryId: this.libraryId(),
          query: title,
          year,
          requestId,
        }),
      );
      if (signal?.aborted)
        throw new DOMException("Busca cancelada", "AbortError");
      return result.results;
    } finally {
      signal?.removeEventListener("abort", abort);
    }
  }

  async refresh(metadata: MovieMetadata): Promise<MovieMetadata> {
    void metadata;
    throw new Error("Atualize a metadata pelo catálogo do filme.");
  }
}
