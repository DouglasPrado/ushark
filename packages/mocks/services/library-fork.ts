import type { LibraryForkPreview } from "@ushark/types/library-fork";
import type { LibraryPreviewService } from "@ushark/types/libraries";
import type { LibraryPackageSnapshot } from "@ushark/types/library-package";
import { previewWork } from "./library-package";
export class MockLibraryForkPreview implements LibraryForkPreview {
  readonly runtime = "mock" as const;
  constructor(private libraries: LibraryPreviewService) {}
  copy(
    snapshot: LibraryPackageSnapshot,
    name: string,
    provenance: boolean,
    scenario: "normal" | "error" | "offline" | "missing",
    signal: AbortSignal,
  ) {
    const source = structuredClone(snapshot);
    return previewWork(
      signal,
      () => {
        if (!name.trim() || name.length > 80)
          throw new Error("Informe um nome para a cópia (até 80 caracteres).");
        if (scenario === "error")
          throw new Error(
            "Falha ao copiar. Nenhum rascunho parcial foi criado.",
          );
        if (scenario === "missing")
          throw new Error(
            "Snapshot local indisponível. Abra uma versão instalada antes de duplicar.",
          );
        const draft = {
          ...source.draft,
          id: this.libraries.create().id,
          name: name.trim(),
          revision: 1,
        };
        const ids = new Map(
          draft.collections.map((c, i) => [
            c.id,
            `${draft.id}:collection:${i}`,
          ]),
        );
        draft.collections = draft.collections.map((c) => ({
          ...c,
          id: ids.get(c.id)!,
        }));
        draft.sections = draft.sections.map((s, i) => ({
          ...s,
          id: `${draft.id}:section:${i}`,
          collectionId: ids.get(s.collectionId) ?? "",
        }));
        delete draft.provenance;
        if (provenance)
          draft.provenance = {
            libraryId: source.draft.id,
            version: source.version,
          };
        return this.libraries.storeFork(draft, source.catalog);
      },
      650,
    );
  }
}
