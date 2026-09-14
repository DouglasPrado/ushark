"use strict";
const CHANNEL = "ushark:diagnostics:call";
const allowed = new Set(["collect", "export", "clear", "retention", "burst"]);
function registerDiagnosticsIpc({ ipcMain, getService, getWindow }) {
  ipcMain.handle(CHANNEL, async (event, input) => {
    try {
      const owner = getWindow();
      if (
        !owner ||
        owner.isDestroyed() ||
        event.sender.id !== owner.webContents.id ||
        input?.protocolVersion !== 1 ||
        !allowed.has(input.operation)
      )
        throw new Error("Solicitação inválida.");
      return {
        ok: true,
        value: await getService()[input.operation](...input.args),
      };
    } catch (error) {
      return { ok: false, error: { message: error.message } };
    }
  });
  return () => ipcMain.removeHandler(CHANNEL);
}
module.exports = { CHANNEL, registerDiagnosticsIpc };
