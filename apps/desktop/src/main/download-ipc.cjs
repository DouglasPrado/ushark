"use strict";

const { Buffer } = require("node:buffer");
const PROTOCOL_VERSION = 1;
const REQUEST_MAXIMUM_BYTES = 64 * 1024;
const CHANNELS = Object.freeze({
  list: "ushark:downloads:list",
  enqueue: "ushark:downloads:enqueue",
  command: "ushark:downloads:command",
  removeData: "ushark:downloads:remove-data",
  setPriority: "ushark:downloads:set-priority",
  setLimits: "ushark:downloads:set-limits",
  tick: "ushark:downloads:tick",
  event: "ushark:downloads:event",
});

function failure(code, message, retryable = false) {
  return {
    ok: false,
    error: { code, message, recoverable: retryable, retryable },
  };
}
function publicFailure(error) {
  return error && typeof error.code === "string"
    ? failure(
        error.code,
        error.publicMessage ?? error.message,
        error.retryable === true,
      )
    : failure(
        "DOWNLOAD_STORAGE_FAILED",
        "Não foi possível controlar os downloads locais.",
        true,
      );
}
function validate(payload, allowed) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    throw Object.assign(new Error("invalid"), {
      code: "DOWNLOAD_INVALID",
      publicMessage: "A solicitação de download não é válida.",
    });
  if (
    Buffer.byteLength(JSON.stringify(payload), "utf8") > REQUEST_MAXIMUM_BYTES
  )
    throw Object.assign(new Error("large"), {
      code: "DOWNLOAD_INVALID",
      publicMessage: "A solicitação excede o limite local.",
    });
  if (payload.protocolVersion !== PROTOCOL_VERSION)
    throw Object.assign(new Error("version"), {
      code: "DOWNLOAD_PROTOCOL_UNSUPPORTED",
      publicMessage: "Esta versão não reconhece o protocolo de downloads.",
    });
  const keys = new Set(["protocolVersion", ...allowed]);
  if (Object.keys(payload).some((key) => !keys.has(key)))
    throw Object.assign(new Error("field"), {
      code: "DOWNLOAD_INVALID",
      publicMessage: "A solicitação contém campos desconhecidos.",
    });
}
function registerDownloadIpc({ ipcMain, getService, getWindow }) {
  const authorize = (event) => {
    const owner = getWindow();
    if (
      !owner ||
      owner.isDestroyed() ||
      event.sender.id !== owner.webContents.id ||
      (event.senderFrame && event.senderFrame !== event.sender.mainFrame)
    )
      throw Object.assign(new Error("sender"), {
        code: "DOWNLOAD_UNAUTHORIZED",
        publicMessage: "A solicitação local não foi autorizada.",
      });
  };
  const handle = (channel, allowed, operation) =>
    ipcMain.handle(channel, async (event, payload) => {
      try {
        authorize(event);
        validate(payload, allowed);
        return await operation(getService(), payload);
      } catch (error) {
        return publicFailure(error);
      }
    });
  handle(CHANNELS.list, [], (service) => service.list());
  handle(
    CHANNELS.enqueue,
    [
      "contentId",
      "contentTitle",
      "sourceId",
      "sourceName",
      "fileId",
      "destination",
      "sizeBytes",
      "mutation",
    ],
    (service, value) => service.enqueue(value),
  );
  handle(
    CHANNELS.command,
    ["downloadId", "action", "mutation"],
    (service, value) => service.command(value),
  );
  handle(
    CHANNELS.removeData,
    ["downloadId", "confirmed", "mutation"],
    (service, value) => service.removeData(value),
  );
  handle(
    CHANNELS.setPriority,
    ["downloadId", "priority", "mutation"],
    (service, value) => service.setPriority(value),
  );
  handle(CHANNELS.setLimits, ["limits", "mutation"], (service, value) =>
    service.setLimits(value),
  );
  handle(CHANNELS.tick, ["playbackActive"], (service, value) =>
    service.tick(value),
  );
  return () => {
    for (const channel of Object.values(CHANNELS))
      if (channel !== CHANNELS.event) ipcMain.removeHandler(channel);
  };
}
function publishDownloadEvent(getWindow, value) {
  const owner = getWindow();
  if (!owner || owner.isDestroyed() || owner.webContents.isDestroyed()) return;
  owner.webContents.send(CHANNELS.event, value);
}
module.exports = {
  CHANNELS,
  PROTOCOL_VERSION,
  publishDownloadEvent,
  registerDownloadIpc,
};
