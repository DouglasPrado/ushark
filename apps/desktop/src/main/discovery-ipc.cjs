"use strict";

const PROTOCOL_VERSION = 1;
const CHANNELS = Object.freeze({
  readHome: "ushark:discovery:read-home",
  search: "ushark:discovery:search",
  readScope: "ushark:discovery:read-scope",
  cancelRequest: "ushark:discovery:cancel-request",
  rebuildSearchIndex: "ushark:discovery:rebuild-search-index",
  event: "ushark:discovery:event",
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
    "DISCOVERY_STORAGE_FAILED",
    "Não foi possível acessar a descoberta local.",
    true,
  );
}

function validateEnvelope(payload, allowedKeys) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    throw Object.assign(new Error("invalid payload"), {
      code: "DISCOVERY_INVALID",
      publicMessage: "A solicitação de descoberta não é válida.",
    });
  if (payload.protocolVersion !== PROTOCOL_VERSION)
    throw Object.assign(new Error("unsupported protocol"), {
      code: "DISCOVERY_PROTOCOL_UNSUPPORTED",
      publicMessage:
        "Esta versão do aplicativo não reconhece o protocolo de descoberta.",
    });
  const accepted = new Set(["protocolVersion", ...allowedKeys]);
  if (Object.keys(payload).some((key) => !accepted.has(key)))
    throw Object.assign(new Error("unknown field"), {
      code: "DISCOVERY_INVALID",
      publicMessage: "A solicitação de descoberta contém campos desconhecidos.",
    });
}

function registerDiscoveryIpc({ ipcMain, getService, getWindow }) {
  const authorize = (event) => {
    const owner = getWindow();
    if (
      !owner ||
      owner.isDestroyed() ||
      event.sender.id !== owner.webContents.id ||
      (event.senderFrame && event.senderFrame !== event.sender.mainFrame)
    )
      throw Object.assign(new Error("unauthorized sender"), {
        code: "DISCOVERY_UNAUTHORIZED",
        publicMessage: "A solicitação local não foi autorizada.",
      });
  };

  const handle = (channel, allowedKeys, operation) => {
    ipcMain.handle(channel, async (event, payload) => {
      try {
        authorize(event);
        validateEnvelope(payload, allowedKeys);
        return await operation(getService(), payload);
      } catch (error) {
        return publicFailure(error);
      }
    });
  };

  handle(CHANNELS.readHome, ["libraryId", "sectionLimit"], (service, value) =>
    service.readHome({
      libraryId: value.libraryId,
      sectionLimit: value.sectionLimit,
    }),
  );
  handle(
    CHANNELS.search,
    [
      "libraryId",
      "query",
      "type",
      "favorite",
      "recent",
      "continuing",
      "genre",
      "collectionId",
      "scopeId",
      "cursor",
      "limit",
      "requestId",
    ],
    (service, value) =>
      service.search({
        libraryId: value.libraryId,
        query: value.query,
        type: value.type,
        favorite: value.favorite,
        recent: value.recent,
        continuing: value.continuing,
        genre: value.genre,
        collectionId: value.collectionId,
        scopeId: value.scopeId,
        cursor: value.cursor,
        limit: value.limit,
        requestId: value.requestId,
      }),
  );
  handle(
    CHANNELS.readScope,
    ["libraryId", "scopeId", "cursor", "limit"],
    (service, value) =>
      service.readScope({
        libraryId: value.libraryId,
        scopeId: value.scopeId,
        cursor: value.cursor,
        limit: value.limit,
      }),
  );
  handle(CHANNELS.cancelRequest, ["requestId"], (service, value) =>
    service.cancelRequest({ requestId: value.requestId }),
  );
  handle(
    CHANNELS.rebuildSearchIndex,
    ["libraryId", "mutation"],
    (service, value) =>
      service.rebuildSearchIndex({
        libraryId: value.libraryId,
        mutation: value.mutation,
      }),
  );

  return () => {
    for (const channel of Object.values(CHANNELS))
      if (channel !== CHANNELS.event) ipcMain.removeHandler(channel);
  };
}

function publishDiscoveryEvent(getWindow, value) {
  const owner = getWindow();
  if (!owner || owner.isDestroyed() || owner.webContents.isDestroyed()) return;
  owner.webContents.send(CHANNELS.event, value);
}

module.exports = {
  CHANNELS,
  PROTOCOL_VERSION,
  publishDiscoveryEvent,
  registerDiscoveryIpc,
};
