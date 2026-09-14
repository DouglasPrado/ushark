"use strict";

const { Buffer } = require("node:buffer");
const PROTOCOL_VERSION = 1;
const REQUEST_MAXIMUM_BYTES = 64 * 1024;
const CHANNELS = Object.freeze({
  resolve: "ushark:next-episode:resolve",
  prepare: "ushark:next-episode:prepare",
  cancel: "ushark:next-episode:cancel",
  claimStart: "ushark:next-episode:claim-start",
});

function publicFailure(error) {
  return {
    ok: false,
    error: {
      code: error?.code ?? "NEXT_STORAGE_FAILED",
      message:
        error?.publicMessage ?? "Não foi possível operar a sequência local.",
      recoverable: error?.retryable === true,
      retryable: error?.retryable === true,
    },
  };
}

function validate(payload, allowed) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    throw Object.assign(new Error("invalid"), {
      code: "NEXT_INVALID",
      publicMessage: "A solicitação de sequência não é válida.",
    });
  if (
    Buffer.byteLength(JSON.stringify(payload), "utf8") > REQUEST_MAXIMUM_BYTES
  )
    throw Object.assign(new Error("large"), {
      code: "NEXT_INVALID",
      publicMessage: "A solicitação excede o limite local.",
    });
  if (payload.protocolVersion !== PROTOCOL_VERSION)
    throw Object.assign(new Error("version"), {
      code: "NEXT_PROTOCOL_UNSUPPORTED",
      publicMessage: "Esta versão não reconhece o protocolo de sequência.",
    });
  const keys = new Set(["protocolVersion", ...allowed]);
  if (Object.keys(payload).some((key) => !keys.has(key)))
    throw Object.assign(new Error("field"), {
      code: "NEXT_INVALID",
      publicMessage: "A solicitação contém campos desconhecidos.",
    });
}

function registerNextEpisodeIpc({ ipcMain, getService, getWindow }) {
  const authorize = (event) => {
    const owner = getWindow();
    if (
      !owner ||
      owner.isDestroyed() ||
      event.sender.id !== owner.webContents.id ||
      (event.senderFrame && event.senderFrame !== event.sender.mainFrame)
    )
      throw Object.assign(new Error("sender"), {
        code: "NEXT_UNAUTHORIZED",
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
  handle(CHANNELS.resolve, ["contentId"], (service, input) =>
    service.resolve(input),
  );
  handle(
    CHANNELS.prepare,
    ["sessionId", "generation", "sourceId", "fileId", "mutation"],
    (service, input) => service.prepare(input),
  );
  handle(
    CHANNELS.cancel,
    ["sessionId", "generation", "mutation"],
    (service, input) => service.cancel(input),
  );
  handle(
    CHANNELS.claimStart,
    ["sessionId", "generation", "mutation"],
    (service, input) => service.claimStart(input),
  );
  return () => {
    for (const channel of Object.values(CHANNELS))
      ipcMain.removeHandler(channel);
  };
}

module.exports = { CHANNELS, PROTOCOL_VERSION, registerNextEpisodeIpc };
