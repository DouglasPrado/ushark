import type { PlaybackContent } from "./player";
export interface NextResult {
  kind: "not-episode" | "next" | "season-end" | "series-end" | "missing";
  next?: PlaybackContent;
  choices?: PlaybackContent[];
  requiresSourceChoice?: boolean;
  message: string;
  sessionId?: string;
  generation?: number;
}
export interface NextEpisodePreview {
  runtime?: "mock" | "desktop";
  resolve(id: string, signal: AbortSignal): Promise<NextResult>;
  prepare(
    fail: boolean,
    signal: AbortSignal,
    next?: PlaybackContent,
  ): Promise<void>;
  cancel?(signal: AbortSignal): Promise<void>;
  claimStart?(signal: AbortSignal): Promise<boolean>;
}

export const NEXT_EPISODE_PROTOCOL_VERSION = 1 as const;
export const NEXT_EPISODE_SCHEMA_VERSION = 1 as const;
export const NEXT_EPISODE_COUNTDOWN_SECONDS = 5 as const;
export type NextEpisodeErrorCode =
  | "NEXT_CANCELLED"
  | "NEXT_CONFLICT"
  | "NEXT_INVALID"
  | "NEXT_NOT_FOUND"
  | "NEXT_PREPARATION_FAILED"
  | "NEXT_PROTOCOL_UNSUPPORTED"
  | "NEXT_STORAGE_FAILED"
  | "NEXT_UNAUTHORIZED";
export interface NextEpisodeFailure {
  code: NextEpisodeErrorCode;
  message: string;
  recoverable: boolean;
  retryable: boolean;
}
export type NextEpisodeResult<T> =
  { ok: true; value: T } | { ok: false; error: NextEpisodeFailure };
export interface NextEpisodeSessionSnapshot extends NextResult {
  schemaVersion: typeof NEXT_EPISODE_SCHEMA_VERSION;
  sessionId: string;
  generation: number;
  currentEpisodeId: string;
  state: "resolved" | "preparing" | "ready" | "cancelled" | "started";
  selectedSourceId?: string;
  countdownSeconds: typeof NEXT_EPISODE_COUNTDOWN_SECONDS;
  updatedAt: string;
}
export interface NextEpisodeDesktopApi {
  protocolVersion: typeof NEXT_EPISODE_PROTOCOL_VERSION;
  resolve(input: {
    contentId: string;
  }): Promise<NextEpisodeResult<NextEpisodeSessionSnapshot>>;
  prepare(input: {
    sessionId: string;
    generation: number;
    sourceId: string;
    fileId?: string;
    mutation: { idempotencyKey: string };
  }): Promise<NextEpisodeResult<NextEpisodeSessionSnapshot>>;
  cancel(input: {
    sessionId: string;
    generation: number;
    mutation: { idempotencyKey: string };
  }): Promise<NextEpisodeResult<NextEpisodeSessionSnapshot>>;
  claimStart(input: {
    sessionId: string;
    generation: number;
    mutation: { idempotencyKey: string };
  }): Promise<NextEpisodeResult<NextEpisodeSessionSnapshot>>;
}
