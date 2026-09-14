/** Provisional M04 frontend read boundary; persistence and FTS belong to S03+. */
export interface DiscoveryItem {
  id: string;
  title: string;
  originalTitle?: string;
  type: "movie" | "series" | "episode";
  seriesTitle?: string;
  synopsis?: string;
  poster?: string;
  backdrop?: string;
  year?: number;
  endYear?: number;
  genres: string[];
  cast?: string[];
  rating?: { average: number; votes: number };
  externalIds?: { imdb?: string; tmdb?: string };
  seasonCount?: number;
  episodeCount?: number;
  favorite: boolean;
  recent: boolean;
  position: number;
  duration: number;
  memberships: { id: string; name: string }[];
  collections: { id: string; name: string }[];
  sources: { id: string; quality: string; fileAvailable?: boolean }[];
}
export type DiscoveryScenario =
  | "current"
  | "editorial"
  | "large"
  | "empty"
  | "offline"
  | "error"
  | "slow"
  | "missing"
  | "hydration";
export interface DiscoveryQuery {
  text: string;
  type: string;
  favorite: boolean;
  recent: boolean;
  continuing: boolean;
  genre: string;
  collection: string;
  scope: string;
  page: number;
}
export interface DiscoveryResult {
  items: DiscoveryItem[];
  total: number;
}
export interface DiscoveryCatalog {
  read(): Promise<DiscoveryItem[]>;
  search(query: DiscoveryQuery): Promise<DiscoveryResult>;
  subscribe?(listener: () => void): () => void;
  dispose?(): void;
}
export interface DiscoverySession {
  query: DiscoveryQuery;
  searching: boolean;
  scenario: DiscoveryScenario;
}
export const discoveryQuery = (): DiscoveryQuery => ({
  text: "",
  type: "",
  favorite: false,
  recent: false,
  continuing: false,
  genre: "",
  collection: "",
  scope: "",
  page: 0,
});

/** Wire and persisted-index versions for the real M04 boundary. */
export const DISCOVERY_PROTOCOL_VERSION = 1 as const;
export const DISCOVERY_INDEX_SCHEMA_VERSION = 1 as const;

export const DISCOVERY_LIMITS = {
  requestBytes: 1 * 1_024 * 1_024,
  queryUtf8Bytes: 512,
  cursorUtf8Bytes: 1_024,
  pageDefault: 24,
  pageMaximum: 128,
  homeSectionMaximum: 24,
  originsPerContent: 64,
  sourcesPerContent: 64,
  facetsPerKind: 256,
  indexBatchMaximum: 1_000,
  invalidationIdsMaximum: 1_000,
  watchedPathUtf8Bytes: 4_096,
  watcherCoalesceMs: 150,
} as const;

export type DiscoveryContentType = "movie" | "series" | "episode";
export type DiscoveryOriginKind =
  "local" | "shared" | "subscription" | "collection";
export type DiscoveryAvailability =
  "available" | "offline" | "missing" | "pending";

export interface DiscoveryPageCursor {
  /** Opaque, revision-bound cursor created only by Core. */
  value: string;
}

export interface DiscoveryPage<T> {
  items: T[];
  nextCursor?: DiscoveryPageCursor;
  total: number;
}

export interface DiscoveryMembershipSnapshot {
  id: string;
  kind: DiscoveryOriginKind;
  name: string;
  available: boolean;
}

export interface DiscoverySourceSnapshot {
  id: string;
  quality?: string;
  availability: DiscoveryAvailability;
  /** Whether Core has a complete managed file for local playback. */
  localFileAvailable?: boolean;
}

export interface DiscoveryContentSnapshot {
  contentId: string;
  type: DiscoveryContentType;
  title: string;
  originalTitle?: string;
  seriesTitle?: string;
  synopsis?: string;
  poster?: string;
  backdrop?: string;
  year?: number;
  endYear?: number;
  genres: string[];
  cast: string[];
  rating?: { average: number; votes: number };
  externalIds?: { imdb?: string; tmdb?: string };
  seasonCount?: number;
  episodeCount?: number;
  favorite: boolean;
  progress: {
    positionSeconds: number;
    durationSeconds: number;
    watched: boolean;
    lastPlayedAt?: string;
  };
  addedAt: string;
  memberships: DiscoveryMembershipSnapshot[];
  collections: DiscoveryMembershipSnapshot[];
  sources: DiscoverySourceSnapshot[];
}

export type DiscoverySectionKind =
  "continue-watching" | "movies" | "series" | "recent" | "editorial";

export interface DiscoveryHomeSection {
  id: string;
  kind: DiscoverySectionKind;
  title: string;
  items: DiscoveryContentSnapshot[];
}

export interface DiscoveryFacets {
  genres: string[];
  collections: DiscoveryMembershipSnapshot[];
  libraries: DiscoveryMembershipSnapshot[];
}

export interface DiscoveryHomeSnapshot {
  schemaVersion: typeof DISCOVERY_INDEX_SCHEMA_VERSION;
  libraryId: string;
  revision: number;
  offline: boolean;
  hero?: DiscoveryContentSnapshot;
  sections: DiscoveryHomeSection[];
  facets: DiscoveryFacets;
}

export interface ReadDiscoveryHomeInput {
  libraryId: string;
  sectionLimit?: number;
}

export interface SearchDiscoveryInput {
  libraryId: string;
  query: string;
  type?: DiscoveryContentType;
  favorite?: boolean;
  recent?: boolean;
  continuing?: boolean;
  genre?: string;
  collectionId?: string;
  scopeId?: string;
  cursor?: DiscoveryPageCursor;
  limit?: number;
  requestId: string;
}

export interface DiscoverySearchSnapshot {
  schemaVersion: typeof DISCOVERY_INDEX_SCHEMA_VERSION;
  libraryId: string;
  revision: number;
  requestId: string;
  query: string;
  page: DiscoveryPage<DiscoveryContentSnapshot>;
  facets: DiscoveryFacets;
}

export interface ReadDiscoveryScopeInput {
  libraryId: string;
  scopeId: string;
  cursor?: DiscoveryPageCursor;
  limit?: number;
}

export interface DiscoveryScopeSnapshot {
  schemaVersion: typeof DISCOVERY_INDEX_SCHEMA_VERSION;
  libraryId: string;
  revision: number;
  scope: DiscoveryMembershipSnapshot;
  page: DiscoveryPage<DiscoveryContentSnapshot>;
}

export interface CancelDiscoveryRequestInput {
  requestId: string;
}

export type DiscoveryInvalidationReason =
  | "catalog"
  | "file-added"
  | "file-changed"
  | "file-renamed"
  | "file-removed"
  | "origin"
  | "progress"
  | "recovery";

export interface DiscoveryInvalidationEvent {
  protocolVersion: typeof DISCOVERY_PROTOCOL_VERSION;
  eventId: string;
  revision: number;
  reason: DiscoveryInvalidationReason;
  contentIds: string[];
  scopeIds: string[];
  occurredAt: string;
}

export interface DiscoveryIndexMutation {
  idempotencyKey: string;
  expectedRevision?: number;
}

/** Core-only normalized document. Host paths never cross the renderer API. */
export interface DiscoveryIndexDocument {
  content: DiscoveryContentSnapshot;
  searchText: {
    title: string;
    originalTitle?: string;
    synopsis?: string;
    seriesTitle?: string;
    episodeTitle?: string;
    originNames: string[];
    collectionNames: string[];
  };
}

export interface ApplyDiscoveryIndexInput {
  libraryId: string;
  upserts: DiscoveryIndexDocument[];
  removals: string[];
  reason: DiscoveryInvalidationReason;
  mutation: DiscoveryIndexMutation;
}

export type DiscoveryErrorCode =
  | "DISCOVERY_CANCELLED"
  | "DISCOVERY_CONFLICT"
  | "DISCOVERY_CURSOR_STALE"
  | "DISCOVERY_INDEX_CORRUPT"
  | "DISCOVERY_INDEX_UNAVAILABLE"
  | "DISCOVERY_INVALID"
  | "DISCOVERY_NOT_FOUND"
  | "DISCOVERY_PROTOCOL_UNSUPPORTED"
  | "DISCOVERY_STORAGE_FAILED"
  | "DISCOVERY_UNAUTHORIZED";

export interface DiscoveryFailure {
  code: DiscoveryErrorCode;
  message: string;
  recoverable: boolean;
  retryable: boolean;
}

export type DiscoveryServiceResult<T> =
  { ok: true; value: T } | { ok: false; error: DiscoveryFailure };

export interface DiscoveryReadService {
  readHome(
    input: ReadDiscoveryHomeInput,
  ): Promise<DiscoveryServiceResult<DiscoveryHomeSnapshot>>;
  search(
    input: SearchDiscoveryInput,
  ): Promise<DiscoveryServiceResult<DiscoverySearchSnapshot>>;
  readScope(
    input: ReadDiscoveryScopeInput,
  ): Promise<DiscoveryServiceResult<DiscoveryScopeSnapshot>>;
  cancelRequest(
    input: CancelDiscoveryRequestInput,
  ): Promise<DiscoveryServiceResult<{ requestId: string; cancelled: boolean }>>;
}

export interface DiscoveryIndexService {
  apply(
    input: ApplyDiscoveryIndexInput,
  ): Promise<DiscoveryServiceResult<DiscoveryInvalidationEvent>>;
}

export type DiscoveryWatchStatus =
  "watching" | "indexed" | "removed" | "pending" | "rejected" | "error";

/** Safe watcher status. Paths are library-relative and never absolute. */
export interface DiscoveryWatchEvent {
  libraryId: string;
  relativePath?: string;
  previousRelativePath?: string;
  contentId?: string;
  reason?: Extract<
    DiscoveryInvalidationReason,
    "file-added" | "file-changed" | "file-renamed" | "file-removed"
  >;
  status: DiscoveryWatchStatus;
  reprocessedCount: number;
  occurredAt: string;
  error?: DiscoveryFailure;
}

export interface DiscoveryWatchedFileSnapshot {
  libraryId: string;
  relativePath: string;
  previousRelativePath?: string;
  previousContentId?: string;
  reason: Extract<
    DiscoveryInvalidationReason,
    "file-added" | "file-changed" | "file-renamed"
  >;
  fingerprint: string;
  sizeBytes: number;
  modifiedAtMs: number;
}

export interface DiscoveryDesktopApi extends DiscoveryReadService {
  protocolVersion: typeof DISCOVERY_PROTOCOL_VERSION;
  rebuildSearchIndex(input: {
    libraryId: string;
    mutation: DiscoveryIndexMutation;
  }): Promise<DiscoveryServiceResult<DiscoveryInvalidationEvent>>;
  subscribe(listener: (event: DiscoveryInvalidationEvent) => void): () => void;
}
