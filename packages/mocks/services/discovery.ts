import type { MovieCatalog } from "@ushark/types/movies";
import type { SeriesCatalog } from "@ushark/types/series";
import type {
  DiscoveryCatalog,
  DiscoveryItem,
  DiscoveryQuery,
  DiscoveryResult,
  DiscoveryScenario,
} from "@ushark/types/discovery";
import { movieFixtures } from "./movies";
const local = { id: "personal", name: "Minha biblioteca" };
const shared = { id: "shared-a", name: "Cinema em casa" };
const sharedOther = { id: "shared-b", name: "Cinema em casa" };
const collection = { id: "weekend", name: "Histórias de sábado" };
const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export function discoveryFixtures(large = false): DiscoveryItem[] {
  const films: DiscoveryItem[] = movieFixtures.map((m, i) => ({
    id: m.id,
    title: m.title,
    originalTitle: m.originalTitle,
    type: "movie",
    synopsis: m.synopsis,
    poster: i === 1 ? "./movie-art/horizon.svg" : m.poster,
    backdrop: i === 1 ? "./movie-art/horizon.svg" : m.backdrop,
    year: m.year,
    genres: m.genres,
    cast: m.cast,
    rating: m.ratings?.imdb,
    externalIds: m.externalIds,
    favorite: i % 2 === 0,
    recent: i < 3,
    position: i === 0 ? 3737 : 0,
    duration: (m.duration ?? 100) * 60,
    memberships:
      i === 0 ? [local, shared, sharedOther] : [i % 2 ? shared : local],
    collections: i % 2 === 0 ? [collection] : [],
    sources:
      i === 3
        ? []
        : [
            { id: `source-${i}`, quality: "1080p" },
            ...(i === 0 ? [{ id: "source-4k", quality: "4K" }] : []),
          ],
  }));
  const series: DiscoveryItem = {
    ...films[0],
    id: "series:fixture:orbitas",
    title: "Entre Órbitas",
    originalTitle: "Between Orbits",
    type: "series",
    synopsis:
      "Uma tripulação encontra caminhos de volta em um universo em transformação.",
    poster: "./movie-art/orbitas.svg",
    backdrop: "./movie-art/orbitas.svg",
    position: 0,
    genres: ["Ficção científica"],
  };
  const episode: DiscoveryItem = {
    ...series,
    id: "episode:fixture:orbitas:1:1",
    title: "S01E01 · Um sinal distante",
    originalTitle: "A distant signal",
    type: "episode",
    seriesTitle: series.title,
    position: 840,
    duration: 2700,
  };
  const items = [...films, series, episode];
  if (large)
    for (let i = items.length; i < 10000; i++)
      items.push({
        ...films[i % films.length],
        id: `discovery-${i}`,
        title: `História ${String(i).padStart(5, "0")}`,
        originalTitle: `Story ${i}`,
        position: 0,
        recent: false,
      });
  return items;
}
export class MockDiscoveryCatalog implements DiscoveryCatalog {
  playbackProgress?: (
    id: string,
  ) => { position: number; watched: boolean } | undefined;
  externalItems?: () => DiscoveryItem[];
  scenario: DiscoveryScenario = "current";
  failNextPage = false;
  private failReadOnce = false;
  private removed = new Set<string>();
  private changed = new Map<string, string>();
  private fixtureCache = discoveryFixtures();
  constructor(
    private movies: MovieCatalog,
    private series: SeriesCatalog,
    private library: () => { id: string; name: string },
  ) {}
  configure(scenario: DiscoveryScenario) {
    this.scenario = scenario;
    this.failReadOnce = scenario === "error";
    this.removed.clear();
    this.changed.clear();
    this.fixtureCache = discoveryFixtures(scenario === "large");
  }
  remove(id: string) {
    this.removed.add(id);
  }
  rename(id: string) {
    this.changed.set(id, "Uma nova história");
  }
  private async snapshot(): Promise<DiscoveryItem[]> {
    let result: DiscoveryItem[];
    if (this.scenario === "empty") result = [];
    else if (this.scenario !== "current") result = this.fixtureCache;
    else {
      const lib = this.library();
      const [movies, series] = await Promise.all([
        this.movies.list(lib.id),
        this.series.list(),
      ]);
      result = movies.map((m) => ({
        id: m.id,
        title: m.metadata.title,
        originalTitle: m.metadata.originalTitle,
        type: "movie",
        synopsis: m.metadata.synopsis,
        poster: m.metadata.poster,
        backdrop: m.metadata.backdrop,
        year: m.metadata.year,
        genres: m.metadata.genres,
        cast: m.metadata.cast,
        rating: m.metadata.ratings?.imdb,
        externalIds: m.metadata.externalIds,
        favorite: m.personal.favorite,
        recent: true,
        position: m.personal.progress,
        duration: (m.metadata.duration ?? 100) * 60,
        memberships: m.memberships.map((x) => ({
          id: x.libraryId,
          name: x.libraryId === lib.id ? lib.name : "Biblioteca compartilhada",
        })),
        collections: [],
        sources: m.sources.map((x) => ({
          id: x.id,
          quality:
            x.resolution === "2160p"
              ? "4K"
              : (x.resolution ?? "Qualidade não informada"),
          fileAvailable: x.fileAvailable,
        })),
      }));
      for (const s of series) {
        const base: DiscoveryItem = {
          id: s.id,
          title: s.title,
          originalTitle: s.originalTitle,
          type: "series",
          synopsis: s.synopsis,
          poster: s.poster,
          backdrop: s.backdrop,
          year: s.startYear,
          endYear: s.endYear,
          genres: s.genres ?? [],
          rating: s.ratings?.imdb,
          externalIds: s.externalIds,
          seasonCount: new Set(s.episodes.map((episode) => episode.season))
            .size,
          episodeCount: s.episodes.length,
          favorite: false,
          recent: true,
          position: 0,
          duration: 0,
          memberships: [{ id: lib.id, name: lib.name }],
          collections: [],
          sources: Array.from(
            new Map(
              s.episodes.flatMap((e) =>
                e.links.map(
                  (l) =>
                    [
                      l.sourceId,
                      {
                        id: l.sourceId,
                        quality:
                          l.resolution === "2160p"
                            ? "4K"
                            : (l.resolution ?? "Qualidade não informada"),
                        fileAvailable: l.fileAvailable,
                      },
                    ] as const,
                ),
              ),
            ).values(),
          ),
        };
        result.push(
          base,
          ...s.episodes.map((e) => ({
            ...base,
            id: e.id,
            type: "episode" as const,
            title: `S${String(e.season).padStart(2, "0")}E${String(e.number).padStart(2, "0")} · ${e.title ?? "Episódio"}`,
            seriesTitle: s.title,
            sources: Array.from(
              new Map(
                e.links.map((l) => [
                  l.sourceId,
                  {
                    id: l.sourceId,
                    quality:
                      l.resolution === "2160p"
                        ? "4K"
                        : (l.resolution ?? "Qualidade não informada"),
                    fileAvailable: l.fileAvailable,
                  },
                ]),
              ).values(),
            ),
          })),
        );
      }
    }
    if (this.scenario === "current")
      for (const extra of this.externalItems?.() ?? []) {
        const current = result.find((item) => item.id === extra.id);
        if (current) {
          current.memberships = [
            ...new Map(
              [...current.memberships, ...extra.memberships].map((m) => [
                m.id,
                m,
              ]),
            ).values(),
          ];
          current.sources = [
            ...new Map(
              [...current.sources, ...extra.sources].map((m) => [m.id, m]),
            ).values(),
          ];
          current.favorite = current.favorite || extra.favorite;
        } else result.push(extra);
      }
    return result
      .filter((x) => !this.removed.has(x.id))
      .map((x) => ({
        ...x,
        title: this.changed.get(x.id) ?? x.title,
        position: this.playbackProgress?.(x.id)?.watched
          ? 0
          : (this.playbackProgress?.(x.id)?.position ?? x.position),
        poster: this.scenario === "missing" ? undefined : x.poster,
        backdrop: this.scenario === "missing" ? undefined : x.backdrop,
      }));
  }
  async read() {
    return this.snapshot();
  }
  async search(query: DiscoveryQuery): Promise<DiscoveryResult> {
    const scenario = this.scenario;
    const snapshot = await this.snapshot();
    await wait(scenario === "slow" ? (query.text.length < 3 ? 900 : 150) : 80);
    if (scenario === "error" && this.failReadOnce) {
      this.failReadOnce = false;
      throw new Error("Não foi possível atualizar a biblioteca");
    }
    if (query.page > 0 && this.failNextPage) {
      this.failNextPage = false;
      throw new Error("Página indisponível");
    }
    const terms = normalize(query.text.trim()).split(/\s+/).filter(Boolean);
    const items = snapshot.filter((x) => {
      const text = normalize(
        [
          x.title,
          x.originalTitle,
          x.seriesTitle,
          ...x.memberships.map((m) => m.name),
          ...x.collections.map((c) => c.name),
        ].join(" "),
      );
      return (
        terms.every((t) => text.includes(t)) &&
        (!query.type || query.type === x.type) &&
        (!query.favorite || x.favorite) &&
        (!query.recent || x.recent) &&
        (!query.continuing || (x.position > 0 && x.position < x.duration)) &&
        (!query.genre || x.genres.includes(query.genre)) &&
        (!query.collection ||
          x.collections.some((c) => c.id === query.collection)) &&
        (!query.scope ||
          x.memberships.some((m) => m.id === query.scope) ||
          x.collections.some((c) => c.id === query.scope))
      );
    });
    // Identity, never title, controls consolidation across origins.
    const unique = Array.from(new Map(items.map((x) => [x.id, x])).values());
    return {
      items: unique.slice(query.page * 24, (query.page + 1) * 24),
      total: unique.length,
    };
  }
}
