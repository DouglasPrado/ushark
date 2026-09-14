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
