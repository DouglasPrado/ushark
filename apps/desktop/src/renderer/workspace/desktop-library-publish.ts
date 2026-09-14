import type {
  LibraryPublishDesktopApi,
  LibraryPublishPreview,
  PublishReview,
  PublishedLibrary,
} from "@ushark/types/library-publish";
import type { LibraryContent, LibraryDraft } from "@ushark/types/libraries";
const unwrap = <T>(
  r: { ok: true; value: T } | { ok: false; error: { message: string } },
) => {
  if (r.ok) return r.value;
  throw new Error(r.error.message);
};
export class DesktopLibraryPublishPreview implements LibraryPublishPreview {
  readonly runtime = "desktop" as const;
  authenticated = true;
  private rows: PublishedLibrary[] = [];
  constructor(private api: LibraryPublishDesktopApi) {
    void this.refresh();
  }
  async refresh() {
    this.rows = unwrap(await this.api.list());
  }
  list() {
    return structuredClone(this.rows);
  }
  prepare(draft: LibraryDraft, catalog: LibraryContent[], signal: AbortSignal) {
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    return this.api.prepare({ draft, catalog }).then(unwrap);
  }
  async publish(
    review: PublishReview,
    _scenario: never,
    signal: AbortSignal,
    progress: (v: number) => void,
  ) {
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    progress(25);
    const row = unwrap(
      await this.api.publish({
        review,
        mutation: { idempotencyKey: crypto.randomUUID() },
      }),
    );
    this.rows.push(row);
    progress(100);
    return row;
  }
  async withdraw(id: string, _scenario: never, signal: AbortSignal) {
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    unwrap(
      await this.api.withdraw({
        libraryId: id,
        mutation: { idempotencyKey: crypto.randomUUID() },
      }),
    );
    this.rows = this.rows.map((r) =>
      r.snapshot.draft.id === id ? { ...r, withdrawn: true } : r,
    );
  }
  resolve(reference: string) {
    return this.rows.find(
      (r) =>
        !r.withdrawn && [r.link, r.code, r.snapshot.key].includes(reference),
    );
  }
}
