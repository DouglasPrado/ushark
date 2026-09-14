"use strict";

const { Buffer } = require("node:buffer");

const PROTOCOL_VERSION = 1;
const REQUEST_MAXIMUM_BYTES = 64 * 1_024;
const CHANNELS = Object.freeze({
  preflight: "ushark:selection:preflight",
  cancel: "ushark:selection:cancel",
  setOverride: "ushark:selection:set-override",
  readOverride: "ushark:selection:read-override",
  event: "ushark:selection:event",
});

function failure(code, message, retryable = false) {
  return {
    ok: false,
    error: { code, message, recoverable: retryable, retryable },
  };
}

function publicFailure(error) {
  if (error && typeof error.code === "string")
    return failure(
      error.code,
      error.publicMessage ?? error.message,
      error.retryable === true,
    );
  return failure(
    "SELECTION_STORAGE_FAILED",
    "Não foi possível selecionar uma source localmente.",
    true,
  );
}

function validateEnvelope(payload, allowedKeys) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    throw Object.assign(new Error("invalid payload"), {
      code: "SELECTION_INVALID",
      publicMessage: "A solicitação de seleção não é válida.",
    });
  if (
    Buffer.byteLength(JSON.stringify(payload), "utf8") > REQUEST_MAXIMUM_BYTES
  )
    throw Object.assign(new Error("payload too large"), {
      code: "SELECTION_INVALID",
      publicMessage: "A solicitação de seleção excede o limite local.",
    });
  if (payload.protocolVersion !== PROTOCOL_VERSION)
    throw Object.assign(new Error("unsupported protocol"), {
      code: "SELECTION_PROTOCOL_UNSUPPORTED",
      publicMessage: "Esta versão não reconhece o protocolo de seleção.",
    });
  const accepted = new Set(["protocolVersion", ...allowedKeys]);
  if (Object.keys(payload).some((key) => !accepted.has(key)))
    throw Object.assign(new Error("unknown field"), {
      code: "SELECTION_INVALID",
      publicMessage: "A solicitação de seleção contém campos desconhecidos.",
    });
}

function registerSourceSelectionIpc({ ipcMain, getService, getWindow }) {
  const authorize = (event) => {
    const owner = getWindow();
    if (
      !owner ||
      owner.isDestroyed() ||
      event.sender.id !== owner.webContents.id ||
      (event.senderFrame && event.senderFrame !== event.sender.mainFrame)
    )
      throw Object.assign(new Error("unauthorized sender"), {
        code: "SELECTION_UNAUTHORIZED",
        publicMessage: "A solicitação local não foi autorizada.",
      });
  };
  const handle = (channel, allowedKeys, operation) =>
    ipcMain.handle(channel, async (event, payload) => {
      try {
        authorize(event);
        validateEnvelope(payload, allowedKeys);
        return await operation(getService(), payload);
      } catch (error) {
        return publicFailure(error);
      }
    });
  handle(
    CHANNELS.preflight,
    [
      "requestId",
      "contentId",
      "candidates",
      "strategy",
      "resolutionLimit",
      "context",
    ],
    (service, value) => service.preflight(value),
  );
  handle(CHANNELS.cancel, ["requestId"], (service, value) =>
    service.cancel(value),
  );
  handle(
    CHANNELS.setOverride,
    ["contentId", "sourceId", "mutation"],
    (service, value) => service.setOverride(value),
  );
  handle(CHANNELS.readOverride, ["contentId"], (service, value) =>
    service.readOverride(value),
  );
  return () => {
    for (const channel of Object.values(CHANNELS))
      if (channel !== CHANNELS.event) ipcMain.removeHandler(channel);
  };
}

function publishSourceSelectionEvent(getWindow, value) {
  const owner = getWindow();
  if (!owner || owner.isDestroyed() || owner.webContents.isDestroyed()) return;
  owner.webContents.send(CHANNELS.event, value);
}

module.exports = {
  CHANNELS,
  PROTOCOL_VERSION,
  publishSourceSelectionEvent,
  registerSourceSelectionIpc,
};
