import type {
  DiagnosticPreview,
  DiagnosticSnapshot,
  DiagnosticCategory,
  DiagnosticScenario,
} from "@ushark/types/diagnostics";
import { previewWork } from "./library-package";
export function sanitizeDiagnosticLog(value: Record<string, unknown>) {
  return {
    event: ["preview_started", "fixture_event", "cleanup_completed"].includes(
      String(value.event),
    )
      ? String(value.event)
      : "event_redacted",
    correlation: /^demo-[a-z0-9-]{1,40}$/.test(String(value.correlation))
      ? String(value.correlation)
      : "demo-redacted",
    level: ["info", "warn", "error"].includes(String(value.level))
      ? String(value.level)
      : "info",
  };
}
export class MockDiagnosticPreview implements DiagnosticPreview {
  readonly runtime = "mock" as const;
  private logs = [
    sanitizeDiagnosticLog({
      event: "preview_started",
      correlation: "demo-session-1",
      level: "info",
      token: "SYNTHETIC_SECRET",
      path: "/Users/example/private",
      magnet: "magnet:?xt=urn:btih:SYNTHETIC",
    }),
  ];
  private limit = 20;
  private days = 7;
  constructor(
    private read: () => Pick<DiagnosticSnapshot, "session" | "metrics">,
    private clearCategory: (
      category: DiagnosticCategory,
      signal: AbortSignal,
    ) => Promise<string>,
  ) {}
  collect(scenario: DiagnosticScenario, signal: AbortSignal) {
    return previewWork(signal, () => {
      if (scenario === "error")
        throw new Error(
          "Não foi possível coletar. Último snapshot preservado.",
        );
      let current = this.read();
      if (
        scenario === "sample" ||
        scenario === "zero" ||
        scenario === "unknown"
      )
        current = {
          session:
            scenario === "sample"
              ? "Sessão sintética ativa"
              : "Fixture de métricas",
          metrics: [
            "Throughput",
            "Buffer",
            "Streaming Ratio",
            "Peers",
            "Upload",
            "Pieces disponíveis",
            "FPS",
            "Frames perdidos",
            "Health bruto",
            "Health exibido",
          ].map((label, i) => ({
            label,
            value:
              scenario === "unknown"
                ? null
                : scenario === "zero"
                  ? 0
                  : [24, 12, 3, 8, 0, 120, 60, 0, 82, 80][i],
            unit: ["Mbps", "s", "", "", "Mbps", "", "fps", "", "", ""][i],
          })),
        };
      return {
        ...current,
        metrics: [
          ...current.metrics,
          { label: "Decoder real", value: null },
          { label: "DB / WAL real", value: null },
          { label: "Sunshine encode real", value: null },
        ],
        logs: structuredClone(this.logs),
        retention: { limit: this.limit, days: this.days },
      };
    });
  }
  export(snapshot: DiagnosticSnapshot, fail: boolean, signal: AbortSignal) {
    return previewWork(signal, () => {
      if (fail)
        throw new Error("Exportação simulada falhou. Nenhum pacote criado.");
      return JSON.stringify(
        {
          format: "diagnostic-preview-v1",
          mode: "simulated",
          session: snapshot.session,
          metrics: snapshot.metrics,
          logs: snapshot.logs.map(sanitizeDiagnosticLog),
          retention: snapshot.retention,
        },
        null,
        2,
      );
    });
  }
  async clear(
    category: DiagnosticCategory,
    scenario: DiagnosticScenario,
    signal: AbortSignal,
  ) {
    await previewWork(signal, () => {
      if (scenario === "error")
        throw new Error("Limpeza indisponível; dados preservados.");
    });
    if (scenario === "partial" && category !== "logs")
      return "Limpeza parcial: categoria protegida preservada. Nenhuma biblioteca removida.";
    if (category === "logs") {
      this.logs = [];
      return "Logs da simulação removidos. Biblioteca e progresso preservados.";
    }
    return this.clearCategory(category, signal);
  }
  retention(limit: number, days: number) {
    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 1000 ||
      !Number.isInteger(days) ||
      days < 1 ||
      days > 365
    )
      throw new Error(
        "Limite entre 1 e 1000; retenção entre 1 e 365 dias inteiros.",
      );
    this.limit = limit;
    this.days = days;
    this.logs = this.logs.slice(-limit);
  }
  burst() {
    for (let i = 0; i < 50; i++) {
      this.logs.push(
        sanitizeDiagnosticLog({
          event: "fixture_event",
          correlation: `demo-event-${i}`,
          level: "info",
        }),
      );
      this.logs = this.logs.slice(-this.limit);
    }
  }
}
