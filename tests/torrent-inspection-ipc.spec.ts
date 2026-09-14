import { expect, test } from "@playwright/test";
import { EventEmitter } from "node:events";

const {
  CHANNELS,
  EVENT_CHANNEL,
  registerTorrentInspectionIpc,
}: {
  CHANNELS: Record<string, string>;
  EVENT_CHANNEL: string;
  registerTorrentInspectionIpc(options: {
    ipcMain: {
      handle(channel: string, handler: IpcHandler): void;
      removeHandler(channel: string): void;
    };
    dialog: {
      showOpenDialog(): Promise<{ canceled: boolean; filePaths: string[] }>;
    };
    getService(): Service;
    getWindow(): OwnerWindow;
  }): () => void;
} = require("../apps/desktop/src/main/torrent-inspection-ipc.cjs");

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
  webContents: { id: number; send(channel: string, value: unknown): void };
};
type Service = EventEmitter &
  Record<string, unknown> & {
    __usharkTorrentEventListener?: (event: unknown) => void;
  };

function fixture() {
  const handlers = new Map<string, IpcHandler>();
  const calls: Array<{ operation: string; payload: unknown }> = [];
  const sent: Array<{ channel: string; value: unknown }> = [];
  const mainFrame = {};
  const event = { sender: { id: 31, mainFrame }, senderFrame: mainFrame };
  const service = new EventEmitter() as Service;
  for (const operation of Object.keys(CHANNELS))
    service[operation] = async (payload: unknown) => {
      calls.push({ operation, payload });
      return { ok: true, value: { operation } };
    };
  const cleanup = registerTorrentInspectionIpc({
    ipcMain: {
      handle: (channel, handler) => handlers.set(channel, handler),
      removeHandler: (channel) => handlers.delete(channel),
    },
    dialog: {
      showOpenDialog: async () => ({ canceled: true, filePaths: [] }),
    },
    getService: () => service,
    getWindow: () => ({
      isDestroyed: () => false,
      webContents: {
        id: 31,
        send: (channel, value) => sent.push({ channel, value }),
      },
    }),
  });
  return { handlers, calls, sent, event, service, cleanup };
}

test("M06 IPC expõe allowlist v1 e encaminha somente DTO validado", async () => {
  const { handlers, calls, event, cleanup } = fixture();
  try {
    expect([...handlers.keys()].sort()).toEqual(Object.values(CHANNELS).sort());
    await expect(
      handlers.get(CHANNELS.start)?.(event, {
        protocolVersion: 1,
        input: { type: "magnet", magnet: "magnet:?xt=urn:btih:test" },
        correlationId: "correlation:test",
        mutation: { idempotencyKey: "mutation:test" },
      }),
    ).resolves.toMatchObject({ ok: true, value: { operation: "start" } });
    expect(calls).toContainEqual({
      operation: "start",
      payload: {
        input: { type: "magnet", magnet: "magnet:?xt=urn:btih:test" },
        correlationId: "correlation:test",
        mutation: { idempotencyKey: "mutation:test" },
      },
    });
    await expect(
      handlers.get(CHANNELS.confirm)?.(event, {
        protocolVersion: 1,
        operationId: "operation:test",
        contentId: "movie:test",
        selector: { type: "manual", fileId: "file:0" },
        mutation: { idempotencyKey: "mutation:confirm" },
        path: "/arbitrary/file",
      }),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "TORRENT_INPUT_INVALID" },
    });
  } finally {
    cleanup();
  }
});

test("M06 IPC restringe sender/frame e entrega eventos só à janela dona", async () => {
  const { handlers, sent, event, service, cleanup } = fixture();
  try {
    await handlers.get(CHANNELS.listPending)?.(event, { protocolVersion: 1 });
    const torrentEvent = { type: "inspection.files-ready" };
    service.emit("event", torrentEvent);
    expect(sent).toEqual([{ channel: EVENT_CHANNEL, value: torrentEvent }]);

    await expect(
      handlers.get(CHANNELS.get)?.(
        { ...event, sender: { ...event.sender, id: 99 } },
        { protocolVersion: 1, operationId: "operation:test" },
      ),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "TORRENT_UNAUTHORIZED" },
    });
    await expect(
      handlers.get(CHANNELS.get)?.(
        { ...event, senderFrame: {} },
        { protocolVersion: 1, operationId: "operation:test" },
      ),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "TORRENT_UNAUTHORIZED" },
    });
  } finally {
    cleanup();
  }
});
