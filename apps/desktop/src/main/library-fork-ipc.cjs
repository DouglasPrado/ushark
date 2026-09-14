"use strict";
const CHANNEL = "ushark:library-fork:copy";
function registerLibraryForkIpc({ ipcMain, getService, getWindow }) {
  ipcMain.handle(CHANNEL, async (event, input) => {
    try {
      const owner = getWindow();
      if (
        !owner ||
        owner.isDestroyed() ||
        event.sender.id !== owner.webContents.id ||
        input?.protocolVersion !== 1
      )
        throw new Error("Solicitação inválida.");
      return getService().fork(
        input.snapshot,
        input.name,
        input.provenance,
        input.mutation.idempotencyKey,
      );
    } catch (error) {
      return { ok: false, error: { message: error.message } };
    }
  });
  return () => ipcMain.removeHandler(CHANNEL);
}
module.exports = { CHANNEL, registerLibraryForkIpc };
