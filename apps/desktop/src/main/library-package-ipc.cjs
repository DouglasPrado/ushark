"use strict";
const { Buffer } = require("node:buffer");
const PROTOCOL_VERSION = 1;
const REQUEST_MAXIMUM_BYTES = 2 * 1024 * 1024;
const CHANNELS = Object.freeze({
  list: "ushark:library-package:list",
  export: "ushark:library-package:export",
  choose: "ushark:library-package:choose",
  stage: "ushark:library-package:stage",
  commit: "ushark:library-package:commit",
});
function publicFailure(error) {
  return {
    ok: false,
    error: {
      code: error?.code ?? "PACKAGE_STORAGE_FAILED",
      message:
        error?.publicMessage ?? "Não foi possível operar o pacote local.",
      recoverable: error?.retryable === true,
      retryable: error?.retryable === true,
    },
  };
}
function validate(payload, allowed) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    throw Object.assign(new Error("invalid"), {
      code: "PACKAGE_INVALID",
      publicMessage: "A solicitação de pacote não é válida.",
    });
  if (
    Buffer.byteLength(JSON.stringify(payload), "utf8") > REQUEST_MAXIMUM_BYTES
  )
    throw Object.assign(new Error("large"), {
      code: "PACKAGE_INVALID",
      publicMessage: "A solicitação excede 2 MiB.",
    });
  if (payload.protocolVersion !== PROTOCOL_VERSION)
    throw Object.assign(new Error("version"), {
      code: "PACKAGE_PROTOCOL_UNSUPPORTED",
      publicMessage: "Protocolo de pacote incompatível.",
    });
  const keys = new Set(["protocolVersion", ...allowed]);
  if (Object.keys(payload).some((key) => !keys.has(key)))
    throw Object.assign(new Error("field"), {
      code: "PACKAGE_INVALID",
      publicMessage: "A solicitação contém campos desconhecidos.",
    });
}
function registerLibraryPackageIpc({ ipcMain, dialog, getService, getWindow }) {
  const authorize = (event) => {
    const owner = getWindow();
    if (
      !owner ||
      owner.isDestroyed() ||
      event.sender.id !== owner.webContents.id ||
      (event.senderFrame && event.senderFrame !== event.sender.mainFrame)
    )
      throw Object.assign(new Error("sender"), {
        code: "PACKAGE_UNAUTHORIZED",
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
  handle(CHANNELS.export, ["draftId", "revision"], async (service, input) => {
    const selected = await dialog.showSaveDialog(getWindow(), {
      title: "Exportar biblioteca",
      defaultPath: `${input.draftId.replaceAll(":", "-")}.tslib`,
      filters: [{ name: "Biblioteca Ushark", extensions: ["tslib"] }],
    });
    if (selected.canceled || !selected.filePath)
      return {
        ok: false,
        error: {
          code: "PACKAGE_CANCELLED",
          message: "Exportação cancelada.",
          recoverable: true,
          retryable: true,
        },
      };
    return service.export(input, selected.filePath);
  });
  handle(CHANNELS.choose, [], async (service) => {
    const selected = await dialog.showOpenDialog(getWindow(), {
      title: "Importar biblioteca",
      properties: ["openFile"],
      filters: [{ name: "Biblioteca Ushark", extensions: ["tslib"] }],
    });
    if (selected.canceled || !selected.filePaths[0])
      return { ok: true, value: undefined };
    return service.stageFile(selected.filePaths[0]);
  });
  handle(CHANNELS.stage, ["snapshot"], (service, input) =>
    service.stageSnapshot(input.snapshot),
  );
  handle(CHANNELS.commit, ["snapshot", "mutation"], (service, input) =>
    service.commit(input),
  );
  return () => {
    for (const channel of Object.values(CHANNELS))
      ipcMain.removeHandler(channel);
  };
}
module.exports = { CHANNELS, PROTOCOL_VERSION, registerLibraryPackageIpc };
