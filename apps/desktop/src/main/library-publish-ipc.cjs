"use strict";
const CHANNELS = {
  list: "ushark:publish:list",
  prepare: "ushark:publish:prepare",
  publish: "ushark:publish:commit",
  withdraw: "ushark:publish:withdraw",
};
function registerLibraryPublishIpc({ ipcMain, getService, getWindow }) {
  const wrap = (fn) => async (event, input) => {
    try {
      const owner = getWindow();
      if (
        !owner ||
        owner.isDestroyed() ||
        event.sender.id !== owner.webContents.id ||
        input?.protocolVersion !== 1
      )
        throw new Error("Solicitação não autorizada.");
      return { ok: true, value: await fn(getService(), input) };
    } catch (error) {
      return { ok: false, error: { message: error.message } };
    }
  };
  ipcMain.handle(
    CHANNELS.list,
    wrap((s) => s.list()),
  );
  ipcMain.handle(
    CHANNELS.prepare,
    wrap((s, i) => s.prepare(i.draft, i.catalog)),
  );
  ipcMain.handle(
    CHANNELS.publish,
    wrap((s, i) => s.publish(i.review, i.mutation.idempotencyKey)),
  );
  ipcMain.handle(
    CHANNELS.withdraw,
    wrap(async (s, i) => {
      await s.withdraw(i.libraryId, i.mutation.idempotencyKey);
      return null;
    }),
  );
  return () => Object.values(CHANNELS).forEach((c) => ipcMain.removeHandler(c));
}
module.exports = { CHANNELS, registerLibraryPublishIpc };
