import type {
  SubscriptionPreview,
  LibrarySubscription,
  SyncScenario,
} from "@ushark/types/subscriptions";
import type { LibraryPublishPreview } from "@ushark/types/library-publish";
import type { LibraryPackageSnapshot } from "@ushark/types/library-package";
import type { LibraryContent } from "@ushark/types/libraries";
import type { DiscoveryItem } from "@ushark/types/discovery";
import { MockLibraryPackagePreview, previewWork } from "./library-package";
export class MockSubscriptionPreview implements SubscriptionPreview {
  capturePreview() {
    return structuredClone({
      subscriptions: this.subscriptions,
      saved: this.saved,
      favorites: this.favorites,
    });
  }
  restorePreview(value: ReturnType<MockSubscriptionPreview["capturePreview"]>) {
    const snapshot = structuredClone(value);
    this.subscriptions = snapshot.subscriptions;
    this.saved = snapshot.saved;
    this.favorites = snapshot.favorites;
  }

  private subscriptions = new Map<string, LibrarySubscription>();
  private saved = new Map<string, LibraryContent>();
  private favorites = new Set<string>();
  constructor(private publisher: LibraryPublishPreview) {}
  list() {
    return structuredClone([...this.subscriptions.values()]);
  }
  resolve(reference: string, scenario: SyncScenario, signal: AbortSignal) {
    return previewWork(signal, () => {
      if (scenario === "offline")
        throw new Error(
          "Offline: não é possível resolver uma nova biblioteca. As instaladas continuam disponíveis.",
        );
      if (scenario === "error")
        throw new Error("Serviço simulado indisponível. Tente novamente.");
      const value = reference.trim();
      if (!value || value.length > 2048)
        throw new Error("Informe um link ou código válido.");
      const code = value.startsWith("ushark://library/")
        ? value.slice("ushark://library/".length)
        : value;
      if (code === "DEMO-CINEMA")
        return new MockLibraryPackagePreview().fixture();
      const found = this.publisher.resolve(code);
      if (!found)
        throw new Error(
          "Link/código não encontrado nesta simulação ou publicação retirada.",
        );
      return found.snapshot;
    });
  }
  install(snapshot: LibraryPackageSnapshot, signal: AbortSignal) {
    const value = structuredClone(snapshot);
    return previewWork(signal, () => {
      if (this.subscriptions.has(value.draft.id)) return;
      this.subscriptions.set(value.draft.id, {
        id: value.draft.id,
        snapshot: value,
        auto: false,
        paused: false,
        hidden: [],
      });
    });
  }
  check(id: string, scenario: SyncScenario, signal: AbortSignal) {
    return previewWork(signal, () => {
      const sub = this.subscriptions.get(id);
      if (!sub) throw new Error("Assinatura removida.");
      if (scenario === "offline" || scenario === "error")
        throw new Error(
          "Verificação indisponível; versão instalada preservada. Próximo ciclo automático após backoff de 10s.",
        );
      let next = structuredClone(
        this.publisher
          .list()
          .filter((p) => p.snapshot.draft.id === id && !p.withdrawn)
          .at(-1)?.snapshot ?? sub.snapshot,
      );
      if (scenario !== "normal") {
        next = structuredClone(sub.snapshot);
        next.version += 1;
        next.key = `${id}@${next.version}`;
        next.integrity = `DEMO-UPDATE-${next.version}`;
        next.draft.description = `Curadoria atualizada · versão ${next.version}`;
        if (scenario === "remove") {
          next.draft.memberships = next.draft.memberships.slice(1);
          next.draft.collections.forEach(
            (c) =>
              (c.items = c.items.filter((item) =>
                next.draft.memberships.some((m) => m.contentId === item),
              )),
          );
          next.catalog = next.catalog.filter((c) =>
            next.draft.memberships.some((m) => m.contentId === c.id),
          );
        }
        if (scenario === "no-sources") {
          next.catalog.forEach((c) => (c.sources = []));
          next.draft.memberships.forEach((m) => (m.sourceIds = []));
        }
        if (scenario === "hash") {
          next.version = sub.snapshot.version;
          next.key = sub.snapshot.key;
        }
        if (scenario === "downgrade")
          next.version = Math.max(0, sub.snapshot.version - 1);
      }
      if (next.version < sub.snapshot.version)
        throw new Error(
          "Downgrade remoto bloqueado. Use rollback explícito da versão retida.",
        );
      if (next.version === sub.snapshot.version) {
        if (next.integrity !== sub.snapshot.integrity)
          throw new Error(
            "Mesma versão com integridade divergente. Atualização bloqueada.",
          );
        return null;
      }
      return next;
    });
  }
  async apply(
    id: string,
    snapshot: LibraryPackageSnapshot,
    scenario: SyncScenario,
    signal: AbortSignal,
    phase: (s: string) => void,
  ) {
    const next = structuredClone(snapshot),
      previous = this.subscriptions.get(id)?.snapshot;
    if (!previous) throw new Error("Assinatura removida.");
    for (const [label, fail] of [
      ["Staging: recebendo snapshot…", "stage-crash"],
      ["Verificando snapshot…", "verify-crash"],
      ["Aplicando nova versão…", "commit-crash"],
    ]) {
      phase(label);
      await previewWork(
        signal,
        () => {
          if (scenario === fail)
            throw new Error(
              `Falha simulada em ${label} Versão anterior preservada.`,
            );
        },
        400,
      );
    }
    const sub = this.subscriptions.get(id);
    if (!sub || sub.snapshot.key !== previous.key)
      throw new Error("Contexto alterado. Verifique novamente.");
    if (next.version <= sub.snapshot.version)
      throw new Error("Versão inválida para atualização automática.");
    sub.previous = structuredClone(sub.snapshot);
    sub.snapshot = next;
  }
  rollback(id: string) {
    const sub = this.subscriptions.get(id);
    if (!sub?.previous) return;
    [sub.snapshot, sub.previous] = [sub.previous, sub.snapshot];
  }
  unsubscribe(id: string) {
    this.subscriptions.delete(id);
  }
  configure(
    id: string,
    patch: Partial<Pick<LibrarySubscription, "auto" | "paused">>,
  ) {
    const s = this.subscriptions.get(id);
    if (s) Object.assign(s, patch);
  }
  hide(id: string, contentId: string) {
    const s = this.subscriptions.get(id);
    if (s)
      s.hidden = s.hidden.includes(contentId)
        ? s.hidden.filter((v) => v !== contentId)
        : [...s.hidden, contentId];
  }
  savePersonal(content: LibraryContent) {
    this.saved.set(content.id, structuredClone(content));
  }
  favorite(id: string) {
    return this.favorites.has(id);
  }
  toggleFavorite(id: string) {
    if (this.favorites.has(id)) this.favorites.delete(id);
    else this.favorites.add(id);
  }
  sources(id: string) {
    const all = [
      ...this.saved.values(),
      ...this.list().flatMap((s) => s.snapshot.catalog),
    ];
    return [
      ...new Map(
        all
          .filter((c) => c.id === id)
          .flatMap((c) => c.sources)
          .map((s) => [s.id, s]),
      ).values(),
    ];
  }
  discoveryItems() {
    const items = new Map<string, DiscoveryItem>();
    const add = (
      content: LibraryContent,
      origin: { id: string; name: string },
    ) => {
      const current = items.get(content.id);
      if (current) {
        current.memberships.push(origin);
        current.sources = [
          ...new Map(
            [
              ...current.sources,
              ...content.sources.map((s) => ({
                id: s.id,
                quality: s.name,
                fileAvailable: s.local,
              })),
            ].map((s) => [s.id, s]),
          ).values(),
        ];
        return;
      }
      items.set(content.id, {
        id: content.id,
        title: content.title,
        synopsis: content.synopsis,
        poster: content.poster,
        type: "movie",
        genres: [],
        favorite: this.favorite(content.id),
        recent: true,
        position: 0,
        duration: 6000,
        memberships: [origin],
        collections: [],
        sources: content.sources.map((s) => ({
          id: s.id,
          quality: s.name,
          fileAvailable: s.local,
        })),
      });
    };
    for (const s of this.list())
      for (const content of s.snapshot.catalog) {
        if (!s.hidden.includes(content.id))
          add(content, { id: s.id, name: s.snapshot.draft.name });
      }
    for (const content of this.saved.values())
      add(content, { id: "personal", name: "Minha biblioteca" });
    return [...items.values()];
  }
}
