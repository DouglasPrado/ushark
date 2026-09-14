/** Provisional frontend boundary. Real domain contracts belong to M02/S03. */
export interface MovieMetadata {
  id: string;
  title: string;
  originalTitle?: string;
  year?: number;
  synopsis?: string;
  duration?: number;
  genres: string[];
  cast: string[];
  poster?: string;
  backdrop?: string;
  externalIds?: { tmdb?: string; imdb?: string };
  ratings?: {
    imdb?: {
      average: number;
      votes: number;
      snapshotDate: string;
    };
  };
}
export interface MovieSource {
  id: string;
  name: string;
  resolution?: string;
  videoCodec?: string;
  audioCodec?: string;
  hdr?: string;
  channels?: string;
  size?: string;
  bitrate?: string;
  fileAvailable: boolean;
}
export interface MovieMembership {
  libraryId: string;
  titleOverride?: string;
  preservedOverrides: string[];
}
export interface Movie {
  id: string;
  metadata: MovieMetadata;
  sources: MovieSource[];
  memberships: MovieMembership[];
  personal: {
    favorite: boolean;
    progress: number;
    history: string[];
    preferences: string[];
  };
}
export type MovieScenario =
  | "normal"
  | "offline"
  | "search-empty"
  | "provider-error"
  | "slow"
  | "save-error"
  | "list-error"
  | "image-error";
export interface MetadataProvider {
  search(
    title: string,
    year?: number,
    signal?: AbortSignal,
  ): Promise<MovieMetadata[]>;
  refresh(metadata: MovieMetadata): Promise<MovieMetadata>;
}
export interface MovieDraft {
  metadata: MovieMetadata;
  source?: MovieSource;
  editingId?: string;
  confirmMerge?: boolean;
}
export interface MovieCatalog {
  list(libraryId: string): Promise<Movie[]>;
  find(id: string): Movie | undefined;
  save(draft: MovieDraft, libraryId: string): Promise<Movie>;
  favorite(id: string): Promise<void>;
  refresh(id: string): Promise<void>;
  addSource(id: string, source: MovieSource): Promise<void>;
  removeSource(id: string, sourceId: string): Promise<void>;
  removeMembership(id: string, libraryId: string): Promise<void>;
  deleteFile(id: string, sourceId: string): Promise<void>;
}
