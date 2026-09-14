"use strict";
const CHANNELS = {
  state: "ushark:update:state",
  check: "ushark:update:check",
  apply: "ushark:update:apply",
  uninstall: "ushark:update:uninstall",
};
function registerAppUpdateIpc({ ipcMain, getService, getWindow }) {
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
      return { ok: true, value: await fn(getService(), input) };
    } catch (error) {
      return { ok: false, error: { message: error.message } };
    }
  };
  ipcMain.handle(
    CHANNELS.state,
    wrap((s) => s.state()),
  );
  ipcMain.handle(
    CHANNELS.check,
    wrap((s, i) => s.check(i.channel)),
  );
  ipcMain.handle(
    CHANNELS.apply,
    wrap((s, i) => s.apply(i.candidate)),
  );
  ipcMain.handle(
    CHANNELS.uninstall,
    wrap(() => {
      throw new Error(
        "Use o desinstalador assinado do sistema; dados não são removidos por este painel.",
      );
    }),
  );
  return () => Object.values(CHANNELS).forEach((c) => ipcMain.removeHandler(c));
}
module.exports = { CHANNELS, registerAppUpdateIpc };
