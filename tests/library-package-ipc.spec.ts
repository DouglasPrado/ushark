import { expect, test } from "@playwright/test";
/* eslint-disable @typescript-eslint/no-explicit-any */
const {
  CHANNELS,
  registerLibraryPackageIpc,
} = require("../apps/desktop/src/main/library-package-ipc.cjs");

test("M13 S05 IPC mantém paths no main e autoriza sender", async () => {
  const handlers = new Map<string, any>();
  const calls: any[] = [];
  const frame = {};
  const event = { sender: { id: 8, mainFrame: frame }, senderFrame: frame };
  const service = {
    list: () => ({ ok: true, value: {} }),
    export: (input: unknown, path: string) => {
      calls.push(["export", input, path]);
      return { ok: true, value: {} };
    },
    stageFile: (path: string) => {
      calls.push(["stage", path]);
      return { ok: true, value: {} };
    },
    stageSnapshot: () => ({ ok: true, value: {} }),
    commit: () => ({ ok: true, value: {} }),
  };
  const cleanup = registerLibraryPackageIpc({
    ipcMain: {
      handle: (channel: string, handler: any) => handlers.set(channel, handler),
      removeHandler: (channel: string) => handlers.delete(channel),
    },
    dialog: {
      showSaveDialog: async () => ({
        canceled: false,
        filePath: "/safe/library.tslib",
      }),
      showOpenDialog: async () => ({
        canceled: false,
        filePaths: ["/safe/input.tslib"],
      }),
    },
    getService: () => service,
    getWindow: () => ({ isDestroyed: () => false, webContents: { id: 8 } }),
  });
  try {
    await handlers.get(CHANNELS.export)(event, {
      protocolVersion: 1,
      draftId: "draft:one",
      revision: 1,
    });
    await handlers.get(CHANNELS.choose)(event, { protocolVersion: 1 });
    expect(calls).toEqual([
      [
        "export",
        { protocolVersion: 1, draftId: "draft:one", revision: 1 },
        "/safe/library.tslib",
      ],
      ["stage", "/safe/input.tslib"],
    ]);
    await expect(
      handlers.get(CHANNELS.list)(
        { ...event, sender: { ...event.sender, id: 9 } },
        { protocolVersion: 1 },
      ),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "PACKAGE_UNAUTHORIZED" },
    });
  } finally {
    cleanup();
  }
});
