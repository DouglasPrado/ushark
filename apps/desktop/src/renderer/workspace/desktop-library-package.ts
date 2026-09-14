import type { LibraryContent, LibraryDraft } from "@ushark/types/libraries";
import type {
  LibraryPackageDesktopApi,
  LibraryPackagePreview,
  LibraryPackageSnapshot,
  PackageScenario,
} from "@ushark/types/library-package";
function unwrap<T>(
  result:
    | { ok: true; value: T }
    | { ok: false; error: { message: string; code: string } },
): T {
  if (result.ok) return result.value;
  throw Object.assign(new Error(result.error.message), {
    code: result.error.code,
  });
}
export class DesktopLibraryPackagePreview implements LibraryPackagePreview {
  readonly runtime = "desktop" as const;
  private outgoing: LibraryPackageSnapshot[] = [];
  private incoming: LibraryPackageSnapshot[] = [];
  constructor(private readonly api: LibraryPackageDesktopApi) {
    void this.refresh();
  }
  async refresh() {
    const value = unwrap(await this.api.list());
    this.outgoing = value.exports;
    this.incoming = value.received;
  }
  capturePreview() {
    return structuredClone({
      outgoing: this.outgoing,
      incoming: this.incoming,
    });
  }
  restorePreview(
    value: ReturnType<DesktopLibraryPackagePreview["capturePreview"]>,
  ) {
    this.outgoing = structuredClone(value.outgoing);
    this.incoming = structuredClone(value.incoming);
  }
  attachSignature(snapshot: LibraryPackageSnapshot) {
    const index = this.outgoing.findIndex((item) => item.key === snapshot.key);
    if (index >= 0) this.outgoing[index] = structuredClone(snapshot);
  }
  exports() {
    return structuredClone(this.outgoing);
  }
  received() {
    return structuredClone(this.incoming);
  }
  async export(
    draft: LibraryDraft,
    catalog: LibraryContent[],
    signal: AbortSignal,
  ) {
    void catalog;
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    const value = unwrap(
      await this.api.export({ draftId: draft.id, revision: draft.revision }),
    );
    this.outgoing.push(value);
    return structuredClone(value);
  }
  async choose(signal: AbortSignal) {
    if (signal.aborted) return undefined;
    return unwrap(await this.api.choose());
  }
  async stage(
    snapshot: LibraryPackageSnapshot,
    scenario: PackageScenario,
    signal: AbortSignal,
  ) {
    if (scenario !== "normal" && scenario !== "offline")
      throw new Error(
        "Cenários simulados não estão disponíveis no runtime real.",
      );
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    return unwrap(await this.api.stage({ snapshot }));
  }
  async commit(
    snapshot: LibraryPackageSnapshot,
    scenario: PackageScenario,
    signal: AbortSignal,
  ) {
    if (scenario !== "normal" && scenario !== "offline")
      throw new Error(
        "Cenários simulados não estão disponíveis no runtime real.",
      );
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    const value = unwrap(
      await this.api.commit({
        snapshot,
        mutation: { idempotencyKey: `package-import:${crypto.randomUUID()}` },
      }),
    );
    if (!this.incoming.some((item) => item.key === value.snapshot.key))
      this.incoming.push(value.snapshot);
    return value.message;
  }
  fixture() {
    if (!this.outgoing[0]) throw new Error("Escolha um arquivo .tslib.");
    return structuredClone(this.outgoing[0]);
  }
}
