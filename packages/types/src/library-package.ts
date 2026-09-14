import type { LibraryContent, LibraryDraft } from "./libraries";
export interface LibraryPackageSnapshot {
  fileName?: string;
  signature?: {
    algorithm: "Ed25519";
    key: string;
    integrity: string;
    value: string;
    valid?: boolean;
  };
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
  runtime?: "mock" | "desktop";
  refresh?(): Promise<void>;
  choose?(signal: AbortSignal): Promise<LibraryPackageSnapshot | undefined>;
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

export const LIBRARY_PACKAGE_PROTOCOL_VERSION = 1 as const;
export const LIBRARY_PACKAGE_SCHEMA = "1.0" as const;
export const LIBRARY_PACKAGE_LIMITS = {
  bytes: 2 * 1_024 * 1_024,
  depth: 24,
  items: 5_000,
  assets: 256,
  stringBytes: 20_000,
} as const;
export type LibraryPackageErrorCode =
  | "PACKAGE_CANCELLED"
  | "PACKAGE_CONFLICT"
  | "PACKAGE_INTEGRITY_FAILED"
  | "PACKAGE_INVALID"
  | "PACKAGE_NOT_FOUND"
  | "PACKAGE_PROTOCOL_UNSUPPORTED"
  | "PACKAGE_SIGNATURE_UNSUPPORTED"
  | "PACKAGE_STORAGE_FAILED"
  | "PACKAGE_UNAUTHORIZED";
export interface LibraryPackageFailure {
  code: LibraryPackageErrorCode;
  message: string;
  recoverable: boolean;
  retryable: boolean;
}
export type LibraryPackageResult<T> =
  { ok: true; value: T } | { ok: false; error: LibraryPackageFailure };
export interface LibraryPackageDesktopApi {
  protocolVersion: typeof LIBRARY_PACKAGE_PROTOCOL_VERSION;
  list(): Promise<
    LibraryPackageResult<{
      exports: LibraryPackageSnapshot[];
      received: LibraryPackageSnapshot[];
    }>
  >;
  export(input: {
    draftId: string;
    revision: number;
  }): Promise<LibraryPackageResult<LibraryPackageSnapshot>>;
  choose(): Promise<LibraryPackageResult<LibraryPackageSnapshot | undefined>>;
  stage(input: {
    snapshot: LibraryPackageSnapshot;
  }): Promise<LibraryPackageResult<LibraryPackageSnapshot>>;
  commit(input: {
    snapshot: LibraryPackageSnapshot;
    mutation: { idempotencyKey: string };
  }): Promise<
    LibraryPackageResult<{ snapshot: LibraryPackageSnapshot; message: string }>
  >;
}
