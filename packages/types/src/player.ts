/** Frontend preview boundary; no runtime or persistence contract. */
export interface PlaybackContent {
  progressive?: boolean;
  sourceId?: string;
  sourceName?: string;
  selector?: string;
  id: string;
  title: string;
  position?: number;
  duration?: number;
  available?: boolean;
}
export type PlayerScenario =
  | "normal"
  | "missing"
  | "removed"
  | "codec"
  | "crash"
  | "no-subtitles"
  | "offline";
export interface PlaybackProgress {
  position: number;
  watched: boolean;
}
export interface PlayerPreview {
  progress(id: string): PlaybackProgress | undefined;
  save(id: string, position: number, watched?: boolean): void;
  prepare(
    content: PlaybackContent,
    scenario: PlayerScenario,
    signal: AbortSignal,
  ): Promise<void>;
}

/** Renderer convenience boundary used only when the real desktop player exists. */
export interface PlayerRuntime extends PlayerPreview {
  readonly runtime: "desktop";
  snapshot(): PlaybackSessionSnapshot | undefined;
  subscribe(
    listener: (
      snapshot: PlaybackSessionSnapshot | undefined,
      error?: PlaybackFailure,
    ) => void,
  ): () => void;
  setPaused(paused: boolean): Promise<void>;
  seek(positionSeconds: number): Promise<void>;
  setVolume(volumePercent: number): Promise<void>;
  setMuted(muted: boolean): Promise<void>;
  selectAudio(trackId: string): Promise<void>;
  selectSubtitle(trackId?: string): Promise<void>;
  chooseExternalSubtitle(): Promise<void>;
  stop(reason?: StopPlaybackInput["reason"]): Promise<void>;
}

export function isPlayerRuntime(
  service: PlayerPreview,
): service is PlayerRuntime {
  return (service as Partial<PlayerRuntime>).runtime === "desktop";
}

/** Real M05 application boundary. Raw MPV JSON and host paths stay in Core. */
export const PLAYBACK_PROTOCOL_VERSION = 1 as const;
export const PLAYBACK_SCHEMA_VERSION = 1 as const;

export const PLAYBACK_LIMITS = {
  requestBytes: 64 * 1_024,
  identifierUtf8Bytes: 256,
  titleUtf8Bytes: 512,
  tracksMaximum: 128,
  positionEventsPerSecond: 4,
  progressPersistIntervalMs: 5_000,
  progressLossBudgetMs: 6_000,
  commandTimeoutMs: 2_000,
  startupTimeoutMs: 15_000,
  shutdownTimeoutMs: 3_000,
  externalSubtitleBytes: 20 * 1_024 * 1_024,
} as const;

export type PlaybackSessionState =
  | "preparing"
  | "launching"
  | "buffering"
  | "playing"
  | "paused"
  | "seeking"
  | "ended"
  | "stopping"
  | "stopped"
  | "error";

export type PlaybackTrackKind = "audio" | "subtitle";

export interface PlaybackTrackSnapshot {
  id: string;
  kind: PlaybackTrackKind;
  language?: string;
  title?: string;
  codec?: string;
  channels?: string;
  external: boolean;
  selected: boolean;
  default: boolean;
}

export interface PlaybackMetricsSnapshot {
  videoCodec?: string;
  audioCodec?: string;
  container?: string;
  bitrateBitsPerSecond?: number;
  framesPerSecond?: number;
  droppedFrames?: number;
  hardwareDecode: "active" | "inactive" | "unknown";
  startupMs?: number;
}

export interface PlaybackSessionSnapshot {
  schemaVersion: typeof PLAYBACK_SCHEMA_VERSION;
  protocolVersion: typeof PLAYBACK_PROTOCOL_VERSION;
  sessionId: string;
  generation: number;
  contentId: string;
  sourceId: string;
  state: PlaybackSessionState;
  positionSeconds: number;
  durationSeconds?: number;
  paused: boolean;
  volumePercent: number;
  muted: boolean;
  audioTracks: PlaybackTrackSnapshot[];
  subtitleTracks: PlaybackTrackSnapshot[];
  selectedAudioTrackId?: string;
  selectedSubtitleTrackId?: string;
  firstFrameAt?: string;
  metrics: PlaybackMetricsSnapshot;
  updatedAt: string;
}

export interface PlaybackProgressSnapshot {
  schemaVersion: typeof PLAYBACK_SCHEMA_VERSION;
  contentId: string;
  positionSeconds: number;
  durationSeconds?: number;
  watched: boolean;
  completedAt?: string;
  lastPlayedAt: string;
  revision: number;
}

export interface PlaybackMutation {
  idempotencyKey: string;
  expectedGeneration?: number;
}

export interface PreparePlaybackInput {
  contentId: string;
  sourceId?: string;
  startPositionSeconds?: number;
  requestId: string;
}

export interface StartPlaybackInput {
  operationId: string;
  mutation: PlaybackMutation;
}

export interface PlaybackSessionCommandInput {
  sessionId: string;
  mutation: PlaybackMutation;
}

export interface SetPlaybackPausedInput extends PlaybackSessionCommandInput {
  paused: boolean;
}

export interface SeekPlaybackInput extends PlaybackSessionCommandInput {
  positionSeconds: number;
}

export interface SetPlaybackVolumeInput extends PlaybackSessionCommandInput {
  volumePercent: number;
}

export interface SelectPlaybackTrackInput extends PlaybackSessionCommandInput {
  trackId?: string;
}

export interface StopPlaybackInput extends PlaybackSessionCommandInput {
  reason: "user" | "ended" | "error" | "shutdown";
}

export interface PlaybackPreparationSnapshot {
  operationId: string;
  requestId: string;
  contentId: string;
  sourceId: string;
  state: "preparing" | "ready" | "cancelled" | "failed";
  resumePositionSeconds: number;
}

export type PlaybackEventType =
  | "prepare-started"
  | "prepare-ready"
  | "started"
  | "first-frame"
  | "position"
  | "paused"
  | "resumed"
  | "seeking"
  | "seeked"
  | "track-changed"
  | "buffering-start"
  | "buffering-end"
  | "ended"
  | "stopped"
  | "failed";

export interface PlaybackEvent {
  protocolVersion: typeof PLAYBACK_PROTOCOL_VERSION;
  eventId: string;
  type: PlaybackEventType;
  occurredAt: string;
  operationId?: string;
  session?: PlaybackSessionSnapshot;
  error?: PlaybackFailure;
}

export type PlaybackErrorCode =
  | "PLAYBACK_CANCELLED"
  | "PLAYBACK_CODEC_UNSUPPORTED"
  | "PLAYBACK_CONFLICT"
  | "PLAYBACK_EXTERNAL_SUBTITLE_INVALID"
  | "PLAYBACK_FILE_MISSING"
  | "PLAYBACK_INVALID"
  | "PLAYBACK_MEDIA_OPEN_FAILED"
  | "PLAYBACK_NOT_FOUND"
  | "PLAYBACK_PLAYER_CRASHED"
  | "PLAYBACK_PLAYER_UNAVAILABLE"
  | "PLAYBACK_PROTOCOL_UNSUPPORTED"
  | "PLAYBACK_SOURCE_UNAVAILABLE"
  | "PLAYBACK_STORAGE_FAILED"
  | "PLAYBACK_TIMEOUT"
  | "PLAYBACK_UNAUTHORIZED";

export interface PlaybackFailure {
  code: PlaybackErrorCode;
  message: string;
  recoverable: boolean;
  retryable: boolean;
}

export type PlaybackServiceResult<T> =
  { ok: true; value: T } | { ok: false; error: PlaybackFailure };

export interface PlaybackService {
  prepare(
    input: PreparePlaybackInput,
  ): Promise<PlaybackServiceResult<PlaybackPreparationSnapshot>>;
  start(
    input: StartPlaybackInput,
  ): Promise<PlaybackServiceResult<PlaybackSessionSnapshot>>;
  readSession(input: {
    sessionId: string;
  }): Promise<PlaybackServiceResult<PlaybackSessionSnapshot>>;
  readProgress(input: {
    contentId: string;
  }): Promise<PlaybackServiceResult<PlaybackProgressSnapshot | undefined>>;
  setPaused(
    input: SetPlaybackPausedInput,
  ): Promise<PlaybackServiceResult<PlaybackSessionSnapshot>>;
  seek(
    input: SeekPlaybackInput,
  ): Promise<PlaybackServiceResult<PlaybackSessionSnapshot>>;
  setVolume(
    input: SetPlaybackVolumeInput,
  ): Promise<PlaybackServiceResult<PlaybackSessionSnapshot>>;
  setMuted(
    input: PlaybackSessionCommandInput & { muted: boolean },
  ): Promise<PlaybackServiceResult<PlaybackSessionSnapshot>>;
  selectAudio(
    input: SelectPlaybackTrackInput & { trackId: string },
  ): Promise<PlaybackServiceResult<PlaybackSessionSnapshot>>;
  selectSubtitle(
    input: SelectPlaybackTrackInput,
  ): Promise<PlaybackServiceResult<PlaybackSessionSnapshot>>;
  stop(
    input: StopPlaybackInput,
  ): Promise<PlaybackServiceResult<PlaybackProgressSnapshot>>;
  cancelPreparation(input: {
    requestId: string;
  }): Promise<PlaybackServiceResult<{ requestId: string; cancelled: boolean }>>;
  subscribe(listener: (event: PlaybackEvent) => void): () => void;
}

export interface PlaybackDesktopApi extends PlaybackService {
  protocolVersion: typeof PLAYBACK_PROTOCOL_VERSION;
  chooseExternalSubtitle(input: {
    sessionId: string;
    mutation: PlaybackMutation;
  }): Promise<PlaybackServiceResult<PlaybackSessionSnapshot | undefined>>;
}
