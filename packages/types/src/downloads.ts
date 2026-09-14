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
  list(): DownloadItem[];
  enqueue(request: DownloadRequest, destination: string): void;
  command(
    id: string,
    action: "pause" | "resume" | "cancel" | "remove" | "complete",
  ): void;
  priority(id: string, value: number): void;
  tick(activePlayback: boolean): void;
  configure(scenario: "normal" | "offline" | "disk" | "resume" | "error"): void;
  restart(): void;
  limits: DownloadLimits;
  setLimits(limits: DownloadLimits): void;
}
