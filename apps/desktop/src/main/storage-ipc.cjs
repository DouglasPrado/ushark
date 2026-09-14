"use strict";

const { Buffer } = require("node:buffer");

const PROTOCOL_VERSION = 1;
const REQUEST_MAXIMUM_BYTES = 64 * 1024;
const CHANNELS = Object.freeze({
  read: "ushark:storage:read",
  clean: "ushark:storage:clean",
  retain: "ushark:storage:retain",
  repair: "ushark:storage:repair",
  applyPolicy: "ushark:storage:apply-policy",
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
        "STORAGE_WRITE_FAILED",
        "Não foi possível operar o armazenamento local.",
        true,
      );
}

function validate(payload, allowed) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    throw Object.assign(new Error("invalid"), {
      code: "STORAGE_INVALID",
      publicMessage: "A solicitação de armazenamento não é válida.",
    });
  if (
    Buffer.byteLength(JSON.stringify(payload), "utf8") > REQUEST_MAXIMUM_BYTES
  )
    throw Object.assign(new Error("large"), {
      code: "STORAGE_INVALID",
      publicMessage: "A solicitação excede o limite local.",
    });
  if (payload.protocolVersion !== PROTOCOL_VERSION)
    throw Object.assign(new Error("version"), {
      code: "STORAGE_PROTOCOL_UNSUPPORTED",
      publicMessage: "Esta versão não reconhece o protocolo de armazenamento.",
    });
  const keys = new Set(["protocolVersion", ...allowed]);
  if (Object.keys(payload).some((key) => !keys.has(key)))
    throw Object.assign(new Error("field"), {
      code: "STORAGE_INVALID",
      publicMessage: "A solicitação contém campos desconhecidos.",
    });
}

function registerStorageIpc({ ipcMain, getService, getWindow }) {
  const authorize = (event) => {
    const owner = getWindow();
    if (
      !owner ||
      owner.isDestroyed() ||
      event.sender.id !== owner.webContents.id ||
      (event.senderFrame && event.senderFrame !== event.sender.mainFrame)
    )
      throw Object.assign(new Error("sender"), {
        code: "STORAGE_UNAUTHORIZED",
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
  handle(CHANNELS.read, [], (service) => service.read());
  handle(
    CHANNELS.clean,
    ["ids", "expectedRevision", "mutation"],
    (service, value) => service.clean(value),
  );
  handle(
    CHANNELS.retain,
    ["id", "keep", "expectedRevision", "mutation"],
    (service, value) => service.retain(value),
  );
  handle(
    CHANNELS.repair,
    ["id", "expectedRevision", "mutation"],
    (service, value) => service.repair(value),
  );
  handle(
    CHANNELS.applyPolicy,
    ["policy", "expectedRevision", "mutation"],
    (service, value) => service.applyPolicy(value),
  );
  return () => {
    for (const channel of Object.values(CHANNELS))
      ipcMain.removeHandler(channel);
  };
}

module.exports = { CHANNELS, PROTOCOL_VERSION, registerStorageIpc };
