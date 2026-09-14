"use strict";

const PROTOCOL_VERSION = 1;
const CHANNELS = Object.freeze({
  readCatalog: "ushark:series:read-catalog",
  readSeries: "ushark:series:read-series",
  readEpisodes: "ushark:series:read-episodes",
  beginReview: "ushark:series:begin-review",
  readReview: "ushark:series:read-review",
  readSourceReview: "ushark:series:read-source-review",
  correctMapping: "ushark:series:correct-mapping",
  confirmImport: "ushark:series:confirm-import",
  setEpisodeArtwork: "ushark:series:set-episode-artwork",
  searchMetadata: "ushark:series:search-metadata",
  cancelMetadataRequest: "ushark:series:cancel-metadata-request",
  refreshMetadata: "ushark:series:refresh-metadata",
});

function failure(code, message, retryable = false) {
  return {
    ok: false,
    error: { code, message, recoverable: retryable, retryable },
  };
}

function publicFailure(error) {
  if (
    error &&
    typeof error.code === "string" &&
    (typeof error.publicMessage === "string" ||
      typeof error.message === "string")
  )
    return failure(
      error.code,
      error.publicMessage ?? error.message,
      error.retryable === true,
    );
  return failure(
    "SERIES_STORAGE_FAILED",
    "Não foi possível acessar as séries locais.",
    true,
  );
}

function validateEnvelope(payload, allowedKeys) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    throw Object.assign(new Error("invalid payload"), {
      code: "SERIES_INVALID",
      publicMessage: "A solicitação de séries não é válida.",
    });
  if (payload.protocolVersion !== PROTOCOL_VERSION)
    throw Object.assign(new Error("unsupported protocol"), {
      code: "SERIES_PROTOCOL_UNSUPPORTED",
      publicMessage:
        "Esta versão do aplicativo não reconhece o protocolo de séries.",
    });
  const accepted = new Set(["protocolVersion", ...allowedKeys]);
  if (Object.keys(payload).some((key) => !accepted.has(key)))
    throw Object.assign(new Error("unknown field"), {
      code: "SERIES_INVALID",
      publicMessage: "A solicitação de séries contém campos desconhecidos.",
    });
}

function registerSeriesCatalogIpc({
  ipcMain,
  getService,
  getWindow,
  onMutation = () => {},
}) {
  const authorize = (event) => {
    const owner = getWindow();
    if (
      !owner ||
      owner.isDestroyed() ||
      event.sender.id !== owner.webContents.id ||
      (event.senderFrame && event.senderFrame !== event.sender.mainFrame)
    )
      throw Object.assign(new Error("unauthorized sender"), {
        code: "SERIES_UNAUTHORIZED",
        publicMessage: "A solicitação local não foi autorizada.",
      });
  };

  const handle = (channel, allowedKeys, operation, mutates = false) => {
    ipcMain.handle(channel, async (event, payload) => {
      try {
        authorize(event);
        validateEnvelope(payload, allowedKeys);
        const result = await operation(getService(), payload);
        if (mutates && result?.ok === true) onMutation();
        return result;
      } catch (error) {
        return publicFailure(error);
      }
    });
  };

  handle(CHANNELS.readCatalog, ["libraryId", "cursor", "limit"], (service, p) =>
    service.readCatalog({
      libraryId: p.libraryId,
      cursor: p.cursor,
      limit: p.limit,
    }),
  );
  handle(CHANNELS.readSeries, ["libraryId", "seriesId"], (service, p) =>
    service.readSeries({ libraryId: p.libraryId, seriesId: p.seriesId }),
  );
  handle(
    CHANNELS.readEpisodes,
    ["libraryId", "seriesId", "seasonNumber", "cursor", "limit"],
    (service, p) =>
      service.readEpisodes({
        libraryId: p.libraryId,
        seriesId: p.seriesId,
        seasonNumber: p.seasonNumber,
        cursor: p.cursor,
        limit: p.limit,
      }),
  );
  handle(
    CHANNELS.beginReview,
    ["libraryId", "operationId", "title", "seriesId", "fileIds", "mutation"],
    (service, p) =>
      service.beginReview({
        libraryId: p.libraryId,
        operationId: p.operationId,
        title: p.title,
        seriesId: p.seriesId,
        fileIds: p.fileIds,
        mutation: p.mutation,
      }),
  );
  handle(CHANNELS.readReview, ["reviewId", "cursor", "limit"], (service, p) =>
    service.readReview({
      reviewId: p.reviewId,
      cursor: p.cursor,
      limit: p.limit,
    }),
  );
  handle(
    CHANNELS.readSourceReview,
    ["sourceId", "cursor", "limit"],
    (service, p) =>
      service.readSourceReview({
        sourceId: p.sourceId,
        cursor: p.cursor,
        limit: p.limit,
      }),
  );
  handle(
    CHANNELS.correctMapping,
    ["reviewId", "fileId", "action", "selectedSubtitleFileId", "mutation"],
    (service, p) =>
      service.correctMapping({
        reviewId: p.reviewId,
        fileId: p.fileId,
        action: p.action,
        selectedSubtitleFileId: p.selectedSubtitleFileId,
        mutation: p.mutation,
      }),
  );
  handle(
    CHANNELS.confirmImport,
    ["reviewId", "title", "mutation"],
    (service, p) =>
      service.confirmImport({
        reviewId: p.reviewId,
        title: p.title,
        mutation: p.mutation,
      }),
    true,
  );
  handle(
    CHANNELS.setEpisodeArtwork,
    ["libraryId", "episodeId", "artwork", "mutation"],
    (service, p) =>
      service.setEpisodeArtwork({
        libraryId: p.libraryId,
        episodeId: p.episodeId,
        artwork: p.artwork,
        mutation: p.mutation,
      }),
    true,
  );
  handle(
    CHANNELS.searchMetadata,
    ["query", "startYear", "requestId"],
    (service, p) =>
      service.searchMetadata({
        query: p.query,
        startYear: p.startYear,
        requestId: p.requestId,
      }),
  );
  handle(CHANNELS.cancelMetadataRequest, ["requestId"], (service, p) =>
    service.cancelMetadataRequest({ requestId: p.requestId }),
  );
  handle(
    CHANNELS.refreshMetadata,
    ["libraryId", "seriesId", "requestId", "mutation"],
    (service, p) =>
      service.refreshMetadata({
        libraryId: p.libraryId,
        seriesId: p.seriesId,
        requestId: p.requestId,
        mutation: p.mutation,
      }),
    true,
  );

  return () => {
    for (const channel of Object.values(CHANNELS))
      ipcMain.removeHandler(channel);
  };
}

module.exports = { CHANNELS, PROTOCOL_VERSION, registerSeriesCatalogIpc };
