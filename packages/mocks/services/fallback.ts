import type {
  FallbackPreview,
  FallbackScenario,
  FallbackCandidate,
  HealthHistory,
} from "@ushark/types/fallback";
import type { SourceCandidate } from "@ushark/types/selection";
import { previewWork } from "./library-package";
export class MockFallbackPreview implements FallbackPreview {
  clear() {
    this.events.clear();
    this.blocked.clear();
  }
  private clock = 0;
  private events = new Map<
    string,
    { success: number; failures: number; at: number }
  >();
  private blocked = new Map<string, number>();
  constructor(
    private readSources: (id: string) => Promise<SourceCandidate[]>,
  ) {}
  async alternatives(
    contentId: string,
    current: string,
    scenario: FallbackScenario,
    signal: AbortSignal,
  ) {
    const sources = await this.readSources(contentId);
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    return previewWork(signal, () => {
      if (scenario === "none" || scenario === "offline") return [];
      const values: FallbackCandidate[] =
        scenario === "catalog"
          ? sources.map((s) => ({
              ...s,
              compatible: false,
              reason:
                "Edição/duração não verificadas nesta fonte; handoff bloqueado.",
            }))
          : [
              {
                id: "fallback-compatible",
                name: "Alternativa compatível 1080p",
                local: true,
                compatible: true,
                reason: "Mesmo conteúdo/episódio e duração na fixture.",
              },
              {
                id: "fallback-other-cut",
                name: "Outra edição · duração diferente",
                local: false,
                compatible: false,
                reason: "Edição incompatível; não trocar automaticamente.",
              },
            ];
      return values
        .filter((s) => s.id !== current)
        .map((s) =>
          scenario === "incompatible"
            ? { ...s, compatible: false, reason: "Edição incompatível." }
            : s,
        )
        .sort((a, b) => this.penalty(a.id) - this.penalty(b.id));
    });
  }
  prepare(
    candidate: FallbackCandidate,
    scenario: FallbackScenario,
    signal: AbortSignal,
  ) {
    return previewWork(
      signal,
      () => {
        if (!candidate.compatible)
          throw new Error(
            "Compatibilidade não verificada. Fonte atual preservada.",
          );
        if (this.cooldown(candidate.id))
          throw new Error("Candidata em cooldown/blacklist temporária.");
        if (scenario === "failure") {
          this.record(candidate.id, false);
          throw new Error(
            "Preparo da alternativa falhou. Fonte atual preservada.",
          );
        }
      },
      800,
    );
  }
  record(sourceId: string, success: boolean) {
    const previous = this.events.get(sourceId) ?? {
      success: 0,
      failures: 0,
      at: this.clock,
    };
    this.events.set(sourceId, {
      success: previous.success + Number(success),
      failures: previous.failures + Number(!success),
      at: this.clock,
    });
    this.blocked.set(sourceId, this.clock + 10);
  }
  history(): HealthHistory[] {
    return [...this.events].map(([sourceId, e]) => {
      const age = this.clock - e.at;
      return {
        sourceId,
        success: e.success,
        failures: e.failures,
        throughput: e.success ? 24 : 0,
        startup: e.success ? 2 : 0,
        buffering: e.failures * 4,
        age,
        weight: age >= 60 ? 0 : Math.max(0, 1 - age / 60),
        algorithm: "demo-v1",
      };
    });
  }
  penalty(sourceId: string) {
    const row = this.history().find((h) => h.sourceId === sourceId);
    return row
      ? Math.max(0, row.failures * 20 - row.success * 5) * row.weight
      : 0;
  }
  cooldown(sourceId: string) {
    return (this.blocked.get(sourceId) ?? 0) > this.clock;
  }
  advance(seconds: number) {
    this.clock += seconds;
  }
}
