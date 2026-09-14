import type { PlaybackContent } from "./player";
import type { SourceCandidate } from "./selection";
export interface DownloadRequest {
  content: PlaybackContent;
  source: SourceCandidate;
}
export type DownloadState =
  "queued" | "downloading" | "paused" | "complete" | "cancelled" | "error";
export interface DownloadItem extends DownloadRequest {
  id: string;
  destination: string;
  state: DownloadState;
  bytes: number;
  total: number;
  speed: number;
  peers: number;
  priority: number;
  error?: string;
}
export interface DownloadLimits {
  download: number;
  upload: number;
  sessions: number;
  concurrent: number;
  probes: number;
}
export interface DownloadPreview {
  runtime?: "mock" | "desktop";
  list(): DownloadItem[];
  enqueue(request: DownloadRequest, destination: string): void | Promise<void>;
  command(
    id: string,
    action: "pause" | "resume" | "cancel" | "remove" | "complete",
  ): void | Promise<void>;
  priority(id: string, value: number): void | Promise<void>;
  tick(activePlayback: boolean): void | Promise<void>;
  configure(scenario: "normal" | "offline" | "disk" | "resume" | "error"): void;
  restart(): void | Promise<void>;
  limits: DownloadLimits;
  setLimits(limits: DownloadLimits): void | Promise<void>;
}

export const DOWNLOAD_PROTOCOL_VERSION = 1 as const;
export const DOWNLOAD_SCHEMA_VERSION = 1 as const;
export const DOWNLOAD_LIMITS = {
  requestBytes: 64 * 1_024,
  itemsMaximum: 256,
  resumeIntervalMs: 30_000,
  defaultDownloadMiBPerSecond: 8,
  defaultUploadMiBPerSecond: 1,
  defaultSessions: 4,
  defaultConcurrent: 2,
  defaultProbes: 1,
} as const;

export type DownloadDestination = "library" | "cache";
export type DownloadErrorCode =
  | "DOWNLOAD_CONFLICT"
  | "DOWNLOAD_DISK_FULL"
  | "DOWNLOAD_INVALID"
  | "DOWNLOAD_NOT_FOUND"
  | "DOWNLOAD_OFFLINE"
  | "DOWNLOAD_PROTOCOL_UNSUPPORTED"
  | "DOWNLOAD_RESUME_INVALID"
  | "DOWNLOAD_SOURCE_UNAVAILABLE"
  | "DOWNLOAD_STORAGE_FAILED"
  | "DOWNLOAD_UNAUTHORIZED";

export interface DownloadMutation {
  idempotencyKey: string;
}

export interface DownloadFailure {
  code: DownloadErrorCode;
  message: string;
  recoverable: boolean;
  retryable: boolean;
}

export type DownloadResult<T> =
  { ok: true; value: T } | { ok: false; error: DownloadFailure };

export interface DownloadSnapshot {
  schemaVersion: typeof DOWNLOAD_SCHEMA_VERSION;
  id: string;
  contentId: string;
  contentTitle: string;
  sourceId: string;
  sourceName: string;
  fileId: string;
  destination: DownloadDestination;
  state: DownloadState;
  bytesCompleted: number;
  bytesTotal: number;
  downloadRateBytesPerSecond: number;
  connectedPeers: number;
  priority: 0 | 1 | 2;
  resumeVersion: 1;
  playbackYielding: boolean;
  createdAt: string;
  updatedAt: string;
  error?: DownloadFailure;
}

export type DownloadEventType =
  | "download.queued"
  | "download.updated"
  | "download.paused"
  | "download.completed"
  | "download.cancelled"
  | "download.failed"
  | "download.removed";

export interface DownloadEvent {
  protocolVersion: typeof DOWNLOAD_PROTOCOL_VERSION;
  eventId: string;
  sequence: number;
  type: DownloadEventType;
  occurredAt: string;
  snapshot?: DownloadSnapshot;
  downloadId?: string;
  error?: DownloadFailure;
}

export interface DownloadDesktopApi {
  protocolVersion: typeof DOWNLOAD_PROTOCOL_VERSION;
  list(): Promise<
    DownloadResult<{ items: DownloadSnapshot[]; limits: DownloadLimits }>
  >;
  enqueue(input: {
    contentId: string;
    contentTitle: string;
    sourceId: string;
    sourceName: string;
    fileId?: string;
    destination: DownloadDestination;
    sizeBytes?: number;
    mutation: DownloadMutation;
  }): Promise<DownloadResult<DownloadSnapshot>>;
  command(input: {
    downloadId: string;
    action: "pause" | "resume" | "cancel";
    mutation: DownloadMutation;
  }): Promise<DownloadResult<DownloadSnapshot>>;
  removeData(input: {
    downloadId: string;
    confirmed: true;
    mutation: DownloadMutation;
  }): Promise<DownloadResult<{ downloadId: string; removed: true }>>;
  setPriority(input: {
    downloadId: string;
    priority: 0 | 1 | 2;
    mutation: DownloadMutation;
  }): Promise<DownloadResult<DownloadSnapshot>>;
  setLimits(input: {
    limits: DownloadLimits;
    mutation: DownloadMutation;
  }): Promise<DownloadResult<DownloadLimits>>;
  tick(input: {
    playbackActive: boolean;
  }): Promise<DownloadResult<{ items: DownloadSnapshot[] }>>;
  subscribe(listener: (event: DownloadEvent) => void): () => void;
}
