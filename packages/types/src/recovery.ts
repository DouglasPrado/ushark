export type RecoveryScenario =
  | "normal"
  | "invalid"
  | "incompatible"
  | "locked"
  | "full"
  | "migration"
  | "partial"
  | "offline";
export interface BackupSummary {
  id: string;
  name: string;
  created: string;
  parts: string[];
}
export interface RecoveryPreview {
  runtime?: "mock" | "desktop";
  refresh?(): Promise<void>;
  list(): BackupSummary[];
  create(
    name: string,
    scenario: RecoveryScenario,
    signal: AbortSignal,
  ): Promise<BackupSummary>;
  validate(
    id: string,
    scenario: RecoveryScenario,
    signal: AbortSignal,
  ): Promise<BackupSummary>;
  restore(
    id: string,
    scenario: RecoveryScenario,
    signal: AbortSignal,
    phase: (p: string) => void,
  ): Promise<void>;
  restart(
    component: string,
    fail: boolean,
    signal: AbortSignal,
  ): Promise<string>;
  rearm(component: string): void;
  shutdown(fail: boolean, signal: AbortSignal): Promise<void>;
}
export interface RecoveryDesktopApi {
  protocolVersion: 1;
  call(input: {
    operation: string;
    args: unknown[];
  }): Promise<
    { ok: true; value: unknown } | { ok: false; error: { message: string } }
  >;
}
