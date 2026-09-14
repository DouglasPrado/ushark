import type {
  NextEpisodePreview,
  NextResult,
} from "@ushark/types/next-episode";
import type { SeriesCatalog } from "@ushark/types/series";
import type {
  SelectionPreview,
  SelectionPreferences,
} from "@ushark/types/selection";
export class MockNextEpisodePreview implements NextEpisodePreview {
  readonly runtime = "mock" as const;
  constructor(
    private catalog: SeriesCatalog,
    private selection: SelectionPreview,
    private preferences: () => SelectionPreferences,
  ) {}
  async resolve(id: string, signal: AbortSignal): Promise<NextResult> {
    const series = (await this.catalog.list()).find((s) =>
      s.episodes.some((e) => e.id === id),
    );
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    if (!series) return { kind: "not-episode", message: "" };
    const current = series.episodes.find((e) => e.id === id)!;
    if (current.season === 0)
      return {
        kind: "series-end",
        message: "Especial concluído. Escolha outro episódio na série.",
      };
    const same = series.episodes.find(
      (e) => e.season === current.season && e.number === current.number + 1,
    );
    const later = series.episodes
      .filter((e) => e.season > current.season)
      .sort((a, b) => a.season - b.season || a.number - b.number)[0];
    const gap = series.episodes.some(
      (e) => e.season === current.season && e.number > current.number + 1,
    );
    if (gap && !same)
      return {
        kind: "missing",
        message:
          "Próximo episódio ausente. A sequência não será pulada automaticamente.",
      };
    const next = same ?? later;
    if (!next)
      return {
        kind: "series-end",
        message: "Fim de série. Nenhum próximo episódio cadastrado.",
      };
    if (!same && (next.number !== 1 || next.season !== current.season + 1))
      return {
        kind: "missing",
        message: "Início da próxima temporada ausente.",
      };
    const candidates = next.links.map((l) => ({
      id: l.sourceId,
      name: l.sourceName,
      local: this.selection.isLocal?.(l.sourceId) ?? false,
      selector: l.fileId,
    }));
    const ranked = this.selection.rank(candidates, [], this.preferences());
    const source =
      ranked.find((s) => s.id === this.selection.override(next.id)) ??
      ranked[0];
    if (!source)
      return {
        kind: "missing",
        message: "Próximo episódio cadastrado, mas sem fonte disponível.",
      };
    const playback = (candidate: (typeof ranked)[number]) => ({
      id: next.id,
      title: `${series.title} · S${next.season}E${next.number}`,
      duration: 2700,
      sourceId: candidate.id,
      sourceName: candidate.name,
      selector: candidate.selector,
      available: true,
      progressive: !candidate.local,
    });
    return {
      choices: ranked.map(playback),
      requiresSourceChoice:
        !this.preferences().autoSelect && !this.selection.override(next.id),
      kind: same ? "next" : "season-end",
      message: same
        ? "Próximo episódio"
        : "Fim de temporada · próxima temporada disponível",
      next: {
        id: next.id,
        title: `${series.title} · S${next.season}E${next.number}`,
        duration: 2700,
        sourceId: source.id,
        sourceName: source.name,
        selector: source.selector,
        available: true,
        progressive: !source.local,
      },
    };
  }
  prepare(fail: boolean, signal: AbortSignal) {
    return new Promise<void>((resolve, reject) => {
      const abort = () => {
        clearTimeout(timer);
        reject(new DOMException("Cancelado", "AbortError"));
      };
      const timer = setTimeout(() => {
        signal.removeEventListener("abort", abort);
        if (fail)
          reject(
            new Error(
              "Preflight do próximo falhou. Episódio atual preservado.",
            ),
          );
        else resolve();
      }, 450);
      if (signal.aborted) abort();
      else signal.addEventListener("abort", abort, { once: true });
    });
  }
}
