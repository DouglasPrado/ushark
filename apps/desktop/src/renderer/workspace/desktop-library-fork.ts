import type {
  LibraryForkDesktopApi,
  LibraryForkPreview,
} from "@ushark/types/library-fork";
import type { LibraryPackageSnapshot } from "@ushark/types/library-package";
export class DesktopLibraryForkPreview implements LibraryForkPreview {
  readonly runtime = "desktop" as const;
  constructor(private api: LibraryForkDesktopApi) {}
  async copy(
    snapshot: LibraryPackageSnapshot,
    name: string,
    provenance: boolean,
    _scenario: "normal" | "error" | "offline" | "missing",
    signal: AbortSignal,
  ) {
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    const r = await this.api.copy({
      snapshot,
      name,
      provenance,
      mutation: { idempotencyKey: crypto.randomUUID() },
    });
    if (!r.ok) throw new Error(r.error.message);
    return r.value;
  }
}
