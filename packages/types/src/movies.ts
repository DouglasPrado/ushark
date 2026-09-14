export const MOVIE_CATALOG_SCHEMA_VERSION = 1 as const;
export const MOVIE_CATALOG_PROTOCOL_VERSION = 1 as const;

export const MOVIE_CATALOG_LIMITS = {
  title: 160,
  originalTitle: 160,
  synopsis: 20_000,
  genres: 32,
  cast: 256,
  sourceName: 512,
  externalId: 128,
  providerQuery: 160,
} as const;

export type MovieSourceAvailability =
  "declared" | "available" | "missing" | "unavailable" | "error";

export interface MovieMetadata {
  id: string;
  title: string;
  originalTitle?: string;
  year?: number;
  synopsis?: string;
  duration?: number;
  genres: string[];
  cast: string[];
  poster?: string;
  backdrop?: string;
  externalIds?: { tmdb?: string; imdb?: string };
  ratings?: {
    imdb?: {
      average: number;
      votes: number;
      snapshotDate: string;
    };
  };
}
export interface MovieSource {
  id: string;
  name: string;
  resolution?: string;
  videoCodec?: string;
  audioCodec?: string;
  hdr?: string;
  channels?: string;
  size?: string;
  bitrate?: string;
  availability: MovieSourceAvailability;
  /** Compatibility projection used by the approved UI. Derived from availability. */
  fileAvailable: boolean;
  /** True only when Core owns an internal path inside an approved managed root. */
  managedFile?: boolean;
}
export interface MovieMembership {
  libraryId: string;
  titleOverride?: string;
  preservedOverrides: string[];
}
export interface Movie {
  id: string;
  metadata: MovieMetadata;
  sources: MovieSource[];
  memberships: MovieMembership[];
  personal: {
    favorite: boolean;
    progress: number;
    history: string[];
    preferences: string[];
  };
}
export type MovieScenario =
  | "normal"
  | "offline"
  | "search-empty"
  | "provider-error"
  | "slow"
  | "save-error"
  | "list-error"
  | "image-error";
export interface MetadataProvider {
  search(
    title: string,
    year?: number,
    signal?: AbortSignal,
  ): Promise<MovieMetadata[]>;
  refresh(
    metadata: MovieMetadata,
    signal?: AbortSignal,
  ): Promise<MovieMetadata>;
}
export interface MovieDraft {
  metadata: MovieMetadata;
  source?: MovieSource;
  editingId?: string;
  confirmMerge?: boolean;
}
export interface MovieCatalog {
  list(libraryId: string): Promise<Movie[]>;
  find(id: string): Movie | undefined;
  save(draft: MovieDraft, libraryId: string): Promise<Movie>;
  favorite(id: string): Promise<void>;
  refresh(id: string): Promise<void>;
  addSource(id: string, source: MovieSource): Promise<void>;
  removeSource(id: string, sourceId: string): Promise<void>;
  removeMembership(id: string, libraryId: string): Promise<void>;
  deleteFile(id: string, sourceId: string): Promise<void>;
}

export type MovieCatalogErrorCode =
  | "CATALOG_CONFLICT"
  | "CATALOG_INVALID"
  | "CATALOG_NOT_FOUND"
  | "CATALOG_PROTOCOL_UNSUPPORTED"
  | "CATALOG_REVISION_CONFLICT"
  | "CATALOG_STORAGE_FAILED"
  | "CATALOG_UNAUTHORIZED"
  | "FILE_DELETE_NOT_CONFIRMED"
  | "FILE_NOT_MANAGED"
  | "FILE_OPERATION_FAILED"
  | "IDENTITY_CONFLICT"
  | "PROVIDER_CANCELLED"
  | "PROVIDER_FAILED"
  | "PROVIDER_NOT_CONFIGURED"
  | "PROVIDER_OFFLINE"
  | "PROVIDER_TIMEOUT";

export interface MovieCatalogFailure {
  code: MovieCatalogErrorCode;
  message: string;
  retryable: boolean;
}

export type MovieCatalogResult<T> =
  { ok: true; value: T } | { ok: false; error: MovieCatalogFailure };

export type MovieProviderState =
  "available" | "offline" | "degraded" | "not-configured";

export interface MovieCatalogSnapshot {
  schemaVersion: typeof MOVIE_CATALOG_SCHEMA_VERSION;
  libraryId: string;
  revision: number;
  providerState: MovieProviderState;
  movies: Movie[];
}

export interface MovieMutationOptions {
  /** Unique per user intent; retries with the same key must not duplicate effects. */
  idempotencyKey: string;
  /** Optional optimistic concurrency guard for UI snapshots. */
  expectedRevision?: number;
}

export interface MovieCatalogCommandResult {
  snapshot: MovieCatalogSnapshot;
  movie?: Movie;
}

export interface MovieCatalogReadInput {
  libraryId: string;
}

export interface MovieMetadataSearchInput {
  libraryId: string;
  query: string;
  year?: number;
  requestId: string;
}

export interface MovieMetadataSearchResult {
  requestId: string;
  providerState: MovieProviderState;
  results: MovieMetadata[];
}

export interface MovieMetadataCancelInput {
  requestId: string;
}

export interface MovieMetadataCancelResult {
  requestId: string;
  cancelled: boolean;
}

export interface MovieSaveInput {
  libraryId: string;
  draft: MovieDraft;
  mutation: MovieMutationOptions;
}

export interface MovieIdCommandInput {
  libraryId: string;
  contentId: string;
  mutation: MovieMutationOptions;
}

export interface MovieSourceCommandInput extends MovieIdCommandInput {
  source: MovieSource;
}

export interface MovieSourceRemovalInput extends MovieIdCommandInput {
  sourceId: string;
}

export interface MovieMembershipRemovalInput extends MovieIdCommandInput {
  membershipLibraryId: string;
}

export interface MovieFileDeleteInput extends MovieSourceRemovalInput {
  /** Destructive intent must be explicit; Core resolves and validates its own path. */
  confirm: true;
}

/** Core-facing capability. All payloads are validated again at the IPC boundary. */
export interface MovieCatalogService {
  read(
    input: MovieCatalogReadInput,
  ): Promise<MovieCatalogResult<MovieCatalogSnapshot>>;
  searchMetadata(
    input: MovieMetadataSearchInput,
  ): Promise<MovieCatalogResult<MovieMetadataSearchResult>>;
  cancelMetadataRequest(
    input: MovieMetadataCancelInput,
  ): Promise<MovieCatalogResult<MovieMetadataCancelResult>>;
  save(
    input: MovieSaveInput,
  ): Promise<MovieCatalogResult<MovieCatalogCommandResult>>;
  toggleFavorite(
    input: MovieIdCommandInput,
  ): Promise<MovieCatalogResult<MovieCatalogCommandResult>>;
  refreshMetadata(
    input: MovieIdCommandInput,
  ): Promise<MovieCatalogResult<MovieCatalogCommandResult>>;
  addSource(
    input: MovieSourceCommandInput,
  ): Promise<MovieCatalogResult<MovieCatalogCommandResult>>;
  removeSource(
    input: MovieSourceRemovalInput,
  ): Promise<MovieCatalogResult<MovieCatalogCommandResult>>;
  removeMembership(
    input: MovieMembershipRemovalInput,
  ): Promise<MovieCatalogResult<MovieCatalogCommandResult>>;
  deleteManagedFile(
    input: MovieFileDeleteInput,
  ): Promise<MovieCatalogResult<MovieCatalogCommandResult>>;
}

/** Minimal preload surface. It intentionally exposes no path- or SQL-level API. */
export interface MovieCatalogDesktopApi extends MovieCatalogService {
  protocolVersion: typeof MOVIE_CATALOG_PROTOCOL_VERSION;
}
