export type SeriesScenario =
  "normal" | "slow" | "offline" | "list-error" | "save-error";
export type PackKind = "single" | "season" | "multi" | "ambiguous";
export interface EpisodeLink {
  sourceId: string;
  sourceName: string;
  fileId: string;
  filename: string;
  resolution?: string;
  fileAvailable?: boolean;
  selector: "episode" | "manual";
  subtitle: string;
}
export interface EpisodeArtwork {
  src: string;
  fileName: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
}
export interface Episode {
  id: string;
  season: number;
  number: number;
  title?: string;
  artwork?: EpisodeArtwork;
  links: EpisodeLink[];
}
export interface SeriesRecord {
  id: string;
  title: string;
  originalTitle?: string;
  synopsis?: string;
  startYear?: number;
  endYear?: number;
  genres?: string[];
  poster?: string;
  backdrop?: string;
  externalIds?: { imdb?: string };
  ratings?: { imdb?: { average: number; votes: number } };
  episodes: Episode[];
}
export interface ReviewFile {
  id: string;
  filename: string;
  season: string;
  episode: string;
  originalSeason: string;
  originalEpisode: string;
  manualRequired: boolean;
  corrected: boolean;
  skipped: boolean;
  subtitle: string;
  subtitles: string[];
}
export interface SeriesDraft {
  seriesId: string;
  title: string;
  sourceId: string;
  sourceName: string;
  files: ReviewFile[];
}
export interface SeriesCatalog {
  list(): Promise<SeriesRecord[]>;
  reviewSource(sourceId: string): SeriesDraft | null;
  save(draft: SeriesDraft): Promise<string>;
  setEpisodeArtwork(
    episodeId: string,
    artwork: EpisodeArtwork | null,
  ): Promise<Episode>;
}
