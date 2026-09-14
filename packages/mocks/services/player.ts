import type {
  PlaybackContent,
  PlaybackProgress,
  PlayerPreview,
  PlayerScenario,
} from "@ushark/types/player";
export class MockPlayerPreview implements PlayerPreview {
  capturePreview() {
    return structuredClone({ history: this.history });
  }
  restorePreview(value: ReturnType<MockPlayerPreview["capturePreview"]>) {
    const snapshot = structuredClone(value);
    this.history = snapshot.history;
  }

  private history = new Map<string, PlaybackProgress>();
  clear(except?: string) {
    for (const id of this.history.keys())
      if (id !== except) this.history.delete(id);
  }
  count() {
    return this.history.size;
  }
  progress(id: string) {
    return this.history.get(id);
  }
  save(id: string, position: number, watched = false) {
    this.history.set(id, { position, watched });
  }
  prepare(
    content: PlaybackContent,
    scenario: PlayerScenario,
    signal: AbortSignal,
  ) {
    return new Promise<void>((resolve, reject) => {
      const abort = () => {
        clearTimeout(timer);
        reject(new DOMException("Cancelado", "AbortError"));
      };
      const timer = setTimeout(() => {
        signal.removeEventListener("abort", abort);
        const errors: Partial<Record<PlayerScenario, string>> = {
          missing: "Nenhum arquivo local disponível.",
          removed: "O arquivo foi removido.",
          codec: "Codec não suportado nesta simulação.",
          crash:
            "O player simulado falhou. Sua biblioteca continua disponível.",
        };
        const error =
          content.available === false ? errors.missing : errors[scenario];
        if (error) reject(new Error(error));
        else resolve();
      }, 650);
      if (signal.aborted) abort();
      else signal.addEventListener("abort", abort, { once: true });
    });
  }
}
