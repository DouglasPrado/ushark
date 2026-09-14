import type { LibraryPackageSnapshot } from "./library-package";
import type { LibraryDraft } from "./libraries";
export interface LibraryForkPreview {
  copy(
    snapshot: LibraryPackageSnapshot,
    name: string,
    provenance: boolean,
    scenario: "normal" | "error" | "offline" | "missing",
    signal: AbortSignal,
  ): Promise<LibraryDraft>;
}
