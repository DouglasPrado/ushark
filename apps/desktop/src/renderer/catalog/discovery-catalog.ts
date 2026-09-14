import type {
  DiscoveryCatalog,
  DiscoveryContentSnapshot,
  DiscoveryDesktopApi,
  DiscoveryItem,
  DiscoveryPageCursor,
  DiscoveryQuery,
  DiscoveryResult,
  DiscoverySearchSnapshot,
  DiscoveryServiceResult,
} from "@ushark/types/discovery";

function unwrap<T>(result: DiscoveryServiceResult<T>): T {
  if (result.ok) return result.value;
  throw Object.assign(new Error(result.error.message), {
    code: result.error.code,
    retryable: result.error.retryable,
  });
}

function item(snapshot: DiscoveryContentSnapshot): DiscoveryItem {
  const addedAt = Date.parse(snapshot.addedAt);
  return {
    id: snapshot.contentId,
    title: snapshot.title,
    originalTitle: snapshot.originalTitle,
    type: snapshot.type,
    seriesTitle: snapshot.seriesTitle,
    synopsis: snapshot.synopsis,
    poster: snapshot.poster,
    backdrop: snapshot.backdrop,
    year: snapshot.year,
    endYear: snapshot.endYear,
    genres: [...snapshot.genres],
    cast: [...snapshot.cast],
    rating: snapshot.rating ? { ...snapshot.rating } : undefined,
    externalIds: snapshot.externalIds ? { ...snapshot.externalIds } : undefined,
    seasonCount: snapshot.seasonCount,
    episodeCount: snapshot.episodeCount,
    favorite: snapshot.favorite,
    recent:
      Number.isFinite(addedAt) &&
      Date.now() - addedAt <= 30 * 24 * 60 * 60 * 1_000,
    position: snapshot.progress.positionSeconds,
    duration: snapshot.progress.durationSeconds,
    memberships: snapshot.memberships.map((origin) => ({
      id: origin.id,
      name: origin.name,
    })),
    collections: snapshot.collections.map((origin) => ({
      id: origin.id,
      name: origin.name,
    })),
    sources: snapshot.sources.map((source) => ({
      id: source.id,
      quality: source.quality ?? "Qualidade não informada",
      fileAvailable:
        source.localFileAvailable ??
        (source.availability === "available" &&
          !source.id.startsWith("source:torrent:") &&
          !source.id.startsWith("torrent:")),
    })),
  };
}

function queryKey(query: DiscoveryQuery) {
  return JSON.stringify({
    text: query.text,
    type: query.type,
    favorite: query.favorite,
    recent: query.recent,
    continuing: query.continuing,
    genre: query.genre,
    collection: query.collection,
    scope: query.scope,
  });
}

export class DesktopDiscoveryCatalog implements DiscoveryCatalog {
  private readonly listeners = new Set<() => void>();
  private readonly unsubscribe: () => void;
  private activeRequestId?: string;
  private cursorKey = "";
  private cursorRevision?: number;
  private cursors = new Map<number, DiscoveryPageCursor | null>([[0, null]]);

  constructor(
    private readonly api: DiscoveryDesktopApi,
    private readonly libraryId: () => string,
  ) {
    this.unsubscribe = api.subscribe(() => {
      this.resetCursors();
      for (const listener of this.listeners) listener();
    });
  }

  private resetCursors(key = "") {
    this.cursorKey = key;
    this.cursorRevision = undefined;
    this.cursors = new Map([[0, null]]);
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  dispose() {
    this.unsubscribe();
    this.listeners.clear();
    if (this.activeRequestId)
      void this.api.cancelRequest({ requestId: this.activeRequestId });
  }

  async read() {
    const snapshot = unwrap(
      await this.api.readHome({
        libraryId: this.libraryId(),
        sectionLimit: 24,
      }),
    );
    const contents = [
      ...(snapshot.hero ? [snapshot.hero] : []),
      ...snapshot.sections.flatMap((section) => section.items),
    ];
    return [
      ...new Map(
        contents.map((content) => [content.contentId, item(content)]),
      ).values(),
    ];
  }

  private async searchPage(
    query: DiscoveryQuery,
    requestId: string,
  ): Promise<DiscoverySearchSnapshot> {
    const key = queryKey(query);
    if (key !== this.cursorKey) this.resetCursors(key);
    let startPage = query.page;
    while (startPage > 0 && !this.cursors.has(startPage)) startPage -= 1;
    let result: DiscoverySearchSnapshot | undefined;
    for (let page = startPage; page <= query.page; page += 1) {
      const cursor = this.cursors.get(page) ?? undefined;
      result = unwrap(
        await this.api.search({
          libraryId: this.libraryId(),
          query: query.text,
          type:
            query.type === "movie" ||
            query.type === "series" ||
            query.type === "episode"
              ? query.type
              : undefined,
          favorite: query.favorite || undefined,
          recent: query.recent || undefined,
          continuing: query.continuing || undefined,
          genre: query.genre || undefined,
          collectionId: query.collection || undefined,
          scopeId: query.scope || undefined,
          cursor,
          limit: 24,
          requestId,
        }),
      );
      if (
        this.cursorRevision !== undefined &&
        this.cursorRevision !== result.revision
      )
        throw Object.assign(
          new Error("O catálogo mudou durante a paginação."),
          {
            code: "DISCOVERY_CURSOR_STALE",
          },
        );
      this.cursorRevision = result.revision;
      if (result.page.nextCursor)
        this.cursors.set(page + 1, result.page.nextCursor);
    }
    if (!result) throw new Error("A busca local não devolveu uma página.");
    return result;
  }

  async search(query: DiscoveryQuery): Promise<DiscoveryResult> {
    if (this.activeRequestId)
      void this.api.cancelRequest({ requestId: this.activeRequestId });
    const requestId = crypto.randomUUID();
    this.activeRequestId = requestId;
    try {
      let snapshot: DiscoverySearchSnapshot;
      try {
        snapshot = await this.searchPage(query, requestId);
      } catch (error) {
        if ((error as { code?: string }).code !== "DISCOVERY_CURSOR_STALE")
          throw error;
        this.resetCursors(queryKey(query));
        snapshot = await this.searchPage(query, requestId);
      }
      return {
        items: snapshot.page.items.map(item),
        total: snapshot.page.total,
      };
    } finally {
      if (this.activeRequestId === requestId) this.activeRequestId = undefined;
    }
  }
}
