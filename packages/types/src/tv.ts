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
  runtime?: "mock" | "desktop";
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
export interface TvSessionDesktopApi {
  protocolVersion: 1;
  read(): Promise<
    | { ok: true; value: TvSessionState }
    | { ok: false; error: { message: string } }
  >;
  connect(): Promise<
    | { ok: true; value: TvSessionState }
    | { ok: false; error: { message: string } }
  >;
  stop(): Promise<
    | { ok: true; value: TvSessionState }
    | { ok: false; error: { message: string } }
  >;
}
