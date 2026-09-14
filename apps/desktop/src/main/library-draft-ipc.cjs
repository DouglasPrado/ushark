"use strict";
const { Buffer } = require("node:buffer");
const PROTOCOL_VERSION = 1;
const REQUEST_MAXIMUM_BYTES = 2 * 1024 * 1024;
const CHANNELS = Object.freeze({
  list: "ushark:library-drafts:list",
  catalog: "ushark:library-drafts:catalog",
  save: "ushark:library-drafts:save",
});
function publicFailure(error) {
  return {
    ok: false,
    error: {
      code: error?.code ?? "DRAFT_STORAGE_FAILED",
      message:
        error?.publicMessage ?? "Não foi possível operar a curadoria local.",
      recoverable: error?.retryable === true,
      retryable: error?.retryable === true,
    },
  };
}
function validate(payload, allowed) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    throw Object.assign(new Error("invalid"), {
      code: "DRAFT_INVALID",
      publicMessage: "A solicitação de curadoria não é válida.",
    });
  if (
    Buffer.byteLength(JSON.stringify(payload), "utf8") > REQUEST_MAXIMUM_BYTES
  )
    throw Object.assign(new Error("large"), {
      code: "DRAFT_INVALID",
      publicMessage: "A solicitação excede o limite local.",
    });
  if (payload.protocolVersion !== PROTOCOL_VERSION)
    throw Object.assign(new Error("version"), {
      code: "DRAFT_PROTOCOL_UNSUPPORTED",
      publicMessage: "Esta versão não reconhece o protocolo de curadoria.",
    });
  const keys = new Set(["protocolVersion", ...allowed]);
  if (Object.keys(payload).some((key) => !keys.has(key)))
    throw Object.assign(new Error("field"), {
      code: "DRAFT_INVALID",
      publicMessage: "A solicitação contém campos desconhecidos.",
    });
}
function registerLibraryDraftIpc({ ipcMain, getService, getWindow }) {
  const authorize = (event) => {
    const owner = getWindow();
    if (
      !owner ||
      owner.isDestroyed() ||
      event.sender.id !== owner.webContents.id ||
      (event.senderFrame && event.senderFrame !== event.sender.mainFrame)
    )
      throw Object.assign(new Error("sender"), {
        code: "DRAFT_UNAUTHORIZED",
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
  handle(CHANNELS.catalog, [], (service) => service.catalog());
  handle(CHANNELS.save, ["draft", "mutation"], (service, input) =>
    service.save(input),
  );
  return () => {
    for (const channel of Object.values(CHANNELS))
      ipcMain.removeHandler(channel);
  };
}
module.exports = { CHANNELS, PROTOCOL_VERSION, registerLibraryDraftIpc };
