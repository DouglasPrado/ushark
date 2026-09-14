import { AppUpdate } from "../system/AppUpdate";
import { MockAppUpdatePreview } from "@ushark/mocks/app-update";
import { Recovery } from "../system/Recovery";
import { MockRecoveryPreview } from "@ushark/mocks/recovery";
import { Diagnostics } from "../system/Diagnostics";
import { MockDiagnosticPreview } from "@ushark/mocks/diagnostics";
import { MockFallbackPreview } from "@ushark/mocks/fallback";
import { TvSessionProvider, TvSetup, useTv } from "../tv/TvSession";
import { MockLibraryForkPreview } from "@ushark/mocks/library-fork";
import { Subscriptions } from "../workspace/Subscriptions";
import { MockSubscriptionPreview } from "@ushark/mocks/subscriptions";
import { LibraryPublish } from "../workspace/LibraryPublish";
import { MockLibraryPublishPreview } from "@ushark/mocks/library-publish";
import { MockLibraryTrustPreview } from "@ushark/mocks/library-trust";
import { LibraryFiles } from "../workspace/LibraryFiles";
import { MockLibraryPackagePreview } from "@ushark/mocks/library-package";
import { Libraries } from "../workspace/Libraries";
import { MockLibraryPreviewService } from "@ushark/mocks/libraries";
import { MockNextEpisodePreview } from "@ushark/mocks/next-episode";
import { Storage } from "../workspace/Storage";
import { MockStoragePreview } from "@ushark/mocks/storage";
import { Downloads } from "../workspace/Downloads";
import { MockDownloadPreview } from "@ushark/mocks/downloads";
import type { DownloadRequest } from "@ushark/types/downloads";
import { useEffect, useRef, useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Folder,
  Gamepad2,
  Library,
  Monitor,
  Play,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Button } from "@ushark/ui";
import {
  defaults,
  initial,
  MockConfigurationService,
  validate,
} from "@ushark/mocks";
import type { Configuration, Preferences, Scenario } from "@ushark/types";
import { useNavigation } from "./navigation";
import { MockTorrentPreview } from "@ushark/mocks/torrent";
import { MockStreamPreview } from "@ushark/mocks/stream";
import { MockSelectionPreview } from "@ushark/mocks/selection";
import { Player } from "../playback/Player";
import { MockPlayerPreview } from "@ushark/mocks/player";
import type { PlaybackContent } from "@ushark/types/player";
import { Discovery } from "../catalog/Discovery";
import { MockDiscoveryCatalog } from "@ushark/mocks/discovery";
import { discoveryQuery, type DiscoverySession } from "@ushark/types/discovery";
import { Movies } from "../catalog/Movies";
import { Series, type SeriesSession } from "../catalog/Series";
import { MockSeriesCatalog } from "@ushark/mocks/series";
import { MockMetadataProvider, MockMovieCatalog } from "@ushark/mocks/movies";
import { hasCompletedOnboarding, markOnboardingCompleted } from "./onboarding";

const steps = [
  "Boas-vindas",
  "Sua biblioteca",
  "Espaço para assistir",
  "Do seu jeito",
];
type Modal = "libraryPath" | "cachePath" | "reset" | null;
function Options({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend>{label}</legend>
      <div className="choices">
        {options.map(([id, text]) => (
          <button
            key={id}
            type="button"
            aria-pressed={value === id}
            className="choice"
            onClick={() => onChange(id)}
          >
            {value === id && <Check size={17} />} {text}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
function Toggle({
  label,
  detail,
  checked,
  onChange,
}: {
  label: string;
  detail?: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      className="toggle-row"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
    >
      <span>
        {label}
        {detail && <small>{detail}</small>}
      </span>
      <span className={"toggle " + (checked ? "on" : "")}>
        <i />
      </span>
    </button>
  );
}
export function App() {
  return (
    <TvSessionProvider>
      <AppContent />
    </TvSessionProvider>
  );
}
function AppContent() {
  const tv = useTv()!;
  const tvMode = tv.mode;
  const service = useRef(new MockConfigurationService()).current;
  const [movieProvider] = useState(() => new MockMetadataProvider());
  const [movieCatalog] = useState(() => {
    const catalog = new MockMovieCatalog(movieProvider);
    catalog.seedDefault(initial.libraryId);
    return catalog;
  });
  const [seriesCatalog] = useState(() => {
    const catalog = new MockSeriesCatalog();
    catalog.seedDefault();
    return catalog;
  });
  const [seriesSession] = useState<SeriesSession>(() => ({
    draft: null,
    collapsed: [],
    pending: null,
  }));
  const [, setMovieCount] = useState(0);
  const [config, setConfig] = useState<Configuration>(structuredClone(initial));
  const configRef = useRef(config);
  configRef.current = config;
  const [discoveryCatalog] = useState(
    () =>
      new MockDiscoveryCatalog(movieCatalog, seriesCatalog, () => ({
        id: configRef.current.libraryId,
        name: configRef.current.name,
      })),
  );
  const [discoverySession] = useState<DiscoverySession>(() => ({
    query: discoveryQuery(),
    searching: false,
    scenario: "current",
  }));
  const [publishService] = useState(() => new MockLibraryPublishPreview());
  const [subscriptionService] = useState(
    () => new MockSubscriptionPreview(publishService),
  );
  discoveryCatalog.externalItems = () => subscriptionService.discoveryItems();
  const [trustService] = useState(() => new MockLibraryTrustPreview());
  const [packageService] = useState(() => new MockLibraryPackagePreview());
  const [libraryService] = useState(
    () =>
      new MockLibraryPreviewService(async () =>
        (await discoveryCatalog.read()).map((item) => ({
          id: item.id,
          title: item.title,
          synopsis: item.synopsis,
          poster: item.poster,
          sources: item.sources.map((source) => ({
            id: source.id,
            name: source.quality,
            local: source.fileAvailable !== false,
            origin: item.memberships.map((m) => m.name).join(", "),
          })),
        })),
      ),
  );
  const [fallbackService] = useState(
    () =>
      new MockFallbackPreview(
        async (id) =>
          (await libraryService.catalog()).find((c) => c.id === id)?.sources ??
          [],
      ),
  );
  const [forkService] = useState(
    () => new MockLibraryForkPreview(libraryService),
  );
  const [libraryEditSession] = useState<{ id?: string }>({});
  const [torrentService] = useState(() => new MockTorrentPreview());
  const [downloadService] = useState(() => new MockDownloadPreview());
  const [storageService] = useState(
    () =>
      new MockStoragePreview(
        () =>
          downloadService.list().map((row) => ({
            id: `download:${row.id}`,
            name: row.content.title,
            gb: row.bytes / 1024 ** 3,
            keep: row.destination === "Biblioteca simulada",
            active: ["queued", "downloading"].includes(row.state),
            favorite: false,
            partial: row.state !== "complete",
            corrupt: false,
            lastUsed: 10,
            volume: row.destination,
            external: true,
          })),
        (id) => downloadService.command(id.slice("download:".length), "remove"),
      ),
  );
  const [showDownloads, setShowDownloads] = useState(false);
  const [downloadRequest, setDownloadRequest] =
    useState<DownloadRequest | null>(null);
  const downloadOrigin = useRef<HTMLElement | null>(null);
  function openDownloads(request: DownloadRequest | null = null) {
    if (tvMode) return;
    downloadOrigin.current = document.activeElement as HTMLElement;
    setDownloadRequest(request);
    setShowDownloads(true);
  }
  const [selectionService] = useState(() => new MockSelectionPreview());
  selectionService.historyPenalty = (id) => fallbackService.penalty(id);
  selectionService.isLocal = (id) =>
    downloadService
      .list()
      .some((row) => row.source.id === id && row.state === "complete");
  const [nextService] = useState(
    () =>
      new MockNextEpisodePreview(
        seriesCatalog,
        selectionService,
        () => configRef.current.preferences,
      ),
  );
  const [streamService] = useState(() => new MockStreamPreview());
  const [playerService] = useState(() => new MockPlayerPreview());
  discoveryCatalog.playbackProgress = (id) => playerService.progress(id);
  const [playing, setPlaying] = useState<PlaybackContent | null>(null);
  useEffect(() => {
    const timer = setInterval(() => {
      downloadService.tick(!!playing);
      fallbackService.advance(1);
    }, 1000);
    return () => clearInterval(timer);
  }, [downloadService, playing]);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const playingRef = useRef(playing);
  playingRef.current = playing;
  const [diagnosticService] = useState(
    () =>
      new MockDiagnosticPreview(
        () => ({
          session: playingRef.current
            ? "Sessão de player simulada ativa"
            : "Sem sessão de player",
          metrics: [
            {
              label: "Throughput",
              value: downloadService.list().reduce((n, d) => n + d.speed, 0),
              unit: "bytes/s simulados",
            },
            {
              label: "Downloads na fila",
              value: downloadService.list().length,
            },
            { label: "Buffer", value: null },
            { label: "Streaming Ratio", value: null },
            { label: "Histórico de reprodução", value: playerService.count() },
            {
              label: "Amostras de Health",
              value: fallbackService.history().length,
            },
            {
              label: "Cache contabilizado",
              value: storageService.list().reduce((n, e) => n + e.gb, 0),
              unit: "GB simulados",
            },
            {
              label: "Razão de escolha",
              value: playingRef.current?.sourceId
                ? selectionService.override(playingRef.current.id)
                  ? "Override local"
                  : "Seleção por preferências"
                : "Sem seleção ativa",
            },
          ],
        }),
        async (category, signal) => {
          if (category === "health") {
            fallbackService.clear();
            return "Histórico Health removido; escolhas e biblioteca preservadas.";
          }
          if (category === "playback") {
            playerService.clear(playingRef.current?.id);
            return "Histórico de reprodução removido; sessão ativa preservada.";
          }
          const removed = await storageService.clean(
            storageService.estimate().map((e) => e.id),
            signal,
          );
          return `${removed} GB de cache elegível removidos na simulação; protegidos preservados.`;
        },
      ),
  );
  const [recoveryService] = useState(
    () =>
      new MockRecoveryPreview(
        () => ({
          config: structuredClone(configRef.current),
          service: service.capturePreview(),
          movieCatalog: movieCatalog.capturePreview(),
          seriesCatalog: seriesCatalog.capturePreview(),
          downloadService: downloadService.capturePreview(),
          storageService: storageService.capturePreview(),
          libraryService: libraryService.capturePreview(),
          subscriptionService: subscriptionService.capturePreview(),
          selectionService: selectionService.capturePreview(),
          torrentService: torrentService.capturePreview(),
          playerService: playerService.capturePreview(),
          trustService: trustService.capturePreview(),
          packageService: packageService.capturePreview(),
        }),
        (snapshot) => {
          service.restorePreview(snapshot.service);
          movieCatalog.restorePreview(snapshot.movieCatalog);
          seriesCatalog.restorePreview(snapshot.seriesCatalog);
          downloadService.restorePreview(snapshot.downloadService);
          storageService.restorePreview(snapshot.storageService);
          libraryService.restorePreview(snapshot.libraryService);
          subscriptionService.restorePreview(snapshot.subscriptionService);
          selectionService.restorePreview(snapshot.selectionService);
          torrentService.restorePreview(snapshot.torrentService);
          playerService.restorePreview(snapshot.playerService);
          trustService.restorePreview(snapshot.trustService);
          packageService.restorePreview(snapshot.packageService);
          setConfig(structuredClone(snapshot.config));
          discoveryCatalog.configure("current");
          discoverySession.query = discoveryQuery();
          discoverySession.scenario = "current";
          seriesSession.draft = null;
          seriesSession.pending = null;
          setPlaying(null);
          setShowDownloads(false);
          setShowDiagnostics(false);
        },
      ),
  );
  const [updateService] = useState(
    () => new MockAppUpdatePreview(recoveryService),
  );
  const playOrigin = useRef<HTMLElement | null>(null);
  function play(content: PlaybackContent) {
    playOrigin.current = document.activeElement as HTMLElement;
    setPlaying(content);
  }
  const [route, setRoute] = useState(() =>
    hasCompletedOnboarding() ? "home" : "onboarding",
  );
  const initialRoute = useRef(route).current;
  const [step, setStep] = useState(0);
  const [modal, setModal] = useState<Modal>(null);
  const [scenario, setScenario] = useState<Scenario>("normal");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const actionOrigin = useRef<HTMLElement | null>(null);
  const primary = useRef<HTMLButtonElement>(null);
  function navigate(next: string) {
    const destination =
      tvMode && !["home", "movies", "series"].includes(next) ? "home" : next;
    setError("");
    setNotice("");
    setRoute(destination);
    window.location.hash = "/" + destination;
  }
  function back() {
    if (modal) {
      setModal(null);
      return;
    }
    if (busy) return;
    if (route === "settings") {
      navigate("home");
      return;
    }
    if (route === "onboarding" && step > 0) setStep(step - 1);
  }
  const input = useNavigation(
    back,
    !playing &&
      !showDownloads &&
      route !== "storage" &&
      route !== "libraries" &&
      route !== "library-files" &&
      route !== "library-publish" &&
      route !== "subscriptions" &&
      route !== "tv" &&
      route !== "diagnostics" &&
      route !== "recovery" &&
      route !== "app-update" &&
      route !== "movies" &&
      route !== "series" &&
      route !== "home",
  );
  useEffect(() => {
    window.location.hash = "/" + initialRoute;
  }, [initialRoute]);
  useEffect(() => {
    primary.current?.focus();
  }, [route, step]);
  const update = <K extends keyof Configuration>(
    key: K,
    value: Configuration[K],
  ) => {
    setConfig((c) => ({ ...c, [key]: value }));
    setError("");
    setNotice("");
  };
  function preference<K extends keyof Preferences>(
    key: K,
    value: Preferences[K],
  ) {
    setConfig((c) => ({
      ...c,
      preferences: { ...c.preferences, [key]: value },
    }));
    setNotice("");
  }
  async function save() {
    const invalid = validate(config);
    if (invalid) {
      setError(invalid);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await service.save(config);
      if (route === "onboarding") {
        markOnboardingCompleted();
        navigate("home");
      } else setNotice("Preferências atualizadas nesta sessão.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function reset() {
    setBusy(true);
    setError("");
    try {
      await service.save({ ...config, preferences: { ...defaults } });
      setConfig((c) => ({ ...c, preferences: { ...defaults } }));
      setModal(null);
      setNotice(
        "Preferências de reprodução restauradas. Biblioteca e cache mantidos.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function advance() {
    setError("");
    if (step === 1 && !config.name.trim()) {
      setError("Dê um nome à biblioteca.");
      return;
    }
    if (step === 2) {
      const invalid = validate(config);
      if (invalid) {
        setError(invalid);
        return;
      }
    }
    if (step < 3) setStep(step + 1);
    else void save();
  }
  const open = (kind: Modal) => {
    actionOrigin.current = document.activeElement as HTMLElement;
    setError("");
    setModal(kind);
  };
  const folders = (kind: "libraryPath" | "cachePath") => (
    <div className="folder-field">
      <span>
        <Folder />
        <span>
          <strong>
            {kind === "libraryPath" ? "Pasta da biblioteca" : "Pasta do cache"}
          </strong>
          <small>{config[kind]}</small>
        </span>
      </span>
      <Button variant="secondary" onClick={() => open(kind)}>
        Escolher pasta
      </Button>
    </div>
  );
  const playback = (
    <>
      <Options
        label="O que importa mais para você?"
        value={config.preferences.strategy}
        options={[
          ["balanced", "Melhor equilíbrio"],
          ["quality", "Melhor qualidade"],
          ["fast", "Começar mais rápido"],
          ["smallest", "Menor tamanho"],
        ]}
        onChange={(v) => preference("strategy", v)}
      />
      <Options
        label="Resolução máxima"
        value={config.preferences.resolution}
        options={[
          ["720p", "720p"],
          ["1080p", "1080p"],
          ["2160p", "4K"],
        ]}
        onChange={(v) => preference("resolution", v)}
      />
      <div className="two-columns">
        <Options
          label="Idioma de áudio"
          value={config.preferences.audio}
          options={[
            ["pt-BR", "Português"],
            ["en", "English"],
          ]}
          onChange={(v) => preference("audio", v)}
        />
        <Options
          label="Legendas"
          value={config.preferences.subtitle}
          options={[
            ["pt-BR", "Português"],
            ["en", "English"],
            ["off", "Desligadas"],
          ]}
          onChange={(v) => preference("subtitle", v)}
        />
      </div>
      <Button
        variant="secondary"
        aria-expanded={advanced}
        onClick={() => setAdvanced(!advanced)}
      >
        <SlidersHorizontal size={18} /> Automação e modo TV{" "}
        <ChevronRight size={18} />
      </Button>
      {advanced && (
        <div className="advanced">
          {(
            [
              ["autoSelect", "Selecionar a melhor fonte"],
              ["autoSwitch", "Trocar fonte se necessário"],
              ["autoplay", "Reproduzir próximo episódio"],
              ["preflight", "Preparar conteúdo em foco"],
              ["nextPreflight", "Preparar próximo episódio"],
            ] as const
          ).map(([key, label]) => (
            <Toggle
              key={key}
              label={label}
              checked={config.preferences[key]}
              onChange={() => preference(key, !config.preferences[key])}
            />
          ))}
          <Options
            label="Ao desconectar da TV"
            value={config.preferences.disconnect}
            options={[
              ["pause", "Pausar"],
              ["continue", "Continuar"],
            ]}
            onChange={(v) => preference("disconnect", v)}
          />
        </div>
      )}
    </>
  );
  const player = playing ? (
    <>
      <div hidden={showDiagnostics}>
        <Player
          preferredAudio={config.preferences.audio}
          preferredSubtitle={config.preferences.subtitle}
          suspended={showDiagnostics}
          onDiagnostics={() => setShowDiagnostics(true)}
          fallback={fallbackService}
          autoSwitch={config.preferences.autoSwitch}
          key={playing.id}
          nextService={nextService}
          autoplay={config.preferences.autoplay}
          nextPreflight={config.preferences.nextPreflight}
          onNext={(next) => {
            seriesSession.playbackId = next.id;
            setPlaying(next);
          }}
          content={playing}
          stream={streamService}
          service={playerService}
          onExit={() => {
            setPlaying(null);
            requestAnimationFrame(() => playOrigin.current?.focus());
          }}
        />
      </div>
      {showDiagnostics && !tvMode && (
        <Diagnostics
          service={diagnosticService}
          onBack={() => {
            setShowDiagnostics(false);
            requestAnimationFrame(() =>
              document
                .querySelector<HTMLButtonElement>(".player-diagnostics")
                ?.focus(),
            );
          }}
        />
      )}
    </>
  ) : null;
  const downloads =
    showDownloads && !tvMode ? (
      <div hidden={!!playing}>
        <Downloads
          service={downloadService}
          request={downloadRequest}
          suspended={!!playing}
          onPlay={play}
          onBack={() => {
            setShowDownloads(false);
            requestAnimationFrame(() => downloadOrigin.current?.focus());
          }}
        />
      </div>
    ) : null;
  if (route === "subscriptions")
    return (
      <>
        {player}
        {downloads}
        <div hidden={!!playing || showDownloads}>
          <Subscriptions
            fork={forkService}
            onForked={(id) => {
              libraryEditSession.id = id;
              navigate("libraries");
            }}
            service={subscriptionService}
            trust={trustService}
            selection={selectionService}
            preferences={config.preferences}
            onPlay={play}
            onDownload={openDownloads}
            progress={(id) => {
              const value = playerService.progress(id);
              return value?.watched ? 0 : (value?.position ?? 0);
            }}
            suspended={!!playing || showDownloads}
            onBack={() => navigate("libraries")}
          />
        </div>
      </>
    );
  if (route === "library-publish")
    return (
      <LibraryPublish
        libraries={libraryService}
        service={publishService}
        onBack={() => navigate("libraries")}
      />
    );
  if (route === "library-files")
    return (
      <LibraryFiles
        trust={trustService}
        libraries={libraryService}
        service={packageService}
        onBack={() => navigate("libraries")}
      />
    );
  if (route === "libraries")
    return (
      <>
        {player}
        {downloads}
        <div hidden={!!playing || showDownloads}>
          <Libraries
            editSession={libraryEditSession}
            service={libraryService}
            onFiles={() => navigate("library-files")}
            onPublish={() => navigate("library-publish")}
            onSubscriptions={() => navigate("subscriptions")}
            selection={selectionService}
            preferences={config.preferences}
            onPlay={play}
            onDownload={openDownloads}
            progress={(id) => {
              const value = playerService.progress(id);
              return value?.watched ? 0 : (value?.position ?? 0);
            }}
            suspended={!!playing || showDownloads}
            onBack={() => navigate("home")}
          />
        </div>
      </>
    );
  if (route === "app-update")
    return (
      <AppUpdate
        service={updateService}
        onBack={() => navigate("settings")}
        onHome={() => navigate("home")}
        onRecovery={() => navigate("recovery")}
      />
    );
  if (route === "recovery")
    return (
      <Recovery
        service={recoveryService}
        onBack={() => navigate("settings")}
        onHome={() => navigate("home")}
        onDiagnostics={() => navigate("diagnostics")}
      />
    );
  if (route === "diagnostics")
    return (
      <Diagnostics
        service={diagnosticService}
        onBack={() => navigate("settings")}
      />
    );
  if (route === "tv")
    return (
      <TvSetup
        policy={config.preferences.disconnect}
        onBack={() => navigate("settings")}
        onBrowse={() => navigate("home")}
      />
    );
  if (route === "storage")
    return (
      <Storage
        service={storageService}
        onBack={() => navigate("settings")}
        onPolicy={(policy, folderChanged) =>
          setConfig((c) => ({
            ...c,
            cacheGB: policy.limitGB,
            cleanup: policy.autoCleanup,
            retainPartial: policy.retainPartial,
            cachePath: !folderChanged
              ? c.cachePath
              : policy.folder === "Cache SSD simulado"
                ? "/Volumes/SSD/Ushark/cache"
                : "/Volumes/HDD/Ushark/cache",
          }))
        }
      />
    );
  let content: ReactNode;
  if (route === "settings")
    content = (
      <>
        <Button variant="secondary" onClick={() => navigate("tv")}>
          Sessão de TV
        </Button>
        <Button variant="secondary" onClick={() => navigate("diagnostics")}>
          Diagnóstico
        </Button>
        <Button variant="secondary" onClick={() => navigate("recovery")}>
          Backup e recuperação
        </Button>
        <Button variant="secondary" onClick={() => navigate("app-update")}>
          Sobre e atualização
        </Button>
        <div className="eyebrow">CONFIGURAÇÕES</div>
        <h1>Seu jeito de assistir.</h1>
        <p className="intro">Escolhas que deixam tudo mais confortável.</p>
        {playback}
        <div className="settings-storage">
          <h2>Biblioteca e armazenamento</h2>
          <Button
            variant="secondary"
            onClick={() => {
              storageService.policy = {
                ...storageService.policy,
                limitGB: config.cacheGB,
                autoCleanup: config.cleanup,
                retainPartial: config.retainPartial,
              };
              navigate("storage");
            }}
          >
            Espaço e retenção
          </Button>
          {folders("libraryPath")}
          {folders("cachePath")}
          <label>
            Limite do cache (GB)
            <input
              type="number"
              min="1"
              max="10000"
              value={config.cacheGB}
              onChange={(e) => update("cacheGB", Number(e.target.value))}
            />
          </label>
        </div>
        <div className="footer-actions">
          <Button variant="secondary" onClick={() => open("reset")}>
            Restaurar preferências
          </Button>
          <Button ref={primary} disabled={busy} onClick={() => void save()}>
            {busy ? "Salvando…" : "Salvar preferências"}
            <Check size={18} />
          </Button>
        </div>
      </>
    );
  else
    content = (
      <>
        <div className="eyebrow">
          {step === 0
            ? "BEM-VINDO AO USHARK"
            : `VAMOS PREPARAR TUDO · ${String(step).padStart(2, "0")} / 03`}
        </div>
        <h1 ref={heading}>
          {
            [
              "Suas histórias.\nSeu lugar.",
              "Uma casa para\nsua coleção.",
              "Espaço para\na próxima história.",
              "A melhor experiência\né a sua.",
            ][step]
          }
        </h1>
        <p className="intro">
          {
            [
              "Sua biblioteca, suas fontes e a liberdade de assistir do seu jeito. No computador ou na sua TV.",
              "Dê um nome à sua biblioteca e escolha onde ela vai morar. Você pode mudar isso depois.",
              "Reserve um espaço temporário para assistir. Sua biblioteca fica separada e protegida.",
              "Escolha como você prefere assistir. Nós cuidamos dos detalhes quando for hora de dar play.",
            ][step]
          }
        </p>
        {step === 0 ? (
          <div className="benefits">
            <div>
              <Library />
              <span>
                <strong>Sua coleção, organizada</strong>
                <small>Filmes e séries em um só lugar.</small>
              </span>
            </div>
            <div>
              <Monitor />
              <span>
                <strong>Da sua tela para a sala</strong>
                <small>Uma experiência pensada para controle.</small>
              </span>
            </div>
            <div>
              <ShieldCheck />
              <span>
                <strong>Seu espaço continua seu</strong>
                <small>Biblioteca e preferências locais.</small>
              </span>
            </div>
          </div>
        ) : step === 1 ? (
          <>
            <label>
              Nome da biblioteca
              <input
                autoComplete="off"
                maxLength={80}
                value={config.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </label>
            {folders("libraryPath")}
            <p className="note">
              <ShieldCheck size={18} /> A biblioteca guarda sua organização.
              Seus arquivos de mídia têm escolhas próprias.
            </p>
          </>
        ) : step === 2 ? (
          <>
            {folders("cachePath")}
            <label>
              Limite do cache (GB)
              <input
                type="number"
                value={config.cacheGB}
                min="1"
                max="10000"
                onChange={(e) => update("cacheGB", Number(e.target.value))}
              />
            </label>
            <p className="note">
              SSD ou NVMe é recomendado para o cache ativo.
            </p>
            <Toggle
              label="Limpar automaticamente"
              detail="Liberar apenas dados temporários elegíveis."
              checked={config.cleanup}
              onChange={() => update("cleanup", !config.cleanup)}
            />
            <Toggle
              label="Manter o que comecei a assistir"
              detail="Preservar conteúdos parcialmente assistidos."
              checked={config.retainPartial}
              onChange={() => update("retainPartial", !config.retainPartial)}
            />
          </>
        ) : (
          playback
        )}
        <div className="footer-actions">
          <span className="step-detail">
            {step === 0
              ? "Poucos passos. Tudo no seu ritmo."
              : `${step} de 3 · ${steps[step]}`}
          </span>
          <Button ref={primary} disabled={busy} onClick={advance}>
            {busy
              ? "Preparando…"
              : step === 0
                ? "Começar"
                : step === 3
                  ? "Abrir minha biblioteca"
                  : "Continuar"}
            <ArrowRight size={20} />
          </Button>
        </div>
      </>
    );
  if (route === "home")
    return (
      <>
        {player}
        {downloads}
        <div hidden={!!playing || showDownloads}>
          <Discovery
            tvMode={tvMode}
            onDownload={openDownloads}
            onLibraries={() => navigate("libraries")}
            onDownloads={() => openDownloads()}
            selectionService={selectionService}
            preferences={config.preferences}
            suspended={!!playing || showDownloads}
            onPlay={play}
            catalog={discoveryCatalog}
            session={discoverySession}
            name={config.name}
            onMovies={() => navigate("movies")}
            onSeries={() => navigate("series")}
            onSettings={() => navigate("settings")}
            configure={(s) => discoveryCatalog.configure(s)}
            simulate={(action, id) => {
              if (action === "page-error") discoveryCatalog.failNextPage = true;
              else if (id && action === "remove") discoveryCatalog.remove(id);
              else if (id) discoveryCatalog.rename(id);
            }}
          />
        </div>
      </>
    );
  if (route === "series")
    return (
      <>
        {player}
        {downloads}
        <div hidden={!!playing || showDownloads}>
          <Series
            tvMode={tvMode}
            onDownload={openDownloads}
            onLibraries={() => navigate("libraries")}
            onDownloads={() => openDownloads()}
            selectionService={selectionService}
            preferences={config.preferences}
            suspended={!!playing || showDownloads}
            onPlay={play}
            torrentService={torrentService}
            catalog={seriesCatalog}
            session={seriesSession}
            configure={(s) => {
              seriesCatalog.scenario = s;
            }}
            seed={(s) => seriesCatalog.seed(s)}
            onHome={() => navigate("home")}
            onMovies={() => navigate("movies")}
            libraryName={config.name}
          />
        </div>
      </>
    );
  if (route === "movies")
    return (
      <>
        {player}
        {downloads}
        <div hidden={!!playing || showDownloads}>
          <Movies
            tvMode={tvMode}
            onDownload={openDownloads}
            onLibraries={() => navigate("libraries")}
            onDownloads={() => openDownloads()}
            selectionService={selectionService}
            preferences={config.preferences}
            suspended={!!playing || showDownloads}
            onPlay={play}
            torrentService={torrentService}
            catalog={movieCatalog}
            provider={movieProvider}
            libraryId={config.libraryId}
            libraryName={config.name}
            onSeries={() => navigate("series")}
            onHome={() => navigate("home")}
            onCount={setMovieCount}
            configure={(value) => {
              movieCatalog.scenario = value;
              movieProvider.scenario = value;
            }}
            seed={(kind) => movieCatalog.seed(kind, config.libraryId)}
          />
        </div>
      </>
    );
  return (
    <div className="app" data-input={input}>
      <main>
        <aside>
          <div className="aside-top">
            <span className="mini-label">SEU CINEMA COMEÇA AQUI</span>
            <div className="cinema-art">
              <div className="ticket">
                <Play size={42} fill="currentColor" />
                <span>
                  PRESS PLAY.
                  <br />
                  FEEL AT HOME.
                </span>
              </div>
              <span className="art-ring" />
            </div>
          </div>
          <nav aria-label="Etapas de configuração">
            {steps.map((s, i) => (
              <div
                className={
                  "step " +
                  (route === "onboarding" && i === step ? "active" : "") +
                  (i < step ? " complete" : "")
                }
                key={s}
              >
                <span>
                  {i < step ? (
                    <Check size={15} />
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </span>
                <strong>{s}</strong>
                {route === "onboarding" && i === step && <i />}
              </div>
            ))}
          </nav>
          <div className="aside-bottom">
            <ShieldCheck size={16} /> Feito para continuar sendo seu.
          </div>
        </aside>
        <section className="surface">
          {(route === "settings" || (route === "onboarding" && step > 0)) && (
            <Button className="back" variant="secondary" onClick={back}>
              <ArrowLeft size={17} /> Voltar
            </Button>
          )}
          {scenario === "offline" && (
            <div className="banner">
              Você está offline. A configuração local continua disponível.
            </div>
          )}
          {scenario === "degraded" && (
            <div className="banner">
              Alguns serviços estão indisponíveis. Você pode continuar.
            </div>
          )}
          {content}
          {error && (
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
      <footer>
        <span>
          <Gamepad2 size={17} />{" "}
          {input === "gamepad"
            ? "Controle conectado · A selecionar · B voltar"
            : input === "disconnected"
              ? "Controle desconectado · teclado disponível"
              : input === "remote"
                ? "Controle remoto · direcionais navegar · OK selecionar"
                : "Tab navegar · Enter selecionar · Esc voltar"}
        </span>
        <span>
          Prévia em memória · conclusão do onboarding salva neste dispositivo
        </span>
        <label className="scenario">
          Cenário
          <select
            aria-label="Cenário de teste"
            value={scenario}
            onChange={(e) => {
              const v = e.target.value as Scenario;
              service.scenario = v;
              setScenario(v);
              setError("");
            }}
          >
            {[
              ["normal", "Normal"],
              ["loading", "Salvamento lento"],
              ["offline", "Offline"],
              ["error", "Erro ao salvar"],
              ["folder-error", "Pasta inacessível"],
              ["degraded", "Serviço degradado"],
            ].map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </footer>
      <Dialog.Root
        open={!!modal}
        onOpenChange={(v) => {
          if (!v && !busy) setModal(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay" />
          <Dialog.Content
            className="modal"
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              actionOrigin.current?.focus();
            }}
          >
            <Dialog.Title>
              {modal === "reset"
                ? "Voltar às preferências iniciais?"
                : "Escolha um lugar"}
            </Dialog.Title>
            <Dialog.Description>
              {modal === "reset"
                ? "Somente preferências de reprodução serão restauradas. Sua biblioteca, cache, histórico e downloads permanecem."
                : "Seletor simulado. Nenhuma pasta será criada ou acessada nesta prévia."}
            </Dialog.Description>
            {modal !== "reset" && (
              <div className="folder-options">
                {["C:\\Ushark\\", "D:\\Cinema\\", "E:\\Media\\"].map((base) => {
                  const path =
                    base + (modal === "libraryPath" ? "Library" : "Cache");
                  return (
                    <Button
                      variant="secondary"
                      key={base}
                      onClick={() => {
                        if (modal === "libraryPath" || modal === "cachePath")
                          update(modal, path);
                        setModal(null);
                      }}
                    >
                      <Folder size={19} />
                      {path}
                    </Button>
                  );
                })}
              </div>
            )}
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <div className="footer-actions">
              <Dialog.Close asChild>
                <Button variant="secondary" disabled={busy}>
                  Cancelar
                </Button>
              </Dialog.Close>
              {modal === "reset" && (
                <Button disabled={busy} onClick={() => void reset()}>
                  {busy ? "Restaurando…" : "Restaurar"}
                </Button>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                aria-label="Fechar"
                className="modal-close"
                disabled={busy}
              >
                <X size={22} />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
