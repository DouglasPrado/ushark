import type {
  FallbackCandidate,
  FallbackDesktopApi,
  FallbackPreview,
  FallbackScenario,
  HealthHistory,
} from "@ushark/types/fallback";
export class DesktopFallbackPreview implements FallbackPreview {
  readonly runtime = "desktop" as const;
  private rows: HealthHistory[] = [];
  private blocked = new Set<string>();
  constructor(private api: FallbackDesktopApi) {
    void this.sync();
  }
  private async call<T>(operation: string, ...args: unknown[]) {
    const r = await this.api.call({ operation, args });
    if (!r.ok) throw new Error(r.error.message);
    return r.value as T;
  }
  private async sync() {
    this.rows = await this.call("history");
  }
  alternatives(
    contentId: string,
    current: string,
    _scenario: FallbackScenario,
    signal: AbortSignal,
  ) {
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    return this.call<FallbackCandidate[]>("alternatives", contentId, current);
  }
  async prepare(
    candidate: FallbackCandidate,
    _scenario: FallbackScenario,
    signal: AbortSignal,
  ) {
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    await this.call("prepare", candidate, "");
  }
  record(id: string, success: boolean) {
    if (!success) this.blocked.add(id);
    void this.call("record", id, success).then(() => this.sync());
  }
  history() {
    return structuredClone(this.rows);
  }
  penalty(id: string) {
    const r = this.rows.find((x) => x.sourceId === id);
    return r ? Math.max(0, r.failures * 20 - r.success * 5) * r.weight : 0;
  }
  cooldown(id: string) {
    return this.blocked.has(id);
  }
  advance(seconds: number) {
    if (seconds >= 30) this.blocked.clear();
    void this.call("advance", seconds).then(() => this.sync());
  }
  clear() {
    this.rows = [];
    this.blocked.clear();
    void this.call("clear");
  }
}
