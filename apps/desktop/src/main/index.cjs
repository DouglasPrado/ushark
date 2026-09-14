const {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  protocol,
  safeStorage,
  session,
} = require("electron");
const fs = require("node:fs");
const { Buffer } = require("node:buffer");
const { randomUUID } = require("node:crypto");
const path = require("node:path");
const { setImmediate } = require("node:timers");
const { ConfigurationStore } = require("@ushark/core/configuration");
const { MovieAssetStore } = require("@ushark/core/movie-assets");
const {
  MovieCatalogApplicationService,
} = require("@ushark/core/movie-catalog-service");
const { MovieCatalogStore } = require("@ushark/core/movies");
const { DiscoveryIndexStore } = require("@ushark/core/discovery-index");
const { DiscoveryWatcher } = require("@ushark/core/discovery-watcher");
const {
  LocalPlaybackSourceResolver,
  PlaybackApplicationService,
} = require("@ushark/core/playback-service");
const { PlaybackStore } = require("@ushark/core/playback-store");
const { ExternalSubtitleStore } = require("@ushark/core/playback-tracks");
const { MpvAdapter } = require("@ushark/core/mpv-adapter");
const {
  ProgressiveStreamApplicationService,
  TorrentStreamSourceResolver,
} = require("@ushark/core/progressive-stream-service");
const {
  ProgressiveHealthSampler,
  TorrentHealthMetricsAdapter,
} = require("@ushark/core/health-sampler");
const {
  SourceSelectionApplicationService,
  SourceSelectionStore,
} = require("@ushark/core/source-selection");
const {
  DownloadApplicationService,
  DownloadStore,
} = require("@ushark/core/downloads");
const { StoragePolicyService } = require("@ushark/core/storage-policy");
const { NextEpisodeApplicationService } = require("@ushark/core/next-episode");
const {
  LibraryDraftApplicationService,
} = require("@ushark/core/library-drafts");
const {
  LibraryPackageApplicationService,
} = require("@ushark/core/library-package");
const { LibraryTrustService } = require("@ushark/core/library-trust");
const {
  HttpRegistryClient,
  RegistryPublisherService,
} = require("@ushark/core/registry-publisher");
const { SubscriptionService } = require("@ushark/core/subscriptions");
const { FallbackService } = require("@ushark/core/fallback");
const { DiagnosticsService } = require("@ushark/core/diagnostics");
const { RecoveryService } = require("@ushark/core/recovery");
const { AppUpdateService } = require("@ushark/core/app-update");
const { TorrentDaemonClient } = require("@ushark/core/torrent-daemon");
const { TorrentInputStore } = require("@ushark/core/torrent-input");
const {
  TorrentInspectionApplicationService,
} = require("@ushark/core/torrent-inspection-service");
const {
  TorrentInspectionStore,
} = require("@ushark/core/torrent-inspection-store");
const { SeriesCatalogStore } = require("@ushark/core/series");
const {
  SeriesCatalogApplicationService,
} = require("@ushark/core/series-service");
const {
  SqliteMetadataCache,
  TmdbMetadataProvider,
} = require("@ushark/core/metadata");
const { registerConfigurationIpc } = require("./configuration-ipc.cjs");
const {
  publishDiscoveryEvent,
  registerDiscoveryIpc,
} = require("./discovery-ipc.cjs");
const { registerMovieCatalogIpc } = require("./movie-catalog-ipc.cjs");
const {
  publishPlaybackEvent,
  registerPlaybackIpc,
} = require("./playback-ipc.cjs");
const { publishStreamEvent, registerStreamIpc } = require("./stream-ipc.cjs");
const {
  publishSourceSelectionEvent,
  registerSourceSelectionIpc,
} = require("./source-selection-ipc.cjs");
const {
  publishDownloadEvent,
  registerDownloadIpc,
} = require("./download-ipc.cjs");
const { registerStorageIpc } = require("./storage-ipc.cjs");
const { registerNextEpisodeIpc } = require("./next-episode-ipc.cjs");
const { registerLibraryDraftIpc } = require("./library-draft-ipc.cjs");
const { registerLibraryPackageIpc } = require("./library-package-ipc.cjs");
const { registerLibraryTrustIpc } = require("./library-trust-ipc.cjs");
const { registerLibraryPublishIpc } = require("./library-publish-ipc.cjs");
const { registerSubscriptionIpc } = require("./subscription-ipc.cjs");
const { registerLibraryForkIpc } = require("./library-fork-ipc.cjs");
const { registerTvSessionIpc } = require("./tv-session-ipc.cjs");
const { registerFallbackIpc } = require("./fallback-ipc.cjs");
const { registerDiagnosticsIpc } = require("./diagnostics-ipc.cjs");
const { registerRecoveryIpc } = require("./recovery-ipc.cjs");
const { registerAppUpdateIpc } = require("./app-update-ipc.cjs");
const { registerSeriesCatalogIpc } = require("./series-catalog-ipc.cjs");
const {
  registerTorrentInspectionIpc,
} = require("./torrent-inspection-ipc.cjs");
const desktopRoot = path.join(__dirname, "../..");
const dev = process.argv.includes("--dev");
const tv = process.argv.includes("--tv");
const devPort = Number(process.env.USHARK_DEV_PORT ?? 5173);
let mainWindow = null;
let configurationStore = null;
let movieContext = null;
let torrentContext = null;
let seriesContext = null;
let discoveryContext = null;
let playbackContext = null;
let streamContext = null;
let sourceSelectionContext = null;
let downloadContext = null;
let storageContext = null;
let nextEpisodeContext = null;
let libraryDraftContext = null;
let libraryPackageContext = null;
let libraryTrustContext = null;
let libraryPublishContext = null;
let subscriptionContext = null;
let fallbackContext = null;
let diagnosticsContext = null;
let recoveryContext = null;
let appUpdateContext = null;
let torrentClosing = false;
const activePlayerSurfaces = new Set();

protocol.registerSchemesAsPrivileged([
  {
    scheme: "ushark-asset",
    privileges: { secure: true, standard: true, supportFetchAPI: true },
  },
]);

function getConfigurationStore() {
  if (!configurationStore) {
    const userData = app.getPath("userData");
    configurationStore = new ConfigurationStore(
      path.join(userData, "ushark.db"),
      path.join(userData, "managed"),
    );
  }
  return configurationStore;
}

function closeMovieContext() {
  if (!movieContext) return;
  movieContext.service.close();
  movieContext.assets.close();
  movieContext.cache.close();
  movieContext.store.close();
  movieContext = null;
}

function closeDiscoveryContext() {
  if (!discoveryContext) return;
  const context = discoveryContext;
  discoveryContext = null;
  context.watcher?.close();
  context.index.close();
}

function signedGeometryOffset(value) {
  const rounded = Math.round(value);
  return rounded < 0 ? String(rounded) : `+${rounded}`;
}

function playerWindowGeometry() {
  if (!mainWindow || mainWindow.isDestroyed()) return undefined;
  const bounds = mainWindow.getContentBounds();
  return `${Math.max(1, Math.round(bounds.width))}x${Math.max(
    1,
    Math.round(bounds.height),
  )}${signedGeometryOffset(bounds.x)}${signedGeometryOffset(bounds.y)}`;
}

function createPlayerSurface() {
  const token = Symbol("mpv-surface");
  const listeners = [
    "move",
    "resize",
    "enter-full-screen",
    "leave-full-screen",
  ];
  return {
    geometry: playerWindowGeometry,
    activate() {
      activePlayerSurfaces.add(token);
      if (!mainWindow || mainWindow.isDestroyed()) return;
      mainWindow.setAlwaysOnTop(true);
      mainWindow.moveTop();
      mainWindow.focus();
    },
    deactivate() {
      activePlayerSurfaces.delete(token);
      if (
        activePlayerSurfaces.size === 0 &&
        mainWindow &&
        !mainWindow.isDestroyed()
      )
        mainWindow.setAlwaysOnTop(false);
    },
    subscribeGeometry(listener) {
      const window = mainWindow;
      if (!window || window.isDestroyed()) return () => {};
      const publish = () => {
        const geometry = playerWindowGeometry();
        if (geometry) listener(geometry);
      };
      for (const event of listeners) window.on(event, publish);
      return () => {
        if (window.isDestroyed()) return;
        for (const event of listeners) window.off(event, publish);
      };
    },
  };
}

function createMpvAdapter() {
  const platformArgs = [
    "--no-border",
    "--no-osc",
    "--focus-on=never",
    "--ontop=no",
    "--auto-window-resize=no",
    "--keepaspect-window=no",
    "--show-in-taskbar=no",
    ...(process.platform === "darwin"
      ? [
          "--macos-app-activation-policy=accessory",
          "--macos-geometry-calculation=whole",
        ]
      : []),
  ];
  const headlessArgs =
    process.env.USHARK_MPV_TEST_HEADLESS === "1"
      ? ["--vo=null", "--ao=null", "--really-quiet"]
      : [];
  return new MpvAdapter({
    executable: process.env.USHARK_MPV_PATH,
    surface: createPlayerSurface(),
    extraArgs: [...platformArgs, ...headlessArgs],
  });
}

async function closePlaybackContext() {
  if (!playbackContext) return;
  const context = playbackContext;
  playbackContext = null;
  context.unsubscribe();
  await context.service.close();
}

async function closeStreamContext() {
  if (!streamContext) return;
  const context = streamContext;
  streamContext = null;
  context.unsubscribe();
  await context.service.close();
}

function closeSourceSelectionContext() {
  if (!sourceSelectionContext) return;
  const context = sourceSelectionContext;
  sourceSelectionContext = null;
  context.unsubscribe();
  context.resolver.close();
  context.store.close();
}

async function closeDownloadContext() {
  if (!downloadContext) return;
  const context = downloadContext;
  downloadContext = null;
  context.unsubscribe();
  await context.service.close();
  context.resolver.close();
  context.store.close();
}

function closeStorageContext() {
  if (!storageContext) return;
  const context = storageContext;
  storageContext = null;
  context.service.close();
}

function closeNextEpisodeContext() {
  if (!nextEpisodeContext) return;
  const context = nextEpisodeContext;
  nextEpisodeContext = null;
  context.service.close();
}

function closeLibraryDraftContext() {
  if (!libraryDraftContext) return;
  const context = libraryDraftContext;
  libraryDraftContext = null;
  context.service.close();
}

function closeLibraryPackageContext() {
  if (!libraryPackageContext) return;
  const context = libraryPackageContext;
  libraryPackageContext = null;
  context.service.close();
}

function closeLibraryTrustContext() {
  if (!libraryTrustContext) return;
  const context = libraryTrustContext;
  libraryTrustContext = null;
  context.service.close();
}
function closeLibraryPublishContext() {
  if (!libraryPublishContext) return;
  const context = libraryPublishContext;
  libraryPublishContext = null;
  context.service.close();
}
function closeSubscriptionContext() {
  if (!subscriptionContext) return;
  const context = subscriptionContext;
  subscriptionContext = null;
  context.service.close();
}
function closeFallbackContext() {
  if (!fallbackContext) return;
  const context = fallbackContext;
  fallbackContext = null;
  context.service.close();
}
function closeDiagnosticsContext() {
  if (!diagnosticsContext) return;
  const context = diagnosticsContext;
  diagnosticsContext = null;
  context.service.close();
}

function closeSeriesContext() {
  if (!seriesContext) return;
  seriesContext.service.close();
  seriesContext.store.close();
  seriesContext = null;
}

function getMovieContext() {
  const configuration = getConfigurationStore().read().configuration;
  const key = [
    configuration.libraryId,
    configuration.libraryPath,
    configuration.cachePath,
  ].join("\0");
  if (movieContext?.key === key) return movieContext;
  closeDiscoveryContext();
  closeSeriesContext();
  closeMovieContext();
  const databasePath = path.join(app.getPath("userData"), "ushark.db");
  const store = new MovieCatalogStore(databasePath, {
    managedLibraryRoot: configuration.libraryPath,
  });
  const cache = new SqliteMetadataCache(databasePath);
  const assets = new MovieAssetStore(
    databasePath,
    path.join(configuration.cachePath, "movie-assets"),
  );
  const provider = new TmdbMetadataProvider({
    accessToken: process.env.USHARK_TMDB_TOKEN,
    cache,
  });
  const service = new MovieCatalogApplicationService({
    store,
    provider,
    assets,
  });
  movieContext = { key, store, cache, assets, provider, service };
  return movieContext;
}

function torrentRuntimePaths() {
  const packagedRoot = path.join(process.resourcesPath, "torrentd");
  return {
    pythonExecutable:
      process.env.USHARK_TORRENTD_PYTHON ??
      path.join(
        packagedRoot,
        "python",
        process.platform === "win32" ? "python.exe" : "bin/python3",
      ),
    pythonPath:
      process.env.USHARK_TORRENTD_PYTHONPATH ??
      path.join(packagedRoot, "site-packages"),
    daemonScript:
      process.env.USHARK_TORRENTD_SCRIPT ??
      (dev
        ? path.join(desktopRoot, "../torrentd/torrentd.py")
        : path.join(packagedRoot, "torrentd.py")),
  };
}

function getTorrentContext() {
  if (torrentContext) return torrentContext;
  // M06 persists relations against the M02 content tables.
  getMovieContext();
  const userData = app.getPath("userData");
  const configuration = getConfigurationStore().read().configuration;
  const importRoot = path.join(userData, "managed", "torrent-input");
  const runtime = torrentRuntimePaths();
  const inputStore = new TorrentInputStore(importRoot);
  const store = new TorrentInspectionStore(path.join(userData, "ushark.db"));
  const daemon = new TorrentDaemonClient({
    ...runtime,
    dataRoot: path.join(configuration.cachePath, "torrent-runtime"),
    importRoot,
  });
  const service = new TorrentInspectionApplicationService({
    daemon,
    inputStore,
    store,
    softTimeoutMs: process.env.USHARK_TORRENTD_SOFT_TIMEOUT_MS
      ? Number(process.env.USHARK_TORRENTD_SOFT_TIMEOUT_MS)
      : undefined,
    hardTimeoutMs: process.env.USHARK_TORRENTD_HARD_TIMEOUT_MS
      ? Number(process.env.USHARK_TORRENTD_HARD_TIMEOUT_MS)
      : undefined,
  });
  torrentContext = { daemon, inputStore, store, service };
  return torrentContext;
}

async function closeTorrentContext() {
  if (!torrentContext) return;
  const context = torrentContext;
  torrentContext = null;
  await context.service.close();
}

function getSeriesContext() {
  const configuration = getConfigurationStore().read().configuration;
  const key = [
    configuration.libraryId,
    configuration.libraryPath,
    configuration.cachePath,
  ].join("\0");
  if (seriesContext?.key === key) return seriesContext;
  closeSeriesContext();
  const movies = getMovieContext();
  const torrent = getTorrentContext();
  const store = new SeriesCatalogStore(
    path.join(app.getPath("userData"), "ushark.db"),
  );
  const service = new SeriesCatalogApplicationService({
    store,
    provider: movies.provider,
    assets: movies.assets,
    torrent: torrent.service,
  });
  seriesContext = { key, store, service };
  return seriesContext;
}

function scheduleDiscoverySynchronization(context) {
  if (context.synchronizing) {
    context.synchronizationPending = true;
    return;
  }
  context.synchronizing = true;
  setImmediate(() => {
    if (discoveryContext !== context) {
      context.synchronizing = false;
      return;
    }
    try {
      const result = context.index.synchronizeCatalog({
        libraryId: context.libraryId,
        mutation: {
          idempotencyKey: `discovery-sync:${randomUUID()}`,
        },
      });
      if (result.ok && result.value.contentIds.length)
        publishDiscoveryEvent(() => mainWindow, result.value);
    } finally {
      context.synchronizing = false;
      if (context.synchronizationPending) {
        context.synchronizationPending = false;
        scheduleDiscoverySynchronization(context);
      }
    }
  });
}

function synchronizeOpenDiscovery() {
  if (discoveryContext) scheduleDiscoverySynchronization(discoveryContext);
}

function getDiscoveryContext() {
  const configuration = getConfigurationStore().read().configuration;
  const key = [configuration.libraryId, configuration.libraryPath].join("\0");
  if (discoveryContext?.key === key) return discoveryContext;
  closeDiscoveryContext();
  getSeriesContext();
  const databasePath = path.join(app.getPath("userData"), "ushark.db");
  const index = new DiscoveryIndexStore(databasePath);
  const context = {
    key,
    libraryId: configuration.libraryId,
    index,
    watcher: null,
    synchronizing: false,
    synchronizationPending: false,
  };
  discoveryContext = context;
  scheduleDiscoverySynchronization(context);
  context.watcher = new DiscoveryWatcher({
    databasePath,
    index,
    resolveDocument: async (input) => index.watchedDocument(input),
    onStatus: (status) => {
      if (status.invalidation)
        publishDiscoveryEvent(() => mainWindow, status.invalidation);
    },
  });
  context.watcher.start(configuration.libraryId);
  return context;
}

function getPlaybackContext() {
  if (playbackContext) return playbackContext;
  // The playback schema references the catalog and therefore initializes it first.
  getSeriesContext();
  const configuration = getConfigurationStore().read().configuration;
  const userData = app.getPath("userData");
  const databasePath = path.join(userData, "ushark.db");
  const store = new PlaybackStore(databasePath);
  const resolver = new LocalPlaybackSourceResolver(
    databasePath,
    configuration.libraryPath,
  );
  const subtitleStore = new ExternalSubtitleStore(
    path.join(configuration.cachePath, "playback-subtitles"),
  );
  const service = new PlaybackApplicationService({
    store,
    resolver,
    subtitleStore,
    fullscreen: false,
    adapterFactory: () => {
      const adapter = createMpvAdapter();
      if (process.env.USHARK_MPV_TEST_HEADLESS === "1")
        adapter.extraArgs.push("--speed=0.25");
      return adapter;
    },
  });
  const context = { service, unsubscribe: () => {} };
  context.unsubscribe = service.subscribe((event) => {
    publishPlaybackEvent(() => mainWindow, event);
    if (["position", "ended", "stopped"].includes(event.type))
      synchronizeOpenDiscovery();
  });
  playbackContext = context;
  return context;
}

function getStreamContext() {
  if (streamContext) return streamContext;
  const userData = app.getPath("userData");
  const torrent = getTorrentContext();
  const resolver = new TorrentStreamSourceResolver(
    path.join(userData, "ushark.db"),
    torrent.daemon,
  );
  const service = new ProgressiveStreamApplicationService({
    daemon: torrent.daemon,
    sourceResolver: resolver,
    fullscreen: false,
    playerFactory: createMpvAdapter,
  });
  const context = { service, unsubscribe: () => {} };
  context.unsubscribe = service.subscribe((event) =>
    publishStreamEvent(() => mainWindow, event),
  );
  streamContext = context;
  return context;
}

function getSourceSelectionContext() {
  if (sourceSelectionContext) return sourceSelectionContext;
  const userData = app.getPath("userData");
  const torrent = getTorrentContext();
  const databasePath = path.join(userData, "ushark.db");
  const resolver = new TorrentStreamSourceResolver(
    databasePath,
    torrent.daemon,
  );
  const adapter = new TorrentHealthMetricsAdapter({
    daemon: torrent.daemon,
    sourceResolver: resolver,
  });
  const sampler = new ProgressiveHealthSampler(adapter);
  const store = new SourceSelectionStore(databasePath);
  const service = new SourceSelectionApplicationService({ sampler, store });
  const context = { resolver, sampler, store, service, unsubscribe: () => {} };
  context.unsubscribe = service.subscribe((event) =>
    publishSourceSelectionEvent(() => mainWindow, event),
  );
  sourceSelectionContext = context;
  return context;
}

function getDownloadContext() {
  if (downloadContext) return downloadContext;
  const userData = app.getPath("userData");
  const torrent = getTorrentContext();
  const databasePath = path.join(userData, "ushark.db");
  const resolver = new TorrentStreamSourceResolver(
    databasePath,
    torrent.daemon,
  );
  const store = new DownloadStore(databasePath);
  const service = new DownloadApplicationService({
    store,
    daemon: torrent.daemon,
    sourceResolver: resolver,
  });
  const context = { resolver, store, service, unsubscribe: () => {} };
  context.unsubscribe = service.subscribe((event) =>
    publishDownloadEvent(() => mainWindow, event),
  );
  downloadContext = context;
  return context;
}

function getStorageContext() {
  const configuration = getConfigurationStore().read().configuration;
  const key = [configuration.cachePath, configuration.libraryPath].join("\0");
  if (storageContext?.key === key) return storageContext;
  closeStorageContext();
  // Initialize catalog tables used for favorite protection without starting a daemon.
  getMovieContext();
  const service = new StoragePolicyService({
    databasePath: path.join(app.getPath("userData"), "ushark.db"),
    cacheRoot: path.join(configuration.cachePath, "torrent-runtime"),
    libraryRoot: configuration.libraryPath,
    activeSourceIds: () => [
      ...(playbackContext?.service.activeSourceIds?.() ?? []),
      ...(streamContext?.service.activeSourceIds?.() ?? []),
    ],
  });
  storageContext = { key, service };
  return storageContext;
}

function getNextEpisodeContext() {
  if (nextEpisodeContext) return nextEpisodeContext;
  getSeriesContext();
  const selection = getSourceSelectionContext();
  const service = new NextEpisodeApplicationService({
    databasePath: path.join(app.getPath("userData"), "ushark.db"),
    preferences: () => getConfigurationStore().read().configuration.preferences,
    selectionService: selection.service,
  });
  nextEpisodeContext = { service };
  return nextEpisodeContext;
}

function getLibraryDraftContext() {
  if (libraryDraftContext) return libraryDraftContext;
  getSeriesContext();
  const service = new LibraryDraftApplicationService(
    path.join(app.getPath("userData"), "ushark.db"),
  );
  libraryDraftContext = { service };
  return libraryDraftContext;
}

function getLibraryPackageContext() {
  if (libraryPackageContext) return libraryPackageContext;
  const drafts = getLibraryDraftContext();
  const service = new LibraryPackageApplicationService({
    databasePath: path.join(app.getPath("userData"), "ushark.db"),
    exportRoot: path.join(app.getPath("documents"), "Ushark"),
    catalogProvider: () => drafts.service.catalog(),
  });
  libraryPackageContext = { service };
  return libraryPackageContext;
}

function getLibraryTrustContext() {
  if (libraryTrustContext) return libraryTrustContext;
  const packageService = getLibraryPackageContext().service;
  const secretPath = path.join(app.getPath("userData"), "author-key.bin");
  const secretStore = {
    read: () => {
      if (!fs.existsSync(secretPath)) return undefined;
      if (!safeStorage.isEncryptionAvailable())
        throw Object.assign(new Error("secure storage unavailable"), {
          code: "TRUST_STORAGE_UNAVAILABLE",
        });
      return Buffer.from(
        safeStorage.decryptString(fs.readFileSync(secretPath)),
        "base64",
      );
    },
    write: (_name, value) => {
      if (!safeStorage.isEncryptionAvailable())
        throw Object.assign(new Error("secure storage unavailable"), {
          code: "TRUST_STORAGE_UNAVAILABLE",
        });
      fs.writeFileSync(
        secretPath,
        safeStorage.encryptString(Buffer.from(value).toString("base64")),
        { mode: 0o600 },
      );
    },
  };
  const service = new LibraryTrustService({
    databasePath: path.join(app.getPath("userData"), "ushark.db"),
    secretStore,
    packageService,
  });
  packageService.setSignatureVerifier((snapshot) => service.verify(snapshot));
  libraryTrustContext = { service };
  return libraryTrustContext;
}
function getLibraryPublishContext() {
  if (libraryPublishContext) return libraryPublishContext;
  const registry = new HttpRegistryClient({
    endpoint: process.env.USHARK_REGISTRY_URL,
    token: process.env.USHARK_REGISTRY_TOKEN,
  });
  const service = new RegistryPublisherService({
    databasePath: path.join(app.getPath("userData"), "ushark.db"),
    registry,
  });
  libraryPublishContext = { service };
  return libraryPublishContext;
}
function getSubscriptionContext() {
  if (subscriptionContext) return subscriptionContext;
  const registry = new HttpRegistryClient({
    endpoint: process.env.USHARK_REGISTRY_URL,
    token: process.env.USHARK_REGISTRY_TOKEN,
  });
  const trust = getLibraryTrustContext().service;
  const service = new SubscriptionService({
    databasePath: path.join(app.getPath("userData"), "ushark.db"),
    registry,
    verify: (snapshot) => trust.verify(snapshot),
  });
  subscriptionContext = { service };
  return subscriptionContext;
}
function getFallbackContext() {
  if (fallbackContext) return fallbackContext;
  const service = new FallbackService({
    databasePath: path.join(app.getPath("userData"), "ushark.db"),
    sources: (contentId) =>
      getLibraryDraftContext()
        .service.catalog()
        .value?.find((item) => item.id === contentId)?.sources ?? [],
    prepare: async (contentId, candidate) => {
      const selection = getSourceSelectionContext().service;
      const config = getConfigurationStore().read().configuration.preferences;
      const result = await selection.preflight({
        requestId: randomUUID(),
        contentId,
        candidates: [
          {
            sourceId: candidate.id,
            name: candidate.name,
            origin: candidate.origin,
            resolutionHeight: candidate.resolution,
            requiredBitrateBitsPerSecond: 8_000_000,
          },
        ],
        preferences: {
          strategy: config.strategy,
          resolutionLimit: config.resolution,
          autoSelect: config.autoSelect,
          preflight: true,
        },
      });
      if (!result.ok) throw new Error(result.error.message);
    },
  });
  fallbackContext = { service };
  return fallbackContext;
}
function getDiagnosticsContext() {
  if (diagnosticsContext) return diagnosticsContext;
  const service = new DiagnosticsService({
    databasePath: path.join(app.getPath("userData"), "ushark.db"),
    metrics: () => ({
      session:
        playbackContext || streamContext
          ? "Sessão de mídia ativa"
          : "Sem sessão de mídia",
      metrics: [
        {
          label: "Downloads",
          value: downloadContext?.service.list().value?.length ?? 0,
        },
        { label: "Playback", value: playbackContext ? 1 : 0 },
        { label: "Stream", value: streamContext ? 1 : 0 },
        {
          label: "Health histórico",
          value: fallbackContext?.service.history().length ?? 0,
        },
        { label: "Sunshine encode", value: null },
      ],
    }),
    cleaners: { health: () => getFallbackContext().service.clear() },
  });
  diagnosticsContext = { service };
  return diagnosticsContext;
}
async function quiesceForRestore() {
  await closePlaybackContext();
  await closeStreamContext();
  await closeDownloadContext();
  closeDiscoveryContext();
  closeDiagnosticsContext();
  closeFallbackContext();
  closeSubscriptionContext();
  closeLibraryPublishContext();
  closeLibraryTrustContext();
  closeLibraryPackageContext();
  closeLibraryDraftContext();
  closeNextEpisodeContext();
  closeStorageContext();
  closeSourceSelectionContext();
  closeSeriesContext();
  closeMovieContext();
  configurationStore?.close();
  configurationStore = null;
}
function getRecoveryContext() {
  if (recoveryContext) return recoveryContext;
  getConfigurationStore();
  const userData = app.getPath("userData");
  const service = new RecoveryService({
    databasePath: path.join(userData, "ushark.db"),
    backupRoot: path.join(userData, "backups"),
    extraFiles: [
      { name: "author-key.bin", path: path.join(userData, "author-key.bin") },
    ],
    beforeRestore: quiesceForRestore,
    restart: async (name) =>
      `${name} rearmado; o serviço será recriado sob demanda.`,
    shutdown: async () => {
      await closePlaybackContext();
      await closeStreamContext();
      await closeTorrentContext();
    },
  });
  recoveryContext = { service };
  return recoveryContext;
}
function getAppUpdateContext() {
  if (appUpdateContext) return appUpdateContext;
  const service = new AppUpdateService({
    currentVersion: app.getVersion(),
    platform: `${process.platform}-${process.arch}`,
    endpoint: process.env.USHARK_UPDATE_URL,
    publicKey: process.env.USHARK_UPDATE_PUBLIC_KEY,
    stageRoot: path.join(app.getPath("userData"), "updates"),
    backup: () => getRecoveryContext().service.create("Antes da atualização"),
  });
  appUpdateContext = { service };
  return appUpdateContext;
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler(
    (_wc, _permission, callback) => callback(false),
  );
  session.defaultSession.setPermissionCheckHandler(() => false);
  protocol.handle("ushark-asset", (request) => {
    try {
      const asset = getMovieContext().assets.resolveUri(request.url);
      if (!asset) return new globalThis.Response("Not found", { status: 404 });
      return new globalThis.Response(fs.readFileSync(asset.path), {
        status: 200,
        headers: {
          "content-type": asset.mediaType,
          "cache-control": "private, max-age=31536000, immutable",
        },
      });
    } catch {
      return new globalThis.Response("Not found", { status: 404 });
    }
  });
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 900,
    minHeight: 650,
    backgroundColor: "#00000000",
    transparent: true,
    fullscreen: tv && process.platform !== "darwin",
    fullscreenable: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      devTools: dev,
    },
  });
  // Keep TV mode on the current macOS desktop instead of creating a Space.
  if (tv && process.platform === "darwin") {
    mainWindow.once("ready-to-show", () =>
      mainWindow.setSimpleFullScreen(true),
    );
  }
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.webContents.on("will-navigate", (event) => event.preventDefault());
  mainWindow.webContents.on("will-attach-webview", (event) =>
    event.preventDefault(),
  );
  registerConfigurationIpc({
    ipcMain,
    dialog,
    getStore: getConfigurationStore,
    getWindow: () => mainWindow,
  });
  registerMovieCatalogIpc({
    ipcMain,
    getService: () => getMovieContext().service,
    getWindow: () => mainWindow,
    onMutation: synchronizeOpenDiscovery,
  });
  registerTorrentInspectionIpc({
    ipcMain,
    dialog,
    getService: () => getTorrentContext().service,
    getWindow: () => mainWindow,
  });
  registerSeriesCatalogIpc({
    ipcMain,
    getService: () => getSeriesContext().service,
    getWindow: () => mainWindow,
    onMutation: synchronizeOpenDiscovery,
  });
  registerDiscoveryIpc({
    ipcMain,
    getService: () => getDiscoveryContext().index,
    getWindow: () => mainWindow,
  });
  registerPlaybackIpc({
    ipcMain,
    dialog,
    getService: () => getPlaybackContext().service,
    getWindow: () => mainWindow,
  });
  registerStreamIpc({
    ipcMain,
    getService: () => getStreamContext().service,
    getWindow: () => mainWindow,
  });
  registerSourceSelectionIpc({
    ipcMain,
    getService: () => getSourceSelectionContext().service,
    getWindow: () => mainWindow,
  });
  registerDownloadIpc({
    ipcMain,
    getService: () => getDownloadContext().service,
    getWindow: () => mainWindow,
  });
  registerStorageIpc({
    ipcMain,
    getService: () => getStorageContext().service,
    getWindow: () => mainWindow,
  });
  registerNextEpisodeIpc({
    ipcMain,
    getService: () => getNextEpisodeContext().service,
    getWindow: () => mainWindow,
  });
  registerLibraryDraftIpc({
    ipcMain,
    getService: () => getLibraryDraftContext().service,
    getWindow: () => mainWindow,
  });
  registerLibraryPackageIpc({
    ipcMain,
    dialog,
    getService: () => {
      getLibraryTrustContext();
      return getLibraryPackageContext().service;
    },
    getWindow: () => mainWindow,
  });
  registerLibraryTrustIpc({
    ipcMain,
    getService: () => getLibraryTrustContext().service,
    getWindow: () => mainWindow,
  });
  registerLibraryPublishIpc({
    ipcMain,
    getService: () => getLibraryPublishContext().service,
    getWindow: () => mainWindow,
  });
  registerSubscriptionIpc({
    ipcMain,
    getService: () => getSubscriptionContext().service,
    getWindow: () => mainWindow,
  });
  registerLibraryForkIpc({
    ipcMain,
    getService: () => getLibraryDraftContext().service,
    getWindow: () => mainWindow,
  });
  registerTvSessionIpc({
    ipcMain,
    isTv: tv,
    getWindow: () => mainWindow,
    stopMedia: async () => {
      await closePlaybackContext();
      await closeStreamContext();
    },
  });
  registerFallbackIpc({
    ipcMain,
    getService: () => getFallbackContext().service,
    getWindow: () => mainWindow,
  });
  registerDiagnosticsIpc({
    ipcMain,
    getService: () => getDiagnosticsContext().service,
    getWindow: () => mainWindow,
  });
  registerRecoveryIpc({
    ipcMain,
    getService: () => getRecoveryContext().service,
    getWindow: () => mainWindow,
  });
  registerAppUpdateIpc({
    ipcMain,
    getService: () => getAppUpdateContext().service,
    getWindow: () => mainWindow,
  });
  if (dev)
    mainWindow.loadURL(`http://127.0.0.1:${devPort}${tv ? "?mode=tv" : ""}`);
  else
    mainWindow.loadFile(
      path.join(desktopRoot, "dist/index.html"),
      tv ? { query: { mode: "tv" } } : undefined,
    );
});
app.on("before-quit", (event) => {
  if (
    (playbackContext ||
      streamContext ||
      sourceSelectionContext ||
      downloadContext ||
      storageContext ||
      nextEpisodeContext ||
      libraryDraftContext ||
      libraryPackageContext ||
      torrentContext) &&
    !torrentClosing
  ) {
    event.preventDefault();
    torrentClosing = true;
    void closePlaybackContext()
      .then(() => closeStreamContext())
      .then(() => closeSourceSelectionContext())
      .then(() => closeDownloadContext())
      .then(() => closeStorageContext())
      .then(() => closeNextEpisodeContext())
      .then(() => closeLibraryTrustContext())
      .then(() => closeLibraryPublishContext())
      .then(() => closeSubscriptionContext())
      .then(() => closeFallbackContext())
      .then(() => closeDiagnosticsContext())
      .then(() => closeLibraryPackageContext())
      .then(() => closeLibraryDraftContext())
      .then(() => closeTorrentContext())
      .finally(() => app.quit());
    return;
  }
  closeDiscoveryContext();
  closeStorageContext();
  closeNextEpisodeContext();
  closeLibraryTrustContext();
  closeLibraryPublishContext();
  closeSubscriptionContext();
  closeFallbackContext();
  closeDiagnosticsContext();
  closeLibraryPackageContext();
  closeLibraryDraftContext();
  closeSourceSelectionContext();
  closeSeriesContext();
  closeMovieContext();
  configurationStore?.close();
  configurationStore = null;
});
app.on("window-all-closed", () => app.quit());
