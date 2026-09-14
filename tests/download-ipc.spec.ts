import { expect, test } from "@playwright/test";
/* eslint-disable @typescript-eslint/no-explicit-any */

const {
  CHANNELS,
  publishDownloadEvent,
  registerDownloadIpc,
} = require("../apps/desktop/src/main/download-ipc.cjs");

test("M09 S05 IPC limita protocolo, campos e sender", async () => {
  const handlers = new Map<string, any>();
  const calls: any[] = [];
  const frame = {};
  const event = { sender: { id: 3, mainFrame: frame }, senderFrame: frame };
  const owner = {
    isDestroyed: () => false,
    webContents: { id: 3, isDestroyed: () => false, send: () => {} },
  };
  const service = new Proxy(
    {},
    {
      get: (_target, method: string) => async (payload: unknown) => {
        calls.push({ method, payload });
        return { ok: true, value: {} };
      },
    },
  );
  const cleanup = registerDownloadIpc({
    ipcMain: {
      handle: (channel: string, handler: any) => handlers.set(channel, handler),
      removeHandler: (channel: string) => handlers.delete(channel),
    },
    getService: () => service,
    getWindow: () => owner,
  });
  const payload = {
    protocolVersion: 1,
    downloadId: "download:one",
    action: "pause",
    mutation: { idempotencyKey: "pause:one" },
  };
  try {
    expect([...handlers.keys()]).toHaveLength(7);
    await expect(
      handlers.get(CHANNELS.command)(event, payload),
    ).resolves.toMatchObject({ ok: true });
    expect(calls).toContainEqual({ method: "command", payload });
    await expect(
      handlers.get(CHANNELS.command)(event, {
        ...payload,
        path: "/private/file",
      }),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "DOWNLOAD_INVALID" },
    });
    await expect(
      handlers.get(CHANNELS.command)(
        { ...event, sender: { ...event.sender, id: 9 } },
        payload,
      ),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "DOWNLOAD_UNAUTHORIZED" },
    });
  } finally {
    cleanup();
  }
});

test("M09 S05 evento agregado não expõe resume ou path", () => {
  const sent: any[] = [];
  const owner = {
    isDestroyed: () => false,
    webContents: {
      isDestroyed: () => false,
      send: (channel: string, value: unknown) => sent.push({ channel, value }),
    },
  };
  publishDownloadEvent(() => owner, {
    type: "download.updated",
    snapshot: { id: "download:one", bytesCompleted: 10 },
  });
  expect(sent).toHaveLength(1);
  expect(JSON.stringify(sent)).not.toMatch(/resumeData|private|magnet/);
});
