import { expect, test } from "@playwright/test";
const {
  CHANNELS,
  registerTvSessionIpc,
} = require("../apps/desktop/src/main/tv-session-ipc.cjs");
test("M18 S04 sessão --tv conecta e shutdown aguarda mídia", async () => {
  const handlers = new Map();
  const frame = {};
  const event = { sender: { id: 1, mainFrame: frame }, senderFrame: frame };
  let stopped = false;
  registerTvSessionIpc({
    ipcMain: {
      handle: (c: string, h: unknown) => handlers.set(c, h),
      removeHandler: () => {},
    },
    isTv: true,
    getWindow: () => ({ isDestroyed: () => false, webContents: { id: 1 } }),
    stopMedia: async () => {
      stopped = true;
    },
  });
  expect(
    (await handlers.get(CHANNELS.read)(event, { protocolVersion: 1 })).value
      .connected,
  ).toBe(true);
  const closed = await handlers.get(CHANNELS.stop)(event, {
    protocolVersion: 1,
  });
  expect(closed.value.phase).toBe("idle");
  expect(stopped).toBe(true);
});
test("M18 S04 reconexão sem sinal --tv é bloqueada", async () => {
  const handlers = new Map();
  const frame = {};
  const event = { sender: { id: 1, mainFrame: frame }, senderFrame: frame };
  registerTvSessionIpc({
    ipcMain: {
      handle: (c: string, h: unknown) => handlers.set(c, h),
      removeHandler: () => {},
    },
    isTv: false,
    getWindow: () => ({ isDestroyed: () => false, webContents: { id: 1 } }),
    stopMedia: async () => {},
  });
  expect(
    (await handlers.get(CHANNELS.connect)(event, { protocolVersion: 1 })).ok,
  ).toBe(false);
});
