"use strict";
const CHANNELS = {
  read: "ushark:tv:read",
  connect: "ushark:tv:connect",
  stop: "ushark:tv:stop",
};
function registerTvSessionIpc({ ipcMain, isTv, stopMedia, getWindow }) {
  let state = {
    active: isTv,
    connected: isTv,
    controller: false,
    policy: "pause",
    phase: isTv ? "connected" : "idle",
    pauseEpoch: 0,
  };
  const wrap = (fn) => async (event, input) => {
    try {
      const owner = getWindow();
      if (
        !owner ||
        owner.isDestroyed() ||
        event.sender.id !== owner.webContents.id ||
        input?.protocolVersion !== 1
      )
        throw new Error("Solicitação inválida.");
      return { ok: true, value: await fn() };
    } catch (error) {
      return { ok: false, error: { message: error.message } };
    }
  };
  ipcMain.handle(
    CHANNELS.read,
    wrap(() => state),
  );
  ipcMain.handle(
    CHANNELS.connect,
    wrap(() => {
      if (!isTv)
        throw new Error(
          "Reconexão requer inicialização explícita com --tv pelo Sunshine.",
        );
      state = { ...state, active: true, connected: true, phase: "connected" };
      return state;
    }),
  );
  ipcMain.handle(
    CHANNELS.stop,
    wrap(async () => {
      state = { ...state, phase: "closing" };
      await Promise.race([
        stopMedia(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Encerramento excedeu 5 s.")),
            5000,
          ),
        ),
      ]);
      state = { ...state, active: false, connected: false, phase: "idle" };
      return state;
    }),
  );
  return () => Object.values(CHANNELS).forEach((c) => ipcMain.removeHandler(c));
}
module.exports = { CHANNELS, registerTvSessionIpc };
