import type {
  BackupSummary,
  RecoveryDesktopApi,
  RecoveryPreview,
  RecoveryScenario,
} from "@ushark/types/recovery";
export class DesktopRecoveryPreview implements RecoveryPreview {
  readonly runtime = "desktop" as const;
  private rows: BackupSummary[] = [];
  constructor(private api: RecoveryDesktopApi) {
    void this.refresh();
  }
  private async call<T>(operation: string, ...args: unknown[]) {
    const r = await this.api.call({ operation, args });
    if (!r.ok) throw new Error(r.error.message);
    return r.value as T;
  }
  async refresh() {
    this.rows = await this.call("list");
  }
  list() {
    return structuredClone(this.rows);
  }
  async create(name: string, _scenario: RecoveryScenario, signal: AbortSignal) {
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    const row = await this.call<BackupSummary>("create", name);
    this.rows.push(row);
    return row;
  }
  validate(id: string, _scenario: RecoveryScenario, signal: AbortSignal) {
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    return this.call<BackupSummary>("validate", id);
  }
  async restore(
    id: string,
    _scenario: RecoveryScenario,
    signal: AbortSignal,
    phase: (p: string) => void,
  ) {
    phase("Validando backup…");
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    await this.call("restore", id);
    phase("Restore aplicado; original preservado.");
  }
  restart(component: string, _fail: boolean, signal: AbortSignal) {
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    return this.call<string>("restart", component);
  }
  rearm(component: string) {
    void this.call("rearm", component);
  }
  shutdown(_fail: boolean, signal: AbortSignal) {
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    return this.call<void>("shutdown");
  }
}
