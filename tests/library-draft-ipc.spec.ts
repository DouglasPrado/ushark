import { expect, test } from "@playwright/test";
/* eslint-disable @typescript-eslint/no-explicit-any */
const {
  CHANNELS,
  registerLibraryDraftIpc,
} = require("../apps/desktop/src/main/library-draft-ipc.cjs");
test("M12 S05 IPC restringe sender e campos", async () => {
  const handlers = new Map<string, any>();
  const frame = {};
  const event = { sender: { id: 7, mainFrame: frame }, senderFrame: frame };
  const cleanup = registerLibraryDraftIpc({
    ipcMain: {
      handle: (channel: string, handler: any) => handlers.set(channel, handler),
      removeHandler: (channel: string) => handlers.delete(channel),
    },
    getService: () => ({
      list: () => ({ ok: true, value: [] }),
      catalog: () => ({ ok: true, value: [] }),
      save: (input: unknown) => ({ ok: true, value: input }),
    }),
    getWindow: () => ({ isDestroyed: () => false, webContents: { id: 7 } }),
  });
  try {
    expect([...handlers.keys()]).toHaveLength(3);
    await expect(
      handlers.get(CHANNELS.list)(event, { protocolVersion: 1 }),
    ).resolves.toMatchObject({ ok: true });
    await expect(
      handlers.get(CHANNELS.list)(event, { protocolVersion: 1, path: "/tmp" }),
    ).resolves.toMatchObject({ ok: false, error: { code: "DRAFT_INVALID" } });
    await expect(
      handlers.get(CHANNELS.list)(
        { ...event, sender: { ...event.sender, id: 8 } },
        { protocolVersion: 1 },
      ),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "DRAFT_UNAUTHORIZED" },
    });
  } finally {
    cleanup();
  }
});
