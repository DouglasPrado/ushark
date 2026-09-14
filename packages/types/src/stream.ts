export type StreamScenario =
  "normal" | "metadata" | "network" | "disk" | "slow" | "vbr";
export interface StreamSnapshot {
  phase: "metadata" | "buffering" | "ready";
  seconds: number;
  megabytes: number;
  bitrate: number;
  position: number;
  target: number;
  generation: number;
}
export interface StreamPreview {
  request(
    position: number,
    scenario: StreamScenario,
    signal: AbortSignal,
    update: (snapshot: StreamSnapshot) => void,
  ): Promise<void>;
}

/** Real M07 Core/torrentd boundary. UI never receives piece indexes or paths. */
export const STREAM_PROTOCOL_VERSION = 1 as const;
export const STREAM_SCHEMA_VERSION = 1 as const;

export const STREAM_LIMITS = {
  requestBytes: 64 * 1_024,
  feedbackBudgetMs: 250,
  schedulerCriticalIntervalMs: 250,
  schedulerHealthyIntervalMs: 1_000,
  startupOperationalTargetMs: { minimum: 1_000, maximum: 5_000 },
  seekOperationalTargetMs: { minimum: 1_000, maximum: 3_000 },
  headProbeBytes: 16 * 1_024 * 1_024,
  tailProbeBytes: 8 * 1_024 * 1_024,
  ramCacheBytes: { minimum: 64 * 1_024 * 1_024, maximum: 512 * 1_024 * 1_024 },
  streamOnlyDiskBytes: 512 * 1_024 * 1_024,
  eventRatePerSecond: 4,
  rapidSeekMaximum: 32,
} as const;

export type StreamMode = "stream-only" | "keep" | "download";
export type StreamSessionState =
  | "preparing"
  | "probing"
  | "buffering"
  | "ready"
  | "stalled"
  | "completed"
  | "stopping"
  | "stopped"
  | "cancelled"
  | "failed";
export type StreamBufferZone = "critical" | "low" | "healthy" | "high";
export type StreamMappingConfidence = "indexed" | "estimated";

export interface StreamTechnicalMetadata {
  durationSeconds?: number;
  sizeBytes: number;
  bitrateBitsPerSecond?: number;
  container?: string;
  videoCodec?: string;
  audioCodec?: string;
  width?: number;
  height?: number;
  mappingConfidence: StreamMappingConfidence;
}

export interface StreamBufferSnapshot {
  seconds: number;
  bytes: number;
  targetSeconds: number;
  zone: StreamBufferZone;
  throughputBitsPerSecond?: number;
  mediaBitrateBitsPerSecond?: number;
  streamingRatio?: number;
  hotWindowReady: boolean;
  warmWindowReady: boolean;
}

export interface StreamSessionSnapshot {
  schemaVersion: typeof STREAM_SCHEMA_VERSION;
  protocolVersion: typeof STREAM_PROTOCOL_VERSION;
  streamSessionId: string;
  contentId: string;
  sourceId: string;
  fileId: string;
  mode: StreamMode;
  state: StreamSessionState;
  seekGeneration: number;
  positionSeconds: number;
  metadata?: StreamTechnicalMetadata;
  buffer: StreamBufferSnapshot;
  delivery: { kind: "partial-file"; ready: boolean };
  protected: true;
  startedAt: string;
  updatedAt: string;
}

export interface StreamMutation {
  idempotencyKey: string;
  expectedSeekGeneration?: number;
}

export interface PrepareStreamInput {
  contentId: string;
  sourceId: string;
  fileId?: string;
  mode: StreamMode;
  startPositionSeconds: number;
  durationSeconds?: number;
  mediaBitrateBitsPerSecond?: number;
  throughputBitsPerSecond?: number;
  tailRequired?: boolean;
  requestId: string;
}

export interface SetStreamPositionInput {
  streamSessionId: string;
  positionSeconds: number;
  durationSeconds?: number;
  seekGeneration: number;
}

export interface SeekStreamInput extends SetStreamPositionInput {
  mutation: StreamMutation;
}

export type StreamEventType =
  | "stream.preparing"
  | "stream.file-resolved"
  | "stream.buffer-updated"
  | "stream.ready"
  | "stream.stalled"
  | "stream.recovered"
  | "stream.completed"
  | "stream.stopped"
  | "stream.failed";

export type StreamErrorCode =
  | "STREAM_CANCELLED"
  | "STREAM_CONFLICT"
  | "STREAM_DAEMON_UNAVAILABLE"
  | "STREAM_DISK_FULL"
  | "STREAM_FILE_MISSING"
  | "STREAM_INVALID"
  | "STREAM_METADATA_INCOMPLETE"
  | "STREAM_NETWORK_LOST"
  | "STREAM_NOT_FOUND"
  | "STREAM_PROTOCOL_UNSUPPORTED"
  | "STREAM_SOURCE_UNAVAILABLE"
  | "STREAM_TIMEOUT"
  | "STREAM_UNAUTHORIZED";

export interface StreamFailure {
  code: StreamErrorCode;
  message: string;
  recoverable: boolean;
  retryable: boolean;
  userAction?: "retry" | "free-space" | "choose-source";
}

export interface StreamEvent {
  protocolVersion: typeof STREAM_PROTOCOL_VERSION;
  eventId: string;
  type: StreamEventType;
  sequence: number;
  occurredAt: string;
  snapshot?: StreamSessionSnapshot;
  error?: StreamFailure;
}

export type StreamServiceResult<T> =
  { ok: true; value: T } | { ok: false; error: StreamFailure };

export interface ProgressiveStreamService {
  prepare(
    input: PrepareStreamInput,
  ): Promise<StreamServiceResult<StreamSessionSnapshot>>;
  setPosition(
    input: SetStreamPositionInput,
  ): Promise<StreamServiceResult<StreamSessionSnapshot>>;
  seek(
    input: SeekStreamInput,
  ): Promise<StreamServiceResult<StreamSessionSnapshot>>;
  stop(input: {
    streamSessionId: string;
    mutation: StreamMutation;
  }): Promise<StreamServiceResult<StreamSessionSnapshot>>;
  cancel(input: {
    requestId: string;
  }): Promise<StreamServiceResult<{ requestId: string; cancelled: boolean }>>;
  subscribe(listener: (event: StreamEvent) => void): () => void;
}

export interface ProgressiveStreamDesktopApi extends ProgressiveStreamService {
  protocolVersion: typeof STREAM_PROTOCOL_VERSION;
  setPaused(input: {
    streamSessionId: string;
    paused: boolean;
    mutation: StreamMutation;
  }): Promise<StreamServiceResult<StreamSessionSnapshot>>;
  setVolume(input: {
    streamSessionId: string;
    volumePercent: number;
    mutation: StreamMutation;
  }): Promise<StreamServiceResult<StreamSessionSnapshot>>;
  setMuted(input: {
    streamSessionId: string;
    muted: boolean;
    mutation: StreamMutation;
  }): Promise<StreamServiceResult<StreamSessionSnapshot>>;
  selectAudio(input: {
    streamSessionId: string;
    trackId: string;
    mutation: StreamMutation;
  }): Promise<StreamServiceResult<StreamSessionSnapshot>>;
  selectSubtitle(input: {
    streamSessionId: string;
    trackId?: string;
    mutation: StreamMutation;
  }): Promise<StreamServiceResult<StreamSessionSnapshot>>;
}
