export type DiagnosticCategory = "logs" | "health" | "playback" | "cache";
export type DiagnosticScenario =
  "current" | "sample" | "unknown" | "zero" | "offline" | "error" | "partial";
export interface DiagnosticSnapshot {
  session: string;
  metrics: { label: string; value: string | number | null; unit?: string }[];
  logs: { event: string; correlation: string; level: string }[];
  retention: { limit: number; days: number };
}
export interface DiagnosticPreview {
  collect(
    scenario: DiagnosticScenario,
    signal: AbortSignal,
  ): Promise<DiagnosticSnapshot>;
  export(
    snapshot: DiagnosticSnapshot,
    fail: boolean,
    signal: AbortSignal,
  ): Promise<string>;
  clear(
    category: DiagnosticCategory,
    scenario: DiagnosticScenario,
    signal: AbortSignal,
  ): Promise<string>;
  retention(limit: number, days: number): void;
  burst(): void;
}
