import type { PlaybackContent } from "./player";
export interface NextResult {
  kind: "not-episode" | "next" | "season-end" | "series-end" | "missing";
  next?: PlaybackContent;
  choices?: PlaybackContent[];
  requiresSourceChoice?: boolean;
  message: string;
}
export interface NextEpisodePreview {
  resolve(id: string, signal: AbortSignal): Promise<NextResult>;
  prepare(fail: boolean, signal: AbortSignal): Promise<void>;
}
