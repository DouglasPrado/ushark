import type {
  EpisodeArtwork,
  PackKind,
  ReviewFile,
  SeriesCatalog,
  SeriesDraft,
  SeriesRecord,
  SeriesScenario,
} from "@ushark/types/series";
import { imdbSeriesFixtures } from "../data/imdb-series";
export const packLabels: Record<PackKind, string> = {
  single: "Episódio avulso",
  season: "Temporada completa",
  multi: "Várias temporadas e especiais",
  ambiguous: "Pack com pendências",
};
export function seriesDraft(kind: PackKind, missing = false): SeriesDraft {
  const file = (
    season: number,
    episode: number,
    filename = `Entre.Orbitas.S${String(season).padStart(2, "0")}E${String(episode).padStart(2, "0")}.mkv`,
  ): ReviewFile => ({
    id: `${kind}:${season}:${episode}:${filename}`,
    filename,
    season: String(season),
    episode: String(episode),
    originalSeason: String(season),
    originalEpisode: String(episode),
    manualRequired: false,
    corrected: false,
    skipped: false,
    subtitle: "",
    subtitles: [filename.replace(".mkv", ".pt-BR.srt")],
  });
  let files = [file(1, 1)];
  if (kind === "season")
    files = Array.from({ length: 8 }, (_, i) => file(1, i + 1));
  if (kind === "multi")
    files = [
      file(0, 1),
      ...Array.from({ length: 16 }, (_, i) => file(i < 8 ? 1 : 2, (i % 8) + 1)),
    ];
  if (kind === "ambiguous")
    files = [
      file(1, 1),
      {
        ...file(1, 2, "Show.02.mkv"),
        season: "",
        episode: "",
        originalSeason: "",
        originalEpisode: "",
      },
      file(1, 3, "Entre.Orbitas.S01E04.mkv"),
      file(1, 1, "Entre.Orbitas.S01E01.alternativo.mkv"),
      {
        ...file(1, 5, "Entre.Orbitas.S01E01E02.mkv"),
        season: "",
        episode: "",
        originalSeason: "",
        originalEpisode: "",
        manualRequired: true,
      },
    ];
  return {
    seriesId: "series:entre-orbitas",
    title: missing ? "" : "Entre Órbitas",
    sourceId: `source:${kind}`,
    sourceName: packLabels[kind],
    files,
  };
}
export function mappingIssue(file: ReviewFile, files: ReviewFile[]): string {
  if (file.skipped) return "";
  if (file.manualRequired && !file.corrected)
    return "Revisão manual: arquivo com múltiplos episódios";
  if (
    !/^\d+$/.test(file.season) ||
    !/^\d+$/.test(file.episode) ||
    +file.season > 999 ||
    +file.episode < 1 ||
    +file.episode > 9999
  )
    return "Não identificado: use temporada 0–999 e episódio 1–9999";
  if (
    files.some(
      (other) =>
        other.id !== file.id &&
        !other.skipped &&
        other.season !== "" &&
        other.episode !== "" &&
        +other.season === +file.season &&
        +other.episode === +file.episode,
    )
  )
    return "Conflito: dois arquivos apontam para o mesmo episódio";
  return "";
}
const resolutionFrom = (filename: string) =>
  filename.match(/(?:^|[. _-])(2160p|1080p|720p)(?:[. _-]|$)/i)?.[1];
export class MockSeriesCatalog implements SeriesCatalog {
  capturePreview() {
    return structuredClone({ records: this.records, drafts: this.drafts });
  }
  restorePreview(value: ReturnType<MockSeriesCatalog["capturePreview"]>) {
    const snapshot = structuredClone(value);
    this.records = snapshot.records;
    this.drafts = snapshot.drafts;
  }

  scenario: SeriesScenario = "normal";
  private records: SeriesRecord[] = [];
  private drafts = new Map<string, SeriesDraft>();
  reviewSource(sourceId: string) {
    return structuredClone(this.drafts.get(sourceId) ?? null);
  }
  seedDefault() {
    this.drafts.clear();
    this.records = structuredClone(imdbSeriesFixtures);
  }
  async list() {
    const scenario = this.scenario;
    await new Promise((resolve) =>
      setTimeout(resolve, scenario === "slow" ? 1600 : 80),
    );
    if (scenario === "list-error")
      throw new Error("Não foi possível abrir as séries.");
    return structuredClone(this.records);
  }
  async save(draft: SeriesDraft) {
    const snapshot = structuredClone(draft);
    const scenario = this.scenario;
    await new Promise((resolve) =>
      setTimeout(resolve, scenario === "slow" ? 1600 : 200),
    );
    if (scenario === "save-error")
      throw new Error("Não foi possível salvar. Seu rascunho foi mantido.");
    if (
      !snapshot.title.trim() ||
      snapshot.title.trim().length > 160 ||
      snapshot.files.every((f) => f.skipped) ||
      snapshot.files.some((f) => mappingIssue(f, snapshot.files))
    )
      throw new Error(
        "Revise o título e resolva as pendências antes de confirmar.",
      );
    const record = structuredClone(
      this.records.find((r) => r.id === snapshot.seriesId) ?? {
        id: snapshot.seriesId,
        title: snapshot.title,
        episodes: [],
      },
    );
    record.title = snapshot.title.trim();
    // Replace only this source's associations, retaining episode identity and other sources.
    record.episodes.forEach(
      (e) =>
        (e.links = e.links.filter((l) => l.sourceId !== snapshot.sourceId)),
    );
    for (const file of snapshot.files.filter((f) => !f.skipped)) {
      const id = `${record.id}:${+file.season}:${+file.episode}`;
      let episode = record.episodes.find((e) => e.id === id);
      if (!episode) {
        episode = {
          id,
          season: +file.season,
          number: +file.episode,
          links: [],
        };
        record.episodes.push(episode);
      }
      episode.links.push({
        sourceId: snapshot.sourceId,
        sourceName: snapshot.sourceName,
        fileId: file.id,
        filename: file.filename,
        resolution: resolutionFrom(file.filename),
        fileAvailable: true,
        selector: file.corrected ? "manual" : "episode",
        subtitle: file.subtitle,
      });
    }
    const index = this.records.findIndex((r) => r.id === record.id);
    if (index < 0) this.records.push(record);
    else this.records[index] = record;
    this.drafts.set(snapshot.sourceId, snapshot);
    return record.id;
  }
  async setEpisodeArtwork(episodeId: string, artwork: EpisodeArtwork | null) {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const episode = this.records
      .flatMap((record) => record.episodes)
      .find((entry) => entry.id === episodeId);
    if (!episode) throw new Error("Não foi possível encontrar este episódio.");
    if (artwork) episode.artwork = structuredClone(artwork);
    else delete episode.artwork;
    return structuredClone(episode);
  }
  seed(kind: "empty" | "no-source" | "large") {
    this.drafts.clear();
    this.records =
      kind === "empty"
        ? []
        : [
            {
              id: "series:archive",
              title:
                kind === "large" ? "Arquivo das Estrelas" : "Série sem fontes",
              episodes: Array.from(
                { length: kind === "large" ? 20000 : 1 },
                (_, i) => ({
                  id: `archive:${i}`,
                  season: Math.floor(i / 200) + 1,
                  number: (i % 200) + 1,
                  links: [],
                }),
              ),
            },
          ];
  }
}
