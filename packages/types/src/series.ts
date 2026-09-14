import type { ContentSourceSelector, Inspection } from "./torrent";

export type SeriesScenario =
  "normal" | "slow" | "offline" | "list-error" | "save-error";
export type PackKind = "single" | "season" | "multi" | "ambiguous";
export interface EpisodeLink {
  sourceId: string;
  sourceName: string;
  fileId: string;
  filename: string;
  resolution?: string;
  fileAvailable?: boolean;
  selector: "episode" | "filename" | "manual";
  subtitle: string;
}
export interface EpisodeArtwork {
  src: string;
  fileName: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
}
export interface Episode {
  id: string;
  season: number;
  number: number;
  title?: string;
  artwork?: EpisodeArtwork;
  links: EpisodeLink[];
}
export interface SeriesRecord {
  id: string;
  title: string;
  originalTitle?: string;
  synopsis?: string;
  startYear?: number;
  endYear?: number;
  genres?: string[];
  poster?: string;
  backdrop?: string;
  externalIds?: { imdb?: string };
  ratings?: { imdb?: { average: number; votes: number } };
  episodes: Episode[];
}
export interface ReviewFile {
  id: string;
  filename: string;
  season: string;
  episode: string;
  originalSeason: string;
  originalEpisode: string;
  manualRequired: boolean;
  corrected: boolean;
  skipped: boolean;
  subtitle: string;
  subtitles: string[];
}
export interface SeriesDraft {
  seriesId: string;
  title: string;
  sourceId: string;
  sourceName: string;
  files: ReviewFile[];
  /** Present only while the real Electron adapter owns a persisted M03 review. */
  reviewId?: string;
}
export interface SeriesCatalog {
  readonly real?: boolean;
  list(): Promise<SeriesRecord[]>;
  reviewSource(sourceId: string): SeriesDraft | null;
  save(draft: SeriesDraft): Promise<string>;
  setEpisodeArtwork(
    episodeId: string,
    artwork: EpisodeArtwork | null,
  ): Promise<Episode>;
  beginInspectionReview?(
    inspection: Inspection,
    fileIds: string[],
    seriesId?: string,
    title?: string,
  ): Promise<SeriesDraft>;
}

/** Wire and persisted-snapshot versions for the real M03 boundary. */
export const SERIES_CATALOG_PROTOCOL_VERSION = 1 as const;
export const SERIES_CATALOG_SCHEMA_VERSION = 1 as const;

/**
 * Limits are shared by Core and IPC. The torrent file ceiling is inherited
 * from M06; an import review never accepts more files than the inspection did.
 */
export const SERIES_CATALOG_LIMITS = {
  titleUtf8Bytes: 512,
  synopsisUtf8Bytes: 20_000,
  externalIdUtf8Bytes: 128,
  seasonNumber: 999,
  episodeNumber: 9_999,
  reviewFiles: 10_000,
  pageSizeDefault: 64,
  pageSizeMaximum: 128,
  cursorUtf8Bytes: 512,
  idempotencyKeyUtf8Bytes: 160,
  requestBytes: 1 * 1_024 * 1_024,
} as const;

export type SeriesContentType = "series" | "episode";
export type SeriesProviderState =
  "available" | "offline" | "degraded" | "not-configured";

export interface SeriesExternalIds {
  tmdb?: string;
  imdb?: string;
}

export interface SeriesMetadata {
  title: string;
  originalTitle?: string;
  synopsis?: string;
  startYear?: number;
  endYear?: number;
  status?: string;
  genres: string[];
  cast: string[];
  poster?: string;
  backdrop?: string;
  externalIds?: SeriesExternalIds;
}

export interface EpisodeMetadata {
  title?: string;
  synopsis?: string;
  runtimeSeconds?: number;
  airDate?: string;
  still?: string;
  externalIds?: SeriesExternalIds;
}

/**
 * A season is a paginated projection. M03 does not materialize a season
 * identity because the approved experience has no season-owned state.
 */
export interface SeriesSeasonSummary {
  seasonNumber: number;
  episodeCount: number;
  mappedEpisodeCount: number;
}

export type EpisodeSourceSelector = Exclude<
  ContentSourceSelector,
  { type: "largest-video" }
>;

export interface EpisodeSourceRelation {
  contentSourceId: string;
  episodeId: string;
  sourceId: string;
  selector: EpisodeSourceSelector;
  resolvedFileId: string;
  selectedSubtitleFileId?: string;
  /** Safe labels projected by Core for the approved legacy UI. */
  sourceName?: string;
  fileName?: string;
}

export interface EpisodeRecordSnapshot {
  id: string;
  seriesId: string;
  seasonNumber: number;
  episodeNumber: number;
  metadata: EpisodeMetadata;
  artwork?: EpisodeArtwork;
  sources: EpisodeSourceRelation[];
}

export interface SeriesRecordSnapshot {
  id: string;
  metadata: SeriesMetadata;
  seasons: SeriesSeasonSummary[];
  episodeCount: number;
}

export interface SeriesPageCursor {
  /** Opaque cursor returned by Core. Renderer must not construct it. */
  value: string;
}

export interface SeriesCatalogPage<T> {
  items: T[];
  nextCursor?: SeriesPageCursor;
  total: number;
}

export interface SeriesCatalogSnapshot {
  schemaVersion: typeof SERIES_CATALOG_SCHEMA_VERSION;
  libraryId: string;
  revision: number;
  providerState: SeriesProviderState;
  series: SeriesCatalogPage<SeriesRecordSnapshot>;
}

export type EpisodeInferencePattern =
  "sxxexx" | "nxnn" | "season-episode" | "none" | "multiple-episodes";

export type EpisodeMappingState =
  | "identified"
  | "ambiguous"
  | "unidentified"
  | "conflict"
  | "multiple-episodes"
  | "manual"
  | "skipped";

export interface EpisodeIdentitySuggestion {
  seasonNumber: number;
  episodeNumber: number;
  pattern: Exclude<EpisodeInferencePattern, "none" | "multiple-episodes">;
}

export interface EpisodeReviewFile {
  fileId: string;
  path: string;
  name: string;
  sizeBytes: number;
  mappingState: EpisodeMappingState;
  inferencePattern: EpisodeInferencePattern;
  suggestions: EpisodeIdentitySuggestion[];
  assignedEpisodeId?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  selectorType?: "episode" | "filename" | "manual";
  subtitleCandidates: string[];
  selectedSubtitleFileId?: string;
}

export type SeriesReviewState = "draft" | "ready" | "confirmed" | "failed";

export interface SeriesImportReviewSnapshot {
  schemaVersion: typeof SERIES_CATALOG_SCHEMA_VERSION;
  reviewId: string;
  operationId: string;
  libraryId: string;
  seriesId?: string;
  sourceId?: string;
  title: string;
  state: SeriesReviewState;
  revision: number;
  mappedCount: number;
  issueCount: number;
  files: SeriesCatalogPage<EpisodeReviewFile>;
  updatedAt: string;
}

export interface SeriesCatalogMutation {
  /** Unique per user intent. Replays return the original result. */
  idempotencyKey: string;
  /** Optional optimistic concurrency guard for the target snapshot/review. */
  expectedRevision?: number;
}

export interface ReadSeriesCatalogInput {
  libraryId: string;
  cursor?: SeriesPageCursor;
  limit?: number;
}

export interface ReadSeriesInput {
  libraryId: string;
  seriesId: string;
}

export interface ReadEpisodesInput extends ReadSeriesInput {
  seasonNumber?: number;
  cursor?: SeriesPageCursor;
  limit?: number;
}

export interface BeginSeriesReviewInput {
  libraryId: string;
  /** Completed M06 inspection operation; Core resolves source/files itself. */
  operationId: string;
  title?: string;
  seriesId?: string;
  /** Explicit video choices from the approved torrent review surface. */
  fileIds?: string[];
  mutation: SeriesCatalogMutation;
}

export interface ReadSeriesReviewInput {
  reviewId: string;
  cursor?: SeriesPageCursor;
  limit?: number;
}

export interface ReadSeriesSourceReviewInput {
  sourceId: string;
}

export interface CorrectEpisodeMappingInput {
  reviewId: string;
  fileId: string;
  action:
    | {
        type: "assign";
        seasonNumber: number;
        episodeNumber: number;
        selectorType: "episode" | "filename" | "manual";
      }
    | { type: "skip" };
  selectedSubtitleFileId?: string;
  mutation: SeriesCatalogMutation;
}

export interface ConfirmSeriesImportInput {
  reviewId: string;
  title?: string;
  mutation: SeriesCatalogMutation;
}

export interface SetEpisodeArtworkInput {
  libraryId: string;
  episodeId: string;
  artwork: EpisodeArtwork | null;
  mutation: SeriesCatalogMutation;
}

export interface SeriesMetadataSearchInput {
  query: string;
  startYear?: number;
  requestId: string;
}

export interface SeriesMetadataSearchResult {
  requestId: string;
  providerState: SeriesProviderState;
  results: Array<SeriesMetadata & { contentId: string }>;
}

export interface SeriesMetadataCancelInput {
  requestId: string;
}

export interface RefreshSeriesMetadataInput {
  libraryId: string;
  seriesId: string;
  requestId: string;
  mutation: SeriesCatalogMutation;
}

export type SeriesCatalogErrorCode =
  | "SERIES_CONFLICT"
  | "SERIES_EPISODE_COLLISION"
  | "SERIES_IDENTITY_CONFLICT"
  | "SERIES_IMPORT_INCOMPLETE"
  | "SERIES_INVALID"
  | "SERIES_NOT_FOUND"
  | "SERIES_PROTOCOL_UNSUPPORTED"
  | "SERIES_PROVIDER_CANCELLED"
  | "SERIES_PROVIDER_FAILED"
  | "SERIES_PROVIDER_NOT_CONFIGURED"
  | "SERIES_PROVIDER_OFFLINE"
  | "SERIES_PROVIDER_TIMEOUT"
  | "SERIES_REVISION_CONFLICT"
  | "SERIES_SOURCE_CHANGED"
  | "SERIES_STORAGE_FAILED"
  | "SERIES_UNAUTHORIZED";

export interface SeriesCatalogFailure {
  code: SeriesCatalogErrorCode;
  message: string;
  recoverable: boolean;
  retryable: boolean;
  fileIds?: string[];
}

export type SeriesCatalogResult<T> =
  { ok: true; value: T } | { ok: false; error: SeriesCatalogFailure };

export interface SeriesImportCommandResult {
  snapshot: SeriesCatalogSnapshot;
  series: SeriesRecordSnapshot;
  review: SeriesImportReviewSnapshot;
}

/** Core-facing M03 application boundary. Inputs are revalidated at IPC. */
export interface SeriesCatalogService {
  readCatalog(
    input: ReadSeriesCatalogInput,
  ): Promise<SeriesCatalogResult<SeriesCatalogSnapshot>>;
  readSeries(
    input: ReadSeriesInput,
  ): Promise<SeriesCatalogResult<SeriesRecordSnapshot>>;
  readEpisodes(
    input: ReadEpisodesInput,
  ): Promise<SeriesCatalogResult<SeriesCatalogPage<EpisodeRecordSnapshot>>>;
  beginReview(
    input: BeginSeriesReviewInput,
  ): Promise<SeriesCatalogResult<SeriesImportReviewSnapshot>>;
  readReview(
    input: ReadSeriesReviewInput,
  ): Promise<SeriesCatalogResult<SeriesImportReviewSnapshot>>;
  readSourceReview(
    input: ReadSeriesSourceReviewInput,
  ): Promise<SeriesCatalogResult<SeriesImportReviewSnapshot>>;
  correctMapping(
    input: CorrectEpisodeMappingInput,
  ): Promise<SeriesCatalogResult<SeriesImportReviewSnapshot>>;
  confirmImport(
    input: ConfirmSeriesImportInput,
  ): Promise<SeriesCatalogResult<SeriesImportCommandResult>>;
  setEpisodeArtwork(
    input: SetEpisodeArtworkInput,
  ): Promise<SeriesCatalogResult<EpisodeRecordSnapshot>>;
  searchMetadata(
    input: SeriesMetadataSearchInput,
  ): Promise<SeriesCatalogResult<SeriesMetadataSearchResult>>;
  cancelMetadataRequest(
    input: SeriesMetadataCancelInput,
  ): Promise<SeriesCatalogResult<{ requestId: string; cancelled: boolean }>>;
  refreshMetadata(
    input: RefreshSeriesMetadataInput,
  ): Promise<SeriesCatalogResult<SeriesRecordSnapshot>>;
}

export interface SeriesCatalogDesktopApi extends SeriesCatalogService {
  protocolVersion: typeof SERIES_CATALOG_PROTOCOL_VERSION;
}
