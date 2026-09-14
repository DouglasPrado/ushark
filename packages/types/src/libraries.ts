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
  runtime?: "mock" | "desktop";
  refresh?(): Promise<void>;
  storeFork(draft: LibraryDraft, catalog: LibraryContent[]): LibraryDraft;
  list(): LibraryDraft[];
  create(): LibraryDraft;
  save(draft: LibraryDraft, signal: AbortSignal): Promise<LibraryDraft>;
  catalog(): Promise<LibraryContent[]>;
  examples(): void;
  failSave: boolean;
}

export const LIBRARY_DRAFT_PROTOCOL_VERSION = 1 as const;
export const LIBRARY_DRAFT_SCHEMA_VERSION = 1 as const;
export type LibraryDraftErrorCode =
  | "DRAFT_CONFLICT"
  | "DRAFT_INVALID"
  | "DRAFT_NOT_FOUND"
  | "DRAFT_PROTOCOL_UNSUPPORTED"
  | "DRAFT_STORAGE_FAILED"
  | "DRAFT_UNAUTHORIZED";
export interface LibraryDraftFailure {
  code: LibraryDraftErrorCode;
  message: string;
  recoverable: boolean;
  retryable: boolean;
}
export type LibraryDraftResult<T> =
  { ok: true; value: T } | { ok: false; error: LibraryDraftFailure };
export interface LibraryDraftDesktopApi {
  protocolVersion: typeof LIBRARY_DRAFT_PROTOCOL_VERSION;
  list(): Promise<LibraryDraftResult<LibraryDraft[]>>;
  catalog(): Promise<LibraryDraftResult<LibraryContent[]>>;
  save(input: {
    draft: LibraryDraft;
    mutation: { idempotencyKey: string };
  }): Promise<LibraryDraftResult<LibraryDraft>>;
}
