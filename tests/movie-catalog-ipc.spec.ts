import { expect, test } from "@playwright/test";

const {
  CHANNELS,
  registerMovieCatalogIpc,
}: {
  CHANNELS: Record<string, string>;
  registerMovieCatalogIpc(options: {
    ipcMain: {
      handle(channel: string, handler: IpcHandler): void;
      removeHandler(channel: string): void;
    };
    getService(): Record<string, (payload: unknown) => Promise<unknown>>;
    getWindow(): OwnerWindow;
    onMutation?(): void;
  }): () => void;
} = require("../apps/desktop/src/main/movie-catalog-ipc.cjs");

type IpcHandler = (
  event: IpcEvent,
  payload: Record<string, unknown>,
) => Promise<unknown>;
type IpcEvent = {
  sender: { id: number; mainFrame: object };
  senderFrame: object;
};
type OwnerWindow = {
  isDestroyed(): boolean;
  webContents: { id: number };
};

function fixture(onMutation?: () => void) {
  const handlers = new Map<string, IpcHandler>();
  const calls: Array<{ operation: string; payload: unknown }> = [];
  const mainFrame = {};
  const event = { sender: { id: 17, mainFrame }, senderFrame: mainFrame };
  const service = Object.fromEntries(
    Object.keys(CHANNELS).map((operation) => [
      operation,
      async (payload: unknown) => {
        calls.push({ operation, payload });
        return { ok: true, value: { operation } };
      },
    ]),
  );
  const cleanup = registerMovieCatalogIpc({
    ipcMain: {
      handle: (channel, handler) => handlers.set(channel, handler),
      removeHandler: (channel) => handlers.delete(channel),
    },
    getService: () => service,
    getWindow: () => ({
      isDestroyed: () => false,
      webContents: { id: 17 },
    }),
    onMutation,
  });
  return { handlers, calls, event, cleanup };
}

test("M04 invalida Discovery somente após mutação de filme confirmada", async () => {
  let invalidations = 0;
  const { handlers, event, cleanup } = fixture(() => invalidations++);
  try {
    await handlers.get(CHANNELS.read)?.(event, {
      protocolVersion: 1,
      libraryId: "library:test",
    });
    expect(invalidations).toBe(0);
    await handlers.get(CHANNELS.save)?.(event, {
      protocolVersion: 1,
      libraryId: "library:test",
      draft: {},
      mutation: { idempotencyKey: "discovery-invalidation-test" },
    });
    expect(invalidations).toBe(1);
  } finally {
    cleanup();
  }
});

test("M02 IPC expõe allowlist versionada e não encaminha protocolo", async () => {
  const { handlers, calls, event, cleanup } = fixture();
  try {
    expect([...handlers.keys()].sort()).toEqual(Object.values(CHANNELS).sort());
    await expect(
      handlers.get(CHANNELS.save)?.(event, {
        protocolVersion: 1,
        libraryId: "library:test",
        draft: {},
        mutation: { idempotencyKey: "save-test-0001" },
      }),
    ).resolves.toMatchObject({ ok: true, value: { operation: "save" } });
    expect(calls).toEqual([
      {
        operation: "save",
        payload: {
          libraryId: "library:test",
          draft: {},
          mutation: { idempotencyKey: "save-test-0001" },
        },
      },
    ]);
    await expect(
      handlers.get(CHANNELS.deleteManagedFile)?.(event, {
        protocolVersion: 1,
        libraryId: "library:test",
        contentId: "movie:test",
        sourceId: "source:test",
        confirm: true,
        mutation: { idempotencyKey: "delete-test-0001" },
        path: "/arbitrary/file",
      }),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "CATALOG_INVALID" },
    });
  } finally {
    cleanup();
  }
});

test("M02 IPC rejeita protocolo, sender e frame desconhecidos", async () => {
  const { handlers, event, cleanup } = fixture();
  try {
    await expect(
      handlers.get(CHANNELS.read)?.(event, {
        protocolVersion: 99,
        libraryId: "library:test",
      }),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "CATALOG_PROTOCOL_UNSUPPORTED" },
    });
    await expect(
      handlers.get(CHANNELS.read)?.(
        { ...event, sender: { ...event.sender, id: 99 } },
        { protocolVersion: 1, libraryId: "library:test" },
      ),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "CATALOG_UNAUTHORIZED" },
    });
    await expect(
      handlers.get(CHANNELS.read)?.(
        { ...event, senderFrame: {} },
        { protocolVersion: 1, libraryId: "library:test" },
      ),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "CATALOG_UNAUTHORIZED" },
    });
  } finally {
    cleanup();
  }
});
