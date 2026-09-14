"use strict";

const PROTOCOL_VERSION = 1;
const CHANNELS = Object.freeze({
  read: "ushark:configuration:read",
  save: "ushark:configuration:save",
  resetPlayback: "ushark:configuration:reset-playback",
  chooseDirectory: "ushark:configuration:choose-directory",
});

function failure(code, message) {
  return { ok: false, error: { code, message } };
}

function publicFailure(error) {
  if (
    error &&
    typeof error.code === "string" &&
    typeof error.publicMessage === "string"
  )
    return failure(error.code, error.publicMessage);
  return failure(
    "CONFIG_STORAGE_FAILED",
    "Não foi possível acessar a configuração local. Tente novamente.",
  );
}

function validateEnvelope(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    throw Object.assign(new Error("invalid payload"), {
      code: "CONFIG_INVALID",
      publicMessage: "A solicitação de configuração não é válida.",
    });
  if (payload.protocolVersion !== PROTOCOL_VERSION)
    throw Object.assign(new Error("unsupported protocol"), {
      code: "CONFIG_PROTOCOL_UNSUPPORTED",
      publicMessage:
        "Esta versão do aplicativo não reconhece o protocolo de configuração.",
    });
}

function registerConfigurationIpc({ ipcMain, dialog, getStore, getWindow }) {
  const authorize = (event) => {
    const owner = getWindow();
    if (
      !owner ||
      owner.isDestroyed() ||
      event.sender.id !== owner.webContents.id
    )
      throw Object.assign(new Error("unauthorized sender"), {
        code: "CONFIG_UNAUTHORIZED",
        publicMessage: "A solicitação local não foi autorizada.",
      });
    if (event.senderFrame && event.senderFrame !== event.sender.mainFrame)
      throw Object.assign(new Error("unauthorized frame"), {
        code: "CONFIG_UNAUTHORIZED",
        publicMessage: "A solicitação local não foi autorizada.",
      });
  };

  const handle = (channel, operation) => {
    ipcMain.handle(channel, async (event, payload) => {
      try {
        authorize(event);
        validateEnvelope(payload);
        return { ok: true, value: await operation(payload) };
      } catch (error) {
        return publicFailure(error);
      }
    });
  };

  handle(CHANNELS.read, () => getStore().read());
  handle(CHANNELS.save, (payload) => {
    const options = payload.options ?? {};
    if (!options || typeof options !== "object" || Array.isArray(options))
      throw Object.assign(new Error("invalid save options"), {
        code: "CONFIG_INVALID",
        publicMessage: "A opção de salvamento não é válida.",
      });
    if (
      Object.keys(options).some((key) => key !== "completeOnboarding") ||
      (options.completeOnboarding !== undefined &&
        typeof options.completeOnboarding !== "boolean")
    )
      throw Object.assign(new Error("invalid save options"), {
        code: "CONFIG_INVALID",
        publicMessage: "A opção de salvamento não é válida.",
      });
    return getStore().save(payload.value, options);
  });
  handle(CHANNELS.resetPlayback, () => getStore().resetPlayback());
  handle(CHANNELS.chooseDirectory, async (payload) => {
    if (payload.kind !== "library" && payload.kind !== "cache")
      throw Object.assign(new Error("invalid directory kind"), {
        code: "CONFIG_INVALID",
        publicMessage: "O tipo de pasta solicitado não é válido.",
      });
    const snapshot = getStore().read();
    const result = await dialog.showOpenDialog(getWindow(), {
      title:
        payload.kind === "library"
          ? "Escolha a pasta da biblioteca"
          : "Escolha a pasta do cache",
      defaultPath:
        payload.kind === "library"
          ? snapshot.configuration.libraryPath
          : snapshot.configuration.cachePath,
      properties: ["openDirectory", "createDirectory"],
    });
    return result.canceled ? null : (result.filePaths[0] ?? null);
  });

  return () => {
    for (const channel of Object.values(CHANNELS))
      ipcMain.removeHandler(channel);
  };
}

module.exports = { CHANNELS, PROTOCOL_VERSION, registerConfigurationIpc };
