import type {
  LibraryContent,
  LibraryDraft,
  LibraryPreviewService,
} from "@ushark/types/libraries";
import { discoveryFixtures } from "./discovery";
export function validateLibrary(draft: LibraryDraft) {
  if (!draft.name.trim() || draft.name.length > 80)
    return "Dê um nome à biblioteca (até 80 caracteres).";
  if (!/^#[0-9a-f]{6}$/i.test(draft.accent))
    return "Informe uma cor hexadecimal como #87bbef.";
  if (
    draft.sections.some(
      (s) =>
        s.type !== "continue" &&
        !draft.collections.some((c) => c.id === s.collectionId),
    )
  )
    return "Cada seção visual precisa de uma coleção existente.";
  if (draft.collections.some((c) => !c.name.trim()))
    return "Nomeie cada coleção.";
  return "";
}
export class MockLibraryPreviewService implements LibraryPreviewService {
  readonly runtime = "mock" as const;
  capturePreview() {
    return structuredClone({
      drafts: this.drafts,
      retained: this.retained,
      count: this.count,
      sample: this.sample,
    });
  }
  restorePreview(
    value: ReturnType<MockLibraryPreviewService["capturePreview"]>,
  ) {
    const snapshot = structuredClone(value);
    this.drafts = snapshot.drafts;
    this.retained = snapshot.retained;
    this.count = Math.max(this.count, snapshot.count);
    this.sample = snapshot.sample;
  }

  private retained = new Map<string, LibraryContent>();
  storeFork(draft: LibraryDraft, catalog: LibraryContent[]) {
    const value = structuredClone(draft);
    this.drafts.set(value.id, value);
    for (const item of catalog)
      this.retained.set(item.id, structuredClone(item));
    return structuredClone(value);
  }
  private drafts = new Map<string, LibraryDraft>();
  private count = 0;
  private sample = false;
  failSave = false;
  constructor(private readCatalog: () => Promise<LibraryContent[]>) {}
  list() {
    return structuredClone([...this.drafts.values()]);
  }
  create(): LibraryDraft {
    return {
      id: `library-draft-${++this.count}`,
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
  examples() {
    this.sample = true;
  }
  async catalog() {
    const current = this.sample
      ? discoveryFixtures().map((x) => ({
          id: x.id,
          title: x.title,
          synopsis: x.synopsis,
          poster: x.poster,
          sources: x.sources.map((s) => ({
            id: s.id,
            name: s.quality,
            local: true,
            origin: "Catálogo sintético",
          })),
        }))
      : await this.readCatalog();
    return [
      ...new Map(
        [...current, ...this.retained.values()].map((c) => [c.id, c]),
      ).values(),
    ];
  }
  save(value: LibraryDraft, signal: AbortSignal) {
    const draft = structuredClone(value);
    return new Promise<LibraryDraft>((resolve, reject) => {
      const abort = () => {
        clearTimeout(timer);
        reject(new DOMException("Cancelado", "AbortError"));
      };
      const timer = setTimeout(() => {
        signal.removeEventListener("abort", abort);
        const invalid = validateLibrary(draft);
        if (invalid) {
          reject(new Error(invalid));
          return;
        }
        if (this.failSave) {
          reject(
            new Error("Não foi possível salvar o rascunho nesta simulação."),
          );
          return;
        }
        const previous = this.drafts.get(draft.id);
        if (previous && previous.revision !== draft.revision) {
          reject(
            new Error(
              "Revisão alterada; reabra a versão salva antes de substituir.",
            ),
          );
          return;
        }
        draft.revision++;
        this.drafts.set(draft.id, draft);
        resolve(structuredClone(draft));
      }, 450);
      if (signal.aborted) abort();
      else signal.addEventListener("abort", abort, { once: true });
    });
  }
}
