import type { SourceCandidate } from "./selection";
/** Provisional UI model only; domain/portable schema remains deferred. */
export interface LibraryContent {
  id: string;
  title: string;
  synopsis?: string;
  poster?: string;
  sources: SourceCandidate[];
}
export interface LibraryMembership {
  contentId: string;
  sourceIds: string[];
  titleOverride: string;
}
export interface LibraryCollection {
  id: string;
  name: string;
  items: string[];
}
export interface LibrarySection {
  id: string;
  title: string;
  type: "hero" | "carousel" | "grid" | "continue";
  collectionId: string;
}
export interface LibraryDraft {
  provenance?: { libraryId: string; version: number };
  id: string;
  revision: number;
  name: string;
  description: string;
  author: string;
  avatar: string;
  logo: string;
  banner: string;
  accent: string;
  memberships: LibraryMembership[];
  collections: LibraryCollection[];
  sections: LibrarySection[];
}
export interface LibraryPreviewService {
  storeFork(draft: LibraryDraft, catalog: LibraryContent[]): LibraryDraft;
  list(): LibraryDraft[];
  create(): LibraryDraft;
  save(draft: LibraryDraft, signal: AbortSignal): Promise<LibraryDraft>;
  catalog(): Promise<LibraryContent[]>;
  examples(): void;
  failSave: boolean;
}
