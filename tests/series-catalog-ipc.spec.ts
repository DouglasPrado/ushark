import { expect, test } from "@playwright/test";

const {
  CHANNELS,
  registerSeriesCatalogIpc,
}: {
  CHANNELS: Record<string, string>;
  registerSeriesCatalogIpc(options: {
    ipcMain: {
      handle(channel: string, handler: IpcHandler): void;
      removeHandler(channel: string): void;
    };
    getService(): Record<string, (payload: unknown) => Promise<unknown>>;
    getWindow(): OwnerWindow;
    onMutation?(): void;
  }): () => void;
} = require("../apps/desktop/src/main/series-catalog-ipc.cjs");

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
  const event = { sender: { id: 23, mainFrame }, senderFrame: mainFrame };
  const service = Object.fromEntries(
    Object.keys(CHANNELS).map((operation) => [
      operation,
      async (payload: unknown) => {
        calls.push({ operation, payload });
        return { ok: true, value: { operation } };
      },
    ]),
  );
  const cleanup = registerSeriesCatalogIpc({
    ipcMain: {
      handle: (channel, handler) => handlers.set(channel, handler),
      removeHandler: (channel) => handlers.delete(channel),
    },
    getService: () => service,
    getWindow: () => ({
      isDestroyed: () => false,
      webContents: { id: 23 },
    }),
    onMutation,
  });
  return { handlers, calls, event, cleanup };
}

test("M04 invalida Discovery somente após importação de série confirmada", async () => {
  let invalidations = 0;
  const { handlers, event, cleanup } = fixture(() => invalidations++);
  try {
    await handlers.get(CHANNELS.readCatalog)?.(event, {
      protocolVersion: 1,
      libraryId: "library:test",
    });
    expect(invalidations).toBe(0);
    await handlers.get(CHANNELS.confirmImport)?.(event, {
      protocolVersion: 1,
      reviewId: "review:test",
      title: "Série persistente",
      mutation: { idempotencyKey: "discovery-series-invalidation-test" },
    });
    expect(invalidations).toBe(1);
  } finally {
    cleanup();
  }
});

test("M03 IPC expõe allowlist v1 e encaminha apenas o DTO validado", async () => {
  const { handlers, calls, event, cleanup } = fixture();
  try {
    expect([...handlers.keys()].sort()).toEqual(Object.values(CHANNELS).sort());
    await expect(
      handlers.get(CHANNELS.beginReview)?.(event, {
        protocolVersion: 1,
        libraryId: "library:test",
        operationId: "operation:test",
        title: "Show",
        fileIds: ["file:1"],
        mutation: { idempotencyKey: "series-review-test" },
      }),
    ).resolves.toMatchObject({
      ok: true,
      value: { operation: "beginReview" },
    });
    expect(calls).toContainEqual({
      operation: "beginReview",
      payload: {
        libraryId: "library:test",
        operationId: "operation:test",
        title: "Show",
        fileIds: ["file:1"],
        mutation: { idempotencyKey: "series-review-test" },
      },
    });
    await expect(
      handlers.get(CHANNELS.setEpisodeArtwork)?.(event, {
        protocolVersion: 1,
        libraryId: "library:test",
        episodeId: "episode:test",
        artwork: null,
        mutation: { idempotencyKey: "series-artwork-test" },
        path: "/arquivo/arbitrario",
      }),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "SERIES_INVALID" },
    });
  } finally {
    cleanup();
  }
});

test("M03 IPC rejeita protocolo, sender e frame desconhecidos", async () => {
  const { handlers, event, cleanup } = fixture();
  try {
    await expect(
      handlers.get(CHANNELS.readCatalog)?.(event, {
        protocolVersion: 99,
        libraryId: "library:test",
      }),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "SERIES_PROTOCOL_UNSUPPORTED" },
    });
    await expect(
      handlers.get(CHANNELS.readCatalog)?.(
        { ...event, sender: { ...event.sender, id: 99 } },
        { protocolVersion: 1, libraryId: "library:test" },
      ),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "SERIES_UNAUTHORIZED" },
    });
    await expect(
      handlers.get(CHANNELS.readCatalog)?.(
        { ...event, senderFrame: {} },
        { protocolVersion: 1, libraryId: "library:test" },
      ),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "SERIES_UNAUTHORIZED" },
    });
  } finally {
    cleanup();
  }
});
