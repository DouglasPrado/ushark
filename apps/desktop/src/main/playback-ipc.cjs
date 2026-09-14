"use strict";

const { Buffer } = require("node:buffer");

const PROTOCOL_VERSION = 1;
const REQUEST_MAXIMUM_BYTES = 64 * 1_024;
const CHANNELS = Object.freeze({
  prepare: "ushark:playback:prepare",
  start: "ushark:playback:start",
  readSession: "ushark:playback:read-session",
  readProgress: "ushark:playback:read-progress",
  setPaused: "ushark:playback:set-paused",
  seek: "ushark:playback:seek",
  setVolume: "ushark:playback:set-volume",
  setMuted: "ushark:playback:set-muted",
  selectAudio: "ushark:playback:select-audio",
  selectSubtitle: "ushark:playback:select-subtitle",
  stop: "ushark:playback:stop",
  cancelPreparation: "ushark:playback:cancel-preparation",
  chooseExternalSubtitle: "ushark:playback:choose-external-subtitle",
  event: "ushark:playback:event",
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
    "PLAYBACK_STORAGE_FAILED",
    "Não foi possível controlar a reprodução local.",
    true,
  );
}

function validateEnvelope(payload, allowedKeys) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    throw Object.assign(new Error("invalid payload"), {
      code: "PLAYBACK_INVALID",
      publicMessage: "A solicitação de reprodução não é válida.",
    });
  if (
    Buffer.byteLength(JSON.stringify(payload), "utf8") > REQUEST_MAXIMUM_BYTES
  )
    throw Object.assign(new Error("payload too large"), {
      code: "PLAYBACK_INVALID",
      publicMessage: "A solicitação de reprodução excede o limite local.",
    });
  if (payload.protocolVersion !== PROTOCOL_VERSION)
    throw Object.assign(new Error("unsupported protocol"), {
      code: "PLAYBACK_PROTOCOL_UNSUPPORTED",
      publicMessage: "Esta versão não reconhece o protocolo do player.",
    });
  const accepted = new Set(["protocolVersion", ...allowedKeys]);
  if (Object.keys(payload).some((key) => !accepted.has(key)))
    throw Object.assign(new Error("unknown field"), {
      code: "PLAYBACK_INVALID",
      publicMessage: "A solicitação de reprodução contém campos desconhecidos.",
    });
}

function registerPlaybackIpc({ ipcMain, dialog, getService, getWindow }) {
  const authorize = (event) => {
    const owner = getWindow();
    if (
      !owner ||
      owner.isDestroyed() ||
      event.sender.id !== owner.webContents.id ||
      (event.senderFrame && event.senderFrame !== event.sender.mainFrame)
    )
      throw Object.assign(new Error("unauthorized sender"), {
        code: "PLAYBACK_UNAUTHORIZED",
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
  handle(
    CHANNELS.prepare,
    ["contentId", "sourceId", "startPositionSeconds", "requestId"],
    (service, value) => service.prepare(value),
  );
  handle(CHANNELS.start, ["operationId", "mutation"], (service, value) =>
    service.start(value),
  );
  handle(CHANNELS.readSession, ["sessionId"], (service, value) =>
    service.readSession(value),
  );
  handle(CHANNELS.readProgress, ["contentId"], (service, value) =>
    service.readProgress(value),
  );
  handle(
    CHANNELS.setPaused,
    ["sessionId", "mutation", "paused"],
    (service, value) => service.setPaused(value),
  );
  handle(
    CHANNELS.seek,
    ["sessionId", "mutation", "positionSeconds"],
    (service, value) => service.seek(value),
  );
  handle(
    CHANNELS.setVolume,
    ["sessionId", "mutation", "volumePercent"],
    (service, value) => service.setVolume(value),
  );
  handle(
    CHANNELS.setMuted,
    ["sessionId", "mutation", "muted"],
    (service, value) => service.setMuted(value),
  );
  handle(
    CHANNELS.selectAudio,
    ["sessionId", "mutation", "trackId"],
    (service, value) => service.selectAudio(value),
  );
  handle(
    CHANNELS.selectSubtitle,
    ["sessionId", "mutation", "trackId"],
    (service, value) => service.selectSubtitle(value),
  );
  handle(CHANNELS.stop, ["sessionId", "mutation", "reason"], (service, value) =>
    service.stop(value),
  );
  handle(CHANNELS.cancelPreparation, ["requestId"], (service, value) =>
    service.cancelPreparation(value),
  );
  handle(
    CHANNELS.chooseExternalSubtitle,
    ["sessionId", "mutation"],
    async (service, value) => {
      const owner = getWindow();
      const selection = await dialog.showOpenDialog(owner, {
        title: "Selecionar legenda local",
        properties: ["openFile"],
        filters: [
          { name: "Legendas", extensions: ["srt", "ass", "ssa", "vtt"] },
        ],
      });
      if (selection.canceled || !selection.filePaths[0])
        return { ok: true, value: undefined };
      return service.addExternalSubtitle({
        ...value,
        candidatePath: selection.filePaths[0],
      });
    },
  );
  return () => {
    for (const channel of Object.values(CHANNELS))
      if (channel !== CHANNELS.event) ipcMain.removeHandler(channel);
  };
}

function publishPlaybackEvent(getWindow, value) {
  const owner = getWindow();
  if (!owner || owner.isDestroyed() || owner.webContents.isDestroyed()) return;
  owner.webContents.send(CHANNELS.event, value);
}

module.exports = {
  CHANNELS,
  PROTOCOL_VERSION,
  publishPlaybackEvent,
  registerPlaybackIpc,
};
