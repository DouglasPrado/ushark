import type {
  LibraryContent,
  LibraryDraft,
  LibraryDraftDesktopApi,
  LibraryPreviewService,
} from "@ushark/types/libraries";

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

export class DesktopLibraryPreviewService implements LibraryPreviewService {
  readonly runtime = "desktop" as const;
  failSave = false;
  private drafts: LibraryDraft[] = [];
  private contents: LibraryContent[] = [];
  constructor(private readonly api: LibraryDraftDesktopApi) {
    void this.refresh();
  }
  async refresh() {
    const [drafts, contents] = await Promise.all([
      this.api.list(),
      this.api.catalog(),
    ]);
    this.drafts = unwrap(drafts);
    this.contents = unwrap(contents);
  }
  capturePreview() {
    return structuredClone({ drafts: this.drafts, contents: this.contents });
  }
  restorePreview(
    value: ReturnType<DesktopLibraryPreviewService["capturePreview"]>,
  ) {
    this.drafts = structuredClone(value.drafts);
    this.contents = structuredClone(value.contents);
  }
  list() {
    return structuredClone(this.drafts);
  }
  create(): LibraryDraft {
    return {
      id: `library-draft:${crypto.randomUUID()}`,
      revision: 0,
      name: "",
      description: "",
      author: "",
      avatar: "",
      logo: "",
      banner: "",
      accent: "#87bbef",
      memberships: [],
      collections: [],
      sections: [],
    };
  }
  async save(draft: LibraryDraft, signal: AbortSignal) {
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    const value = unwrap(
      await this.api.save({
        draft,
        mutation: { idempotencyKey: `draft-save:${crypto.randomUUID()}` },
      }),
    );
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    const index = this.drafts.findIndex((item) => item.id === value.id);
    if (index < 0) this.drafts.push(value);
    else this.drafts[index] = value;
    return structuredClone(value);
  }
  catalog() {
    return Promise.resolve(structuredClone(this.contents));
  }
  examples() {
    throw new Error(
      "Exemplos sintéticos não estão disponíveis no runtime real.",
    );
  }
  storeFork(draft: LibraryDraft, catalog: LibraryContent[]) {
    this.contents = [
      ...new Map(
        [...this.contents, ...catalog].map((item) => [item.id, item]),
      ).values(),
    ];
    const index = this.drafts.findIndex((item) => item.id === draft.id);
    if (index < 0) this.drafts.push(structuredClone(draft));
    else this.drafts[index] = structuredClone(draft);
    return structuredClone(draft);
  }
}
