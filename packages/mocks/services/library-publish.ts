import type {
  LibraryPublishPreview,
  PublishReview,
  PublishScenario,
  PublishedLibrary,
} from "@ushark/types/library-publish";
import type { LibraryContent, LibraryDraft } from "@ushark/types/libraries";
import { previewWork } from "./library-package";
export class MockLibraryPublishPreview implements LibraryPublishPreview {
  authenticated = false;
  private versions: PublishedLibrary[] = [];
  list() {
    return structuredClone(this.versions);
  }
  private latest(id: string) {
    return this.versions.filter((v) => v.snapshot.draft.id === id).at(-1);
  }
  prepare(draft: LibraryDraft, catalog: LibraryContent[], signal: AbortSignal) {
    const d = structuredClone(draft),
      items = structuredClone(
        catalog.filter((c) => d.memberships.some((m) => m.contentId === c.id)),
      ).map((c) => ({
        ...c,
        sources: c.sources.filter((s) =>
          d.memberships
            .find((m) => m.contentId === c.id)
            ?.sourceIds.includes(s.id),
        ),
      }));
    return previewWork(signal, (): PublishReview => {
      if (!d.name.trim())
        throw new Error(
          "Nome da biblioteca obrigatório. Salve um rascunho válido.",
        );
      const previous = this.latest(d.id),
        expectedVersion = previous?.snapshot.version ?? 0,
        version = expectedVersion + 1;
      const changes = previous
        ? (
            [
              "name",
              "description",
              "author",
              "avatar",
              "logo",
              "banner",
              "accent",
              "memberships",
              "collections",
              "sections",
            ] as const
          )
            .filter(
              (key) =>
                JSON.stringify(d[key]) !==
                JSON.stringify(previous.snapshot.draft[key]),
            )
            .map(
              (key) =>
                ({
                  name: "Nome",
                  description: "Descrição",
                  author: "Autor",
                  avatar: "Avatar",
                  logo: "Logo",
                  banner: "Banner",
                  accent: "Cor",
                  memberships: "Conteúdos/fontes e apresentação",
                  collections: "Coleções e ordem",
                  sections: "Seções e layout",
                })[key],
            )
        : ["Primeira versão da biblioteca"];
      if (!changes.length)
        changes.push("Sem mudanças na curadoria; nova versão explícita.");
      return {
        expectedVersion,
        changes,
        snapshot: {
          key: `${d.id}@${version}`,
          schema: "1.0",
          version,
          integrity: `DEMO-PUBLISH-${d.id}-${version}`,
          draft: d,
          catalog: items,
          warnings: [],
        },
      };
    });
  }
  private check(scenario: PublishScenario) {
    if (!this.authenticated) throw new Error("Entre como editor na simulação.");
    const errors: Partial<Record<PublishScenario, string>> = {
      permission: "Sem permissão de editor para esta biblioteca.",
      quota: "Quota simulada excedida; nenhuma versão criada.",
      offline: "Offline: publicação remota simulada indisponível.",
      partial: "Falha parcial no upload; nenhum snapshot ativo incompleto.",
      conflict:
        "Conflito de versão. Recarregue o diff antes de tentar novamente.",
    };
    if (errors[scenario]) throw new Error(errors[scenario]);
  }
  async publish(
    review: PublishReview,
    scenario: PublishScenario,
    signal: AbortSignal,
    progress: (v: number) => void,
  ) {
    const candidate = structuredClone(review);
    await previewWork(
      signal,
      () => {
        this.check(scenario === "partial" ? "normal" : scenario);
        progress(35);
      },
      300,
    );
    await previewWork(
      signal,
      () => {
        this.check(scenario);
        progress(75);
      },
      400,
    );
    return previewWork(
      signal,
      () => {
        this.check(scenario);
        if (
          (this.latest(candidate.snapshot.draft.id)?.snapshot.version ?? 0) !==
          candidate.expectedVersion
        )
          throw new Error("Conflito de versão. Recarregue o diff.");
        const snapshot = candidate.snapshot;
        const row = {
          snapshot,
          link: `https://ushark.invalid/library/${snapshot.draft.id}/v/${snapshot.version}`,
          code: `DEMO-${snapshot.draft.id}-${snapshot.version}`,
          withdrawn: false,
        };
        this.versions.push(row);
        progress(100);
        return structuredClone(row);
      },
      300,
    );
  }
  withdraw(id: string, scenario: PublishScenario, signal: AbortSignal) {
    return previewWork(signal, () => {
      this.check(scenario);
      this.versions = this.versions.map((v) =>
        v.snapshot.draft.id === id ? { ...v, withdrawn: true } : v,
      );
    });
  }
  resolve(reference: string) {
    const value = this.versions.find(
      (v) =>
        v.link === reference ||
        v.code === reference ||
        v.snapshot.key === reference,
    );
    return value && !value.withdrawn ? structuredClone(value) : undefined;
  }
}
