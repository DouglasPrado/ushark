import type { LibraryPackageSnapshot } from "./library-package";
import type { LibraryContent } from "./libraries";
import type { DiscoveryItem } from "./discovery";
export type SyncScenario =
  | "normal"
  | "update"
  | "remove"
  | "no-sources"
  | "offline"
  | "error"
  | "stage-crash"
  | "verify-crash"
  | "commit-crash"
  | "hash"
  | "downgrade";
export interface LibrarySubscription {
  id: string;
  snapshot: LibraryPackageSnapshot;
  previous?: LibraryPackageSnapshot;
  auto: boolean;
  paused: boolean;
  hidden: string[];
}
export interface SubscriptionPreview {
  runtime?: "mock" | "desktop";
  refresh?(): Promise<void>;
  list(): LibrarySubscription[];
  resolve(
    reference: string,
    scenario: SyncScenario,
    signal: AbortSignal,
  ): Promise<LibraryPackageSnapshot>;
  install(snapshot: LibraryPackageSnapshot, signal: AbortSignal): Promise<void>;
  check(
    id: string,
    scenario: SyncScenario,
    signal: AbortSignal,
  ): Promise<LibraryPackageSnapshot | null>;
  apply(
    id: string,
    snapshot: LibraryPackageSnapshot,
    scenario: SyncScenario,
    signal: AbortSignal,
    phase: (s: string) => void,
  ): Promise<void>;
  rollback(id: string): void;
  unsubscribe(id: string): void;
  configure(
    id: string,
    patch: Partial<Pick<LibrarySubscription, "auto" | "paused">>,
  ): void;
  hide(id: string, contentId: string): void;
  savePersonal(content: LibraryContent): void;
  favorite(id: string): boolean;
  toggleFavorite(id: string): void;
  discoveryItems(): DiscoveryItem[];
  sources(id: string): LibraryContent["sources"];
}
export interface SubscriptionDesktopApi {
  protocolVersion: 1;
  call(input: {
    operation: string;
    args: unknown[];
  }): Promise<
    { ok: true; value: unknown } | { ok: false; error: { message: string } }
  >;
}
