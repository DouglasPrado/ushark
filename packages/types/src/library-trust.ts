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
  runtime?: "mock" | "desktop";
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
export const LIBRARY_TRUST_PROTOCOL_VERSION = 1 as const;
export type LibraryTrustResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: string; message: string; retryable: boolean } };
export interface LibraryTrustDesktopApi {
  protocolVersion: typeof LIBRARY_TRUST_PROTOCOL_VERSION;
  verify(input: {
    snapshot: LibraryPackageSnapshot;
  }): Promise<LibraryTrustResult<TrustResult>>;
  accept(input: {
    libraryId: string;
    key: string;
    snapshot: LibraryPackageSnapshot;
    mutation: { idempotencyKey: string };
  }): Promise<LibraryTrustResult<void>>;
  sign(input: {
    snapshot: LibraryPackageSnapshot;
  }): Promise<LibraryTrustResult<LibraryPackageSnapshot>>;
}
