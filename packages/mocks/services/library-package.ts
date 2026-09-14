import type { LibraryContent, LibraryDraft } from "@ushark/types/libraries";
import type {
  LibraryPackagePreview,
  LibraryPackageSnapshot,
  PackageScenario,
} from "@ushark/types/library-package";
import { discoveryFixtures } from "./discovery";
// Delays model UI work only; no archive parser, filesystem, hash or cryptography.
export function previewWork<T>(
  signal: AbortSignal,
  work: () => T,
  ms = 500,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException("Cancelado", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      try {
        resolve(work());
      } catch (e) {
        reject(e);
      }
    }, ms);
    if (signal.aborted) abort();
    else signal.addEventListener("abort", abort, { once: true });
  });
}
export class MockLibraryPackagePreview implements LibraryPackagePreview {
  capturePreview() {
    return structuredClone({
      incoming: this.incoming,
      outgoing: this.outgoing,
    });
  }
  restorePreview(
    value: ReturnType<MockLibraryPackagePreview["capturePreview"]>,
  ) {
    const snapshot = structuredClone(value);
    this.incoming = snapshot.incoming;
    this.outgoing = snapshot.outgoing;
  }

  private outgoing: LibraryPackageSnapshot[] = [];
  private incoming = new Map<string, LibraryPackageSnapshot>();
  attachSignature(snapshot: LibraryPackageSnapshot) {
    this.outgoing = this.outgoing.map((p) =>
      p.key === snapshot.key ? structuredClone(snapshot) : p,
    );
  }
  exports() {
    return structuredClone(this.outgoing);
  }
  received() {
    return structuredClone([...this.incoming.values()]);
  }
  export(draft: LibraryDraft, catalog: LibraryContent[], signal: AbortSignal) {
    const snapshot = structuredClone({
      draft,
      catalog: catalog
        .filter((c) => draft.memberships.some((m) => m.contentId === c.id))
        .map((c) => ({
          ...c,
          sources: c.sources.filter((s) =>
            draft.memberships
              .find((m) => m.contentId === c.id)
              ?.sourceIds.includes(s.id),
          ),
        })),
    });
    return previewWork(signal, () => {
      const version =
        this.outgoing.filter((p) => p.draft.id === draft.id).length + 1;
      const value: LibraryPackageSnapshot = {
        ...snapshot,
        key: `${draft.id}@${version}`,
        schema: "1.0",
        version,
        integrity: `DEMO-${draft.id}-${version}`,
        warnings: [],
      };
      this.outgoing.push(value);
      return structuredClone(value);
    });
  }
  fixture(): LibraryPackageSnapshot {
    const item = discoveryFixtures()[0];
    const draft: LibraryDraft = {
      id: "package-demo",
      revision: 1,
      name: "Cinema portátil",
      description: "Histórias sintéticas para compartilhar.",
      author: "Curadoria de exemplo",
      avatar: "",
      logo: "",
      banner: "",
      accent: "#87bbef",
      memberships: [
        {
          contentId: item.id,
          sourceIds: item.sources.map((s) => s.id),
          titleOverride: "",
        },
      ],
      collections: [
        { id: "demo-collection", name: "Seleção", items: [item.id] },
      ],
      sections: [
        {
          id: "demo-section",
          title: "Seleção",
          type: "grid",
          collectionId: "demo-collection",
        },
      ],
    };
    return {
      key: "package-demo@1",
      schema: "1.0",
      version: 1,
      integrity: "DEMO-package-demo-1",
      draft,
      catalog: [
        {
          id: item.id,
          title: item.title,
          poster: item.poster,
          synopsis: item.synopsis,
          sources: item.sources.map((s) => ({
            id: s.id,
            name: s.quality,
            local: false,
            origin: "Pacote sintético",
          })),
        },
      ],
      warnings: [],
    };
  }
  stage(
    snapshot: LibraryPackageSnapshot,
    scenario: PackageScenario,
    signal: AbortSignal,
  ) {
    const value = structuredClone(snapshot);
    return previewWork(signal, () => {
      const blocked: Partial<Record<PackageScenario, string>> = {
        major:
          "Schema major incompatível. Atualize o leitor antes de importar.",
        invalid: "Manifest inválido: referências ou IDs inconsistentes.",
        signature:
          "Assinatura presente sem verificação suportada. Importação bloqueada.",
        traversal: "Caminho com traversal rejeitado.",
        absolute: "Caminho absoluto externo rejeitado.",
        symlink: "Link simbólico rejeitado.",
        bomb: "Limite de expansão do pacote excedido.",
        code: "Conteúdo executável, HTML, CSS ou script rejeitado.",
        limits:
          "Limites de bytes, profundidade, itens, assets ou strings excedidos.",
        protocol: "Protocolo ou destino de asset não permitido.",
      };
      if (blocked[scenario])
        throw new Error(
          `${blocked[scenario]} Cenário simulado; catálogo preservado.`,
        );
      if (scenario === "minor") {
        value.schema = "1.1";
        value.warnings.push(
          "Schema minor compatível; extensão desconhecida ignorada.",
        );
      }
      if (scenario === "asset") {
        value.catalog.forEach((c) => delete c.poster);
        value.draft.banner = "";
        value.warnings.push("Asset ausente: usando apresentação sem imagem.");
      }
      if (scenario === "conflict") value.integrity += "-divergente";
      return value;
    });
  }
  commit(
    snapshot: LibraryPackageSnapshot,
    scenario: PackageScenario,
    signal: AbortSignal,
  ) {
    const value = structuredClone(snapshot);
    return previewWork(signal, () => {
      if (scenario === "commit-error")
        throw new Error(
          "Falha ao importar; perfil receptor preservado. Tente novamente.",
        );
      const existing = this.incoming.get(value.key);
      if (existing && existing.integrity !== value.integrity)
        throw new Error(
          "Conflito: mesma identidade e versão com conteúdo diferente. Nada substituído.",
        );
      if (existing)
        return "Este pacote já está no perfil receptor. Nenhuma duplicação.";
      this.incoming.set(value.key, value);
      return "Biblioteca importada no perfil receptor simulado.";
    });
  }
}
