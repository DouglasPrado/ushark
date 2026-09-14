import { expect, test } from "@playwright/test";

const {
  CHANNELS,
  publishStreamEvent,
  registerStreamIpc,
} = require("../apps/desktop/src/main/stream-ipc.cjs");

type Handler = (
  event: IpcEvent,
  payload: Record<string, unknown>,
) => Promise<unknown>;
type IpcEvent = {
  sender: { id: number; mainFrame: object };
  senderFrame: object;
};

function fixture() {
  const handlers = new Map<string, Handler>();
  const calls: Array<{ operation: string; payload: unknown }> = [];
  const sent: Array<{ channel: string; value: unknown }> = [];
  const frame = {};
  const event = { sender: { id: 7, mainFrame: frame }, senderFrame: frame };
  const service = new Proxy(
    {},
    {
      get: (_target, operation: string) => async (payload: unknown) => {
        calls.push({ operation, payload });
        return { ok: true, value: { operation } };
      },
    },
  );
  const owner = {
    isDestroyed: () => false,
    webContents: {
      id: 7,
      isDestroyed: () => false,
      send: (channel: string, value: unknown) => sent.push({ channel, value }),
    },
  };
  const cleanup = registerStreamIpc({
    ipcMain: {
      handle: (channel: string, handler: Handler) =>
        handlers.set(channel, handler),
      removeHandler: (channel: string) => handlers.delete(channel),
    },
    getService: () => service,
    getWindow: () => owner,
  });
  return { handlers, calls, sent, event, owner, cleanup };
}

test("M07 S05 IPC aplica protocolo, allowlist e sender principal", async () => {
  const { handlers, calls, event, cleanup } = fixture();
  try {
    expect([...handlers.keys()].sort()).toEqual(
      Object.values(CHANNELS)
        .filter((channel) => channel !== CHANNELS.event)
        .sort(),
    );
    const payload = {
      protocolVersion: 1,
      streamSessionId: "stream:test",
      positionSeconds: 90,
      seekGeneration: 2,
      mutation: { idempotencyKey: "seek:test" },
    };
    await expect(
      handlers.get(CHANNELS.seek)?.(event, payload),
    ).resolves.toMatchObject({ ok: true });
    expect(calls).toContainEqual({ operation: "seek", payload });
    await expect(
      handlers.get(CHANNELS.seek)?.(event, {
        ...payload,
        path: "/private/media.mp4",
      }),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "STREAM_INVALID" },
    });
    await expect(
      handlers.get(CHANNELS.seek)?.(
        { ...event, sender: { ...event.sender, id: 99 } },
        payload,
      ),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "STREAM_UNAUTHORIZED" },
    });
  } finally {
    cleanup();
  }
});

test("M07 S05 evento público não expõe path nem pieces", () => {
  const { sent, owner, cleanup } = fixture();
  try {
    const event = {
      protocolVersion: 1,
      type: "stream.ready",
      snapshot: { streamSessionId: "stream:test", positionSeconds: 12 },
    };
    publishStreamEvent(() => owner, event);
    expect(sent).toEqual([{ channel: CHANNELS.event, value: event }]);
    expect(JSON.stringify(sent)).not.toContain("/private/");
    expect(JSON.stringify(sent)).not.toContain("piece");
  } finally {
    cleanup();
  }
});
