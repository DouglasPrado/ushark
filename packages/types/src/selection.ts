export interface SourceCandidate {
  id: string;
  name: string;
  local: boolean;
  resolution?: number;
  sizeGB?: number;
  origin?: string;
  selector?: string;
}
export type SelectionScenario =
  | "normal"
  | "unknown"
  | "low-confidence"
  | "degraded"
  | "unavailable"
  | "error"
  | "offline"
  | "comparison";
export interface SourceHealth {
  id: string;
  state: "unknown" | "ready" | "degraded" | "unavailable";
  score?: number;
  confidence: string;
  throughput?: number;
  bitrate?: number;
  ratio?: number;
  startup?: string;
  startupSeconds?: number;
  reason: string;
  eligible: boolean;
}
export interface SelectionPreferences {
  strategy: string;
  resolution: string;
  autoSelect: boolean;
  preflight: boolean;
}
export interface SelectionPreview {
  isLocal?: (id: string) => boolean;
  getHealthSummary(source: SourceCandidate): SourceHealth;
  measure(
    sources: SourceCandidate[],
    scenario: SelectionScenario,
    signal: AbortSignal,
    context?: { contentId: string; preferences: SelectionPreferences },
  ): Promise<SourceHealth[]>;
  rank(
    sources: SourceCandidate[],
    health: SourceHealth[],
    preferences: SelectionPreferences,
  ): SourceCandidate[];
  override(id: string): string | undefined;
  setOverride(id: string, sourceId?: string): void | Promise<void>;
}

export const SOURCE_SELECTION_PROTOCOL_VERSION = 1 as const;
export const SOURCE_SELECTION_SCHEMA_VERSION = 1 as const;

export const SOURCE_SELECTION_LIMITS = {
  requestBytes: 64 * 1_024,
  candidatesMaximum: 64,
  samplesPerSourceMaximum: 120,
  concurrentProbesMaximum: 3,
  probeBytesMaximum: 8 * 1_024 * 1_024,
  probeBandwidthBytesPerSecond: 2 * 1_024 * 1_024,
  selectionDeadlineMs: 2_000,
  detailsTtlMs: 15_000,
  cardTtlMs: 90_000,
  eventRatePerSecond: 4,
  rankingTargetMs: 10,
} as const;

export type HealthState =
  "idle" | "measuring" | "ready" | "degraded" | "unavailable" | "error";
export type HealthLabel =
  "excellent" | "very-good" | "good" | "unstable" | "poor";
export type SelectionStrategy = "balanced" | "quality" | "fast" | "smallest";
export type ResolutionLimit = "720p" | "1080p" | "2160p";

export interface HealthMetricSample {
  observedAt: string;
  downloadThroughputBitsPerSecond: number;
  connectedPeers: number;
  usefulPeers: number;
  wantedPieceAvailabilityMinimum?: number;
  wantedPieceAvailabilityMedian?: number;
  wantedPiecesAvailableRatio?: number;
  bufferSeconds?: number;
  stalled?: boolean;
}

export interface StreamingHealthSnapshot {
  schemaVersion: typeof SOURCE_SELECTION_SCHEMA_VERSION;
  sourceId: string;
  state: HealthState;
  score?: number;
  displayedScore?: number;
  bars?: 1 | 2 | 3 | 4 | 5;
  label?: HealthLabel;
  confidence: number;
  streamingRatio?: number;
  startupEstimateMs?: number;
  sustainableThroughputBitsPerSecond?: number;
  requiredBitrateBitsPerSecond?: number;
  connectedPeers: number;
  usefulPeers: number;
  wantedPieceAvailability?: number;
  stabilityScore?: number;
  swarmHealthScore?: number;
  measuredAt: string;
  staleAt: string;
  algorithmVersion: 1;
  reasonCodes: string[];
  breakdown: Record<string, number>;
}

export interface SourceSelectionCandidate {
  sourceId: string;
  name: string;
  origin?: string;
  fileId?: string;
  completedLocal: boolean;
  resolutionHeight?: number;
  sizeBytes?: number;
  bitrateBitsPerSecond?: number;
  durationSeconds?: number;
  videoCodec?: string;
  hardwareDecodeSupported?: boolean;
  preferredByAuthor?: boolean;
  blacklisted?: boolean;
  health?: StreamingHealthSnapshot;
}

export interface RankedSourceSnapshot {
  sourceId: string;
  rank: number;
  score: number;
  eligible: boolean;
  reasonCodes: string[];
}

export interface SourceSelectionSnapshot {
  schemaVersion: typeof SOURCE_SELECTION_SCHEMA_VERSION;
  protocolVersion: typeof SOURCE_SELECTION_PROTOCOL_VERSION;
  requestId: string;
  contentId: string;
  state: "measuring" | "ready" | "cancelled" | "error";
  strategy: SelectionStrategy;
  resolutionLimit: ResolutionLimit;
  candidates: SourceSelectionCandidate[];
  ranked: RankedSourceSnapshot[];
  selectedSourceId?: string;
  overrideSourceId?: string;
  decisionId?: string;
  reasonCodes: string[];
  startedAt: string;
  updatedAt: string;
}

export interface SourceSelectionMutation {
  idempotencyKey: string;
}

export type SourceSelectionErrorCode =
  | "SELECTION_CANCELLED"
  | "SELECTION_CONFLICT"
  | "SELECTION_INVALID"
  | "SELECTION_NOT_FOUND"
  | "SELECTION_PROTOCOL_UNSUPPORTED"
  | "SELECTION_SOURCE_UNAVAILABLE"
  | "SELECTION_STORAGE_FAILED"
  | "SELECTION_TIMEOUT"
  | "SELECTION_UNAUTHORIZED";

export interface SourceSelectionFailure {
  code: SourceSelectionErrorCode;
  message: string;
  recoverable: boolean;
  retryable: boolean;
}

export type SourceSelectionResult<T> =
  { ok: true; value: T } | { ok: false; error: SourceSelectionFailure };

export interface BeginSourcePreflightInput {
  requestId: string;
  contentId: string;
  candidates: SourceSelectionCandidate[];
  strategy: SelectionStrategy;
  resolutionLimit: ResolutionLimit;
  context: "details" | "focused-card" | "hero" | "next-episode";
}

export type SourceSelectionEventType =
  | "selection.measuring"
  | "selection.updated"
  | "selection.ready"
  | "selection.cancelled"
  | "selection.failed";

export interface SourceSelectionEvent {
  protocolVersion: typeof SOURCE_SELECTION_PROTOCOL_VERSION;
  eventId: string;
  type: SourceSelectionEventType;
  sequence: number;
  occurredAt: string;
  snapshot?: SourceSelectionSnapshot;
  error?: SourceSelectionFailure;
}

export interface SourceSelectionDesktopApi {
  protocolVersion: typeof SOURCE_SELECTION_PROTOCOL_VERSION;
  preflight(
    input: BeginSourcePreflightInput,
  ): Promise<SourceSelectionResult<SourceSelectionSnapshot>>;
  cancel(input: {
    requestId: string;
  }): Promise<SourceSelectionResult<{ requestId: string; cancelled: boolean }>>;
  setOverride(input: {
    contentId: string;
    sourceId?: string;
    mutation: SourceSelectionMutation;
  }): Promise<SourceSelectionResult<{ contentId: string; sourceId?: string }>>;
  readOverride(input: {
    contentId: string;
  }): Promise<SourceSelectionResult<{ contentId: string; sourceId?: string }>>;
  subscribe(listener: (event: SourceSelectionEvent) => void): () => void;
}
