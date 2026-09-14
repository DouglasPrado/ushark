import type { DownloadRequest } from "@ushark/types/downloads";
import { SourceChoices } from "./SourceChoices";
import type {
  SelectionPreview,
  SelectionPreferences,
} from "@ushark/types/selection";
import { TorrentImport } from "../torrent/TorrentImport";
import type { TorrentPreview } from "@ushark/types/torrent";
import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  Download,
  ImageOff,
  Plus,
  Search,
  Tv,
  X,
} from "lucide-react";
import {
  Button,
  FilterSearch,
  FilterSelect,
  FilterToolbar,
  MediaCard,
} from "@ushark/ui";
import type {
  Episode,
  EpisodeArtwork as EpisodeArtworkValue,
  EpisodeLink,
  PackKind,
  ReviewFile,
  SeriesCatalog,
  SeriesDraft,
  SeriesRecord,
  SeriesScenario,
} from "@ushark/types/series";
import { mappingIssue, packLabels, seriesDraft } from "@ushark/mocks/series";
import { useNavigation } from "../app/navigation";
import {
  averageTorrentHealth,
  bestQuality,
  healthPresentation,
  TorrentHealthBadge,
} from "./MediaSignals";
import "./movies.css";
import "./series.css";
export interface SeriesSession {
  playbackId?: string;
  draft: SeriesDraft | null;
  collapsed: number[];
  pending: string[] | null;
}
const seasonLabel = (n: number) =>
  n === 0
    ? "Especiais"
    : n === -1
      ? "Sem temporada definida"
      : `Temporada ${n}`;
const episodeLabel = (episode: Episode) =>
  `E${String(episode.number).padStart(2, "0")}`;
const compactNumber = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const seriesYears = (record: SeriesRecord) =>
  record.startYear
    ? `${record.startYear}${record.endYear ? `–${record.endYear}` : "–"}`
    : "Ano não informado";
type CatalogSort = "featured" | "votes" | "title";
const normalizeCatalogText = (value = "") =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
const EPISODE_ARTWORK_MAX_BYTES = 12 * 1024 * 1024;
const EPISODE_ARTWORK_TYPES = new Set<EpisodeArtworkValue["mimeType"]>([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const episodeArtworkExtension = /\.(?:jpe?g|png|webp|gif)$/i;
const readArtwork = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Não foi possível ler esta imagem."));
    reader.onerror = () =>
      reject(new Error("Não foi possível ler esta imagem."));
    reader.readAsDataURL(file);
  });
function SeriesArtwork({
  record,
  backdrop = false,
}: {
  record: SeriesRecord;
  backdrop?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const url = backdrop ? record.backdrop : record.poster;
  return (
    <div className={backdrop ? "series-detail-backdrop" : "series-poster"}>
      {url && !failed ? (
        <img src={url} alt="" loading="lazy" onError={() => setFailed(true)} />
      ) : backdrop ? null : (
        <div className="series-poster-fallback">
          <ImageOff size={30} />
          <small>Poster indisponível</small>
        </div>
      )}
    </div>
  );
}
function EpisodeArtwork({
  episode,
  fallback,
  detail = false,
}: {
  episode: Episode;
  fallback?: string;
  detail?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const src = episode.artwork?.src ?? fallback;
  useEffect(() => setFailed(false), [src]);
  return (
    <div
      className={`series-episode-artwork${detail ? " is-detail" : ""}`}
      aria-hidden="true"
      data-artwork-source={
        episode.artwork
          ? "episode-upload"
          : fallback
            ? "series-backdrop"
            : "empty"
      }
    >
      {src && !failed ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <div className="series-episode-artwork-fallback">
          <ImageOff size={detail ? 34 : 24} />
          <small>Sem imagem</small>
        </div>
      )}
    </div>
  );
}
function SeriesImdbFacts({
  record,
  detail = false,
}: {
  record: SeriesRecord;
  detail?: boolean;
}) {
  const imdbId = record.externalIds?.imdb;
  if (!imdbId || !/^tt\d+$/.test(imdbId)) return null;
  const rating = record.ratings?.imdb;
  return (
    <div
      className={`imdb-facts${detail ? " imdb-facts-detail" : ""}`}
      aria-label={
        rating
          ? `IMDb ${rating.average.toFixed(1)} de 10, ${rating.votes} votos, identificador ${imdbId}`
          : `Identificador IMDb ${imdbId}`
      }
    >
      <span className="imdb-badge">IMDb</span>
      {rating && (
        <>
          <span className="imdb-score">
            {rating.average.toLocaleString("pt-BR", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
          </span>
          <span className="imdb-votes">
            {compactNumber.format(rating.votes)} votos
          </span>
        </>
      )}
      <code>{imdbId}</code>
    </div>
  );
}
export function Series({
  tvMode = false,
  onDownload,
  onLibraries,
  onDownloads,
  selectionService,
  preferences,
  suspended = false,
  onPlay,
  torrentService,
  catalog,
  session,
  configure,
  seed,
  onHome,
  onMovies,
  libraryName,
}: {
  tvMode?: boolean;
  suspended?: boolean;
  onPlay: (content: import("@ushark/types/player").PlaybackContent) => void;
  selectionService: SelectionPreview;
  preferences: SelectionPreferences;
  onDownload: (request: DownloadRequest) => void;
  onLibraries: () => void;
  onDownloads: () => void;
  torrentService: TorrentPreview;
  catalog: SeriesCatalog;
  session: SeriesSession;
  configure: (s: SeriesScenario) => void;
  seed: (s: "empty" | "no-source" | "large") => void;
  onHome: () => void;
  onMovies: () => void;
  libraryName: string;
}) {
  const [torrentOpen, setTorrentOpen] = useState(false);
  const [records, setRecords] = useState<SeriesRecord[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [season, setSeason] = useState<number | null>(null);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [review, setReview] = useState(false);
  const [draft, setDraft] = useState<SeriesDraft | null>(session.draft);
  const [collapsed, setCollapsed] = useState<number[]>(session.collapsed);
  const [pending, setPending] = useState<string[] | null>(session.pending);
  const [scenario, setScenario] = useState<SeriesScenario>("normal");
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [seasonPage, setSeasonPage] = useState(0);
  const [episodePage, setEpisodePage] = useState(0);
  const [artworkBusy, setArtworkBusy] = useState(false);
  const [artworkError, setArtworkError] = useState("");
  const [artworkNotice, setArtworkNotice] = useState("");
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogSort, setCatalogSort] = useState<CatalogSort>("featured");
  const version = useRef(0);
  const locked = useRef(false);
  const origin = useRef<HTMLElement | null>(null);
  const returnTarget = useRef("series-add");
  useEffect(() => {
    if (!suspended && session.playbackId) {
      const record = records.find((r) =>
        r.episodes.some((e) => e.id === session.playbackId),
      );
      if (record) {
        setSelected(record.id);
        setEpisode(
          record.episodes.find((e) => e.id === session.playbackId) ?? null,
        );
      }
      session.playbackId = undefined;
    }
  }, [suspended, records, session]);
  const item = records.find((r) => r.id === selected);
  const normalizedCatalogQuery = normalizeCatalogText(catalogQuery.trim());
  const visibleRecords = records
    .filter((record) => {
      if (!normalizedCatalogQuery) return true;
      const searchable = normalizeCatalogText(
        [record.title, record.originalTitle, ...(record.genres ?? [])].join(
          " ",
        ),
      );
      return normalizedCatalogQuery
        .split(/\s+/)
        .every((term) => searchable.includes(term));
    })
    .sort((left, right) => {
      const byTitle = left.title.localeCompare(right.title, "pt-BR", {
        sensitivity: "base",
      });
      if (catalogSort === "title") return byTitle;
      if (catalogSort === "votes")
        return (
          (right.ratings?.imdb?.votes ?? -1) -
            (left.ratings?.imdb?.votes ?? -1) || byTitle
        );
      return 0;
    });
  const signalForLinks = (links: EpisodeLink[], id: string) => {
    const uniqueLinks = Array.from(
      new Map(links.map((link) => [link.sourceId, link])).values(),
    );
    return {
      quality: bestQuality(links.map((link) => link.resolution)),
      health: averageTorrentHealth(
        uniqueLinks.map((link) =>
          selectionService.getHealthSummary({
            id: link.sourceId,
            name: link.sourceName,
            local: false,
            resolution: link.resolution ? parseInt(link.resolution) : undefined,
          }),
        ),
        id,
      ),
    };
  };
  const signalFor = (record: SeriesRecord) =>
    signalForLinks(
      record.episodes.flatMap((entry) => entry.links),
      `series-average:${record.id}`,
    );
  const signalForEpisode = (entry: Episode) =>
    signalForLinks(entry.links, `episode-average:${entry.id}`);
  const itemSignal = item ? signalFor(item) : undefined;
  const input = useNavigation(back, !torrentOpen && !suspended);
  async function refresh() {
    const request = ++version.current;
    setLoading(true);
    try {
      const result = await catalog.list();
      if (request === version.current) {
        setRecords(result);
        setListError("");
      }
    } catch (e) {
      if (request === version.current) setListError((e as Error).message);
    } finally {
      if (request === version.current) setLoading(false);
    }
  }
  useEffect(() => {
    configure("normal");
    void refresh();
    return () => {
      version.current++;
    };
  }, []);
  useEffect(() => {
    session.draft = draft;
    session.collapsed = collapsed;
    session.pending = pending;
  }, [draft, collapsed, pending, session]);
  useEffect(() => {
    window.location.hash = review
      ? "/series/new"
      : selected
        ? `/series/${selected}${season === null ? "" : `/season/${season}`}`
        : "/series";
  }, [selected, season, review]);
  useEffect(() => {
    setArtworkError("");
    setArtworkNotice("");
  }, [episode?.id]);
  useEffect(() => {
    if (!review && !episode && !loading)
      (
        document.getElementById(returnTarget.current) ??
        document.getElementById("series-back")
      )?.focus();
  }, [selected, season, review, episode, loading]);
  function back() {
    if (locked.current) return;
    if (review) {
      setReview(false);
      return;
    }
    if (episode) {
      setEpisode(null);
      return;
    }
    if (season !== null) {
      returnTarget.current = `season-${season}`;
      setSeason(null);
      return;
    }
    if (selected) {
      returnTarget.current = `series-${selected}`;
      setSelected(null);
      return;
    }
    onHome();
  }
  function openReview() {
    origin.current = document.activeElement as HTMLElement;
    setError("");
    setReview(true);
  }
  function choose(kind: PackKind, missing = false) {
    setDraft(
      missing
        ? seriesDraft(kind, true)
        : (catalog.reviewSource(`source:${kind}`) ?? seriesDraft(kind)),
    );
    setPending(null);
    setCollapsed([]);
    setError("");
  }
  function edit(id: string, change: Partial<ReviewFile>) {
    setDraft((d) =>
      d
        ? {
            ...d,
            files: d.files.map((f) => (f.id === id ? { ...f, ...change } : f)),
          }
        : d,
    );
    setError("");
  }
  async function save() {
    if (!draft || locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      const id = await catalog.save(draft);
      await refresh();
      setSelected(id);
      setSeason(null);
      setReview(false);
      setDraft(draft.files.some((f) => f.skipped) ? draft : null);
      setPending(null);
      setCollapsed([]);
      returnTarget.current = "series-back";
      setNotice("Série atualizada nesta sessão.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  function applyEpisodeArtwork(updated: Episode) {
    setEpisode(updated);
    setRecords((current) =>
      current.map((record) => ({
        ...record,
        episodes: record.episodes.map((entry) =>
          entry.id === updated.id ? updated : entry,
        ),
      })),
    );
  }
  async function submitEpisodeArtwork(file: File) {
    if (!episode || artworkBusy) return;
    setArtworkError("");
    setArtworkNotice("");
    if (
      !EPISODE_ARTWORK_TYPES.has(
        file.type as EpisodeArtworkValue["mimeType"],
      ) ||
      !episodeArtworkExtension.test(file.name)
    ) {
      setArtworkError("Use uma imagem JPEG, PNG, WebP ou GIF.");
      return;
    }
    if (!file.size || file.size > EPISODE_ARTWORK_MAX_BYTES) {
      setArtworkError("A imagem precisa ter até 12 MB e não pode estar vazia.");
      return;
    }
    setArtworkBusy(true);
    try {
      const updated = await catalog.setEpisodeArtwork(episode.id, {
        src: await readArtwork(file),
        fileName: file.name,
        mimeType: file.type as EpisodeArtworkValue["mimeType"],
      });
      applyEpisodeArtwork(updated);
      setArtworkNotice(
        file.type === "image/gif"
          ? "GIF aplicado ao episódio nesta sessão."
          : "Imagem aplicada ao episódio nesta sessão.",
      );
    } catch (cause) {
      setArtworkError((cause as Error).message);
    } finally {
      setArtworkBusy(false);
    }
  }
  async function removeEpisodeArtwork() {
    if (!episode || artworkBusy) return;
    setArtworkBusy(true);
    setArtworkError("");
    setArtworkNotice("");
    try {
      applyEpisodeArtwork(await catalog.setEpisodeArtwork(episode.id, null));
      setArtworkNotice("Imagem removida; usando a prévia padrão da série.");
    } catch (cause) {
      setArtworkError((cause as Error).message);
    } finally {
      setArtworkBusy(false);
    }
  }
  const files = draft?.files ?? [];
  const issues = files.filter((f) => mappingIssue(f, files));
  const active = files.filter((f) => !f.skipped);
  const groups = [
    ...new Set(
      files.map((f) => (f.originalSeason === "" ? -1 : +f.originalSeason)),
    ),
  ].sort((a, b) => a - b);
  const seasons = [...new Set(item?.episodes.map((e) => e.season) ?? [])].sort(
    (a, b) => a - b,
  );
  const episodes =
    item?.episodes
      .filter((e) => e.season === season)
      .sort((a, b) => a.number - b.number) ?? [];
  const duplicate = records.some((r) =>
    r.episodes.some((e) => e.links.some((l) => l.sourceId === draft?.sourceId)),
  );
  const pager = (page: number, total: number, set: (n: number) => void) =>
    total > 20 && (
      <div className="series-pager">
        <Button
          variant="secondary"
          disabled={page === 0}
          onClick={() => set(page - 1)}
        >
          Página anterior
        </Button>
        <span>
          Página {page + 1} de {Math.ceil(total / 20)}
        </span>
        <Button
          variant="secondary"
          disabled={(page + 1) * 20 >= total}
          onClick={() => set(page + 1)}
        >
          Próxima página
        </Button>
      </div>
    );
  return (
    <div
      className="app series-app"
      data-input={input}
      data-tv-mode={tvMode || undefined}
    >
      <header className="movies-header">
        <div className="movies-header-primary">
          <span className="movies-brand">Ushark</span>
          <nav aria-label="Navegação principal">
            <button onClick={onHome} disabled={busy}>
              Início
            </button>
            <button onClick={onMovies} disabled={busy}>
              Filmes
            </button>
            <button
              aria-current="page"
              onClick={() => {
                setSelected(null);
                setSeason(null);
                returnTarget.current = "series-add";
              }}
              disabled={busy}
            >
              Séries
            </button>
            {!tvMode && <button onClick={onLibraries}>Bibliotecas</button>}
          </nav>
        </div>
        {!tvMode && (
          <div className="movies-header-actions">
            <TorrentImport
              compact
              service={torrentService}
              onActive={setTorrentOpen}
              onConfirm={async (value, ids) => {
                const files = value.files.filter((f) => ids.includes(f.id));
                if (files.some((f) => !/[Ss](\d+)[Ee](\d+)/.test(f.name)))
                  throw new Error(
                    "Arquivo sem temporada/episódio inequívoco. Use o fluxo manual de Séries para mapear esta source.",
                  );
                await catalog.save({
                  seriesId: selected ?? `import-series:${value.hash}`,
                  title: item?.title ?? value.name,
                  sourceId: `torrent:${value.hash}`,
                  sourceName: value.name,
                  files: files.map((f) => {
                    const match = f.name.match(/[Ss](\d+)[Ee](\d+)/)!;
                    return {
                      id: f.id,
                      filename: f.name,
                      season: String(Number(match[1])),
                      episode: String(Number(match[2])),
                      originalSeason: String(Number(match[1])),
                      originalEpisode: String(Number(match[2])),
                      manualRequired: false,
                      corrected: false,
                      skipped: false,
                      subtitle: "",
                      subtitles: [],
                    };
                  }),
                });
                await refresh();
              }}
            />
            <button
              className="movie-icon-button"
              aria-label="Downloads"
              title="Downloads"
              onClick={onDownloads}
            >
              <Download size={21} />
            </button>
            <button
              id="series-add"
              className="movie-icon-button movie-add-button"
              aria-label="Adicionar série"
              title="Adicionar série"
              onClick={openReview}
              disabled={busy}
            >
              <Plus size={22} />
            </button>
          </div>
        )}
      </header>
      <main className="movies-layout">
        <section className="movies-surface">
          {selected && (
            <Button id="series-back" variant="secondary" onClick={back}>
              <ArrowLeft size={18} />{" "}
              {season === null ? "Todas as séries" : "Voltar à série"}
            </Button>
          )}
          {!selected && (
            <>
              <div className="movie-list-heading">
                <div>
                  <div className="eyebrow">BIBLIOTECA · SÉRIES</div>
                  <h1>Séries</h1>
                  <p>Histórias que continuam. Uma temporada de cada vez.</p>
                </div>
              </div>
              <FilterToolbar
                className="movie-list-toolbar series-list-toolbar"
                summary={
                  visibleRecords.length === records.length
                    ? `${records.length} ${records.length === 1 ? "série na biblioteca" : "séries na biblioteca"}`
                    : `${visibleRecords.length} de ${records.length} séries`
                }
              >
                <FilterSearch
                  className="catalog-list-search"
                  label="Buscar na lista de séries"
                  placeholder="Buscar séries"
                  value={catalogQuery}
                  icon={<Search size={18} aria-hidden="true" />}
                  onChange={(event) => setCatalogQuery(event.target.value)}
                />
                <FilterSelect
                  className="catalog-list-sort"
                  label="Ordenar por"
                  aria-label="Ordenar séries"
                  value={catalogSort}
                  onChange={(event) =>
                    setCatalogSort(event.target.value as CatalogSort)
                  }
                >
                  <option value="featured">Em destaque</option>
                  <option value="votes">Mais votados</option>
                  <option value="title">A–Z</option>
                </FilterSelect>
              </FilterToolbar>
            </>
          )}
          {scenario === "offline" && (
            <p className="banner">
              Offline simulado. Sua coleção em memória continua disponível.
            </p>
          )}
          {notice && (
            <p className="success" role="status">
              {notice}
            </p>
          )}
          {loading ? (
            <p role="status">Abrindo suas séries…</p>
          ) : listError ? (
            <div role="alert" className="error">
              {listError}
              <Button
                onClick={() => {
                  configure("normal");
                  setScenario("normal");
                  void refresh();
                }}
              >
                Tentar novamente
              </Button>
            </div>
          ) : !selected ? (
            visibleRecords.length ? (
              <div className="series-grid">
                {visibleRecords.map((r) => {
                  const { quality, health } = signalFor(r);
                  const healthId = health
                    ? `torrent-health-${r.id}`
                    : undefined;
                  return (
                    <MediaCard
                      className="series-card"
                      orientation="portrait"
                      image={r.poster}
                      fallback={
                        <>
                          <ImageOff size={30} />
                          <small>Poster indisponível</small>
                        </>
                      }
                      overlays={
                        health ? (
                          <TorrentHealthBadge
                            id={healthId}
                            health={health}
                            prefix="Média"
                          />
                        ) : undefined
                      }
                      title={r.title}
                      mediaClassName="series-card-media"
                      artClassName="series-poster"
                      copyClassName="series-card-copy"
                      id={`series-${r.id}`}
                      key={r.id}
                      onClick={() => {
                        setSelected(r.id);
                        setSeasonPage(0);
                        returnTarget.current = "series-back";
                      }}
                      aria-label={`Abrir ${r.title}`}
                      aria-describedby={healthId}
                    >
                      <small className="series-card-meta">
                        {seriesYears(r)} ·{" "}
                        {new Set(r.episodes.map((e) => e.season)).size}{" "}
                        temporadas · {r.episodes.length.toLocaleString("pt-BR")}{" "}
                        episódios{quality ? ` · ${quality}` : ""}
                      </small>
                      <SeriesImdbFacts record={r} />
                      {!!r.genres?.length && (
                        <small className="series-card-genres">
                          {r.genres.join(" / ")}
                        </small>
                      )}
                    </MediaCard>
                  );
                })}
              </div>
            ) : (
              <div className="series-empty">
                {normalizedCatalogQuery ? (
                  <Search size={64} />
                ) : (
                  <Tv size={64} />
                )}
                <h2>
                  {normalizedCatalogQuery
                    ? "Nenhuma série encontrada."
                    : "Sua próxima série começa aqui."}
                </h2>
                <p>
                  {normalizedCatalogQuery
                    ? "Tente buscar por outro título, título original ou gênero."
                    : tvMode
                      ? "Nenhuma série está disponível neste dispositivo."
                      : "Adicione um episódio ou organize uma temporada inteira."}
                </p>
                {normalizedCatalogQuery ? (
                  <Button onClick={() => setCatalogQuery("")}>
                    Limpar busca
                  </Button>
                ) : tvMode ? (
                  <Button onClick={onHome}>Voltar ao início</Button>
                ) : (
                  <Button onClick={openReview}>
                    Explorar fontes de exemplo
                  </Button>
                )}
              </div>
            )
          ) : (
            item && (
              <>
                <div className="series-detail">
                  <SeriesArtwork record={item} backdrop />
                  <div className="series-detail-poster">
                    <SeriesArtwork record={item} />
                  </div>
                  <div className="series-detail-copy">
                    <div className="eyebrow">NA SUA BIBLIOTECA</div>
                    <h1>{item.title}</h1>
                    <p className="series-meta">
                      {seriesYears(item)} <span>·</span> Série
                      {itemSignal?.quality && (
                        <>
                          <span>·</span> {itemSignal.quality}
                        </>
                      )}
                      {itemSignal?.health && (
                        <TorrentHealthBadge
                          health={itemSignal.health}
                          inline
                          prefix="Média"
                        />
                      )}
                    </p>
                    {item.originalTitle &&
                      item.originalTitle !== item.title && (
                        <small>Título original: {item.originalTitle}</small>
                      )}
                    <SeriesImdbFacts record={item} detail />
                    {!!item.genres?.length && (
                      <div className="genre-list">
                        {item.genres.map((genre) => (
                          <span key={genre}>{genre}</span>
                        ))}
                      </div>
                    )}
                    {item.synopsis && (
                      <p className="series-synopsis">{item.synopsis}</p>
                    )}
                    {item.externalIds?.imdb && (
                      <small className="series-data-note">
                        Dados e imagens: snapshot IMDb · temporadas e episódios:
                        demonstração local
                      </small>
                    )}
                  </div>
                </div>
                <div className="series-summary">
                  <span>{seasons.length} temporadas</span>
                  <span>
                    {item.episodes.length.toLocaleString("pt-BR")} episódios
                  </span>
                  {!tvMode && (
                    <>
                      <span>
                        {
                          new Set(
                            item.episodes.flatMap((e) =>
                              e.links.map((l) => l.sourceId),
                            ),
                          ).size
                        }{" "}
                        fontes de exemplo
                      </span>
                      {itemSignal?.quality && (
                        <span>Melhor resolução: {itemSignal.quality}</span>
                      )}
                      {itemSignal?.health && (
                        <span>
                          Média do Torrent Health:{" "}
                          {healthPresentation(itemSignal.health).label}
                        </span>
                      )}
                      <span>
                        {item.externalIds?.imdb
                          ? "Hierarquia de episódios mockada"
                          : "Metadata de episódios indisponível"}
                      </span>
                    </>
                  )}
                </div>
                {season === null ? (
                  <>
                    <h2>Temporadas</h2>
                    <div className="series-seasons">
                      {seasons
                        .slice(seasonPage * 20, seasonPage * 20 + 20)
                        .map((n) => (
                          <Button
                            id={`season-${n}`}
                            key={n}
                            variant="secondary"
                            onClick={() => {
                              setSeason(n);
                              setEpisodePage(0);
                              returnTarget.current = "series-back";
                            }}
                          >
                            {seasonLabel(n)}
                            <small>
                              {
                                item.episodes.filter((e) => e.season === n)
                                  .length
                              }{" "}
                              episódios
                            </small>
                          </Button>
                        ))}
                    </div>
                    {pager(seasonPage, seasons.length, setSeasonPage)}
                  </>
                ) : (
                  <>
                    <h2>{seasonLabel(season)}</h2>
                    <div className="series-episodes">
                      {episodes
                        .slice(episodePage * 20, episodePage * 20 + 20)
                        .map((e) => {
                          const episodeSignal = signalForEpisode(e);
                          const healthId = episodeSignal.health
                            ? `torrent-health-${e.id}`
                            : undefined;
                          return (
                            <button
                              id={`episode-${e.id}`}
                              key={e.id}
                              className="series-episode"
                              onClick={() => {
                                origin.current =
                                  document.activeElement as HTMLElement;
                                returnTarget.current = `episode-${e.id}`;
                                setEpisode(e);
                              }}
                              aria-describedby={healthId}
                            >
                              <EpisodeArtwork
                                episode={e}
                                fallback={item.backdrop}
                              />
                              <strong className="series-episode-code">
                                {episodeLabel(e)}
                              </strong>
                              <span className="series-episode-copy">
                                {e.title ?? "Título do episódio indisponível"}
                                <small>
                                  {e.links.length
                                    ? `${e.links.length} fonte(s)${episodeSignal.quality ? ` · ${episodeSignal.quality}` : ""} · arquivo associado`
                                    : "Sem fontes"}
                                </small>
                              </span>
                              {episodeSignal.health && (
                                <TorrentHealthBadge
                                  id={healthId}
                                  health={episodeSignal.health}
                                  inline
                                />
                              )}
                              <span className="series-episode-action">
                                {tvMode ? "Assistir →" : "Ver arquivos →"}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                    {pager(episodePage, episodes.length, setEpisodePage)}
                  </>
                )}
              </>
            )
          )}
          {!tvMode && (
            <details className="series-tools">
              <summary>Inspecionar prévia</summary>
              <div className="series-tool-fields">
                <label>
                  Cenário de séries
                  <select
                    value={scenario}
                    onChange={(e) => {
                      const s = e.target.value as SeriesScenario;
                      setScenario(s);
                      configure(s);
                      void refresh();
                    }}
                  >
                    {Object.entries({
                      normal: "Normal",
                      slow: "Carregamento lento",
                      offline: "Offline",
                      "list-error": "Erro de lista",
                      "save-error": "Erro ao salvar",
                    }).map(([v, t]) => (
                      <option key={v} value={v}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Coleção de exemplo
                  <select
                    defaultValue="current"
                    onChange={(e) => {
                      if (e.target.value === "current") return;
                      seed(e.target.value as "empty" | "no-source" | "large");
                      setSelected(null);
                      setSeason(null);
                      returnTarget.current = "series-add";
                      void refresh();
                    }}
                  >
                    <option value="current">Coleção atual</option>
                    <option value="empty">Vazia</option>
                    <option value="no-source">Sem fontes</option>
                    <option value="large">20.000 episódios</option>
                  </select>
                </label>
              </div>
            </details>
          )}
        </section>
      </main>
      {!tvMode && (
        <footer>
          <span>
            {input === "gamepad"
              ? "Controle · A selecionar · B voltar"
              : input === "remote"
                ? "Direcionais navegar · OK selecionar · Voltar"
                : input === "disconnected"
                  ? "Controle desconectado · teclado disponível"
                  : "Tab navegar · Enter selecionar · Esc voltar"}
          </span>
          <span>
            Prévia em memória · metadata empacotada · reiniciar descarta
            alterações
          </span>
        </footer>
      )}
      <Dialog.Root
        open={!suspended && (review || !!episode)}
        onOpenChange={(open) => {
          if (!open) back();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay" />
          <Dialog.Content
            className="modal series-modal"
            data-input={input}
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              if (origin.current?.isConnected) origin.current.focus();
            }}
            onEscapeKeyDown={(e) => {
              e.preventDefault();
              back();
            }}
          >
            <Dialog.Title>
              {review
                ? "Adicionar e revisar série"
                : `${seasonLabel(episode?.season ?? 0)} · ${episode ? episodeLabel(episode) : ""}`}
            </Dialog.Title>
            <Dialog.Description>
              {review
                ? "Escolha uma fonte fictícia e confira o destino de cada arquivo. Nada será lido ou baixado."
                : tvMode
                  ? "Escolha assistir para continuar."
                  : "Arquivos associados a este episódio. Reprodução simulada disponível nesta prévia."}
            </Dialog.Description>
            {review ? (
              <>
                <fieldset disabled={busy}>
                  <legend>Fonte de exemplo</legend>
                  <div className="series-pack-options">
                    {(Object.keys(packLabels) as PackKind[]).map((kind) => (
                      <Button
                        key={kind}
                        variant="secondary"
                        aria-pressed={draft?.sourceId === `source:${kind}`}
                        onClick={() => choose(kind)}
                      >
                        {packLabels[kind]}
                      </Button>
                    ))}
                    <Button
                      variant="secondary"
                      onClick={() => choose("multi", true)}
                    >
                      Sem metadata
                    </Button>
                  </div>
                </fieldset>
                {draft && (
                  <>
                    <label>
                      Título da série
                      <input
                        disabled={busy}
                        maxLength={160}
                        value={draft.title}
                        onChange={(e) => {
                          setDraft({ ...draft, title: e.target.value });
                          setError("");
                        }}
                      />
                    </label>
                    <div className="series-review-summary">
                      <strong>
                        {active.length - issues.length} identificados ·{" "}
                        {issues.length} pendências ·{" "}
                        {files.filter((f) => f.skipped).length} para depois
                      </strong>
                      <Button
                        variant="secondary"
                        disabled={busy}
                        aria-pressed={!!pending}
                        onClick={() =>
                          setPending(pending ? null : issues.map((f) => f.id))
                        }
                      >
                        {pending
                          ? "Mostrar todos os arquivos"
                          : "Filtrar pendências"}
                      </Button>
                    </div>
                    {pending && (
                      <p className="note">
                        As linhas permanecem visíveis durante a correção. Mostre
                        todos os arquivos para atualizar o filtro.
                      </p>
                    )}
                    {duplicate && (
                      <p className="banner">
                        Fonte já cadastrada. Confirmar substituirá somente as
                        associações desta fonte; outras fontes serão mantidas.
                      </p>
                    )}
                    <div className="series-review-files">
                      {groups.map((group) => {
                        const groupFiles = files.filter(
                          (f) =>
                            (f.originalSeason === ""
                              ? -1
                              : +f.originalSeason) === group &&
                            (!pending || pending.includes(f.id)),
                        );
                        if (!groupFiles.length) return null;
                        return (
                          <section key={group}>
                            <Button
                              variant="secondary"
                              disabled={busy}
                              aria-expanded={!collapsed.includes(group)}
                              onClick={() =>
                                setCollapsed((c) =>
                                  c.includes(group)
                                    ? c.filter((n) => n !== group)
                                    : [...c, group],
                                )
                              }
                            >
                              {seasonLabel(group)} · {groupFiles.length}{" "}
                              arquivo(s)
                            </Button>
                            {!collapsed.includes(group) &&
                              groupFiles.map((f) => (
                                <div
                                  className="series-file"
                                  key={f.id}
                                  data-file={f.filename}
                                >
                                  <strong>{f.filename}</strong>
                                  <small
                                    className={
                                      mappingIssue(f, files)
                                        ? "series-warning"
                                        : ""
                                    }
                                  >
                                    {f.skipped
                                      ? "Deixado para depois"
                                      : mappingIssue(f, files) ||
                                        (f.corrected
                                          ? "Corrigido · escolha manual"
                                          : "Identificado · por episódio")}
                                  </small>
                                  <div className="series-file-fields">
                                    <label>
                                      Temporada
                                      <input
                                        aria-label={`Temporada de ${f.filename}`}
                                        disabled={busy || f.skipped}
                                        type="number"
                                        min={0}
                                        max={999}
                                        value={f.season}
                                        onChange={(e) =>
                                          edit(f.id, {
                                            season: e.target.value,
                                            corrected: true,
                                          })
                                        }
                                      />
                                    </label>
                                    <label>
                                      Episódio
                                      <input
                                        aria-label={`Episódio de ${f.filename}`}
                                        disabled={busy || f.skipped}
                                        type="number"
                                        min={1}
                                        max={9999}
                                        value={f.episode}
                                        onChange={(e) =>
                                          edit(f.id, {
                                            episode: e.target.value,
                                            corrected: true,
                                          })
                                        }
                                      />
                                    </label>
                                    <label>
                                      Legenda
                                      <select
                                        aria-label={`Legenda de ${f.filename}`}
                                        disabled={busy || f.skipped}
                                        value={f.subtitle}
                                        onChange={(e) =>
                                          edit(f.id, {
                                            subtitle: e.target.value,
                                          })
                                        }
                                      >
                                        <option value="">Sem legenda</option>
                                        {f.subtitles.map((s) => (
                                          <option key={s}>{s}</option>
                                        ))}
                                      </select>
                                    </label>
                                  </div>
                                  <div className="series-file-actions">
                                    <Button
                                      variant="secondary"
                                      disabled={busy}
                                      onClick={() =>
                                        edit(f.id, {
                                          season: f.originalSeason,
                                          episode: f.originalEpisode,
                                          corrected: false,
                                          skipped: false,
                                          subtitle: "",
                                        })
                                      }
                                    >
                                      Restaurar sugestão
                                    </Button>
                                    <Button
                                      variant="secondary"
                                      disabled={busy}
                                      onClick={() =>
                                        edit(f.id, { skipped: !f.skipped })
                                      }
                                    >
                                      {f.skipped
                                        ? "Retomar arquivo"
                                        : "Deixar para depois"}
                                    </Button>
                                  </div>
                                </div>
                              ))}
                          </section>
                        );
                      })}
                    </div>
                  </>
                )}
                {error && (
                  <p role="alert" className="error">
                    {error}
                  </p>
                )}
                <div className="series-save">
                  <label className="series-failure">
                    <input
                      type="checkbox"
                      disabled={busy}
                      checked={scenario === "save-error"}
                      onChange={(e) => {
                        const s = e.target.checked ? "save-error" : "normal";
                        setScenario(s);
                        configure(s);
                      }}
                    />{" "}
                    Simular falha ao salvar
                  </label>
                  <Button variant="secondary" disabled={busy} onClick={back}>
                    Cancelar e guardar rascunho
                  </Button>
                  <Button
                    disabled={
                      busy ||
                      !draft?.title.trim() ||
                      issues.length > 0 ||
                      active.length === 0
                    }
                    onClick={() => void save()}
                  >
                    {busy ? "Salvando…" : "Confirmar série"}
                  </Button>
                </div>
              </>
            ) : (
              episode && (
                <div className="series-link-list">
                  <section className="episode-artwork-panel">
                    <EpisodeArtwork
                      episode={episode}
                      fallback={item?.backdrop}
                      detail
                    />
                    <div className="episode-artwork-copy">
                      <strong>Imagem do episódio</strong>
                      <p>
                        {episode.artwork
                          ? `${episode.artwork.fileName} · ${episode.artwork.mimeType === "image/gif" ? "GIF animado" : "imagem enviada"}`
                          : item?.backdrop
                            ? "Usando a imagem da série como prévia até você enviar a arte deste episódio."
                            : "Este episódio ainda não possui imagem."}
                      </p>
                      {!tvMode && (
                        <>
                          <label className="episode-artwork-upload">
                            {artworkBusy
                              ? "Aplicando imagem…"
                              : "Enviar imagem ou GIF do episódio"}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                              disabled={artworkBusy}
                              onChange={(event) => {
                                const input = event.currentTarget;
                                const file = input.files?.[0];
                                if (file) void submitEpisodeArtwork(file);
                                input.value = "";
                              }}
                            />
                          </label>
                          {episode.artwork && (
                            <Button
                              variant="secondary"
                              disabled={artworkBusy}
                              onClick={() => void removeEpisodeArtwork()}
                            >
                              Remover imagem
                            </Button>
                          )}
                          <small>
                            JPEG, PNG, WebP ou GIF · até 12 MB. Nesta prévia, o
                            arquivo fica somente na sessão mock.
                          </small>
                        </>
                      )}
                      {artworkError && (
                        <p
                          className="episode-artwork-message is-error"
                          role="alert"
                        >
                          {artworkError}
                        </p>
                      )}
                      {artworkNotice && (
                        <p className="episode-artwork-message" role="status">
                          {artworkNotice}
                        </p>
                      )}
                    </div>
                  </section>
                  <SourceChoices
                    contentId={episode.id}
                    sources={episode.links.map((l) => ({
                      id: l.sourceId,
                      name: l.sourceName,
                      local: false,
                      selector: l.fileId,
                      origin: libraryName,
                    }))}
                    onDownload={(source) =>
                      onDownload({
                        content: {
                          id: episode.id,
                          title: `${item?.title ?? "Série"} · S${episode.season}E${episode.number}`,
                          duration: 2700,
                        },
                        source,
                      })
                    }
                    service={selectionService}
                    preferences={preferences}
                    suspended={suspended}
                    consumerMode={tvMode}
                    label="Assistir episódio"
                    onPlay={(s) =>
                      onPlay({
                        id: episode.id,
                        title: `${item?.title ?? "Série"} · S${episode.season}E${episode.number}`,
                        available: true,
                        progressive: !s.local,
                        sourceId: s.id,
                        sourceName: s.name,
                        selector: s.selector,
                        duration: 2700,
                      })
                    }
                  />

                  {!tvMode &&
                    (episode.links.length ? (
                      episode.links.map((link) => (
                        <div
                          className="series-file"
                          key={`${link.sourceId}:${link.fileId}`}
                        >
                          <strong>{link.sourceName}</strong>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              const saved = catalog.reviewSource(link.sourceId);
                              if (!saved) return;
                              setDraft(saved);
                              setCollapsed([]);
                              setPending(null);
                              setError("");
                              setEpisode(null);
                              setReview(true);
                            }}
                          >
                            Revisar associações desta fonte
                          </Button>
                          <p>{link.filename}</p>
                          <small>
                            {link.selector === "manual"
                              ? "Escolha manual"
                              : "Identificado por episódio"}{" "}
                            · {link.subtitle || "Sem legenda"}
                          </small>
                        </div>
                      ))
                    ) : (
                      <p>Este episódio ainda não tem fontes.</p>
                    ))}
                </div>
              )
            )}
            <Button
              className="modal-close"
              aria-label="Fechar"
              variant="secondary"
              disabled={busy}
              onClick={back}
            >
              <X size={22} />
            </Button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
