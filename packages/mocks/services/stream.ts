import type {
  StreamPreview,
  StreamScenario,
  StreamSnapshot,
} from "@ushark/types/stream";
export class MockStreamPreview implements StreamPreview {
  private generation = 0;
  request(
    position: number,
    scenario: StreamScenario,
    signal: AbortSignal,
    update: (s: StreamSnapshot) => void,
  ) {
    const generation = ++this.generation,
      bitrate = scenario === "vbr" ? 32 : 8,
      target = scenario === "slow" ? 20 : 12;
    return new Promise<void>((resolve, reject) => {
      let elapsed = 0;
      const abort = () => {
        clearInterval(timer);
        reject(new DOMException("Cancelado", "AbortError"));
      };
      const timer = setInterval(() => {
        if (signal.aborted || generation !== this.generation) {
          abort();
          return;
        }
        elapsed++;
        const errors: Partial<Record<StreamScenario, string>> = {
          metadata: "Metadata incompleta: índice ainda indisponível.",
          network:
            "Rede perdida: buffer esgotado. Reconecte para tentar novamente.",
          disk: "Disco cheio: escrita simulada pausada. Libere espaço antes de tentar novamente.",
        };
        if (elapsed === 2 && errors[scenario]) {
          clearInterval(timer);
          signal.removeEventListener("abort", abort);
          reject(new Error(errors[scenario]));
          return;
        }
        const seconds = Math.min(target, Math.max(0, (elapsed - 1) * 4));
        update({
          phase:
            elapsed === 1
              ? "metadata"
              : seconds >= target
                ? "ready"
                : "buffering",
          seconds,
          megabytes: (seconds * bitrate) / 8,
          bitrate,
          position,
          target,
          generation,
        });
        if (seconds >= target) {
          clearInterval(timer);
          signal.removeEventListener("abort", abort);
          resolve();
        }
      }, 200);
      if (signal.aborted) abort();
      else signal.addEventListener("abort", abort, { once: true });
    });
  }
}
