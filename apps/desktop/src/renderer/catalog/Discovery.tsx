import type { DownloadRequest } from "@ushark/types/downloads";
import type {
  SelectionPreview,
  SelectionPreferences,
} from "@ushark/types/selection";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Film,
  Info,
  Keyboard,
  Library,
  Play,
  Search,
  Settings,
  X,
} from "lucide-react";
import {
  Button,
  FilterGroup,
  FilterSearch,
  FilterSelect,
  FilterToolbar,
} from "@ushark/ui";
import type {
  DiscoveryCatalog,
  DiscoveryItem,
  DiscoveryQuery,
  DiscoveryScenario,
  DiscoverySession,
} from "@ushark/types/discovery";
import { discoveryQuery } from "@ushark/types/discovery";
import { useNavigation } from "../app/navigation";
import { TorrentHealthBadge } from "./MediaSignals";
import {
  ContentDetails,
  contentRecommendations,
  trailerDuration,
} from "./ContentDetails";
import {
  DiscoveryCard,
  DiscoveryRail,
  discoverySourceSignal,
} from "./DiscoveryRail";
import "./discovery.css";
interface Props {
  tvMode?: boolean;
  onDownload: (request: DownloadRequest) => void;
  onLibraries: () => void;
  onDownloads: () => void;
  selectionService: SelectionPreview;
  preferences: SelectionPreferences;
  suspended?: boolean;
  onPlay?: (content: import("@ushark/types/player").PlaybackContent) => void;
  catalog: DiscoveryCatalog;
  session: DiscoverySession;
  name: string;
  onMovies: () => void;
  onSeries: () => void;
  onSettings: () => void;
  configure: (scenario: DiscoveryScenario) => void;
  simulate: (action: "remove" | "rename" | "page-error", id?: string) => void;
}
export function Discovery({
  tvMode = false,
  onDownload,
  onLibraries,
  onDownloads,
  selectionService,
  preferences,
  suspended = false,
  onPlay,
  catalog,
  session,
  name,
  onMovies,
  onSeries,
  onSettings,
  configure,
  simulate,
}: Props) {
  const [query, setQuery] = useState(session.query);
  const [searching, setSearching] = useState(session.searching);
  const [scenario, setScenario] = useState(session.scenario);
  const [all, setAll] = useState<DiscoveryItem[]>([]);
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [displayedPage, setDisplayedPage] = useState(query.page);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<DiscoveryItem | null>(null);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [trailerPlaying, setTrailerPlaying] = useState(false);
  const [trailerPosition, setTrailerPosition] = useState(0);
  const [keyboard, setKeyboard] = useState(false);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const [hydrated, setHydrated] = useState(scenario !== "hydration");
  const origin = useRef<HTMLElement | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const first = useRef<HTMLButtonElement>(null);
  const detail = useRef<HTMLDivElement>(null);
  const request = useRef(0);
  const focusPage = useRef(false);
  const focusRecommendation = useRef(false);
  const wasSuspended = useRef(suspended);
  const scroll = useRef(0);
  const initialFocus = useRef(true);
  const input = useNavigation(() => {
    if (keyboard) setKeyboard(false);
    else if (trailerOpen) {
      setTrailerOpen(false);
      setTrailerPlaying(false);
    } else if (selected) setSelected(null);
    else if (searching) {
      setSearching(false);
      setQuery(discoveryQuery());
    }
  }, !suspended);
  useEffect(() => {
    session.query = query;
    session.searching = searching;
    session.scenario = scenario;
  }, [session, query, searching, scenario]);
  useEffect(() => {
    window.location.hash = selected
      ? `/content/${encodeURIComponent(selected.id)}`
      : query.scope
        ? `/${all.some((x) => x.collections.some((c) => c.id === query.scope)) ? "collections" : "libraries"}/${encodeURIComponent(query.scope)}`
        : searching
          ? "/search"
          : "/home";
  }, [selected, searching, query.scope, all]);
  useEffect(() => {
    const version = ++request.current;
    setLoading(true);
    setError("");
    Promise.all([catalog.read(), catalog.search(query)])
      .then(([data, result]) => {
        if (version !== request.current) return;
        if (query.page > 0 && query.page * 24 >= result.total) {
          setQuery((q) => ({
            ...q,
            page: Math.max(0, Math.ceil(result.total / 24) - 1),
          }));
          return;
        }
        setAll(data);
        setItems(result.items);
        setDisplayedPage(query.page);
        setTotal(result.total);
        setLoading(false);
      })
      .catch(() => {
        if (version === request.current) {
          setError("Não foi possível atualizar a biblioteca");
          setLoading(false);
        }
      });
    return () => {
      request.current++;
    };
  }, [catalog, query, revision, scenario, suspended]);
  useLayoutEffect(() => {
    if (searching) searchInput.current?.focus();
    else first.current?.focus();
  }, [searching, query.scope]);
  useLayoutEffect(() => {
    if (focusPage.current) {
      (
        document.querySelector<HTMLButtonElement>(
          ".discovery-results .discovery-card",
        ) ??
        searchInput.current ??
        first.current
      )?.focus();
      focusPage.current = false;
    } else if (initialFocus.current && first.current) {
      first.current.focus();
      initialFocus.current = false;
    }
  }, [items]);
  useLayoutEffect(() => {
    if (!focusRecommendation.current) return;
    if (selected?.type === "movie") {
      window.scrollTo({ top: 0, left: 0 });
    } else {
      detail.current?.scrollTo({ top: 0 });
    }
    detail.current
      ?.querySelector<HTMLButtonElement>("[data-detail-primary-action]")
      ?.focus({ preventScroll: true });
    focusRecommendation.current = false;
  }, [selected?.id]);
  useEffect(() => {
    const returningToDetail = wasSuspended.current && !suspended && selected;
    wasSuspended.current = suspended;
    if (!returningToDetail) return;
    requestAnimationFrame(() =>
      detail.current
        ?.querySelector<HTMLButtonElement>("[data-detail-primary-action]")
        ?.focus({ preventScroll: true }),
    );
  }, [selected, suspended]);
  useEffect(() => {
    setHydrated(scenario !== "hydration");
    if (scenario !== "hydration") return;
    const timer = setTimeout(() => setHydrated(true), 1800);
    return () => clearTimeout(timer);
  }, [scenario]);
  useEffect(() => {
    if (!suspended && selected) {
      const current = all.find((x) => x.id === selected.id);
      if (current && current.position !== selected.position)
        setSelected(current);
    }
  }, [all, suspended, selected]);
  useEffect(() => {
    if (!trailerOpen || !trailerPlaying) return;
    const duration = trailerDuration(selected?.type);
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
  }, [trailerOpen, trailerPlaying, selected?.type]);
  const open = (item: DiscoveryItem) => {
    origin.current = document.activeElement as HTMLElement;
    scroll.current = window.scrollY;
    setNotice("");
    setTrailerOpen(false);
    setTrailerPlaying(false);
    setTrailerPosition(0);
    setSelected(item);
    if (item.type === "movie") {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0 });
        detail.current
          ?.querySelector<HTMLButtonElement>("[data-detail-primary-action]")
          ?.focus({ preventScroll: true });
      });
    }
  };
  const openRecommendation = (item: DiscoveryItem) => {
    focusRecommendation.current = true;
    setNotice("");
    setTrailerOpen(false);
    setTrailerPlaying(false);
    setTrailerPosition(0);
    setSelected(item);
  };
  const update = (patch: Partial<DiscoveryQuery>) => {
    focusPage.current = false;
    setSearching(true);
    setQuery((q) => ({ ...q, ...patch, page: 0 }));
  };
  const scope = (id: string) => {
    setSelected(null);
    setSearching(true);
    setQuery({ ...discoveryQuery(), scope: id });
    searchInput.current?.focus();
  };
  const cards = (data: DiscoveryItem[], rail = false) =>
    data.map((item) => (
      <DiscoveryCard
        key={item.id}
        item={item}
        selectionService={selectionService}
        rail={rail}
        hideArt={!hydrated}
        onOpen={open}
      />
    ));
  const section = (
    title: string,
    data: DiscoveryItem[],
    patch: Partial<DiscoveryQuery>,
  ) =>
    data.length > 0 && (
      <DiscoveryRail
        title={title}
        items={data}
        selectionService={selectionService}
        onOpen={open}
        hideArt={!hydrated}
        headingAction={
          <button onClick={() => update(patch)}>
            Ver todos <ArrowRight size={16} />
          </button>
        }
      />
    );
  const libraries = Array.from(
    new Map(
      all.flatMap((x) => x.memberships.map((m) => [m.id, m] as const)),
    ).values(),
  );
  const collections = Array.from(
    new Map(
      all.flatMap((x) => x.collections.map((c) => [c.id, c] as const)),
    ).values(),
  );
  const hero = all.find((x) => x.type === "movie") ?? all[0];
  const heroSignal = hero
    ? discoverySourceSignal(hero, selectionService)
    : undefined;
  const detailSignal = selected
    ? discoverySourceSignal(selected, selectionService)
    : undefined;
  const recommendations = selected ? contentRecommendations(all, selected) : [];
  const scopeName = [...libraries, ...collections].find(
    (x) => x.id === query.scope,
  )?.name;
  const movieDetailPage = selected?.type === "movie" && !suspended;
  return (
    <div
      className="app discovery-app"
      data-input={input}
      data-tv-mode={tvMode || undefined}
      data-detail-page={movieDetailPage || undefined}
    >
      <header className="discovery-header">
        <div className="discovery-header-primary">
          <span className="discovery-brand">Ushark</span>
          <nav aria-label="Navegação principal">
            <button
              aria-current={!searching ? "page" : undefined}
              onClick={() => {
                setSearching(false);
                setQuery(discoveryQuery());
              }}
            >
              Início
            </button>
            <button onClick={onMovies}>Filmes</button>
            <button onClick={onSeries}>Séries</button>
            {!tvMode && <button onClick={onLibraries}>Bibliotecas</button>}
          </nav>
        </div>
        <div className="discovery-header-actions">
          <button
            className="discovery-icon-action"
            aria-label="Busca"
            aria-current={searching ? "page" : undefined}
            onClick={() => {
              setSearching(true);
              searchInput.current?.focus();
            }}
          >
            <Search size={22} />
          </button>
          {!tvMode && (
            <>
              <button
                className="discovery-icon-action"
                aria-label="Downloads"
                onClick={onDownloads}
              >
                <Download size={22} />
              </button>
              <button
                className="discovery-icon-action"
                aria-label="Ajustar preferências"
                onClick={onSettings}
              >
                <Settings size={22} />
              </button>
            </>
          )}
        </div>
      </header>
      <main
        className={`discovery-main ${searching ? "is-searching" : "is-home"}`}
      >
        {scenario === "offline" && (
          <p className="discovery-banner" role="status">
            Offline · Sua biblioteca continua disponível. Sincronização e novos
            peers indisponíveis.
          </p>
        )}
        {searching ? (
          <>
            <div className="discovery-title">
              <span className="eyebrow">ENCONTRE SUA PRÓXIMA HISTÓRIA</span>
              <h1>{scopeName ?? "Busca na biblioteca"}</h1>
            </div>
            <FilterToolbar className="discovery-filters">
              <FilterSearch
                ref={searchInput}
                className="discovery-search"
                label="Busca global"
                type="text"
                placeholder={
                  tvMode
                    ? "Título, série, episódio ou coleção"
                    : "Título, série, episódio, biblioteca ou coleção"
                }
                value={query.text}
                icon={<Search aria-hidden="true" />}
                onChange={(e) => update({ text: e.target.value })}
                actions={
                  <>
                    <button
                      aria-label="Abrir teclado na tela"
                      onClick={() => {
                        origin.current = document.activeElement as HTMLElement;
                        setDraft(query.text);
                        setKeyboard(true);
                      }}
                    >
                      <Keyboard />
                    </button>
                    {query.text && (
                      <button
                        aria-label="Limpar busca"
                        onClick={() => update({ text: "" })}
                      >
                        <X />
                      </button>
                    )}
                  </>
                }
              />
              <FilterSelect
                label="Tipo"
                aria-label="Tipo"
                value={query.type}
                onChange={(e) => update({ type: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="movie">Filmes</option>
                <option value="series">Séries</option>
                <option value="episode">Episódios</option>
              </FilterSelect>
              <FilterSelect
                label="Gênero"
                aria-label="Gênero"
                value={query.genre}
                onChange={(e) => update({ genre: e.target.value })}
              >
                <option value="">Todos os gêneros</option>
                {Array.from(new Set(all.flatMap((x) => x.genres)))
                  .sort()
                  .map((g) => (
                    <option key={g}>{g}</option>
                  ))}
              </FilterSelect>
              <FilterSelect
                label="Coleção"
                aria-label="Coleção"
                value={query.collection}
                onChange={(e) => update({ collection: e.target.value })}
              >
                <option value="">Todas as coleções</option>
                {collections.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.name}
                  </option>
                ))}
              </FilterSelect>
              <FilterGroup>
                <Button
                  variant="secondary"
                  aria-pressed={query.favorite}
                  onClick={() => update({ favorite: !query.favorite })}
                >
                  Favoritos
                </Button>
                <Button
                  variant="secondary"
                  aria-pressed={query.recent}
                  onClick={() => update({ recent: !query.recent })}
                >
                  Recentes
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setQuery(discoveryQuery())}
                >
                  Limpar filtros
                </Button>
              </FilterGroup>
            </FilterToolbar>
          </>
        ) : (
          <>
            {hero ? (
              <section className="discovery-hero">
                <div
                  className="discovery-hero-image"
                  style={
                    hydrated && (hero.backdrop ?? hero.poster)
                      ? {
                          backgroundImage: `url("${hero.backdrop ?? hero.poster}")`,
                        }
                      : undefined
                  }
                />
                <div className="discovery-hero-copy">
                  <span className="eyebrow">EM DESTAQUE NO USHARK</span>
                  <h1>{hero.title}</h1>
                  <p className="discovery-meta">
                    {hero.year} · {hero.genres.join(" / ")}
                    {heroSignal?.quality ? ` · ${heroSignal.quality}` : ""}{" "}
                    {heroSignal?.health && (
                      <TorrentHealthBadge health={heroSignal.health} inline />
                    )}
                  </p>
                  <p>{hero.synopsis ?? "Uma história esperando por você."}</p>
                  <div className="discovery-hero-actions">
                    <Button
                      ref={first}
                      data-nav-initial
                      onClick={() => open(hero)}
                    >
                      <Play size={20} fill="currentColor" />
                      {hero.position > 0 ? "Continuar" : "Assistir"}
                    </Button>
                    <Button variant="secondary" onClick={() => open(hero)}>
                      <Info size={20} /> Mais informações
                    </Button>
                  </div>
                </div>
              </section>
            ) : !loading && !error ? (
              <section className="discovery-empty-home">
                <Library size={56} />
                <span className="eyebrow">SEU ESPAÇO, SUAS ESCOLHAS</span>
                <h1>{name}</h1>
                <h2>Um novo lugar para suas histórias.</h2>
                <p>Toda boa coleção começa com uma descoberta.</p>
                <div className="discovery-empty-actions">
                  <Button ref={first} onClick={onMovies}>
                    <Play size={18} />
                    {all.length || tvMode
                      ? "Ver meus filmes"
                      : "Adicionar conteúdo"}
                  </Button>
                  <Button variant="secondary" onClick={onSeries}>
                    Explorar séries
                  </Button>
                </div>
              </section>
            ) : null}
            {all.length > 0 && (
              <>
                <div className="discovery-welcome">
                  <h2>{name}</h2>
                  <button onClick={onMovies}>
                    Ver meus filmes <ArrowRight size={16} />
                  </button>
                </div>
                {section(
                  "Continuar assistindo",
                  all.filter((x) => x.position > 0 && x.position < x.duration),
                  { continuing: true },
                )}
                {section(
                  "Filmes para descobrir",
                  all.filter((x) => x.type === "movie"),
                  { type: "movie" },
                )}
                {section(
                  "Séries",
                  all.filter((x) => x.type === "series"),
                  { type: "series" },
                )}
                {section(
                  "Adicionados recentemente",
                  all.filter((x) => x.recent),
                  { recent: true },
                )}
                {!tvMode && (
                  <section className="discovery-section">
                    <h2>Suas bibliotecas</h2>
                    <div className="discovery-origins">
                      {libraries.map((lib, i) => (
                        <button key={lib.id} onClick={() => scope(lib.id)}>
                          <Library />
                          <span>
                            <strong>{lib.name}</strong>
                            <small>
                              Biblioteca {i + 1} ·{" "}
                              {
                                all.filter((x) =>
                                  x.memberships.some((m) => m.id === lib.id),
                                ).length
                              }{" "}
                              histórias
                            </small>
                          </span>
                          <ArrowRight size={20} />
                        </button>
                      ))}
                    </div>
                  </section>
                )}
                {collections.length > 0 && (
                  <section className="discovery-section">
                    <h2>Coleções</h2>
                    <div className="discovery-origins">
                      {collections.map((c) => (
                        <button key={c.id} onClick={() => scope(c.id)}>
                          <Film />
                          <strong>{c.name}</strong>
                          <ArrowRight size={20} />
                        </button>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </>
        )}
        {loading && (
          <p role="status" className="discovery-banner">
            Buscando suas histórias…
          </p>
        )}
        {error && (
          <div className="discovery-banner" role="alert">
            Não foi possível atualizar a biblioteca. Seus resultados foram
            preservados.{" "}
            <button onClick={() => setRevision((x) => x + 1)}>
              Tentar novamente
            </button>
          </div>
        )}
        {searching && (
          <section
            className="discovery-results"
            aria-label="Resultados da busca"
            aria-busy={loading}
          >
            <div className="discovery-section-heading">
              <h2>
                {total}{" "}
                {total === 1 ? "história encontrada" : "histórias encontradas"}
              </h2>
              <span>
                Página {displayedPage + 1} de{" "}
                {Math.max(1, Math.ceil(total / 24))}
              </span>
            </div>
            <div className="discovery-grid">{cards(items)}</div>
            {!items.length && !loading && !error && (
              <div className="discovery-no-results">
                <Search size={36} />
                <h2>Nenhuma história por aqui</h2>
                <p>Tente outro título ou remova os filtros.</p>
                <Button onClick={() => setQuery(discoveryQuery())}>
                  Limpar busca e filtros
                </Button>
              </div>
            )}
            <div className="discovery-pagination">
              <Button
                variant="secondary"
                disabled={displayedPage === 0 || loading}
                onClick={() => {
                  focusPage.current = true;
                  setQuery((q) => ({ ...q, page: displayedPage - 1 }));
                }}
              >
                <ArrowLeft size={18} /> Página anterior
              </Button>
              <Button
                variant="secondary"
                disabled={
                  (displayedPage + 1) * 24 >= total || loading || !!error
                }
                onClick={() => {
                  focusPage.current = true;
                  setQuery((q) => ({ ...q, page: displayedPage + 1 }));
                }}
              >
                Próxima página <ArrowRight size={18} />
              </Button>
            </div>
          </section>
        )}
      </main>
      {!tvMode && (
        <footer className="discovery-footer">
          <span>
            {input === "gamepad"
              ? "A selecionar · B voltar"
              : input === "remote"
                ? "Direcionais navegar · OK selecionar · Voltar"
                : input === "disconnected"
                  ? "Controle desconectado · teclado disponível"
                  : "Tab navegar · Enter selecionar · Esc voltar"}
          </span>
          <span>Prévia em memória · reiniciar descarta alterações</span>
          <details>
            <summary>Cenários da prévia</summary>
            <div>
              <label>
                Catálogo da Home
                <select
                  aria-label="Cenário da Home"
                  value={scenario}
                  onChange={(e) => {
                    const s = e.target.value as DiscoveryScenario;
                    configure(s);
                    setScenario(s);
                    setQuery(discoveryQuery());
                    setNotice("");
                  }}
                >
                  <option value="current">Meu catálogo atual</option>
                  <option value="editorial">Prévia editorial</option>
                  <option value="large">10.000 histórias</option>
                  <option value="empty">Vazio</option>
                  <option value="offline">Offline</option>
                  <option value="error">Erro de leitura</option>
                  <option value="slow">Busca lenta</option>
                  <option value="missing">Sem imagens</option>
                  <option value="hydration">Imagens chegando</option>
                </select>
              </label>
              <button
                onClick={() => {
                  simulate("page-error");
                  setNotice("A próxima página falhará uma vez.");
                }}
              >
                Falhar próxima página
              </button>
              <button
                disabled={!items[0]}
                onClick={() => {
                  simulate("rename", items[0]?.id);
                  setRevision((x) => x + 1);
                }}
              >
                Simular alteração externa
              </button>
              <button
                disabled={!items[0]}
                onClick={() => {
                  simulate("remove", items[0]?.id);
                  setRevision((x) => x + 1);
                  focusPage.current = true;
                }}
              >
                Simular remoção do primeiro resultado
              </button>
              {notice && <p role="status">{notice}</p>}
            </div>
          </details>
        </footer>
      )}
      <Dialog.Root
        open={!!selected && !suspended}
        modal={!movieDetailPage}
        onOpenChange={(v) => {
          if (!v && !suspended) {
            setTrailerOpen(false);
            setTrailerPlaying(false);
            setSelected(null);
          }
        }}
      >
        <Dialog.Portal>
          {!movieDetailPage && <Dialog.Overlay className="modal-overlay" />}
          <Dialog.Content
            ref={detail}
            role={movieDetailPage ? "main" : "dialog"}
            tabIndex={movieDetailPage ? -1 : undefined}
            className={
              movieDetailPage
                ? "discovery-detail discovery-detail-page"
                : "modal discovery-detail"
            }
            onEscapeKeyDown={(event) => {
              if (!trailerOpen) return;
              event.preventDefault();
              setTrailerOpen(false);
              setTrailerPlaying(false);
            }}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              if (movieDetailPage) window.scrollTo({ top: 0, left: 0 });
              detail.current
                ?.querySelector<HTMLButtonElement>(
                  "[data-detail-primary-action]",
                )
                ?.focus({ preventScroll: true });
            }}
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              window.scrollTo(0, scroll.current);
              origin.current?.focus({ preventScroll: true });
            }}
          >
            {selected && (
              <ContentDetails
                item={selected}
                signal={detailSignal}
                recommendations={recommendations}
                movieDetailPage={movieDetailPage}
                tvMode={tvMode}
                selectionService={selectionService}
                preferences={preferences}
                suspended={suspended}
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
                  if (trailerPosition >= trailerDuration(selected.type))
                    setTrailerPosition(0);
                  setTrailerPlaying((playing) => !playing);
                }}
                onMembership={scope}
                onRecommendation={openRecommendation}
                notice={notice}
                scenarioControls={
                  !tvMode ? (
                    <details className="discovery-detail-scenarios">
                      <summary>Cenários do detalhe</summary>
                      <button
                        onClick={() => {
                          simulate("remove", selected.id);
                          origin.current = null;
                          setSelected(null);
                          focusPage.current = true;
                          setRevision((x) => x + 1);
                        }}
                      >
                        Simular remoção deste conteúdo
                      </button>
                    </details>
                  ) : undefined
                }
              />
            )}
            {!movieDetailPage && (
              <Dialog.Close asChild>
                <button className="modal-close" aria-label="Fechar detalhes">
                  <X aria-hidden="true" />
                </button>
              </Dialog.Close>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root open={keyboard} onOpenChange={setKeyboard}>
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay" />
          <Dialog.Content
            className="modal discovery-keyboard"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              origin.current?.focus();
            }}
          >
            <Dialog.Title>Buscar com o controle</Dialog.Title>
            <Dialog.Description>
              Escolha as letras. Concluir aplica a busca; voltar cancela a
              edição.
            </Dialog.Description>
            <output aria-label="Texto do teclado">
              {draft || "Digite um título"}
            </output>
            <div className="discovery-keys">
              {"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
                .split("")
                .map((character) => (
                  <button
                    key={character}
                    onClick={() => setDraft((value) => value + character)}
                  >
                    {character}
                  </button>
                ))}
            </div>
            <div className="discovery-key-actions">
              <button onClick={() => setDraft((value) => value + " ")}>
                Espaço
              </button>
              <button onClick={() => setDraft((value) => value.slice(0, -1))}>
                Apagar
              </button>
              <Dialog.Close asChild>
                <button>Cancelar</button>
              </Dialog.Close>
              <Button
                onClick={() => {
                  update({ text: draft });
                  setKeyboard(false);
                }}
              >
                Concluir busca
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
