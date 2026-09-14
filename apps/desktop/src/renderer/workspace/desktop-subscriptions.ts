import type {
  SubscriptionDesktopApi,
  SubscriptionPreview,
  LibrarySubscription,
  SyncScenario,
} from "@ushark/types/subscriptions";
import type { LibraryPackageSnapshot } from "@ushark/types/library-package";
import type { LibraryContent } from "@ushark/types/libraries";
import type { DiscoveryItem } from "@ushark/types/discovery";
export class DesktopSubscriptionPreview implements SubscriptionPreview {
  readonly runtime = "desktop" as const;
  private rows: LibrarySubscription[] = [];
  private personal = new Map<string, LibraryContent>();
  private favorites = new Set<string>();
  constructor(private api: SubscriptionDesktopApi) {
    void this.refresh();
  }
  capturePreview() {
    return {
      subscriptions: new Map<string, LibrarySubscription>(),
      saved: new Map<string, LibraryContent>(),
      favorites: new Set<string>(),
    };
  }
  restorePreview(value: {
    subscriptions: Map<string, LibrarySubscription>;
    saved: Map<string, LibraryContent>;
    favorites: Set<string>;
  }) {
    void value;
  }
  private async call<T>(operation: string, ...args: unknown[]) {
    const r = await this.api.call({ operation, args });
    if (!r.ok) throw new Error(r.error.message);
    return r.value as T;
  }
  async refresh() {
    this.rows = await this.call("list");
  }
  list() {
    return structuredClone(this.rows);
  }
  resolve(reference: string, _scenario: SyncScenario, signal: AbortSignal) {
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    return this.call<LibraryPackageSnapshot>("resolve", reference);
  }
  async install(snapshot: LibraryPackageSnapshot, signal: AbortSignal) {
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    await this.call("install", snapshot);
    await this.refresh();
  }
  check(id: string, _scenario: SyncScenario, signal: AbortSignal) {
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    return this.call<LibraryPackageSnapshot | null>("check", id);
  }
  async apply(
    id: string,
    snapshot: LibraryPackageSnapshot,
    _scenario: SyncScenario,
    signal: AbortSignal,
    phase: (s: string) => void,
  ) {
    phase("Staging e verificação…");
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    await this.call("apply", id, snapshot);
    phase("Commit atômico concluído");
    await this.refresh();
  }
  rollback(id: string) {
    void this.call("rollback", id).then(() => this.refresh());
  }
  unsubscribe(id: string) {
    this.rows = this.rows.filter((r) => r.id !== id);
    void this.call("unsubscribe", id);
  }
  configure(
    id: string,
    patch: Partial<Pick<LibrarySubscription, "auto" | "paused">>,
  ) {
    const row = this.rows.find((r) => r.id === id);
    if (row) Object.assign(row, patch);
    void this.call("configure", id, patch);
  }
  hide(id: string, contentId: string) {
    const row = this.rows.find((r) => r.id === id);
    if (row) row.hidden = [...new Set([...row.hidden, contentId])];
    void this.call("hide", id, contentId);
  }
  savePersonal(content: LibraryContent) {
    this.personal.set(content.id, structuredClone(content));
    void this.call("savePersonal", content);
  }
  favorite(id: string) {
    return this.favorites.has(id);
  }
  toggleFavorite(id: string) {
    if (this.favorites.has(id)) this.favorites.delete(id);
    else this.favorites.add(id);
    void this.call("toggleFavorite", id);
  }
  discoveryItems() {
    return this.rows.flatMap((s) =>
      s.snapshot.catalog
        .filter((c) => !s.hidden.includes(c.id))
        .map((c) => ({
          ...c,
          memberships: [{ id: s.id, name: s.snapshot.draft.name }],
          favorite: this.favorite(c.id),
        })),
    ) as unknown as DiscoveryItem[];
  }
  sources(id: string) {
    for (const s of this.rows) {
      const item = s.snapshot.catalog.find((c) => c.id === id);
      if (item) return structuredClone(item.sources);
    }
    return [];
  }
}
