import type { LibraryPackageSnapshot } from "./library-package";
import type { LibraryDraft } from "./libraries";
export interface LibraryForkPreview {
  runtime?: "mock" | "desktop";
  copy(
    snapshot: LibraryPackageSnapshot,
    name: string,
    provenance: boolean,
    scenario: "normal" | "error" | "offline" | "missing",
    signal: AbortSignal,
  ): Promise<LibraryDraft>;
}
export interface LibraryForkDesktopApi {
  protocolVersion: 1;
  copy(input: {
    snapshot: LibraryPackageSnapshot;
    name: string;
    provenance: boolean;
    mutation: { idempotencyKey: string };
  }): Promise<
    | { ok: true; value: LibraryDraft }
    | { ok: false; error: { message: string } }
  >;
}
