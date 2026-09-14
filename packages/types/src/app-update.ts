export type UpdateChannel = "Canary" | "Beta" | "Stable";
export type UpdateScenario =
  | "normal"
  | "current"
  | "signature"
  | "hash"
  | "incompatible"
  | "download-error"
  | "migration"
  | "offline";
export interface UpdateCandidate {
  url?: string;
  size?: number;
  version: string;
  checksum: string;
  channel: UpdateChannel;
  platform: string;
  notes: string[];
  signature: string;
  sbom: string;
  provenance: string;
}
export interface AppUpdatePreview {
  runtime?: "mock" | "desktop";
  version: string;
  installed: boolean;
  check(
    channel: UpdateChannel,
    scenario: UpdateScenario,
    signal: AbortSignal,
  ): Promise<UpdateCandidate | null>;
  apply(
    candidate: UpdateCandidate,
    scenario: UpdateScenario,
    signal: AbortSignal,
    phase: (value: string) => void,
  ): Promise<void>;
  uninstall(signal: AbortSignal): Promise<void>;
}
export interface AppUpdateDesktopApi {
  protocolVersion: 1;
  state(): Promise<
    | { ok: true; value: { version: string; installed: boolean } }
    | { ok: false; error: { message: string } }
  >;
  check(input: {
    channel: UpdateChannel;
  }): Promise<
    | { ok: true; value: UpdateCandidate | null }
    | { ok: false; error: { message: string } }
  >;
  apply(input: {
    candidate: UpdateCandidate;
  }): Promise<
    | { ok: true; value: { staged: boolean } }
    | { ok: false; error: { message: string } }
  >;
  uninstall(): Promise<
    { ok: true; value: null } | { ok: false; error: { message: string } }
  >;
}
