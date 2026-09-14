"use strict";

const { contextBridge, ipcRenderer } = require("electron");

const protocolVersion = 1;
const invoke = (channel, payload = {}) =>
  ipcRenderer.invoke(channel, { protocolVersion, ...payload });

contextBridge.exposeInMainWorld(
  "ushark",
  Object.freeze({
    configuration: Object.freeze({
      protocolVersion,
      read: () => invoke("ushark:configuration:read"),
      save: (value, options) =>
        invoke("ushark:configuration:save", { value, options }),
      resetPlayback: () => invoke("ushark:configuration:reset-playback"),
      chooseDirectory: (kind) =>
        invoke("ushark:configuration:choose-directory", { kind }),
    }),
    movieCatalog: Object.freeze({
      protocolVersion,
      read: (input) => invoke("ushark:movies:read", input),
      searchMetadata: (input) => invoke("ushark:movies:search-metadata", input),
      cancelMetadataRequest: (input) =>
        invoke("ushark:movies:cancel-metadata-request", input),
      save: (input) => invoke("ushark:movies:save", input),
      toggleFavorite: (input) => invoke("ushark:movies:toggle-favorite", input),
      refreshMetadata: (input) =>
        invoke("ushark:movies:refresh-metadata", input),
      addSource: (input) => invoke("ushark:movies:add-source", input),
      removeSource: (input) => invoke("ushark:movies:remove-source", input),
      removeMembership: (input) =>
        invoke("ushark:movies:remove-membership", input),
      deleteManagedFile: (input) =>
        invoke("ushark:movies:delete-managed-file", input),
    }),
    seriesCatalog: Object.freeze({
      protocolVersion,
      readCatalog: (input) => invoke("ushark:series:read-catalog", input),
      readSeries: (input) => invoke("ushark:series:read-series", input),
      readEpisodes: (input) => invoke("ushark:series:read-episodes", input),
      beginReview: (input) => invoke("ushark:series:begin-review", input),
      readReview: (input) => invoke("ushark:series:read-review", input),
      readSourceReview: (input) =>
        invoke("ushark:series:read-source-review", input),
      correctMapping: (input) => invoke("ushark:series:correct-mapping", input),
      confirmImport: (input) => invoke("ushark:series:confirm-import", input),
      setEpisodeArtwork: (input) =>
        invoke("ushark:series:set-episode-artwork", input),
      searchMetadata: (input) => invoke("ushark:series:search-metadata", input),
      cancelMetadataRequest: (input) =>
        invoke("ushark:series:cancel-metadata-request", input),
      refreshMetadata: (input) =>
        invoke("ushark:series:refresh-metadata", input),
    }),
    discovery: Object.freeze({
      protocolVersion,
      readHome: (input) => invoke("ushark:discovery:read-home", input),
      search: (input) => invoke("ushark:discovery:search", input),
      readScope: (input) => invoke("ushark:discovery:read-scope", input),
      cancelRequest: (input) =>
        invoke("ushark:discovery:cancel-request", input),
      rebuildSearchIndex: (input) =>
        invoke("ushark:discovery:rebuild-search-index", input),
      subscribe: (listener) => {
        const handler = (_event, value) => listener(value);
        ipcRenderer.on("ushark:discovery:event", handler);
        return () =>
          ipcRenderer.removeListener("ushark:discovery:event", handler);
      },
    }),
    playback: Object.freeze({
      protocolVersion,
      prepare: (input) => invoke("ushark:playback:prepare", input),
      start: (input) => invoke("ushark:playback:start", input),
      readSession: (input) => invoke("ushark:playback:read-session", input),
      readProgress: (input) => invoke("ushark:playback:read-progress", input),
      setPaused: (input) => invoke("ushark:playback:set-paused", input),
      seek: (input) => invoke("ushark:playback:seek", input),
      setVolume: (input) => invoke("ushark:playback:set-volume", input),
      setMuted: (input) => invoke("ushark:playback:set-muted", input),
      selectAudio: (input) => invoke("ushark:playback:select-audio", input),
      selectSubtitle: (input) =>
        invoke("ushark:playback:select-subtitle", input),
      stop: (input) => invoke("ushark:playback:stop", input),
      cancelPreparation: (input) =>
        invoke("ushark:playback:cancel-preparation", input),
      chooseExternalSubtitle: (input) =>
        invoke("ushark:playback:choose-external-subtitle", input),
      subscribe: (listener) => {
        const handler = (_event, value) => listener(value);
        ipcRenderer.on("ushark:playback:event", handler);
        return () =>
          ipcRenderer.removeListener("ushark:playback:event", handler);
      },
    }),
    stream: Object.freeze({
      protocolVersion,
      prepare: (input) => invoke("ushark:stream:prepare", input),
      setPosition: (input) => invoke("ushark:stream:set-position", input),
      seek: (input) => invoke("ushark:stream:seek", input),
      setPaused: (input) => invoke("ushark:stream:set-paused", input),
      setVolume: (input) => invoke("ushark:stream:set-volume", input),
      setMuted: (input) => invoke("ushark:stream:set-muted", input),
      selectAudio: (input) => invoke("ushark:stream:select-audio", input),
      selectSubtitle: (input) => invoke("ushark:stream:select-subtitle", input),
      stop: (input) => invoke("ushark:stream:stop", input),
      cancel: (input) => invoke("ushark:stream:cancel", input),
      subscribe: (listener) => {
        const handler = (_event, value) => listener(value);
        ipcRenderer.on("ushark:stream:event", handler);
        return () => ipcRenderer.removeListener("ushark:stream:event", handler);
      },
    }),
    sourceSelection: Object.freeze({
      protocolVersion,
      preflight: (input) => invoke("ushark:selection:preflight", input),
      cancel: (input) => invoke("ushark:selection:cancel", input),
      setOverride: (input) => invoke("ushark:selection:set-override", input),
      readOverride: (input) => invoke("ushark:selection:read-override", input),
      subscribe: (listener) => {
        const handler = (_event, value) => listener(value);
        ipcRenderer.on("ushark:selection:event", handler);
        return () =>
          ipcRenderer.removeListener("ushark:selection:event", handler);
      },
    }),
    downloads: Object.freeze({
      protocolVersion,
      list: () => invoke("ushark:downloads:list"),
      enqueue: (input) => invoke("ushark:downloads:enqueue", input),
      command: (input) => invoke("ushark:downloads:command", input),
      removeData: (input) => invoke("ushark:downloads:remove-data", input),
      setPriority: (input) => invoke("ushark:downloads:set-priority", input),
      setLimits: (input) => invoke("ushark:downloads:set-limits", input),
      tick: (input) => invoke("ushark:downloads:tick", input),
      subscribe: (listener) => {
        const handler = (_event, value) => listener(value);
        ipcRenderer.on("ushark:downloads:event", handler);
        return () =>
          ipcRenderer.removeListener("ushark:downloads:event", handler);
      },
    }),
    storage: Object.freeze({
      protocolVersion,
      read: () => invoke("ushark:storage:read"),
      clean: (input) => invoke("ushark:storage:clean", input),
      retain: (input) => invoke("ushark:storage:retain", input),
      repair: (input) => invoke("ushark:storage:repair", input),
      applyPolicy: (input) => invoke("ushark:storage:apply-policy", input),
    }),
    nextEpisode: Object.freeze({
      protocolVersion,
      resolve: (input) => invoke("ushark:next-episode:resolve", input),
      prepare: (input) => invoke("ushark:next-episode:prepare", input),
      cancel: (input) => invoke("ushark:next-episode:cancel", input),
      claimStart: (input) => invoke("ushark:next-episode:claim-start", input),
    }),
    libraryDrafts: Object.freeze({
      protocolVersion,
      list: () => invoke("ushark:library-drafts:list"),
      catalog: () => invoke("ushark:library-drafts:catalog"),
      save: (input) => invoke("ushark:library-drafts:save", input),
    }),
    libraryPackage: Object.freeze({
      protocolVersion,
      list: () => invoke("ushark:library-package:list"),
      export: (input) => invoke("ushark:library-package:export", input),
      choose: () => invoke("ushark:library-package:choose"),
      stage: (input) => invoke("ushark:library-package:stage", input),
      commit: (input) => invoke("ushark:library-package:commit", input),
    }),
    libraryTrust: Object.freeze({
      protocolVersion,
      verify: (input) => invoke("ushark:library-trust:verify", input),
      accept: (input) => invoke("ushark:library-trust:accept", input),
      sign: (input) => invoke("ushark:library-trust:sign", input),
    }),
    libraryPublish: Object.freeze({
      protocolVersion,
      list: () => invoke("ushark:publish:list"),
      prepare: (input) => invoke("ushark:publish:prepare", input),
      publish: (input) => invoke("ushark:publish:commit", input),
      withdraw: (input) => invoke("ushark:publish:withdraw", input),
    }),
    subscriptions: Object.freeze({
      protocolVersion,
      call: (input) => invoke("ushark:subscriptions:call", input),
    }),
    libraryFork: Object.freeze({
      protocolVersion,
      copy: (input) => invoke("ushark:library-fork:copy", input),
    }),
    tvSession: Object.freeze({
      protocolVersion,
      read: () => invoke("ushark:tv:read"),
      connect: () => invoke("ushark:tv:connect"),
      stop: () => invoke("ushark:tv:stop"),
    }),
    fallback: Object.freeze({
      protocolVersion,
      call: (input) => invoke("ushark:fallback:call", input),
    }),
    diagnostics: Object.freeze({
      protocolVersion,
      call: (input) => invoke("ushark:diagnostics:call", input),
    }),
    recovery: Object.freeze({
      protocolVersion,
      call: (input) => invoke("ushark:recovery:call", input),
    }),
    appUpdate: Object.freeze({
      protocolVersion,
      state: () => invoke("ushark:update:state"),
      check: (input) => invoke("ushark:update:check", input),
      apply: (input) => invoke("ushark:update:apply", input),
      uninstall: () => invoke("ushark:update:uninstall"),
    }),
    torrentInspection: Object.freeze({
      protocolVersion,
      capabilities: () => invoke("ushark:torrent:capabilities"),
      chooseTorrentFile: () => invoke("ushark:torrent:choose-file"),
      start: (input) => invoke("ushark:torrent:start", input),
      cancel: (input) => invoke("ushark:torrent:cancel", input),
      get: (input) => invoke("ushark:torrent:get", input),
      getFiles: (input) => invoke("ushark:torrent:get-files", input),
      listPending: () => invoke("ushark:torrent:list-pending"),
      savePending: (input) => invoke("ushark:torrent:save-pending", input),
      retry: (input) => invoke("ushark:torrent:retry", input),
      removePending: (input) => invoke("ushark:torrent:remove-pending", input),
      confirm: (input) => invoke("ushark:torrent:confirm", input),
      subscribe: (listener) => {
        const handler = (_event, value) => listener(value);
        ipcRenderer.on("ushark:torrent:event", handler);
        return () =>
          ipcRenderer.removeListener("ushark:torrent:event", handler);
      },
    }),
  }),
);
