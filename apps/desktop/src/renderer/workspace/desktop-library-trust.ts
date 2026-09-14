import type { LibraryPackageSnapshot } from "@ushark/types/library-package";
import type {
  LibraryTrustDesktopApi,
  LibraryTrustPreview,
  TrustScenario,
} from "@ushark/types/library-trust";
function unwrap<T>(
  result: { ok: true; value: T } | { ok: false; error: { message: string } },
): T {
  if (result.ok) return result.value;
  throw new Error(result.error.message);
}
export class DesktopLibraryTrustPreview implements LibraryTrustPreview {
  readonly runtime = "desktop" as const;
  private current?: LibraryPackageSnapshot;
  constructor(private readonly api: LibraryTrustDesktopApi) {}
  capturePreview() {
    return { pins: new Map<string, string>() };
  }
  restorePreview(value: { pins: Map<string, string> }) {
    void value;
  }
  remember(snapshot: LibraryPackageSnapshot) {
    this.current = snapshot;
  }
  async verify(
    snapshot: LibraryPackageSnapshot,
    _scenario: TrustScenario,
    signal: AbortSignal,
  ) {
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    this.current = snapshot;
    return unwrap(await this.api.verify({ snapshot }));
  }
  async accept(
    id: string,
    key: string,
    _scenario: TrustScenario,
    signal: AbortSignal,
  ) {
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    const snapshot = this.current;
    if (!snapshot?.signature) throw new Error("Assinatura ausente.");
    unwrap(
      await this.api.accept({
        libraryId: id,
        key,
        snapshot,
        mutation: { idempotencyKey: `trust:${id}:${key}` },
      }),
    );
  }
  async sign(
    snapshot: LibraryPackageSnapshot,
    _unavailable: boolean,
    signal: AbortSignal,
  ) {
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    return unwrap(await this.api.sign({ snapshot }));
  }
}
