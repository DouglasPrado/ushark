import type { LibraryContent, LibraryDraft } from "./libraries";
export interface LibraryPackageSnapshot {
  signature?: { key: string; integrity: string; valid: boolean };
  key: string;
  schema: string;
  version: number;
  integrity: string;
  draft: LibraryDraft;
  catalog: LibraryContent[];
  warnings: string[];
}
export type PackageScenario =
  | "normal"
  | "minor"
  | "major"
  | "invalid"
  | "asset"
  | "signature"
  | "traversal"
  | "absolute"
  | "symlink"
  | "bomb"
  | "code"
  | "limits"
  | "protocol"
  | "conflict"
  | "commit-error"
  | "offline";
export interface LibraryPackagePreview {
  attachSignature(snapshot: LibraryPackageSnapshot): void;
  exports(): LibraryPackageSnapshot[];
  received(): LibraryPackageSnapshot[];
  export(
    draft: LibraryDraft,
    catalog: LibraryContent[],
    signal: AbortSignal,
  ): Promise<LibraryPackageSnapshot>;
  stage(
    snapshot: LibraryPackageSnapshot,
    scenario: PackageScenario,
    signal: AbortSignal,
  ): Promise<LibraryPackageSnapshot>;
  commit(
    snapshot: LibraryPackageSnapshot,
    scenario: PackageScenario,
    signal: AbortSignal,
  ): Promise<string>;
  fixture(): LibraryPackageSnapshot;
}
