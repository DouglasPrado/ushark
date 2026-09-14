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
