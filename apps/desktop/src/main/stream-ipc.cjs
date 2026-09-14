"use strict";

const { Buffer } = require("node:buffer");

const PROTOCOL_VERSION = 1;
const REQUEST_MAXIMUM_BYTES = 64 * 1_024;
const CHANNELS = Object.freeze({
  prepare: "ushark:stream:prepare",
  setPosition: "ushark:stream:set-position",
  seek: "ushark:stream:seek",
  setPaused: "ushark:stream:set-paused",
  setVolume: "ushark:stream:set-volume",
  setMuted: "ushark:stream:set-muted",
  selectAudio: "ushark:stream:select-audio",
  selectSubtitle: "ushark:stream:select-subtitle",
  stop: "ushark:stream:stop",
  cancel: "ushark:stream:cancel",
  event: "ushark:stream:event",
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
    "STREAM_DAEMON_UNAVAILABLE",
    "Não foi possível controlar o streaming local.",
    true,
  );
}

function validateEnvelope(payload, allowedKeys) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    throw Object.assign(new Error("invalid payload"), {
      code: "STREAM_INVALID",
      publicMessage: "A solicitação de streaming não é válida.",
    });
  if (
    Buffer.byteLength(JSON.stringify(payload), "utf8") > REQUEST_MAXIMUM_BYTES
  )
    throw Object.assign(new Error("payload too large"), {
      code: "STREAM_INVALID",
      publicMessage: "A solicitação de streaming excede o limite local.",
    });
  if (payload.protocolVersion !== PROTOCOL_VERSION)
    throw Object.assign(new Error("unsupported protocol"), {
      code: "STREAM_PROTOCOL_UNSUPPORTED",
      publicMessage: "Esta versão não reconhece o protocolo de streaming.",
    });
  const accepted = new Set(["protocolVersion", ...allowedKeys]);
  if (Object.keys(payload).some((key) => !accepted.has(key)))
    throw Object.assign(new Error("unknown field"), {
      code: "STREAM_INVALID",
      publicMessage: "A solicitação de streaming contém campos desconhecidos.",
    });
}

function registerStreamIpc({ ipcMain, getService, getWindow }) {
  const authorize = (event) => {
    const owner = getWindow();
    if (
      !owner ||
      owner.isDestroyed() ||
      event.sender.id !== owner.webContents.id ||
      (event.senderFrame && event.senderFrame !== event.sender.mainFrame)
    )
      throw Object.assign(new Error("unauthorized sender"), {
        code: "STREAM_UNAUTHORIZED",
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
    [
      "contentId",
      "sourceId",
      "fileId",
      "mode",
      "startPositionSeconds",
      "durationSeconds",
      "mediaBitrateBitsPerSecond",
      "throughputBitsPerSecond",
      "tailRequired",
      "requestId",
    ],
    (service, value) => service.prepare(value),
  );
  handle(
    CHANNELS.setPosition,
    ["streamSessionId", "positionSeconds", "seekGeneration"],
    (service, value) => service.setPosition(value),
  );
  handle(
    CHANNELS.seek,
    ["streamSessionId", "positionSeconds", "seekGeneration", "mutation"],
    (service, value) => service.seek(value),
  );
  for (const [channel, field, method] of [
    [CHANNELS.setPaused, "paused", "setPaused"],
    [CHANNELS.setVolume, "volumePercent", "setVolume"],
    [CHANNELS.setMuted, "muted", "setMuted"],
    [CHANNELS.selectAudio, "trackId", "selectAudio"],
    [CHANNELS.selectSubtitle, "trackId", "selectSubtitle"],
  ])
    handle(channel, ["streamSessionId", "mutation", field], (service, value) =>
      service[method](value),
    );
  handle(CHANNELS.stop, ["streamSessionId", "mutation"], (service, value) =>
    service.stop(value),
  );
  handle(CHANNELS.cancel, ["requestId"], (service, value) =>
    service.cancel(value),
  );
  return () => {
    for (const channel of Object.values(CHANNELS))
      if (channel !== CHANNELS.event) ipcMain.removeHandler(channel);
  };
}

function publishStreamEvent(getWindow, value) {
  const owner = getWindow();
  if (!owner || owner.isDestroyed() || owner.webContents.isDestroyed()) return;
  owner.webContents.send(CHANNELS.event, value);
}

module.exports = {
  CHANNELS,
  PROTOCOL_VERSION,
  publishStreamEvent,
  registerStreamIpc,
};
