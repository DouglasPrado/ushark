import { expect, test } from "@playwright/test";
/* eslint-disable @typescript-eslint/no-explicit-any */

const {
  CHANNELS,
  registerStorageIpc,
} = require("../apps/desktop/src/main/storage-ipc.cjs");

test("M10 S05 IPC limita protocolo, campos e sender", async () => {
  const handlers = new Map<string, any>();
  const calls: any[] = [];
  const frame = {};
  const event = { sender: { id: 4, mainFrame: frame }, senderFrame: frame };
  const owner = {
    isDestroyed: () => false,
    webContents: { id: 4, isDestroyed: () => false },
  };
  const service = new Proxy(
    {},
    {
      get: (_target, method: string) => (payload: unknown) => {
        calls.push({ method, payload });
        return { ok: true, value: {} };
      },
    },
  );
  const cleanup = registerStorageIpc({
    ipcMain: {
      handle: (channel: string, handler: any) => handlers.set(channel, handler),
      removeHandler: (channel: string) => handlers.delete(channel),
    },
    getService: () => service,
    getWindow: () => owner,
  });
  const payload = {
    protocolVersion: 1,
    ids: ["old"],
    expectedRevision: 1,
    mutation: { idempotencyKey: "clean:one" },
  };
  try {
    expect([...handlers.keys()]).toHaveLength(5);
    await expect(
      handlers.get(CHANNELS.clean)(event, payload),
    ).resolves.toMatchObject({ ok: true });
    expect(calls).toContainEqual({ method: "clean", payload });
    await expect(
      handlers.get(CHANNELS.clean)(event, { ...payload, path: "/private" }),
    ).resolves.toMatchObject({ ok: false, error: { code: "STORAGE_INVALID" } });
    await expect(
      handlers.get(CHANNELS.clean)(
        { ...event, sender: { ...event.sender, id: 9 } },
        payload,
      ),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "STORAGE_UNAUTHORIZED" },
    });
  } finally {
    cleanup();
  }
});
