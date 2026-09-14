export interface TvSessionState {
  active: boolean;
  connected: boolean;
  controller: boolean;
  policy: "pause" | "continue";
  phase:
    "idle" | "starting" | "connected" | "lost" | "reconnecting" | "closing";
  pauseEpoch: number;
}
export interface TvSessionPreview {
  state: TvSessionState;
  connect(
    reconnect: boolean,
    fail: boolean,
    signal: AbortSignal,
  ): Promise<void>;
  disconnect(): void;
  hotplug(connected: boolean): void;
  stop(fail: boolean, signal: AbortSignal): Promise<void>;
}
