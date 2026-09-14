import type { TvSessionPreview, TvSessionState } from "@ushark/types/tv";
import { previewWork } from "./library-package";
export class MockTvSessionPreview implements TvSessionPreview {
  readonly runtime = "mock" as const;
  state: TvSessionState = {
    active: false,
    connected: false,
    controller: true,
    policy: "pause",
    phase: "idle",
    pauseEpoch: 0,
  };
  async connect(reconnect: boolean, fail: boolean, signal: AbortSignal) {
    const previous = structuredClone(this.state);
    this.state.phase = reconnect ? "reconnecting" : "starting";
    try {
      await previewWork(
        signal,
        () => {
          if (fail)
            throw new Error(
              "Sessão indisponível na simulação. Tente novamente.",
            );
          this.state = {
            ...this.state,
            active: true,
            connected: true,
            phase: "connected",
          };
        },
        650,
      );
    } catch (e) {
      this.state = previous;
      throw e;
    }
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
  async stop(fail: boolean, signal: AbortSignal) {
    const previous = structuredClone(this.state);
    this.state.phase = "closing";
    try {
      await previewWork(
        signal,
        () => {
          if (fail)
            throw new Error(
              "Encerramento simulado excedeu o prazo. Tente novamente.",
            );
          this.state = {
            ...this.state,
            active: false,
            connected: false,
            phase: "idle",
          };
        },
        500,
      );
    } catch (e) {
      this.state = previous;
      throw e;
    }
  }
}
