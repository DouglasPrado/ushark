import type {
  SelectionPreview,
  SelectionPreferences,
  SourceCandidate,
  SourceHealth,
  SelectionScenario,
} from "@ushark/types/selection";
export const comparisonSources: SourceCandidate[] = [
  {
    id: "fixture-local",
    name: "Cópia local 1080p",
    local: true,
    resolution: 1080,
    sizeGB: 4,
    origin: "Minha biblioteca",
  },
  {
    id: "fixture-small",
    name: "720p compacto",
    local: false,
    resolution: 720,
    sizeGB: 1,
    origin: "Cinema em casa",
  },
  {
    id: "fixture-4k",
    name: "4K inviável",
    local: false,
    resolution: 2160,
    sizeGB: 50,
    origin: "Coleção compartilhada",
  },
];
export class MockSelectionPreview implements SelectionPreview {
  capturePreview() {
    return structuredClone({ overrides: this.overrides });
  }
  restorePreview(value: ReturnType<MockSelectionPreview["capturePreview"]>) {
    const snapshot = structuredClone(value);
    this.overrides = snapshot.overrides;
  }

  historyPenalty: (id: string) => number = () => 0;
  isLocal: (id: string) => boolean = () => false;
  private overrides = new Map<string, string>();
  override(id: string) {
    return this.overrides.get(id);
  }
  setOverride(id: string, sourceId?: string) {
    if (sourceId) this.overrides.set(id, sourceId);
    else this.overrides.delete(id);
  }
  getHealthSummary(source: SourceCandidate): SourceHealth {
    const stableKey = source.id.includes(":source:season-")
      ? source.id
      : (source.id.match(/tt(\d+)/)?.[1] ?? source.id);
    const bucket = [...stableKey].reduce(
      (sum, character) => sum + character.charCodeAt(0),
      0,
    );
    const score = [94, 82, 68, 46][bucket % 4];
    return {
      id: source.id,
      state: score < 55 ? "degraded" : "ready",
      score,
      confidence: "Alta (fixture)",
      reason: "Torrent Health determinístico de demonstração.",
      eligible: score >= 30,
    };
  }
  measure(
    sources: SourceCandidate[],
    scenario: SelectionScenario,
    signal: AbortSignal,
  ) {
    return new Promise<SourceHealth[]>((resolve, reject) => {
      const abort = () => {
        clearTimeout(timer);
        reject(new DOMException("Cancelado", "AbortError"));
      };
      const timer = setTimeout(() => {
        signal.removeEventListener("abort", abort);
        if (scenario === "error") {
          reject(
            new Error(
              "Não foi possível medir as fontes. Você pode tentar novamente.",
            ),
          );
          return;
        }
        resolve(
          sources.map((s) => {
            if (s.local)
              return {
                id: s.id,
                state: "ready",
                confidence: "Local",
                reason: "Arquivo já disponível; dispensa Health de rede.",
                eligible: true,
              };
            if (scenario === "offline" || scenario === "unavailable")
              return {
                id: s.id,
                state: "unavailable",
                confidence: "Alta (fixture)",
                reason:
                  scenario === "offline"
                    ? "Offline; precisa de rede."
                    : "Sem disponibilidade nesta fixture.",
                eligible: false,
              };
            if (scenario === "unknown")
              return {
                id: s.id,
                state: "unknown",
                confidence: "Desconhecida",
                reason:
                  "Aguardando amostra; disponibilidade ainda não determinada.",
                eligible: true,
              };
            const bitrate = (s.resolution ?? 1080) >= 2160 ? 60 : 8,
              throughput = scenario === "degraded" ? 5 : 24,
              ratio = throughput / bitrate,
              score = Math.min(100, Math.round(ratio * 35));
            return {
              id: s.id,
              state: ratio < 1 ? "degraded" : "ready",
              score,
              confidence:
                scenario === "low-confidence" ? "Baixa" : "Alta (fixture)",
              throughput,
              bitrate,
              ratio,
              startupSeconds:
                ratio < 1
                  ? undefined
                  : Math.max(
                      1,
                      Math.min(5, ((s.sizeGB ?? 4) / throughput) * 8),
                    ),
              startup:
                ratio < 1 ? "Indeterminado" : "1–5 s (estimativa simulada)",
              reason:
                ratio < 1
                  ? "Throughput insuficiente para bitrate; risco de interrupção."
                  : "Throughput estável e pieces úteis disponíveis (fixture).",
              eligible: ratio >= 1,
            };
          }),
        );
      }, 600);
      if (signal.aborted) abort();
      else signal.addEventListener("abort", abort, { once: true });
    });
  }
  rank(
    sources: SourceCandidate[],
    health: SourceHealth[],
    preferences: SelectionPreferences,
  ) {
    const max =
      preferences.resolution === "4k"
        ? 2160
        : Number(preferences.resolution.replace(/p$/, "")) || 2160;
    const eligible = sources.filter(
      (s) =>
        (s.resolution ?? 0) <= max &&
        health.find((h) => h.id === s.id)?.eligible !== false,
    );
    return [...eligible].sort((a, b) => {
      if (preferences.strategy === "smallest")
        return (
          (a.sizeGB ?? Infinity) - (b.sizeGB ?? Infinity) ||
          a.id.localeCompare(b.id)
        );
      if (a.local !== b.local) return a.local ? -1 : 1;
      if (preferences.strategy === "fast")
        return (
          (health.find((h) => h.id === a.id)?.startupSeconds ?? Infinity) -
            (health.find((h) => h.id === b.id)?.startupSeconds ?? Infinity) ||
          a.id.localeCompare(b.id)
        );
      if (preferences.strategy === "quality")
        return (
          (b.resolution ?? 0) - (a.resolution ?? 0) || a.id.localeCompare(b.id)
        );
      return (
        (health.find((h) => h.id === b.id)?.score ?? 0) -
          this.historyPenalty(b.id) -
          ((health.find((h) => h.id === a.id)?.score ?? 0) -
            this.historyPenalty(a.id)) || a.id.localeCompare(b.id)
      );
    });
  }
}
