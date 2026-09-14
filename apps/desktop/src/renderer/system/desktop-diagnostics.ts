import type {
  DiagnosticCategory,
  DiagnosticDesktopApi,
  DiagnosticPreview,
  DiagnosticScenario,
  DiagnosticSnapshot,
} from "@ushark/types/diagnostics";
export class DesktopDiagnosticPreview implements DiagnosticPreview {
  readonly runtime = "desktop" as const;
  constructor(private api: DiagnosticDesktopApi) {}
  private async call<T>(operation: string, ...args: unknown[]) {
    const r = await this.api.call({ operation, args });
    if (!r.ok) throw new Error(r.error.message);
    return r.value as T;
  }
  collect(_scenario: DiagnosticScenario, signal: AbortSignal) {
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    return this.call<DiagnosticSnapshot>("collect");
  }
  export(snapshot: DiagnosticSnapshot, _fail: boolean, signal: AbortSignal) {
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    return this.call<string>("export", snapshot);
  }
  clear(
    category: DiagnosticCategory,
    _scenario: DiagnosticScenario,
    signal: AbortSignal,
  ) {
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    return this.call<string>("clear", category);
  }
  retention(limit: number, days: number) {
    void this.call("retention", limit, days);
  }
  burst() {
    void this.call("burst");
  }
}
