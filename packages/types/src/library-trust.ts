import type { LibraryPackageSnapshot } from "./library-package";
export type TrustScenario =
  | "package"
  | "valid"
  | "invalid"
  | "hash"
  | "changed"
  | "storage"
  | "error"
  | "offline";
export interface TrustResult {
  status: "unsigned" | "first" | "known" | "changed" | "invalid" | "hash";
  key: string;
  previous: string;
  message: string;
}
export interface LibraryTrustPreview {
  verify(
    snapshot: LibraryPackageSnapshot,
    scenario: TrustScenario,
    signal: AbortSignal,
  ): Promise<TrustResult>;
  accept(
    id: string,
    key: string,
    scenario: TrustScenario,
    signal: AbortSignal,
  ): Promise<void>;
  sign(
    snapshot: LibraryPackageSnapshot,
    unavailable: boolean,
    signal: AbortSignal,
  ): Promise<LibraryPackageSnapshot>;
}
