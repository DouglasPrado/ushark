/** Provisional M04 frontend read boundary; persistence and FTS belong to S03+. */
export interface DiscoveryItem {
  id: string;
  title: string;
  originalTitle?: string;
  type: "movie" | "series" | "episode";
  seriesTitle?: string;
  synopsis?: string;
  poster?: string;
  backdrop?: string;
  year?: number;
  endYear?: number;
  genres: string[];
  cast?: string[];
  rating?: { average: number; votes: number };
  externalIds?: { imdb?: string; tmdb?: string };
  seasonCount?: number;
  episodeCount?: number;
  favorite: boolean;
  recent: boolean;
  position: number;
  duration: number;
  memberships: { id: string; name: string }[];
  collections: { id: string; name: string }[];
  sources: { id: string; quality: string; fileAvailable?: boolean }[];
}
export type DiscoveryScenario =
  | "current"
  | "editorial"
  | "large"
  | "empty"
  | "offline"
  | "error"
  | "slow"
  | "missing"
  | "hydration";
export interface DiscoveryQuery {
  text: string;
  type: string;
  favorite: boolean;
  recent: boolean;
  continuing: boolean;
  genre: string;
  collection: string;
  scope: string;
  page: number;
}
export interface DiscoveryResult {
  items: DiscoveryItem[];
  total: number;
}
export interface DiscoveryCatalog {
  read(): Promise<DiscoveryItem[]>;
  search(query: DiscoveryQuery): Promise<DiscoveryResult>;
}
export interface DiscoverySession {
  query: DiscoveryQuery;
  searching: boolean;
  scenario: DiscoveryScenario;
}
export const discoveryQuery = (): DiscoveryQuery => ({
  text: "",
  type: "",
  favorite: false,
  recent: false,
  continuing: false,
  genre: "",
  collection: "",
  scope: "",
  page: 0,
});
