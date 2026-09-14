import type { LibraryContent, LibraryDraft } from "./libraries";
import type { LibraryPackageSnapshot } from "./library-package";
export type PublishScenario =
  "normal" | "permission" | "quota" | "conflict" | "partial" | "offline";
export interface PublishedLibrary {
  snapshot: LibraryPackageSnapshot;
  link: string;
  code: string;
  withdrawn: boolean;
}
export interface PublishReview {
  snapshot: LibraryPackageSnapshot;
  expectedVersion: number;
  changes: string[];
}
export interface LibraryPublishPreview {
  authenticated: boolean;
  list(): PublishedLibrary[];
  prepare(
    draft: LibraryDraft,
    catalog: LibraryContent[],
    signal: AbortSignal,
  ): Promise<PublishReview>;
  publish(
    review: PublishReview,
    scenario: PublishScenario,
    signal: AbortSignal,
    progress: (value: number) => void,
  ): Promise<PublishedLibrary>;
  withdraw(
    id: string,
    scenario: PublishScenario,
    signal: AbortSignal,
  ): Promise<void>;
  resolve(reference: string): PublishedLibrary | undefined;
}
