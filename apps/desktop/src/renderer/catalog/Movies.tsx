import type { DownloadRequest } from "@ushark/types/downloads";
import type {
  SelectionPreview,
  SelectionPreferences,
} from "@ushark/types/selection";
import { TorrentImport } from "../torrent/TorrentImport";
import type { Inspection, TorrentPreview } from "@ushark/types/torrent";
import { useEffect, useRef, useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  FileX2,
  Film,
  Heart,
  ImageOff,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  Unlink,
  X,
} from "lucide-react";
import {
  Button,
  FilterGroup,
  FilterSelect,
  FilterToolbar,
  MediaCard,
} from "@ushark/ui";
import type {
  MetadataProvider,
  Movie,
  MovieCatalog,
  MovieMetadata,
  MovieScenario,
  MovieSource,
} from "@ushark/types/movies";
import type { DiscoveryItem } from "@ushark/types/discovery";
import {
  movieFixtures,
  movieTitle,
  sourceFixtures,
} from "@ushark/mocks/movies";
import { useNavigation } from "../app/navigation";
import { bestQuality, formatQuality, TorrentHealthBadge } from "./MediaSignals";
import {
  ContentDetails,
  contentRecommendations,
  trailerDuration,
} from "./ContentDetails";
import { CatalogRail, groupCatalogItems } from "./CatalogRail";
import { CatalogSearch } from "./CatalogSearch";
import "./movies.css";
import "./discovery.css";

type Panel = "search" | "manual" | "review" | "sources" | "confirm" | null;
type Removal = { kind: "source" | "membership" | "file"; source?: MovieSource };
type CatalogSort = "featured" | "votes" | "title";
const normalizeCatalogText = (value = "") =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
const movieDetailItem = (
  movie: Movie,
  libraryId: string,
  libraryName: string,
): DiscoveryItem => ({
  id: movie.id,
  title: movieTitle(movie, libraryId),
  originalTitle: movie.metadata.originalTitle,
  type: "movie",
  synopsis: movie.metadata.synopsis,
  poster: movie.metadata.poster,
  backdrop: movie.metadata.backdrop,
  year: movie.metadata.year,
  genres: movie.metadata.genres,
  cast: movie.metadata.cast,
  rating: movie.metadata.ratings?.imdb,
  externalIds: movie.metadata.externalIds,
  favorite: movie.personal.favorite,
  recent: true,
  position: movie.personal.progress,
  duration: (movie.metadata.duration ?? 100) * 60,
  memberships: movie.memberships.map((membership) => ({
    id: membership.libraryId,
    name:
      membership.libraryId === libraryId
        ? libraryName
        : "Biblioteca compartilhada",
  })),
  collections: [],
  sources: movie.sources.map((source) => ({
    id: source.id,
    quality:
      source.resolution === "2160p"
        ? "4K"
        : (source.resolution ?? "Qualidade não informada"),
    fileAvailable: source.fileAvailable,
  })),
});
interface Props {
  tvMode?: boolean;
  onDownload: (request: DownloadRequest) => void;
  onLibraries: () => void;
  onDownloads: () => void;
  selectionService: SelectionPreview;
  preferences: SelectionPreferences;
  torrentService: TorrentPreview;
  suspended?: boolean;
  onPlay?: (content: import("@ushark/types/player").PlaybackContent) => void;
  catalog: MovieCatalog;
  provider: MetadataProvider;
  libraryId: string;
  libraryName: string;
  onHome: () => void;
  onSeries: () => void;
  onCount: (count: number) => void;
  configure: (scenario: MovieScenario) => void;
  seed: (kind: "empty" | "collection" | "conflict") => void;
  previewTools?: boolean;
}
function Poster({
  metadata,
  broken = false,
  className = "",
  backdrop = false,
}: {
  metadata: MovieMetadata;
  broken?: boolean;
  className?: string;
  backdrop?: boolean;
}) {
  const [failed, setFailed] = useState<string>();
  const url = broken
    ? "./movie-art/missing.svg"
    : backdrop
      ? metadata.backdrop
      : metadata.poster;
  if (backdrop && (!url || failed === url)) return null;
  return (
    <div className={`movie-poster ${className}`}>
      {url && failed !== url ? (
        <img src={url} alt="" loading="lazy" onError={() => setFailed(url)} />
      ) : (
        <div className="poster-fallback">
          <ImageOff size={30} />
          <span>{metadata.title}</span>
          <small>Poster indisponível</small>
        </div>
      )}
    </div>
  );
}

const compactNumber = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function ImdbFacts({
  metadata,
  detail = false,
}: {
  metadata: MovieMetadata;
  detail?: boolean;
}) {
  const imdbId = metadata.externalIds?.imdb;
  if (!imdbId || !/^tt\d+$/.test(imdbId)) return null;
  const rating = metadata.ratings?.imdb;
  return (
    <span
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
    </span>
  );
}
export function Movies({
  tvMode = false,
  onDownload,
  onLibraries,
  onDownloads,
  selectionService,
  preferences,
  torrentService,
  suspended = false,
  onPlay,
  catalog,
  provider,
  libraryId,
  libraryName,
  onHome,
  onSeries,
  onCount,
  configure,
  seed,
  previewTools = true,
}: Props) {
  const [torrentOpen, setTorrentOpen] = useState(false);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [trailerPlaying, setTrailerPlaying] = useState(false);
  const [trailerPosition, setTrailerPosition] = useState(0);
  const [panel, setPanel] = useState<Panel>(null);
  const [scenario, setScenario] = useState<MovieScenario>("normal");
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");
  const [results, setResults] = useState<MovieMetadata[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [poster, setPoster] = useState("");
  const [picked, setPicked] = useState<MovieMetadata | null>(null);
  const [reviewBack, setReviewBack] = useState<"search" | "manual">("search");
  const [editingId, setEditingId] = useState<string>();
  const [sourceId, setSourceId] = useState("");
  const [removal, setRemoval] = useState<Removal>({ kind: "membership" });
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogSearchOpen, setCatalogSearchOpen] = useState(false);
  const [catalogSort, setCatalogSort] = useState<CatalogSort>("featured");
  const [fixtureKind, setFixtureKind] = useState("current");
  const origin = useRef<HTMLElement | null>(null);
  const lastCard = useRef<string | null>(null);
  const lastCardElement = useRef<string | null>(null);
  const detail = useRef<HTMLDivElement>(null);
  const listScroll = useRef(0);
  const focusRecommendation = useRef(false);
  const wasSuspended = useRef(suspended);
  const draftId = useRef(`movie:local:${crypto.randomUUID()}`);
  const searchRequest = useRef<AbortController | null>(null);
  const searchVersion = useRef(0);
  const listVersion = useRef(0);
  const lock = useRef(false);
  const selected = movies.find((m) => m.id === selectedId);
  const selectedDetail = selected
    ? movieDetailItem(selected, libraryId, libraryName)
    : undefined;
  const displayedDetail =
    selectedDetail && scenario === "image-error"
      ? { ...selectedDetail, poster: undefined, backdrop: undefined }
      : selectedDetail;
  const detailItems = movies.map((movie) =>
    movieDetailItem(movie, libraryId, libraryName),
  );
  const recommendations = selectedDetail
    ? contentRecommendations(detailItems, selectedDetail)
    : [];
  const normalizedCatalogQuery = normalizeCatalogText(catalogQuery.trim());
  const visible = movies
    .filter((m) => !favoriteOnly || m.personal.favorite)
    .filter((movie) => {
      if (!normalizedCatalogQuery) return true;
      const searchable = normalizeCatalogText(
        [
          movieTitle(movie, libraryId),
          movie.metadata.title,
          movie.metadata.originalTitle,
          ...movie.metadata.genres,
        ].join(" "),
      );
      return normalizedCatalogQuery
        .split(/\s+/)
        .every((term) => searchable.includes(term));
    })
    .sort((left, right) => {
      const byTitle = movieTitle(left, libraryId).localeCompare(
        movieTitle(right, libraryId),
        "pt-BR",
        { sensitivity: "base" },
      );
      if (catalogSort === "title") return byTitle;
      if (catalogSort === "votes")
        return (
          (right.metadata.ratings?.imdb?.votes ?? -1) -
            (left.metadata.ratings?.imdb?.votes ?? -1) || byTitle
        );
      return 0;
    });
  const categorizedCatalog =
    !normalizedCatalogQuery && !favoriteOnly && catalogSort === "featured";
  const movieCategories = groupCatalogItems(
    visible,
    (movie) => movie.metadata.genres,
  );
  const signalFor = (movie: Movie) => {
    const quality = bestQuality(
      movie.sources.map((source) => source.resolution),
    );
    const source =
      movie.sources.find(
        (candidate) => formatQuality(candidate.resolution) === quality,
      ) ?? movie.sources[0];
    return {
      quality,
      health: source
        ? selectionService.getHealthSummary({
            id: source.id,
            name: source.name,
            local: false,
            resolution: source.resolution
              ? parseInt(source.resolution)
              : undefined,
          })
        : undefined,
    };
  };
  const selectedSignal = selected ? signalFor(selected) : undefined;
  const input = useNavigation(back, !suspended && !torrentOpen);
  const refreshList = async (showLoading = false) => {
    const version = ++listVersion.current;
    if (showLoading) setLoading(true);
    try {
      const next = await catalog.list(libraryId);
      if (version !== listVersion.current) return;
      setMovies(next);
      onCount(next.length);
      setListError("");
    } catch (e) {
      if (version === listVersion.current) setListError((e as Error).message);
    } finally {
      if (version === listVersion.current) setLoading(false);
    }
  };
  useEffect(() => {
    configure("normal");
    void refreshList(true);
    return () => {
      listVersion.current++;
      searchRequest.current?.abort();
      searchVersion.current++;
    };
    // Services and library are stable for this mounted session.
  }, []);
  useEffect(() => {
    window.location.hash =
      panel && ["search", "manual", "review"].includes(panel) && !editingId
        ? "/movies/new"
        : selectedId
          ? `/content/${encodeURIComponent(selectedId)}`
          : "/movies";
  }, [selectedId, panel, editingId]);
  useEffect(() => {
    if (panel || loading) return;
    const target = selectedId
      ? detail.current?.querySelector<HTMLButtonElement>(
          "[data-detail-primary-action]",
        )
      : (document.getElementById(
          lastCardElement.current ?? `card-${lastCard.current}`,
        ) ?? document.querySelector<HTMLElement>("[data-movie-add]"));
    target?.focus();
  }, [selectedId, loading]);
  useEffect(() => {
    if (!focusRecommendation.current || !selectedId) return;
    window.scrollTo({ top: 0, left: 0 });
    detail.current
      ?.querySelector<HTMLButtonElement>("[data-detail-primary-action]")
      ?.focus({ preventScroll: true });
    focusRecommendation.current = false;
  }, [selectedId]);
  useEffect(() => {
    const returningToDetail = wasSuspended.current && !suspended && selectedId;
    wasSuspended.current = suspended;
    if (!returningToDetail) return;
    requestAnimationFrame(() =>
      detail.current
        ?.querySelector<HTMLButtonElement>("[data-detail-primary-action]")
        ?.focus({ preventScroll: true }),
    );
  }, [selectedId, suspended]);
  useEffect(() => {
    if (!trailerOpen || !trailerPlaying || !selectedDetail) return;
    const duration = trailerDuration(selectedDetail.type);
    const timer = setInterval(
      () =>
        setTrailerPosition((position) => {
          if (position >= duration - 1) {
            setTrailerPlaying(false);
            return duration;
          }
          return position + 1;
        }),
      1000,
    );
    return () => clearInterval(timer);
  }, [trailerOpen, trailerPlaying, selectedDetail?.type]);
  useEffect(() => {
    if (!panel) return;
    const frame = requestAnimationFrame(() => {
      const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
      const target =
        panel === "search" || panel === "manual"
          ? dialog?.querySelector<HTMLElement>("input")
          : dialog?.querySelector<HTMLElement>(
              panel === "sources"
                ? ".modal-close"
                : ".footer-actions button:not(:disabled)",
            );
      if (dialog) dialog.scrollTop = 0;
      target?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [panel]);
  function openDetails(id: string, cardId = `card-${id}`) {
    lastCard.current = id;
    lastCardElement.current = cardId;
    listScroll.current = window.scrollY;
    setNotice("");
    setError("");
    setTrailerOpen(false);
    setTrailerPlaying(false);
    setTrailerPosition(0);
    setSelectedId(id);
  }
  function openRecommendation(item: DiscoveryItem) {
    if (!movies.some((movie) => movie.id === item.id)) return;
    focusRecommendation.current = true;
    setNotice("");
    setError("");
    setTrailerOpen(false);
    setTrailerPlaying(false);
    setTrailerPosition(0);
    setSelectedId(item.id);
  }
  function cancelSearch() {
    searchRequest.current?.abort();
    searchVersion.current++;
    setSearching(false);
  }
  function close() {
    if (lock.current) return;
    cancelSearch();
    setPanel(null);
    setError("");
  }
  function back() {
    if (lock.current) return;
    if (trailerOpen) {
      setTrailerOpen(false);
      setTrailerPlaying(false);
    } else if (panel) dismiss();
    else if (selectedId) {
      setSelectedId(null);
      setNotice("");
    } else if (catalogSearchOpen) {
      setCatalogQuery("");
      setCatalogSearchOpen(false);
    } else onHome();
  }
  function dismiss() {
    if (lock.current) return;
    if (panel === "confirm" && removal.kind !== "membership") {
      setPanel("sources");
      setError("");
    } else close();
  }
  function open(next: Panel) {
    if (!panel) origin.current = document.activeElement as HTMLElement;
    setError("");
    setNotice("");
    setPanel(next);
  }
  function resetDraft() {
    draftId.current = `movie:local:${crypto.randomUUID()}`;
    setQuery("");
    setYear("");
    setManualTitle("");
    setSynopsis("");
    setPoster("");
    setSourceId("");
    setPicked(null);
    setResults(null);
  }
  function add() {
    if (editingId) resetDraft();
    setEditingId(undefined);
    open("search");
  }
  function edit() {
    if (!selected) return;
    if (editingId === selected.id) {
      open("search");
      return;
    }
    resetDraft();
    setEditingId(selected.id);
    setQuery(selected.metadata.title);
    setYear(selected.metadata.year?.toString() ?? "");
    setManualTitle(selected.metadata.title);
    setSynopsis(selected.metadata.synopsis ?? "");
    setPoster(selected.metadata.poster ?? "");
    open("search");
  }
  function validYear() {
    if (year && (!/^\d{4}$/.test(year) || +year < 1888 || +year > 2100)) {
      setError("Use um ano entre 1888 e 2100.");
      return false;
    }
    return true;
  }
  async function search(event: FormEvent) {
    event.preventDefault();
    cancelSearch();
    setError("");
    if (!query.trim()) {
      setError("Digite um título para buscar.");
      return;
    }
    if (!validYear()) return;
    const controller = new AbortController();
    searchRequest.current = controller;
    const version = ++searchVersion.current;
    setSearching(true);
    setResults(null);
    try {
      const next = await provider.search(
        query,
        year ? +year : undefined,
        controller.signal,
      );
      if (version === searchVersion.current) setResults(next);
    } catch (e) {
      if (
        version === searchVersion.current &&
        (e as Error).name !== "AbortError"
      )
        setError((e as Error).message);
    } finally {
      if (version === searchVersion.current) setSearching(false);
    }
  }
  function manual(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!manualTitle.trim()) {
      setError("Dê um título ao filme.");
      return;
    }
    if (!validYear()) return;
    const original = editingId ? catalog.find(editingId)?.metadata : undefined;
    setPicked({
      ...original,
      id: editingId ?? draftId.current,
      title: manualTitle.trim(),
      year: year ? +year : undefined,
      synopsis: synopsis.trim() || undefined,
      poster: poster || undefined,
      backdrop: poster || undefined,
      genres: original?.genres ?? [],
      cast: original?.cast ?? [],
    });
    setReviewBack("manual");
    setPanel("review");
  }
  async function mutate(
    action: () => Promise<unknown>,
    success: string,
    after?: () => void,
  ) {
    if (lock.current) return;
    const actionFocus = document.activeElement as HTMLElement | null;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      await refreshList();
      after?.();
      setNotice(success);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
      requestAnimationFrame(() => {
        const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
        if (actionFocus?.isConnected && !actionFocus.matches(":disabled"))
          actionFocus.focus();
        else if (dialog)
          dialog
            .querySelector<HTMLElement>(".footer-actions button:not(:disabled)")
            ?.focus();
      });
    }
  }
  async function save() {
    if (!picked) return;
    await mutate(
      async () => {
        const movie = await catalog.save(
          {
            metadata: picked,
            editingId,
            source: sourceFixtures.find((s) => s.id === sourceId),
            confirmMerge: true,
          },
          libraryId,
        );
        lastCard.current = movie.id;
        lastCardElement.current = `card-${movie.id}`;
        setSelectedId(movie.id);
      },
      "Filme atualizado na sua biblioteca.",
      () => {
        setPanel(null);
        resetDraft();
        setEditingId(undefined);
      },
    );
  }
  function confirm(kind: Removal["kind"], source?: MovieSource) {
    setRemoval({ kind, source });
    open("confirm");
  }
  async function remove() {
    if (!selected) return;
    const { kind, source } = removal;
    await mutate(
      () =>
        kind === "membership"
          ? catalog.removeMembership(selected.id, libraryId)
          : kind === "source"
            ? catalog.removeSource(selected.id, source!.id)
            : catalog.deleteFile(selected.id, source!.id),
      kind === "membership"
        ? "Filme removido desta biblioteca. Arquivos e estado pessoal preservados."
        : kind === "source"
          ? "Fonte removida. O filme e o arquivo foram preservados."
          : "Arquivo apagado. O filme e a origem foram preservados.",
      () => {
        setPanel(kind === "membership" ? null : "sources");
        if (kind === "membership") {
          lastCard.current =
            visible.find((m) => m.id !== selected.id)?.id ?? null;
          lastCardElement.current = lastCard.current
            ? `card-${lastCard.current}`
            : null;
          setSelectedId(null);
        }
      },
    );
  }
  const conflict =
    picked && editingId && picked.id !== editingId
      ? catalog.find(picked.id)
      : undefined;
  const duplicate = picked && !editingId ? catalog.find(picked.id) : undefined;
  const title = selected ? movieTitle(selected, libraryId) : "";
  const importTorrent = async (value: Inspection, ids: string[]) => {
    const files = value.files.filter((file) => ids.includes(file.id));
    for (const file of files) {
      let contentId = selectedId;
      if (torrentService.confirmForContent) {
        if (!contentId) {
          const movie = await catalog.save(
            {
              metadata: {
                id: `import:${value.hash}:${file.id}`,
                title: value.name.replace(/\./g, " "),
                genres: [],
                cast: [],
              },
            },
            libraryId,
          );
          contentId = movie.id;
        }
        const linked = await torrentService.confirmForContent(
          contentId,
          value,
          file.id,
        );
        await catalog.addSource(contentId, {
          id: linked.sourceId,
          name: file.name,
          size: file.size,
          availability: "declared",
          fileAvailable: false,
          resolution: /1080p/i.test(file.name) ? "1080p" : undefined,
          videoCodec: /H264/i.test(file.name) ? "H264" : undefined,
        });
        continue;
      }
      const source = {
        id: `torrent:${value.hash}:${file.id}`,
        name: file.name,
        size: file.size,
        availability: "declared" as const,
        fileAvailable: false,
        resolution: /1080p/i.test(file.name) ? "1080p" : undefined,
        videoCodec: /H264/i.test(file.name) ? "H264" : undefined,
      };
      if (selectedId) await catalog.addSource(selectedId, source);
      else
        await catalog.save(
          {
            metadata: {
              id: `import:${value.hash}:${file.id}`,
              title: value.name.replace(/\./g, " "),
              genres: [],
              cast: [],
            },
            source,
          },
          libraryId,
        );
    }
    await refreshList();
  };
  const panelTitle =
    panel === "sources"
      ? "Fontes do filme"
      : panel === "confirm"
        ? removal.kind === "membership"
          ? "Remover da biblioteca?"
          : removal.kind === "source"
            ? "Remover esta fonte?"
            : "Apagar este arquivo?"
        : panel === "review"
          ? conflict
            ? "Revisar união dos filmes"
            : "Tudo certo com este filme?"
          : panel === "manual"
            ? "Criar identificação manual"
            : editingId
              ? "Editar identificação"
              : "Adicionar filme";
  const panelDescription =
    panel === "sources"
      ? "Gerencie os arquivos e origens disponíveis para este filme."
      : panel === "confirm"
        ? removal.kind === "membership"
          ? "Só o vínculo com esta biblioteca será removido. Arquivos, favoritos e histórico continuam seus."
          : removal.kind === "source"
            ? "O filme continua na biblioteca, mesmo sem fontes. O arquivo não será apagado."
            : "Esta ação apaga somente o arquivo selecionado. O filme continua na biblioteca."
        : panel === "review"
          ? "Confira a identificação antes de guardar na sua biblioteca."
          : "Encontre uma história pelo título ou cadastre um filme do seu jeito.";
  return (
    <div
      className="app movies-app"
      data-input={input}
      data-tv-mode={tvMode || undefined}
      data-detail-page={!!displayedDetail || undefined}
    >
      <header className="movies-header">
        <div className="movies-header-primary">
          <span className="movies-brand">Ushark</span>
          <nav aria-label="Navegação principal">
            <button onClick={onHome} disabled={busy}>
              Início
            </button>
            <button
              aria-current="page"
              onClick={() => {
                if (!busy) {
                  setSelectedId(null);
                  setFavoriteOnly(false);
                }
              }}
            >
              Filmes
            </button>
            <button onClick={onSeries} disabled={busy}>
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
              onConfirm={importTorrent}
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
              className="movie-icon-button movie-add-button"
              aria-label="Adicionar filme"
              title="Adicionar filme"
              data-movie-add
              onClick={add}
              disabled={busy}
            >
              <Plus size={22} />
            </button>
            {previewTools && (
              <details className="movie-preview-tools">
                <summary aria-label="Opções de visualização" title="Opções">
                  <SlidersHorizontal size={20} />
                </summary>
                <div>
                  <label>
                    Catálogo
                    <select
                      aria-label="Conteúdo da biblioteca"
                      value={fixtureKind}
                      disabled={busy || !!panel}
                      onChange={(e) => {
                        const kind = e.target.value as
                          "empty" | "collection" | "conflict";
                        seed(kind);
                        setFixtureKind(kind);
                        setSelectedId(null);
                        setFavoriteOnly(false);
                        setNotice("");
                        setError("");
                        void refreshList(true);
                      }}
                    >
                      <option value="current" disabled>
                        Atual
                      </option>
                      <option value="empty">Vazio</option>
                      <option value="collection">Preenchido</option>
                      <option value="conflict">Identidades duplicadas</option>
                    </select>
                  </label>
                  <label>
                    Estado
                    <select
                      aria-label="Estado da interface"
                      value={scenario}
                      disabled={busy || !!panel}
                      onChange={(e) => {
                        const next = e.target.value as MovieScenario;
                        configure(next);
                        setScenario(next);
                        setError("");
                        void refreshList(true);
                      }}
                    >
                      {Object.entries({
                        normal: "Normal",
                        offline: "Offline",
                        "search-empty": "Busca vazia",
                        "provider-error": "Busca indisponível",
                        slow: "Resposta lenta",
                        "save-error": "Erro ao salvar",
                        "list-error": "Erro ao carregar",
                        "image-error": "Imagem indisponível",
                      }).map(([id, name]) => (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </details>
            )}
          </div>
        )}
      </header>
      <main className="movies-layout">
        <section className="movies-surface">
          {scenario === "offline" && (
            <div className="banner">
              {tvMode
                ? "Você está offline. Os filmes disponíveis neste dispositivo continuam acessíveis."
                : "Você está offline. Seus filmes continuam disponíveis; o cadastro manual também."}
            </div>
          )}
          {selected ? null : (
            <>
              <div className="movie-list-heading">
                <div>
                  <h1>Filmes</h1>
                  <p>{libraryName}</p>
                </div>
              </div>
              <FilterToolbar
                className="movie-list-toolbar"
                summary={
                  visible.length === movies.length
                    ? `${movies.length} ${movies.length === 1 ? "filme na biblioteca" : "filmes na biblioteca"}`
                    : `${visible.length} de ${movies.length} filmes`
                }
              >
                <FilterSelect
                  className="catalog-list-sort"
                  label="Ordenar por"
                  aria-label="Ordenar filmes"
                  value={catalogSort}
                  onChange={(event) =>
                    setCatalogSort(event.target.value as CatalogSort)
                  }
                >
                  <option value="featured">Em destaque</option>
                  <option value="votes">Mais votados</option>
                  <option value="title">A–Z</option>
                </FilterSelect>
                <FilterGroup className="movie-tabs">
                  <button
                    aria-label="Todos os filmes"
                    title="Todos os filmes"
                    aria-pressed={!favoriteOnly}
                    onClick={() => setFavoriteOnly(false)}
                  >
                    <Film size={18} />
                  </button>
                  <button
                    aria-label="Favoritos"
                    title="Favoritos"
                    aria-pressed={favoriteOnly}
                    onClick={() => setFavoriteOnly(true)}
                  >
                    <Heart size={18} />
                  </button>
                  <CatalogSearch
                    open={catalogSearchOpen}
                    label="Buscar na lista de filmes"
                    placeholder="Buscar filmes"
                    openLabel="Buscar filmes"
                    closeLabel="Fechar busca de filmes"
                    value={catalogQuery}
                    onValueChange={setCatalogQuery}
                    onOpenChange={setCatalogSearchOpen}
                  />
                </FilterGroup>
              </FilterToolbar>
              {loading ? (
                <div className="movie-empty" role="status">
                  <LoaderCircle className="movie-loading-icon" size={30} />
                  <h2>Abrindo suas histórias…</h2>
                </div>
              ) : listError ? (
                <div className="movie-empty">
                  <p role="alert">{listError}</p>
                  <Button onClick={() => void refreshList(true)}>
                    Tentar novamente
                  </Button>
                </div>
              ) : !visible.length ? (
                <div className="movie-empty">
                  <div className="empty-film">
                    {normalizedCatalogQuery ? (
                      <Search size={44} />
                    ) : favoriteOnly ? (
                      <Heart size={44} />
                    ) : (
                      <Film size={44} />
                    )}
                  </div>
                  <h2>
                    {normalizedCatalogQuery
                      ? "Nenhum filme encontrado."
                      : favoriteOnly
                        ? "Guarde suas histórias favoritas."
                        : "Sua próxima história começa aqui."}
                  </h2>
                  <p>
                    {normalizedCatalogQuery
                      ? "Tente buscar por outro título, título original ou gênero."
                      : favoriteOnly
                        ? "Favorite um filme nos detalhes para encontrá-lo aqui."
                        : tvMode
                          ? "Nenhum filme está disponível neste dispositivo."
                          : "Busque um título ou adicione um filme manualmente.\nEle pode fazer parte da coleção mesmo sem uma fonte."}
                  </p>
                  <Button
                    variant="secondary"
                    className="movie-empty-action"
                    onClick={
                      normalizedCatalogQuery
                        ? () => setCatalogQuery("")
                        : favoriteOnly
                          ? () => setFavoriteOnly(false)
                          : tvMode
                            ? onHome
                            : add
                    }
                  >
                    {normalizedCatalogQuery ? (
                      <Search size={18} />
                    ) : favoriteOnly || tvMode ? (
                      <Film size={18} />
                    ) : (
                      <Plus size={18} />
                    )}
                    {normalizedCatalogQuery
                      ? "Limpar busca"
                      : favoriteOnly
                        ? "Ver todos os filmes"
                        : tvMode
                          ? "Voltar ao início"
                          : "Adicionar meu primeiro filme"}
                  </Button>
                </div>
              ) : categorizedCatalog ? (
                <div className="catalog-rails" data-catalog-view="categories">
                  <CatalogRail title="Em destaque">
                    {visible.map((movie) => {
                      const { quality, health } = signalFor(movie);
                      const healthId = health
                        ? `torrent-health-featured-${movie.id}`
                        : undefined;
                      return (
                        <MediaCard
                          className="movie-card catalog-rail-card"
                          orientation="landscape"
                          image={
                            scenario === "image-error"
                              ? "./movie-art/missing.svg"
                              : (movie.metadata.backdrop ??
                                movie.metadata.poster)
                          }
                          fallback={
                            <span className="poster-fallback">
                              <ImageOff size={30} />
                              <span>{movie.metadata.title}</span>
                              <small>Imagem indisponível</small>
                            </span>
                          }
                          overlays={
                            <>
                              {health && (
                                <TorrentHealthBadge
                                  id={healthId}
                                  health={health}
                                />
                              )}
                              {movie.personal.favorite && (
                                <span className="favorite-badge">
                                  <Heart size={14} fill="currentColor" />
                                  <span className="sr-only">Favorito</span>
                                </span>
                              )}
                            </>
                          }
                          title={movieTitle(movie, libraryId)}
                          mediaClassName="movie-card-media"
                          artClassName="movie-poster"
                          copyClassName="movie-card-copy"
                          id={`card-${movie.id}`}
                          key={movie.id}
                          data-content-id={movie.id}
                          onClick={() => openDetails(movie.id)}
                          aria-label={`Abrir ${movieTitle(movie, libraryId)}`}
                          aria-describedby={healthId}
                        >
                          <small className="movie-card-year">
                            {movie.metadata.year ?? "Ano não informado"}
                            {movie.metadata.duration && (
                              <>
                                <span> · </span>
                                {movie.metadata.duration} min
                              </>
                            )}
                            {quality ? ` · ${quality}` : ""}
                          </small>
                          <ImdbFacts metadata={movie.metadata} />
                          {!!movie.metadata.genres.length && (
                            <small className="movie-card-genres">
                              {movie.metadata.genres.join(" / ")}
                            </small>
                          )}
                        </MediaCard>
                      );
                    })}
                  </CatalogRail>
                  {movieCategories.map((category, categoryIndex) => (
                    <CatalogRail title={category.title} key={category.title}>
                      {category.items.map((movie) => {
                        const { quality, health } = signalFor(movie);
                        const healthId = health
                          ? `torrent-health-category-${categoryIndex}-${movie.id}`
                          : undefined;
                        return (
                          <MediaCard
                            className="movie-category-card catalog-rail-card"
                            orientation="landscape"
                            image={
                              scenario === "image-error"
                                ? "./movie-art/missing.svg"
                                : (movie.metadata.backdrop ??
                                  movie.metadata.poster)
                            }
                            fallback={
                              <span className="poster-fallback">
                                <ImageOff size={30} />
                                <span>{movie.metadata.title}</span>
                                <small>Imagem indisponível</small>
                              </span>
                            }
                            overlays={
                              <>
                                {health && (
                                  <TorrentHealthBadge
                                    id={healthId}
                                    health={health}
                                  />
                                )}
                                {movie.personal.favorite && (
                                  <span className="favorite-badge">
                                    <Heart size={14} fill="currentColor" />
                                    <span className="sr-only">Favorito</span>
                                  </span>
                                )}
                              </>
                            }
                            title={movieTitle(movie, libraryId)}
                            mediaClassName="movie-card-media"
                            artClassName="movie-poster"
                            copyClassName="movie-card-copy"
                            id={`card-${movie.id}-category-${categoryIndex}`}
                            key={movie.id}
                            data-content-id={movie.id}
                            onClick={() =>
                              openDetails(
                                movie.id,
                                `card-${movie.id}-category-${categoryIndex}`,
                              )
                            }
                            aria-label={`Na categoria ${category.title}: abrir ${movieTitle(movie, libraryId)}`}
                            aria-describedby={healthId}
                          >
                            <small className="movie-card-year">
                              {movie.metadata.year ?? "Ano não informado"}
                              {quality ? ` · ${quality}` : ""}
                            </small>
                            <ImdbFacts metadata={movie.metadata} />
                          </MediaCard>
                        );
                      })}
                    </CatalogRail>
                  ))}
                </div>
              ) : (
                <div className="movie-grid">
                  {visible.map((movie) => {
                    const { quality, health } = signalFor(movie);
                    const healthId = health
                      ? `torrent-health-${movie.id}`
                      : undefined;
                    return (
                      <MediaCard
                        className="movie-card"
                        orientation="portrait"
                        image={
                          scenario === "image-error"
                            ? "./movie-art/missing.svg"
                            : movie.metadata.poster
                        }
                        fallback={
                          <span className="poster-fallback">
                            <ImageOff size={30} />
                            <span>{movie.metadata.title}</span>
                            <small>Poster indisponível</small>
                          </span>
                        }
                        overlays={
                          <>
                            {health && (
                              <TorrentHealthBadge
                                id={healthId}
                                health={health}
                              />
                            )}
                            {movie.personal.favorite && (
                              <span className="favorite-badge">
                                <Heart size={14} fill="currentColor" />
                                <span className="sr-only">Favorito</span>
                              </span>
                            )}
                          </>
                        }
                        title={movieTitle(movie, libraryId)}
                        mediaClassName="movie-card-media"
                        artClassName="movie-poster"
                        copyClassName="movie-card-copy"
                        id={`card-${movie.id}`}
                        key={movie.id}
                        onClick={() => openDetails(movie.id)}
                        aria-label={`Abrir ${movieTitle(movie, libraryId)}`}
                        aria-describedby={healthId}
                      >
                        <small className="movie-card-year">
                          {movie.metadata.year ?? "Ano não informado"}
                          {movie.metadata.duration && (
                            <>
                              <span> · </span>
                              {movie.metadata.duration} min
                            </>
                          )}
                          {!tvMode && (
                            <>
                              <span> · </span>
                              {movie.sources.length
                                ? `${movie.sources.length} fontes`
                                : "Sem fontes"}
                              {quality ? ` · ${quality}` : ""}
                            </>
                          )}
                        </small>
                        <ImdbFacts metadata={movie.metadata} />
                        {!!movie.metadata.genres.length && (
                          <small className="movie-card-genres">
                            {movie.metadata.genres.join(" / ")}
                          </small>
                        )}
                      </MediaCard>
                    );
                  })}
                </div>
              )}
            </>
          )}
          {busy && !panel && <p role="status">Salvando alterações…</p>}
          {error && !panel && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          {notice && (
            <div className="success" role="status">
              {notice}
            </div>
          )}
        </section>
      </main>
      <Dialog.Root
        open={!!displayedDetail && !suspended}
        modal={false}
        onOpenChange={(value) => {
          if (!value && !suspended && !panel) {
            setTrailerOpen(false);
            setTrailerPlaying(false);
            setSelectedId(null);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Content
            ref={detail}
            role="main"
            tabIndex={-1}
            className="discovery-detail discovery-detail-page"
            onEscapeKeyDown={(event) => {
              if (panel) {
                event.preventDefault();
                return;
              }
              if (!trailerOpen) return;
              event.preventDefault();
              setTrailerOpen(false);
              setTrailerPlaying(false);
            }}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              window.scrollTo({ top: 0, left: 0 });
              detail.current
                ?.querySelector<HTMLButtonElement>(
                  "[data-detail-primary-action]",
                )
                ?.focus({ preventScroll: true });
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              requestAnimationFrame(() => {
                window.scrollTo(0, listScroll.current);
                document
                  .getElementById(
                    lastCardElement.current ?? `card-${lastCard.current}`,
                  )
                  ?.focus({ preventScroll: true });
              });
            }}
          >
            {displayedDetail && selected && (
              <ContentDetails
                item={displayedDetail}
                signal={selectedSignal}
                recommendations={recommendations}
                movieDetailPage
                tvMode={tvMode}
                selectionService={selectionService}
                preferences={preferences}
                suspended={suspended || !!panel}
                onDownload={onDownload}
                onPlay={onPlay}
                trailerOpen={trailerOpen}
                trailerPlaying={trailerPlaying}
                trailerPosition={trailerPosition}
                onToggleTrailer={() => {
                  setTrailerOpen((open) => !open);
                  setTrailerPlaying(!trailerOpen);
                  if (!trailerOpen) setTrailerPosition(0);
                }}
                onToggleTrailerPlayback={() => {
                  if (trailerPosition >= trailerDuration(displayedDetail.type))
                    setTrailerPosition(0);
                  setTrailerPlaying((playing) => !playing);
                }}
                onMembership={() => {
                  setSelectedId(null);
                }}
                onRecommendation={openRecommendation}
                notice={notice}
                error={error}
                backAccessibleName="Todos os filmes"
                managementActions={
                  <>
                    <Button
                      variant="secondary"
                      className="movie-round-action"
                      aria-label={
                        selected.personal.favorite ? "Favoritado" : "Favoritar"
                      }
                      title={
                        selected.personal.favorite
                          ? "Remover dos favoritos"
                          : "Adicionar aos favoritos"
                      }
                      aria-pressed={selected.personal.favorite}
                      onClick={() =>
                        void mutate(
                          () => catalog.favorite(selected.id),
                          selected.personal.favorite
                            ? "Removido dos favoritos."
                            : "Adicionado aos favoritos.",
                        )
                      }
                      disabled={busy}
                    >
                      <Heart
                        size={20}
                        fill={
                          selected.personal.favorite ? "currentColor" : "none"
                        }
                      />
                    </Button>
                    {!tvMode && (
                      <>
                        <Button
                          variant="secondary"
                          className="movie-icon-tool"
                          aria-label={`Fontes (${selected.sources.length})`}
                          title="Gerenciar fontes"
                          onClick={() => open("sources")}
                          disabled={busy}
                        >
                          <SlidersHorizontal size={19} />
                        </Button>
                        <Button
                          variant="secondary"
                          className="movie-icon-tool"
                          aria-label="Editar identificação"
                          title="Editar identificação"
                          onClick={edit}
                          disabled={busy}
                        >
                          <Pencil size={18} />
                        </Button>
                        <Button
                          variant="secondary"
                          className="movie-icon-tool"
                          aria-label="Atualizar dados"
                          title="Atualizar dados"
                          onClick={() =>
                            void mutate(
                              () => catalog.refresh(selected.id),
                              "Identificação atualizada. Seu título de biblioteca e estado pessoal foram preservados.",
                            )
                          }
                          disabled={busy}
                        >
                          <RefreshCw size={18} />
                        </Button>
                        <Button
                          variant="secondary"
                          className="movie-icon-tool remove-membership"
                          aria-label="Remover da biblioteca"
                          title="Remover da biblioteca"
                          onClick={() => confirm("membership")}
                          disabled={busy}
                        >
                          <Trash2 size={18} />
                        </Button>
                      </>
                    )}
                  </>
                }
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root
        open={!tvMode && !!panel}
        onOpenChange={(value) => {
          if (!value) dismiss();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay" />
          <Dialog.Content
            className={`modal movie-modal ${panel === "sources" ? "sources-modal" : ""}`}
            onEscapeKeyDown={(e) => {
              e.preventDefault();
              dismiss();
            }}
            onPointerDownOutside={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              requestAnimationFrame(() => {
                const fallback = selectedId
                  ? document.querySelector<HTMLElement>("[data-movie-back]")
                  : (document.getElementById(
                      lastCardElement.current ?? `card-${lastCard.current}`,
                    ) ??
                    document.querySelector<HTMLElement>("[data-movie-add]"));
                if (
                  origin.current?.isConnected &&
                  !origin.current.matches(":disabled")
                )
                  origin.current.focus();
                else fallback?.focus();
              });
            }}
          >
            <Dialog.Title>{panelTitle}</Dialog.Title>
            <Dialog.Description>{panelDescription}</Dialog.Description>
            {panel === "search" && (
              <>
                <form onSubmit={(e) => void search(e)}>
                  <div className="search-fields">
                    <label>
                      Título do filme
                      <input
                        autoComplete="off"
                        maxLength={160}
                        placeholder="Qual história você procura?"
                        value={query}
                        onChange={(e) => {
                          cancelSearch();
                          setQuery(e.target.value);
                          setResults(null);
                          setError("");
                        }}
                      />
                    </label>
                    <label>
                      Ano (opcional)
                      <input
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="Ex.: 2024"
                        value={year}
                        onChange={(e) => {
                          cancelSearch();
                          setYear(e.target.value);
                          setResults(null);
                        }}
                      />
                    </label>
                  </div>
                  <Button type="submit">
                    <Search size={17} />
                    {searching ? "Buscar outro título" : "Buscar filme"}
                  </Button>
                </form>
                {searching && (
                  <p role="status" className="search-status">
                    Buscando correspondências…{" "}
                    <Button variant="secondary" onClick={cancelSearch}>
                      Cancelar busca
                    </Button>
                  </p>
                )}
                {results && (
                  <div
                    className="search-results"
                    aria-label="Resultados da busca"
                  >
                    {results.length ? (
                      <>
                        <small>
                          {results.length}{" "}
                          {results.length === 1
                            ? "correspondência. Confira antes de escolher."
                            : "correspondências. Escolha a identificação correta."}
                        </small>
                        {results.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => {
                              setPicked(m);
                              setReviewBack("search");
                              setPanel("review");
                              setError("");
                            }}
                          >
                            <Poster metadata={m} />
                            <span>
                              <strong>{m.title}</strong>
                              <small>
                                {m.year ?? "Ano não informado"} ·{" "}
                                {m.genres.join(" / ") || "Filme"}
                              </small>
                            </span>
                            <ArrowRight size={17} />
                          </button>
                        ))}
                      </>
                    ) : (
                      <p role="status">
                        Nenhuma correspondência. Você pode criar este filme
                        manualmente.
                      </p>
                    )}
                  </div>
                )}
                {!editingId && previewTools && (
                  <label className="source-entry">
                    Fonte inicial (opcional)
                    <select
                      value={sourceId}
                      onChange={(e) => {
                        setSourceId(e.target.value);
                        if (e.target.value && !query)
                          setQuery("Horizonte Azul");
                      }}
                    >
                      <option value="">Sem fonte</option>
                      {sourceFixtures.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {picked && (
                  <Button
                    variant="secondary"
                    className="resume-review"
                    onClick={() => setPanel("review")}
                  >
                    Retomar revisão
                  </Button>
                )}
                <div className="footer-actions">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      cancelSearch();
                      setManualTitle(manualTitle || query);
                      setPanel("manual");
                      setError("");
                    }}
                  >
                    Criar manualmente
                  </Button>
                  <Button variant="secondary" onClick={close}>
                    Cancelar
                  </Button>
                </div>
              </>
            )}
            {panel === "manual" && (
              <form onSubmit={manual}>
                <div className="manual-kind">
                  <Film size={16} /> Filme
                </div>
                <label>
                  Título
                  <input
                    value={manualTitle}
                    maxLength={160}
                    onChange={(e) => setManualTitle(e.target.value)}
                  />
                </label>
                <label>
                  Ano (opcional)
                  <input
                    inputMode="numeric"
                    value={year}
                    maxLength={4}
                    onChange={(e) => setYear(e.target.value)}
                  />
                </label>
                <label>
                  Sinopse (opcional)
                  <textarea
                    value={synopsis}
                    maxLength={2000}
                    rows={3}
                    onChange={(e) => setSynopsis(e.target.value)}
                  />
                </label>
                <label>
                  Poster (opcional)
                  <select
                    value={poster}
                    onChange={(e) => setPoster(e.target.value)}
                  >
                    <option value="">Sem imagem</option>
                    {movieFixtures
                      .filter((_, i) => i !== 1)
                      .map((m) => (
                        <option key={m.id} value={m.poster}>
                          {m.title}
                        </option>
                      ))}
                  </select>
                </label>
                <div className="footer-actions">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setPanel("search");
                      setError("");
                    }}
                  >
                    <ArrowLeft size={17} /> Voltar à busca
                  </Button>
                  <Button type="submit">
                    Revisar filme
                    <ArrowRight size={17} />
                  </Button>
                </div>
              </form>
            )}
            {panel === "review" && picked && (
              <>
                <div className="review-movie">
                  <Poster metadata={picked} />
                  <div>
                    <h3>{picked.title}</h3>
                    <p>{picked.year ?? "Ano não informado"} · Filme</p>
                    <small>
                      {picked.externalIds
                        ? Object.entries(picked.externalIds)
                            .map(
                              ([key, value]) =>
                                `${key.toUpperCase()}: ${value}`,
                            )
                            .join(" · ")
                        : "Identificação manual"}
                    </small>
                    <small>
                      {sourceFixtures.find((s) => s.id === sourceId)?.name ??
                        "Sem nova fonte. O filme pode ser cadastrado assim."}
                    </small>
                  </div>
                </div>
                {duplicate && (
                  <div className="banner">
                    Este filme já existe. Vamos reutilizar sua identificação,
                    preservar seus favoritos e adicionar apenas o vínculo ou
                    fonte que faltar.
                  </div>
                )}
                {editingId && picked.id !== editingId && (
                  <div className="banner">
                    {conflict
                      ? `Já existe “${movieTitle(conflict, libraryId)}”. Confirmar unirá os dois registros.`
                      : "A nova identificação substituirá a associação atual por uma união explícita."}{" "}
                    Fontes, bibliotecas, favoritos e histórico serão
                    preservados. Se houver dois títulos na mesma biblioteca, o
                    título do destino prevalece.
                  </div>
                )}
                <div className="footer-actions">
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => {
                      setPanel(reviewBack);
                      setError("");
                    }}
                  >
                    <ArrowLeft size={17} />{" "}
                    {reviewBack === "manual"
                      ? "Voltar à edição"
                      : "Voltar à busca"}
                  </Button>
                  <Button disabled={busy} onClick={() => void save()}>
                    {busy
                      ? "Salvando…"
                      : conflict
                        ? "Confirmar união"
                        : "Confirmar filme"}
                    <Check size={17} />
                  </Button>
                </div>
              </>
            )}
            {panel === "sources" && selected && (
              <>
                {!selected.sources.length && (
                  <div className="empty-source">
                    <Film size={24} />
                    <p>
                      Nenhuma fonte adicionada. Seu filme continua na
                      biblioteca.
                    </p>
                  </div>
                )}
                <div className="source-list">
                  {selected.sources.map((s) => (
                    <article key={s.id}>
                      <h3>{s.name}</h3>
                      <small>
                        {s.fileAvailable
                          ? "Arquivo disponível"
                          : "Sem arquivo local disponível"}
                      </small>
                      <dl>
                        {[
                          ["Resolução", s.resolution],
                          ["Vídeo", s.videoCodec],
                          ["Áudio", s.audioCodec],
                          ["HDR", s.hdr],
                          ["Canais", s.channels],
                          ["Tamanho", s.size],
                          ["Bitrate", s.bitrate],
                        ].map(([key, value]) => (
                          <div key={key}>
                            <dt>{key}</dt>
                            <dd>{value ?? "Não informado"}</dd>
                          </div>
                        ))}
                      </dl>
                      <div className="source-actions">
                        <Button
                          variant="secondary"
                          className="source-icon-action"
                          aria-label="Remover fonte"
                          title="Remover fonte"
                          disabled={busy}
                          onClick={() => confirm("source", s)}
                        >
                          <Unlink size={18} />
                        </Button>
                        <Button
                          variant="secondary"
                          className="source-icon-action source-file-delete"
                          aria-label="Apagar arquivo"
                          title="Apagar arquivo"
                          disabled={busy || !s.fileAvailable}
                          onClick={() => confirm("file", s)}
                        >
                          <FileX2 size={18} />
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
                {previewTools && (
                  <label>
                    Adicionar fonte
                    <select
                      value={sourceId}
                      onChange={(e) => setSourceId(e.target.value)}
                      disabled={busy}
                    >
                      <option value="">Escolher fonte</option>
                      {sourceFixtures.map((s) => (
                        <option
                          key={s.id}
                          value={s.id}
                          disabled={selected.sources.some((x) => x.id === s.id)}
                        >
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <div className="footer-actions">
                  <Button variant="secondary" onClick={close} disabled={busy}>
                    Fechar fontes
                  </Button>
                  {previewTools && (
                    <Button
                      disabled={
                        busy ||
                        !sourceId ||
                        selected.sources.some((s) => s.id === sourceId)
                      }
                      onClick={() =>
                        void mutate(
                          () =>
                            catalog.addSource(
                              selected.id,
                              sourceFixtures.find((s) => s.id === sourceId)!,
                            ),
                          "Fonte adicionada.",
                          () => setSourceId(""),
                        )
                      }
                    >
                      <Plus size={17} />
                      {busy ? "Salvando…" : "Adicionar fonte"}
                    </Button>
                  )}
                </div>
              </>
            )}
            {panel === "confirm" && selected && (
              <>
                <div className="removal-subject">
                  <Trash2 size={22} />
                  <strong>{removal.source?.name ?? title}</strong>
                </div>
                <div className="footer-actions">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (removal.kind === "membership") close();
                      else {
                        setPanel("sources");
                        setError("");
                      }
                    }}
                    disabled={busy}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="danger-button"
                    onClick={() => void remove()}
                    disabled={busy}
                  >
                    {busy
                      ? "Salvando…"
                      : removal.kind === "membership"
                        ? "Confirmar remoção"
                        : removal.kind === "source"
                          ? "Confirmar remoção da fonte"
                          : "Confirmar exclusão do arquivo"}
                  </Button>
                </div>
              </>
            )}
            {error && (
              <div className="error" role="alert">
                {error}
              </div>
            )}
            <button
              className="modal-close"
              aria-label="Fechar diálogo"
              onClick={dismiss}
              disabled={busy}
            >
              <X size={22} />
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
