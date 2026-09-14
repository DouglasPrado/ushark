"use strict";

const PROTOCOL_VERSION = 1;
const CHANNELS = Object.freeze({
  read: "ushark:movies:read",
  searchMetadata: "ushark:movies:search-metadata",
  cancelMetadataRequest: "ushark:movies:cancel-metadata-request",
  save: "ushark:movies:save",
  toggleFavorite: "ushark:movies:toggle-favorite",
  refreshMetadata: "ushark:movies:refresh-metadata",
  addSource: "ushark:movies:add-source",
  removeSource: "ushark:movies:remove-source",
  removeMembership: "ushark:movies:remove-membership",
  deleteManagedFile: "ushark:movies:delete-managed-file",
});

function failure(code, message, retryable = false) {
  return { ok: false, error: { code, message, retryable } };
}

function publicFailure(error) {
  if (
    error &&
    typeof error.code === "string" &&
    typeof error.publicMessage === "string"
  )
    return failure(error.code, error.publicMessage, error.retryable === true);
  return failure(
    "CATALOG_STORAGE_FAILED",
    "Não foi possível acessar o catálogo local.",
    true,
  );
}

function validateEnvelope(payload, allowedKeys) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    throw Object.assign(new Error("invalid payload"), {
      code: "CATALOG_INVALID",
      publicMessage: "A solicitação do catálogo não é válida.",
    });
  if (payload.protocolVersion !== PROTOCOL_VERSION)
    throw Object.assign(new Error("unsupported protocol"), {
      code: "CATALOG_PROTOCOL_UNSUPPORTED",
      publicMessage:
        "Esta versão do aplicativo não reconhece o protocolo do catálogo.",
    });
  const accepted = new Set(["protocolVersion", ...allowedKeys]);
  if (Object.keys(payload).some((key) => !accepted.has(key)))
    throw Object.assign(new Error("unknown field"), {
      code: "CATALOG_INVALID",
      publicMessage: "A solicitação do catálogo contém campos desconhecidos.",
    });
}

function registerMovieCatalogIpc({
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
      event.sender.id !== owner.webContents.id
    )
      throw Object.assign(new Error("unauthorized sender"), {
        code: "CATALOG_UNAUTHORIZED",
        publicMessage: "A solicitação local não foi autorizada.",
      });
    if (event.senderFrame && event.senderFrame !== event.sender.mainFrame)
      throw Object.assign(new Error("unauthorized frame"), {
        code: "CATALOG_UNAUTHORIZED",
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

  handle(CHANNELS.read, ["libraryId"], (service, payload) =>
    service.read({ libraryId: payload.libraryId }),
  );
  handle(
    CHANNELS.searchMetadata,
    ["libraryId", "query", "year", "requestId"],
    (service, payload) =>
      service.searchMetadata({
        libraryId: payload.libraryId,
        query: payload.query,
        year: payload.year,
        requestId: payload.requestId,
      }),
  );
  handle(CHANNELS.cancelMetadataRequest, ["requestId"], (service, payload) =>
    service.cancelMetadataRequest({ requestId: payload.requestId }),
  );
  handle(
    CHANNELS.save,
    ["libraryId", "draft", "mutation"],
    (service, payload) =>
      service.save({
        libraryId: payload.libraryId,
        draft: payload.draft,
        mutation: payload.mutation,
      }),
    true,
  );
  handle(
    CHANNELS.toggleFavorite,
    ["libraryId", "contentId", "mutation"],
    (service, payload) =>
      service.toggleFavorite({
        libraryId: payload.libraryId,
        contentId: payload.contentId,
        mutation: payload.mutation,
      }),
    true,
  );
  handle(
    CHANNELS.refreshMetadata,
    ["libraryId", "contentId", "mutation"],
    (service, payload) =>
      service.refreshMetadata({
        libraryId: payload.libraryId,
        contentId: payload.contentId,
        mutation: payload.mutation,
      }),
    true,
  );
  handle(
    CHANNELS.addSource,
    ["libraryId", "contentId", "source", "mutation"],
    (service, payload) =>
      service.addSource({
        libraryId: payload.libraryId,
        contentId: payload.contentId,
        source: payload.source,
        mutation: payload.mutation,
      }),
    true,
  );
  handle(
    CHANNELS.removeSource,
    ["libraryId", "contentId", "sourceId", "mutation"],
    (service, payload) =>
      service.removeSource({
        libraryId: payload.libraryId,
        contentId: payload.contentId,
        sourceId: payload.sourceId,
        mutation: payload.mutation,
      }),
    true,
  );
  handle(
    CHANNELS.removeMembership,
    ["libraryId", "contentId", "membershipLibraryId", "mutation"],
    (service, payload) =>
      service.removeMembership({
        libraryId: payload.libraryId,
        contentId: payload.contentId,
        membershipLibraryId: payload.membershipLibraryId,
        mutation: payload.mutation,
      }),
    true,
  );
  handle(
    CHANNELS.deleteManagedFile,
    ["libraryId", "contentId", "sourceId", "confirm", "mutation"],
    (service, payload) =>
      service.deleteManagedFile({
        libraryId: payload.libraryId,
        contentId: payload.contentId,
        sourceId: payload.sourceId,
        confirm: payload.confirm,
        mutation: payload.mutation,
      }),
    true,
  );

  return () => {
    for (const channel of Object.values(CHANNELS))
      ipcMain.removeHandler(channel);
  };
}

module.exports = { CHANNELS, PROTOCOL_VERSION, registerMovieCatalogIpc };
