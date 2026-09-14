import type {
  Episode,
  EpisodeArtwork,
  EpisodeRecordSnapshot,
  EpisodeReviewFile,
  SeriesCatalog,
  SeriesCatalogDesktopApi,
  SeriesCatalogPage,
  SeriesCatalogResult,
  SeriesDraft,
  SeriesImportReviewSnapshot,
  SeriesRecord,
  SeriesRecordSnapshot,
} from "@ushark/types/series";
import type { Inspection } from "@ushark/types/torrent";

function unwrap<T>(result: SeriesCatalogResult<T>): T {
  if (result.ok) return result.value;
  throw Object.assign(new Error(result.error.message), result.error);
}

const resolutionFrom = (filename = "") =>
  filename.match(/(?:^|[. _-])(2160p|1080p|720p)(?:[. _-]|$)/i)?.[1];

function reviewFile(file: EpisodeReviewFile) {
  const suggested = file.suggestions[0];
  return {
    id: file.fileId,
    filename: file.name,
    season: file.seasonNumber === undefined ? "" : String(file.seasonNumber),
    episode: file.episodeNumber === undefined ? "" : String(file.episodeNumber),
    originalSeason:
      suggested?.seasonNumber === undefined
        ? ""
        : String(suggested.seasonNumber),
    originalEpisode:
      suggested?.episodeNumber === undefined
        ? ""
        : String(suggested.episodeNumber),
    manualRequired: ["ambiguous", "multiple-episodes"].includes(
      file.mappingState,
    ),
    corrected: file.mappingState === "manual",
    skipped: file.mappingState === "skipped",
    subtitle: file.selectedSubtitleFileId ?? "",
    subtitles: file.subtitleCandidates,
  };
}

function draftFrom(review: SeriesImportReviewSnapshot): SeriesDraft {
  return {
    reviewId: review.reviewId,
    seriesId: review.seriesId ?? `series:local:${review.reviewId.slice(7)}`,
    title: review.title,
    sourceId: review.sourceId ?? `review:${review.reviewId}`,
    sourceName: review.sourceId ?? "Torrent inspecionado",
    files: review.files.items.map(reviewFile),
  };
}

export class DesktopSeriesCatalog implements SeriesCatalog {
  readonly real = true;
  private readonly reviews = new Map<string, SeriesDraft>();
  private libraryId?: string;
  private catalogRevision?: number;

  constructor(
    private readonly api: SeriesCatalogDesktopApi,
    private readonly configuredLibraryId: () => string,
  ) {}

  private mutation(expectedRevision?: number) {
    return {
      idempotencyKey: crypto.randomUUID(),
      ...(expectedRevision === undefined ? {} : { expectedRevision }),
    };
  }

  private async allPages<T>(
    first: SeriesCatalogPage<T>,
    read: (
      cursor: NonNullable<SeriesCatalogPage<T>["nextCursor"]>,
    ) => Promise<SeriesCatalogResult<SeriesCatalogPage<T>>>,
  ) {
    const items = [...first.items];
    let cursor = first.nextCursor;
    while (cursor) {
      const page = unwrap(await read(cursor));
      items.push(...page.items);
      cursor = page.nextCursor;
    }
    return items;
  }

  private async completeReview(initial: SeriesImportReviewSnapshot) {
    const items = await this.allPages(initial.files, (cursor) =>
      this.api
        .readReview({ reviewId: initial.reviewId, cursor, limit: 128 })
        .then((result) =>
          result.ok ? { ok: true as const, value: result.value.files } : result,
        ),
    );
    return { ...initial, files: { items, total: items.length } };
  }

  private episode(value: EpisodeRecordSnapshot): Episode {
    return {
      id: value.id,
      season: value.seasonNumber,
      number: value.episodeNumber,
      title: value.metadata.title,
      artwork:
        value.artwork ??
        (value.metadata.still
          ? {
              src: value.metadata.still,
              fileName: "Imagem do episódio",
              mimeType: "image/jpeg",
            }
          : undefined),
      links: value.sources.map((source) => ({
        sourceId: source.sourceId,
        sourceName: source.sourceName ?? "Torrent",
        fileId: source.resolvedFileId,
        filename: source.fileName ?? source.resolvedFileId,
        resolution: resolutionFrom(source.fileName),
        fileAvailable: true,
        selector: source.selector.type,
        subtitle: source.selectedSubtitleFileId ?? "",
      })),
    };
  }

  private async record(value: SeriesRecordSnapshot): Promise<SeriesRecord> {
    const libraryId = this.libraryId ?? this.configuredLibraryId();
    const episodes = await this.allPages(
      unwrap(
        await this.api.readEpisodes({
          libraryId,
          seriesId: value.id,
          limit: 128,
        }),
      ),
      (cursor) =>
        this.api.readEpisodes({
          libraryId,
          seriesId: value.id,
          cursor,
          limit: 128,
        }),
    );
    return {
      id: value.id,
      title: value.metadata.title,
      originalTitle: value.metadata.originalTitle,
      synopsis: value.metadata.synopsis,
      startYear: value.metadata.startYear,
      endYear: value.metadata.endYear,
      genres: value.metadata.genres,
      poster: value.metadata.poster,
      backdrop: value.metadata.backdrop,
      externalIds: value.metadata.externalIds?.imdb
        ? { imdb: value.metadata.externalIds.imdb }
        : undefined,
      episodes: episodes.map((episode) => this.episode(episode)),
    };
  }

  private async cacheReview(sourceId: string) {
    const result = await this.api.readSourceReview({ sourceId });
    if (!result.ok) {
      if (result.error.code === "SERIES_NOT_FOUND") return;
      throw new Error(result.error.message);
    }
    const review = await this.completeReview(result.value);
    this.reviews.set(sourceId, draftFrom(review));
  }

  async list() {
    const libraryId = this.configuredLibraryId();
    this.libraryId = libraryId;
    const first = unwrap(await this.api.readCatalog({ libraryId, limit: 128 }));
    this.catalogRevision = first.revision;
    const series = await this.allPages(first.series, (cursor) =>
      this.api
        .readCatalog({ libraryId, cursor, limit: 128 })
        .then((result) =>
          result.ok
            ? { ok: true as const, value: result.value.series }
            : result,
        ),
    );
    const records = await Promise.all(
      series.map((value) => this.record(value)),
    );
    const sourceIds = new Set(
      records.flatMap((record) =>
        record.episodes.flatMap((episode) =>
          episode.links.map((link) => link.sourceId),
        ),
      ),
    );
    await Promise.all(
      [...sourceIds].map((sourceId) => this.cacheReview(sourceId)),
    );
    return records;
  }

  reviewSource(sourceId: string) {
    const value = this.reviews.get(sourceId);
    return value ? structuredClone(value) : null;
  }

  async beginInspectionReview(
    inspection: Inspection,
    fileIds: string[],
    seriesId?: string,
    title?: string,
  ) {
    if (!inspection.operationId)
      throw new Error("A operação torrent real não está disponível.");
    const review = await this.completeReview(
      unwrap(
        await this.api.beginReview({
          libraryId: this.configuredLibraryId(),
          operationId: inspection.operationId,
          title: title ?? inspection.name,
          seriesId,
          fileIds,
          mutation: this.mutation(),
        }),
      ),
    );
    return draftFrom(review);
  }

  async save(draft: SeriesDraft) {
    if (!draft.reviewId)
      throw new Error(
        "A revisão persistida desta importação não foi encontrada.",
      );
    let review = await this.completeReview(
      unwrap(
        await this.api.readReview({ reviewId: draft.reviewId, limit: 128 }),
      ),
    );
    const persisted = new Map(
      review.files.items.map((file) => [file.fileId, file]),
    );
    for (const file of draft.files) {
      const current = persisted.get(file.id);
      if (!current)
        throw new Error(`O arquivo ${file.filename} não está mais disponível.`);
      const season = Number(file.season);
      const episode = Number(file.episode);
      const shouldSkip = file.skipped;
      const changed = shouldSkip
        ? current.mappingState !== "skipped"
        : current.mappingState === "skipped" ||
          current.seasonNumber !== season ||
          current.episodeNumber !== episode ||
          current.selectedSubtitleFileId !== (file.subtitle || undefined) ||
          (file.corrected && current.selectorType !== "manual");
      if (!changed) continue;
      review = await this.completeReview(
        unwrap(
          await this.api.correctMapping({
            reviewId: draft.reviewId,
            fileId: file.id,
            action: shouldSkip
              ? { type: "skip" }
              : {
                  type: "assign",
                  seasonNumber: season,
                  episodeNumber: episode,
                  selectorType: file.corrected
                    ? "manual"
                    : (current.selectorType ?? "episode"),
                },
            selectedSubtitleFileId: file.subtitle || undefined,
            mutation: this.mutation(review.revision),
          }),
        ),
      );
    }
    const confirmed = unwrap(
      await this.api.confirmImport({
        reviewId: draft.reviewId,
        title: draft.title,
        mutation: this.mutation(),
      }),
    );
    this.catalogRevision = confirmed.snapshot.revision;
    if (confirmed.review.sourceId) {
      const complete = await this.completeReview(confirmed.review);
      this.reviews.set(confirmed.review.sourceId, draftFrom(complete));
    }
    return confirmed.series.id;
  }

  async setEpisodeArtwork(
    episodeId: string,
    artwork: EpisodeArtwork | null,
  ): Promise<Episode> {
    return this.episode(
      unwrap(
        await this.api.setEpisodeArtwork({
          libraryId: this.libraryId ?? this.configuredLibraryId(),
          episodeId,
          artwork,
          mutation: this.mutation(),
        }),
      ),
    );
  }
}
