import type {
  MetadataProvider,
  Movie,
  MovieCatalog,
  MovieDraft,
  MovieMetadata,
  MovieScenario,
  MovieSource,
} from "@ushark/types/movies";
import { imdbMovieFixtures } from "../data/imdb-movies";

const art = (name: string) => `./movie-art/${name}.svg`;
export const movieFixtures: MovieMetadata[] = [
  {
    id: "movie:tmdb:fixture-horizon",
    title: "Horizonte Azul",
    originalTitle: "Blue Horizon",
    year: 2024,
    synopsis:
      "Em uma ilha que parece ter parado no tempo, uma cartógrafa encontra um mapa para um lugar que ainda não existe. Uma viagem sobre os caminhos que escolhemos e aqueles que nos encontram.",
    duration: 118,
    genres: ["Aventura", "Drama"],
    cast: ["Lia Campos", "Tomás Reis"],
    poster: art("horizon"),
    backdrop: art("horizon"),
    externalIds: { tmdb: "fixture-horizon", imdb: "fixture-blue" },
  },
  {
    id: "movie:tmdb:fixture-horizon-1998",
    title: "Horizonte Azul",
    originalTitle: "Horizonte Azul",
    year: 1998,
    synopsis:
      "Dois irmãos voltam à cidade onde cresceram para uma última viagem de verão.",
    duration: 96,
    genres: ["Drama"],
    cast: ["Clara Luz"],
    poster: art("tides"),
    backdrop: art("tides"),
    externalIds: { tmdb: "fixture-horizon-1998" },
  },
  {
    id: "movie:tmdb:fixture-station",
    title: "A Última Estação",
    originalTitle: "The Last Station",
    year: 2023,
    synopsis:
      "Uma estação esquecida recebe um trem inesperado. Entre encontros e despedidas, cinco desconhecidos descobrem que nunca é tarde para mudar de direção.",
    duration: 104,
    genres: ["Mistério", "Drama"],
    cast: ["Nina Vale", "Caio Moura"],
    poster: art("station"),
    backdrop: art("station"),
    externalIds: { tmdb: "fixture-station" },
  },
  {
    id: "movie:local:tides",
    title: "Entre Marés",
    year: 2022,
    synopsis: "Um retrato das pequenas histórias que o oceano devolve à praia.",
    duration: 82,
    genres: ["Documentário"],
    cast: [],
    poster: art("tides"),
    backdrop: art("tides"),
  },
  {
    id: "movie:local:paper",
    title: "Noite de Papel",
    year: 2025,
    synopsis:
      "Uma ilustradora vê seus desenhos ganharem vida durante uma noite de chuva.",
    duration: 91,
    genres: ["Fantasia"],
    cast: ["Ana Sol"],
    poster: art("paper"),
    backdrop: art("paper"),
  },
];
const metadataFixtures = [...imdbMovieFixtures, ...movieFixtures];
export const sourceFixtures: MovieSource[] = [
  {
    id: "source:example-1080",
    name: "Horizonte.Azul.1080p.mkv",
    resolution: "1080p",
    videoCodec: "H.264",
    audioCodec: "AAC",
    channels: "2.0",
    size: "2,4 GB",
    bitrate: "3 Mb/s",
    fileAvailable: true,
  },
  {
    id: "source:example-4k",
    name: "Horizonte.Azul.2160p.mkv",
    resolution: "2160p",
    videoCodec: "HEVC",
    audioCodec: "EAC3",
    hdr: "HDR10",
    channels: "5.1",
    size: "8,1 GB",
    fileAvailable: true,
  },
  {
    id: "source:example-unknown",
    name: "Origem sem metadados",
    fileAvailable: false,
  },
];
function pause(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException("Busca cancelada", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", abort);
      resolve();
    }, ms);
    if (signal?.aborted) abort();
    else signal?.addEventListener("abort", abort, { once: true });
  });
}
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export class MockMetadataProvider implements MetadataProvider {
  scenario: MovieScenario = "normal";
  async search(title: string, year?: number, signal?: AbortSignal) {
    const scenario = this.scenario;
    await pause(scenario === "slow" ? 1800 : 240, signal);
    if (scenario === "offline" || scenario === "provider-error")
      throw new Error(
        "A busca está indisponível. Tente novamente ou crie o filme manualmente.",
      );
    if (scenario === "search-empty") return [];
    return structuredClone(
      metadataFixtures.filter(
        (m) =>
          [m.title, m.originalTitle].some((candidate) =>
            normalize(candidate ?? "").includes(normalize(title.trim())),
          ) &&
          (!year || m.year === year),
      ),
    );
  }
  async refresh(metadata: MovieMetadata) {
    await pause(240);
    if (this.scenario === "offline" || this.scenario === "provider-error")
      throw new Error(
        "Não foi possível atualizar. Os dados que você já tem continuam disponíveis.",
      );
    return {
      ...structuredClone(metadata),
      synopsis: `${metadataFixtures.find((m) => m.id === metadata.id)?.synopsis ?? metadata.synopsis ?? "Filme cadastrado manualmente."} Uma nova perspectiva sobre esta história.`,
    };
  }
}
export class MockMovieCatalog implements MovieCatalog {
  capturePreview() {
    return structuredClone({
      movies: this.movies,
      deletedFiles: this.deletedFiles,
    });
  }
  restorePreview(value: ReturnType<MockMovieCatalog["capturePreview"]>) {
    const snapshot = structuredClone(value);
    this.movies = snapshot.movies;
    this.deletedFiles = snapshot.deletedFiles;
  }

  private movies: Movie[] = [];
  private deletedFiles = new Set<string>();
  scenario: MovieScenario = "normal";
  constructor(readonly provider: MetadataProvider) {}
  seedDefault(libraryId: string) {
    this.deletedFiles.clear();
    this.movies = imdbMovieFixtures.map((metadata, index) => ({
      id: metadata.id,
      metadata: structuredClone(metadata),
      sources: [this.defaultSource(metadata, index)],
      memberships: [{ libraryId, preservedOverrides: [] }],
      personal: {
        favorite: index === 1 || index === 6,
        progress: index < 2 ? [3737, 1840][index] : 0,
        history: index < 2 ? ["default-imdb-seed"] : [],
        preferences: [],
      },
    }));
  }
  seed(kind: "empty" | "collection" | "conflict", libraryId: string) {
    this.deletedFiles.clear();
    this.movies =
      kind === "empty"
        ? []
        : movieFixtures
            .filter((_, i) => i !== 1)
            .map((metadata, i) => ({
              id: metadata.id,
              metadata: structuredClone(metadata),
              sources:
                i === 0 ? structuredClone(sourceFixtures.slice(0, 2)) : [],
              memberships: [{ libraryId, preservedOverrides: [] }],
              personal: {
                favorite: i === 1,
                progress: 0,
                history: [],
                preferences: [],
              },
            }));
    if (kind === "conflict") {
      const target = this.movies[0];
      target.memberships[0].titleOverride = "Horizonte · edição da coleção";
      target.personal = {
        favorite: false,
        progress: 1200,
        history: ["canonical-history"],
        preferences: ["audio:pt-BR"],
      };
      this.movies.push({
        id: "movie:local:unidentified",
        metadata: {
          id: "movie:local:unidentified",
          title: "Meu filme sem identificação",
          genres: [],
          cast: [],
        },
        sources: [structuredClone(sourceFixtures[2])],
        memberships: [
          {
            libraryId,
            titleOverride: "Minha descoberta",
            preservedOverrides: [],
          },
          {
            libraryId: "library:other",
            titleOverride: "Viagem favorita",
            preservedOverrides: [],
          },
        ],
        personal: {
          favorite: true,
          progress: 2400,
          history: ["local-history"],
          preferences: ["audio:en"],
        },
      });
    }
  }
  async list(libraryId: string) {
    await pause(this.scenario === "slow" ? 1200 : 120);
    if (this.scenario === "list-error")
      throw new Error(
        "Não foi possível abrir os filmes. Sua coleção continua aqui.",
      );
    return structuredClone(
      this.movies.filter((m) =>
        m.memberships.some((x) => x.libraryId === libraryId),
      ),
    );
  }
  find(id: string) {
    return structuredClone(this.movies.find((m) => m.id === id));
  }
  private get(id: string) {
    const movie = this.movies.find((m) => m.id === id);
    if (!movie)
      throw new Error("Este filme não está mais disponível. Volte à lista.");
    return movie;
  }
  private defaultSource(metadata: MovieMetadata, index: number): MovieSource {
    const name = (metadata.originalTitle ?? metadata.title)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, ".")
      .replace(/^\.|\.$/g, "");
    const imdbId = metadata.externalIds?.imdb ?? metadata.id;
    return {
      id: `source:mock:${imdbId}`,
      name: `${name}.${metadata.year ?? "unknown"}.${index === 0 ? "2160p" : "1080p"}.mkv`,
      resolution: index === 0 ? "2160p" : "1080p",
      videoCodec: index === 0 ? "HEVC" : "H.264",
      audioCodec: "EAC3",
      channels: "5.1",
      fileAvailable: true,
    };
  }
  private async writable() {
    await pause(this.scenario === "slow" ? 1600 : 180);
    if (this.scenario === "save-error")
      throw new Error(
        "Não foi possível salvar. Suas escolhas continuam aqui. Tente novamente.",
      );
  }
  async save(draft: MovieDraft, libraryId: string) {
    await this.writable();
    if (!draft.metadata.title.trim() || draft.metadata.title.length > 160)
      throw new Error("Dê um título ao filme (até 160 caracteres).");
    const previous = draft.editingId ? this.get(draft.editingId) : undefined;
    let target = this.movies.find((m) => m.id === draft.metadata.id);
    if (previous && target && previous.id !== target.id && !draft.confirmMerge)
      throw new Error(
        "Revise a união com o filme existente antes de confirmar.",
      );
    if (!target) {
      target = {
        id: draft.metadata.id,
        metadata: structuredClone(draft.metadata),
        sources: [],
        memberships: [],
        personal: {
          favorite: false,
          progress: 0,
          history: [],
          preferences: [],
        },
      };
      this.movies.push(target);
    }
    if (previous && previous.id !== target.id) {
      for (const source of previous.sources)
        if (!target.sources.some((s) => s.id === source.id))
          target.sources.push(structuredClone(source));
      for (const membership of previous.memberships) {
        const existing = target.memberships.find(
          (m) => m.libraryId === membership.libraryId,
        );
        if (!existing) target.memberships.push(structuredClone(membership));
        else {
          const overrides = [
            ...existing.preservedOverrides,
            ...membership.preservedOverrides,
          ];
          if (
            membership.titleOverride &&
            existing.titleOverride &&
            existing.titleOverride !== membership.titleOverride
          )
            overrides.push(membership.titleOverride);
          existing.titleOverride ??= membership.titleOverride;
          existing.preservedOverrides = [...new Set(overrides)];
        }
      }
      target.personal.favorite ||= previous.personal.favorite;
      target.personal.progress = Math.max(
        target.personal.progress,
        previous.personal.progress,
      );
      target.personal.history = [
        ...new Set([...target.personal.history, ...previous.personal.history]),
      ];
      target.personal.preferences = [
        ...new Set([
          ...target.personal.preferences,
          ...previous.personal.preferences,
        ]),
      ];
      this.movies = this.movies.filter((m) => m.id !== previous.id);
    }
    // Re-adding an existing identity preserves refreshed metadata and personal state.
    if (previous)
      target.metadata = { ...structuredClone(draft.metadata), id: target.id };
    if (!target.memberships.some((m) => m.libraryId === libraryId))
      target.memberships.push({ libraryId, preservedOverrides: [] });
    if (draft.source && !target.sources.some((s) => s.id === draft.source?.id))
      target.sources.push(this.declaredSource(draft.source));
    return structuredClone(target);
  }
  async favorite(id: string) {
    await this.writable();
    const m = this.get(id);
    m.personal.favorite = !m.personal.favorite;
  }
  async refresh(id: string) {
    const original = this.get(id);
    const metadata = await this.provider.refresh(
      structuredClone(original.metadata),
    );
    await this.writable();
    const current = this.get(id);
    current.metadata = { ...metadata, id: current.id };
  }
  private declaredSource(source: MovieSource): MovieSource {
    return {
      ...structuredClone(source),
      fileAvailable: source.fileAvailable && !this.deletedFiles.has(source.id),
    };
  }
  async addSource(id: string, source: MovieSource) {
    await this.writable();
    const m = this.get(id);
    if (!m.sources.some((s) => s.id === source.id))
      m.sources.push(this.declaredSource(source));
  }
  async removeSource(id: string, sourceId: string) {
    await this.writable();
    const m = this.get(id);
    m.sources = m.sources.filter((s) => s.id !== sourceId);
  }
  async removeMembership(id: string, libraryId: string) {
    await this.writable();
    const m = this.get(id);
    m.memberships = m.memberships.filter((x) => x.libraryId !== libraryId);
  }
  async deleteFile(id: string, sourceId: string) {
    await this.writable();
    const source = this.get(id).sources.find((s) => s.id === sourceId);
    if (!source) throw new Error("Fonte não encontrada.");
    this.deletedFiles.add(sourceId);
    for (const movie of this.movies) {
      for (const linked of movie.sources)
        if (linked.id === sourceId) linked.fileAvailable = false;
    }
  }
}
export { imdbMovieFixtures } from "../data/imdb-movies";
export function movieTitle(movie: Movie, libraryId: string) {
  return (
    movie.memberships.find((m) => m.libraryId === libraryId)?.titleOverride ??
    movie.metadata.title
  );
}
