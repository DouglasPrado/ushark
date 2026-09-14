import { expect, test } from "@playwright/test";
/* eslint-disable @typescript-eslint/no-explicit-any */

const {
  CHANNELS,
  registerNextEpisodeIpc,
} = require("../apps/desktop/src/main/next-episode-ipc.cjs");

test("M11 S05 IPC autoriza sender e limita payload", async () => {
  const handlers = new Map<string, any>();
  const frame = {};
  const event = { sender: { id: 6, mainFrame: frame }, senderFrame: frame };
  const owner = { isDestroyed: () => false, webContents: { id: 6 } };
  const service = {
    resolve: (input: unknown) => ({ ok: true, value: input }),
    prepare: (input: unknown) => ({ ok: true, value: input }),
    cancel: (input: unknown) => ({ ok: true, value: input }),
    claimStart: (input: unknown) => ({ ok: true, value: input }),
  };
  const cleanup = registerNextEpisodeIpc({
    ipcMain: {
      handle: (channel: string, handler: any) => handlers.set(channel, handler),
      removeHandler: (channel: string) => handlers.delete(channel),
    },
    getService: () => service,
    getWindow: () => owner,
  });
  try {
    expect([...handlers.keys()]).toHaveLength(4);
    await expect(
      handlers.get(CHANNELS.resolve)(event, {
        protocolVersion: 1,
        contentId: "episode:one",
      }),
    ).resolves.toMatchObject({ ok: true });
    await expect(
      handlers.get(CHANNELS.resolve)(event, {
        protocolVersion: 1,
        contentId: "episode:one",
        privatePath: "/tmp/x",
      }),
    ).resolves.toMatchObject({ ok: false, error: { code: "NEXT_INVALID" } });
    await expect(
      handlers.get(CHANNELS.resolve)(
        { ...event, sender: { ...event.sender, id: 99 } },
        { protocolVersion: 1, contentId: "episode:one" },
      ),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "NEXT_UNAUTHORIZED" },
    });
  } finally {
    cleanup();
  }
});
