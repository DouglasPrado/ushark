import type {
  TvSessionDesktopApi,
  TvSessionPreview,
  TvSessionState,
} from "@ushark/types/tv";
export class DesktopTvSessionPreview implements TvSessionPreview {
  readonly runtime = "desktop" as const;
  state: TvSessionState = {
    active: new URLSearchParams(location.search).get("mode") === "tv",
    connected: new URLSearchParams(location.search).get("mode") === "tv",
    controller: navigator.getGamepads?.().some(Boolean) ?? false,
    policy: "pause",
    phase:
      new URLSearchParams(location.search).get("mode") === "tv"
        ? "connected"
        : "idle",
    pauseEpoch: 0,
  };
  constructor(private api: TvSessionDesktopApi) {
    void api.read().then((r) => {
      if (r.ok) this.state = r.value;
    });
    addEventListener("gamepadconnected", () => {
      this.state = { ...this.state, controller: true };
    });
    addEventListener("gamepaddisconnected", () => {
      this.state = {
        ...this.state,
        controller: navigator.getGamepads().some(Boolean),
      };
    });
  }
  async connect(_reconnect: boolean, _fail: boolean, signal: AbortSignal) {
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    const r = await this.api.connect();
    if (!r.ok) throw new Error(r.error.message);
    this.state = r.value;
  }
  disconnect() {
    this.state = {
      ...this.state,
      connected: false,
      phase: "lost",
      pauseEpoch: this.state.pauseEpoch + 1,
    };
  }
  hotplug(connected: boolean) {
    this.state = { ...this.state, controller: connected };
  }
  async stop(_fail: boolean, signal: AbortSignal) {
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    const r = await this.api.stop();
    if (!r.ok) throw new Error(r.error.message);
    this.state = r.value;
  }
}
