import { expect, test } from "@playwright/test";

const {
  CHANNELS,
  publishPlaybackEvent,
  registerPlaybackIpc,
} = require("../apps/desktop/src/main/playback-ipc.cjs");

type Handler = (
  event: Event,
  payload: Record<string, unknown>,
) => Promise<unknown>;
type Event = { sender: { id: number; mainFrame: object }; senderFrame: object };

function fixture() {
  const handlers = new Map<string, Handler>();
  const calls: Array<{ operation: string; payload: unknown }> = [];
  const sent: Array<{ channel: string; value: unknown }> = [];
  const frame = {};
  const event = { sender: { id: 8, mainFrame: frame }, senderFrame: frame };
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
      id: 8,
      isDestroyed: () => false,
      send: (channel: string, value: unknown) => sent.push({ channel, value }),
    },
  };
  const cleanup = registerPlaybackIpc({
    ipcMain: {
      handle: (channel: string, handler: Handler) =>
        handlers.set(channel, handler),
      removeHandler: (channel: string) => handlers.delete(channel),
    },
    dialog: {
      showOpenDialog: async () => ({ canceled: true, filePaths: [] }),
    },
    getService: () => service,
    getWindow: () => owner,
  });
  return { handlers, calls, sent, event, owner, cleanup };
}

test("M05 S05 IPC mantém allowlist, protocolo e sender principal", async () => {
  const { handlers, calls, event, cleanup } = fixture();
  try {
    expect([...handlers.keys()].sort()).toEqual(
      Object.values(CHANNELS)
        .filter((channel) => channel !== CHANNELS.event)
        .sort(),
    );
    await expect(
      handlers.get(CHANNELS.seek)?.(event, {
        protocolVersion: 1,
        sessionId: "session:test",
        positionSeconds: 42,
        mutation: { idempotencyKey: "seek:test" },
      }),
    ).resolves.toMatchObject({ ok: true });
    expect(calls).toContainEqual({
      operation: "seek",
      payload: {
        protocolVersion: 1,
        sessionId: "session:test",
        positionSeconds: 42,
        mutation: { idempotencyKey: "seek:test" },
      },
    });
    await expect(
      handlers.get(CHANNELS.seek)?.(event, {
        protocolVersion: 1,
        sessionId: "session:test",
        path: "/private/media.mp4",
      }),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "PLAYBACK_INVALID" },
    });
    await expect(
      handlers.get(CHANNELS.seek)?.(
        { ...event, sender: { ...event.sender, id: 99 } },
        { protocolVersion: 1, sessionId: "session:test" },
      ),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "PLAYBACK_UNAUTHORIZED" },
    });
  } finally {
    cleanup();
  }
});

test("M05 S05 evento público não carrega caminho local", () => {
  const { sent, owner, cleanup } = fixture();
  try {
    const event = {
      protocolVersion: 1,
      type: "position",
      session: { sessionId: "session:test" },
    };
    publishPlaybackEvent(() => owner, event);
    expect(sent).toEqual([{ channel: CHANNELS.event, value: event }]);
    expect(JSON.stringify(sent)).not.toContain("/private/");
  } finally {
    cleanup();
  }
});
