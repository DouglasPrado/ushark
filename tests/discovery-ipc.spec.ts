import { expect, test } from "@playwright/test";

const {
  CHANNELS,
  publishDiscoveryEvent,
  registerDiscoveryIpc,
}: {
  CHANNELS: Record<string, string>;
  publishDiscoveryEvent(getWindow: () => OwnerWindow, value: unknown): void;
  registerDiscoveryIpc(options: {
    ipcMain: {
      handle(channel: string, handler: IpcHandler): void;
      removeHandler(channel: string): void;
    };
    getService(): Record<string, (payload: unknown) => Promise<unknown>>;
    getWindow(): OwnerWindow;
  }): () => void;
} = require("../apps/desktop/src/main/discovery-ipc.cjs");

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
  webContents: {
    id: number;
    isDestroyed(): boolean;
    send(channel: string, value: unknown): void;
  };
};

function fixture() {
  const handlers = new Map<string, IpcHandler>();
  const calls: Array<{ operation: string; payload: unknown }> = [];
  const sent: Array<{ channel: string; value: unknown }> = [];
  const mainFrame = {};
  const event = { sender: { id: 41, mainFrame }, senderFrame: mainFrame };
  const service = Object.fromEntries(
    [
      "readHome",
      "search",
      "readScope",
      "cancelRequest",
      "rebuildSearchIndex",
    ].map((operation) => [
      operation,
      async (payload: unknown) => {
        calls.push({ operation, payload });
        return { ok: true, value: { operation } };
      },
    ]),
  );
  const owner: OwnerWindow = {
    isDestroyed: () => false,
    webContents: {
      id: 41,
      isDestroyed: () => false,
      send: (channel, value) => sent.push({ channel, value }),
    },
  };
  const cleanup = registerDiscoveryIpc({
    ipcMain: {
      handle: (channel, handler) => handlers.set(channel, handler),
      removeHandler: (channel) => handlers.delete(channel),
    },
    getService: () => service,
    getWindow: () => owner,
  });
  return { handlers, calls, sent, event, owner, cleanup };
}

test("M04 IPC expõe somente o protocolo v1 e encaminha busca validada", async () => {
  const { handlers, calls, event, cleanup } = fixture();
  try {
    expect([...handlers.keys()].sort()).toEqual(
      Object.values(CHANNELS)
        .filter((channel) => channel !== CHANNELS.event)
        .sort(),
    );
    await expect(
      handlers.get(CHANNELS.search)?.(event, {
        protocolVersion: 1,
        libraryId: "library:test",
        query: "historia",
        favorite: true,
        cursor: { value: "opaque" },
        limit: 24,
        requestId: "request:test",
      }),
    ).resolves.toMatchObject({ ok: true, value: { operation: "search" } });
    expect(calls).toEqual([
      {
        operation: "search",
        payload: {
          libraryId: "library:test",
          query: "historia",
          type: undefined,
          favorite: true,
          recent: undefined,
          continuing: undefined,
          genre: undefined,
          collectionId: undefined,
          scopeId: undefined,
          cursor: { value: "opaque" },
          limit: 24,
          requestId: "request:test",
        },
      },
    ]);
    await expect(
      handlers.get(CHANNELS.readHome)?.(event, {
        protocolVersion: 1,
        libraryId: "library:test",
        absolutePath: "/não/autorizado",
      }),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "DISCOVERY_INVALID" },
    });
  } finally {
    cleanup();
  }
});

test("M04 IPC rejeita protocolo, sender e frame e publica invalidação segura", async () => {
  const { handlers, sent, event, owner, cleanup } = fixture();
  try {
    await expect(
      handlers.get(CHANNELS.readHome)?.(event, {
        protocolVersion: 2,
        libraryId: "library:test",
      }),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "DISCOVERY_PROTOCOL_UNSUPPORTED" },
    });
    await expect(
      handlers.get(CHANNELS.readHome)?.(
        { ...event, sender: { ...event.sender, id: 99 } },
        { protocolVersion: 1, libraryId: "library:test" },
      ),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "DISCOVERY_UNAUTHORIZED" },
    });
    await expect(
      handlers.get(CHANNELS.readHome)?.(
        { ...event, senderFrame: {} },
        { protocolVersion: 1, libraryId: "library:test" },
      ),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "DISCOVERY_UNAUTHORIZED" },
    });
    const value = { revision: 8, contentIds: ["movie:test"] };
    publishDiscoveryEvent(() => owner, value);
    expect(sent).toEqual([{ channel: CHANNELS.event, value }]);
  } finally {
    cleanup();
  }
});
