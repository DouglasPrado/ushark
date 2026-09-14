"use strict";

const PROTOCOL_VERSION = 1;
const EVENT_CHANNEL = "ushark:torrent:event";
const CHANNELS = Object.freeze({
  capabilities: "ushark:torrent:capabilities",
  chooseTorrentFile: "ushark:torrent:choose-file",
  start: "ushark:torrent:start",
  cancel: "ushark:torrent:cancel",
  get: "ushark:torrent:get",
  getFiles: "ushark:torrent:get-files",
  listPending: "ushark:torrent:list-pending",
  savePending: "ushark:torrent:save-pending",
  retry: "ushark:torrent:retry",
  removePending: "ushark:torrent:remove-pending",
  confirm: "ushark:torrent:confirm",
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
    typeof error.publicMessage === "string"
  )
    return failure(error.code, error.publicMessage, error.retryable === true);
  return failure(
    "TORRENT_DAEMON_UNAVAILABLE",
    "Não foi possível acessar o runtime de torrent.",
    true,
  );
}

function validateEnvelope(payload, allowedKeys) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    throw Object.assign(new Error("invalid payload"), {
      code: "TORRENT_INPUT_INVALID",
      publicMessage: "A solicitação torrent não é válida.",
    });
  if (payload.protocolVersion !== PROTOCOL_VERSION)
    throw Object.assign(new Error("unsupported protocol"), {
      code: "TORRENT_PROTOCOL_UNSUPPORTED",
      publicMessage:
        "Esta versão do aplicativo não reconhece o protocolo torrent.",
    });
  const accepted = new Set(["protocolVersion", ...allowedKeys]);
  if (Object.keys(payload).some((key) => !accepted.has(key)))
    throw Object.assign(new Error("unknown field"), {
      code: "TORRENT_INPUT_INVALID",
      publicMessage: "A solicitação torrent contém campos desconhecidos.",
    });
}

function registerTorrentInspectionIpc({
  ipcMain,
  dialog,
  getService,
  getWindow,
}) {
  const observed = new Set();
  const authorize = (event) => {
    const owner = getWindow();
    if (
      !owner ||
      owner.isDestroyed() ||
      event.sender.id !== owner.webContents.id ||
      (event.senderFrame && event.senderFrame !== event.sender.mainFrame)
    )
      throw Object.assign(new Error("unauthorized sender"), {
        code: "TORRENT_UNAUTHORIZED",
        publicMessage: "A solicitação torrent local não foi autorizada.",
      });
  };
  const observe = (service) => {
    if (observed.has(service)) return service;
    const listener = (event) => {
      const owner = getWindow();
      if (!owner || owner.isDestroyed()) return;
      owner.webContents.send(EVENT_CHANNEL, event);
    };
    service.on("event", listener);
    observed.add(service);
    service.__usharkTorrentEventListener = listener;
    return service;
  };
  const handle = (channel, allowedKeys, operation) => {
    ipcMain.handle(channel, async (event, payload) => {
      try {
        authorize(event);
        validateEnvelope(payload, allowedKeys);
        return await operation(observe(getService()), payload, event);
      } catch (error) {
        return publicFailure(error);
      }
    });
  };

  handle(CHANNELS.capabilities, [], (service) => service.capabilities());
  handle(CHANNELS.chooseTorrentFile, [], async (service) => {
    const owner = getWindow();
    const selected = await dialog.showOpenDialog(owner, {
      title: "Selecionar arquivo torrent",
      properties: ["openFile"],
      filters: [{ name: "Torrent", extensions: ["torrent"] }],
    });
    if (selected.canceled || selected.filePaths.length !== 1)
      return { ok: true, value: null };
    return service.chooseTorrentFile(selected.filePaths[0]);
  });
  handle(
    CHANNELS.start,
    ["input", "correlationId", "mutation"],
    (service, payload) =>
      service.start({
        input: payload.input,
        correlationId: payload.correlationId,
        mutation: payload.mutation,
      }),
  );
  for (const [name, method] of [
    ["cancel", "cancel"],
    ["get", "get"],
  ])
    handle(CHANNELS[name], ["operationId"], (service, payload) =>
      service[method]({ operationId: payload.operationId }),
    );
  handle(
    CHANNELS.getFiles,
    ["operationId", "cursor", "limit"],
    (service, payload) =>
      service.getFiles({
        operationId: payload.operationId,
        cursor: payload.cursor,
        limit: payload.limit,
      }),
  );
  handle(CHANNELS.listPending, [], (service) => service.listPending());
  handle(
    CHANNELS.savePending,
    ["operationId", "mutation"],
    (service, payload) =>
      service.savePending({
        operationId: payload.operationId,
        mutation: payload.mutation,
      }),
  );
  handle(
    CHANNELS.retry,
    ["pendingId", "correlationId", "mutation"],
    (service, payload) =>
      service.retry({
        pendingId: payload.pendingId,
        correlationId: payload.correlationId,
        mutation: payload.mutation,
      }),
  );
  handle(
    CHANNELS.removePending,
    ["pendingId", "mutation"],
    (service, payload) =>
      service.removePending({
        pendingId: payload.pendingId,
        mutation: payload.mutation,
      }),
  );
  handle(
    CHANNELS.confirm,
    ["operationId", "contentId", "selector", "mutation"],
    (service, payload) =>
      service.confirm({
        operationId: payload.operationId,
        contentId: payload.contentId,
        selector: payload.selector,
        mutation: payload.mutation,
      }),
  );

  return () => {
    for (const channel of Object.values(CHANNELS))
      ipcMain.removeHandler(channel);
    for (const service of observed) {
      service.off("event", service.__usharkTorrentEventListener);
      delete service.__usharkTorrentEventListener;
    }
    observed.clear();
  };
}

module.exports = {
  CHANNELS,
  EVENT_CHANNEL,
  PROTOCOL_VERSION,
  registerTorrentInspectionIpc,
};
