"use strict";
const { Buffer } = require("node:buffer");
const PROTOCOL_VERSION = 1;
const CHANNELS = Object.freeze({
  verify: "ushark:library-trust:verify",
  accept: "ushark:library-trust:accept",
  sign: "ushark:library-trust:sign",
});
function registerLibraryTrustIpc({ ipcMain, getService, getWindow }) {
  const wrap = (operation) => async (event, input) => {
    try {
      const owner = getWindow();
      if (
        !owner ||
        owner.isDestroyed() ||
        event.sender.id !== owner.webContents.id ||
        (event.senderFrame && event.senderFrame !== event.sender.mainFrame)
      )
        throw Object.assign(new Error("unauthorized"), {
          code: "TRUST_UNAUTHORIZED",
        });
      if (
        !input ||
        input.protocolVersion !== PROTOCOL_VERSION ||
        Buffer.byteLength(JSON.stringify(input)) > 2 * 1024 * 1024
      )
        throw Object.assign(new Error("invalid"), { code: "TRUST_INVALID" });
      return { ok: true, value: await operation(getService(), input) };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: error.code ?? "TRUST_STORAGE_FAILED",
          message:
            error.message === "unauthorized"
              ? "Solicitação não autorizada."
              : error.message === "invalid"
                ? "Solicitação de confiança inválida."
                : "Não foi possível verificar a identidade.",
          retryable: !["TRUST_INVALID", "TRUST_UNAUTHORIZED"].includes(
            error.code,
          ),
        },
      };
    }
  };
  ipcMain.handle(
    CHANNELS.verify,
    wrap((service, input) => service.verify(input.snapshot)),
  );
  ipcMain.handle(
    CHANNELS.accept,
    wrap((service, input) => {
      const signature = input.snapshot?.signature;
      service.accept({
        libraryId: input.libraryId,
        publicKey: signature?.key,
        idempotencyKey: input.mutation.idempotencyKey,
      });
    }),
  );
  ipcMain.handle(
    CHANNELS.sign,
    wrap((service, input) => service.sign(input.snapshot)),
  );
  return () =>
    Object.values(CHANNELS).forEach((channel) =>
      ipcMain.removeHandler(channel),
    );
}
module.exports = { CHANNELS, registerLibraryTrustIpc };
