import { expect, test } from "@playwright/test";
/* eslint-disable @typescript-eslint/no-explicit-any */

const {
  CHANNELS,
  publishSourceSelectionEvent,
  registerSourceSelectionIpc,
} = require("../apps/desktop/src/main/source-selection-ipc.cjs");

type Handler = (event: any, payload: Record<string, unknown>) => Promise<any>;

function fixture() {
  const handlers = new Map<string, Handler>();
  const calls: any[] = [];
  const sent: any[] = [];
  const frame = {};
  const event = { sender: { id: 7, mainFrame: frame }, senderFrame: frame };
  const service = new Proxy(
    {},
    {
      get: (_target, operation: string) => async (payload: unknown) => {
        calls.push({ operation, payload });
        return { ok: true, value: {} };
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
  const cleanup = registerSourceSelectionIpc({
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

test("M08 S05 IPC restringe protocolo, payload e sender principal", async () => {
  const { handlers, calls, event, cleanup } = fixture();
  const payload = {
    protocolVersion: 1,
    requestId: "request:one",
    contentId: "movie:one",
    candidates: [],
    strategy: "balanced",
    resolutionLimit: "1080p",
    context: "details",
  };
  try {
    expect([...handlers.keys()].sort()).toEqual(
      Object.values(CHANNELS)
        .filter((channel) => channel !== CHANNELS.event)
        .sort(),
    );
    await expect(
      handlers.get(CHANNELS.preflight)!(event, payload),
    ).resolves.toMatchObject({ ok: true });
    expect(calls).toContainEqual({ operation: "preflight", payload });
    await expect(
      handlers.get(CHANNELS.preflight)!(event, {
        ...payload,
        path: "/private/torrent",
      }),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "SELECTION_INVALID" },
    });
    await expect(
      handlers.get(CHANNELS.preflight)!(
        { ...event, sender: { ...event.sender, id: 99 } },
        payload,
      ),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "SELECTION_UNAUTHORIZED" },
    });
  } finally {
    cleanup();
  }
});

test("M08 S05 evento público transporta apenas snapshot agregado", () => {
  const { sent, owner, cleanup } = fixture();
  try {
    const event = {
      protocolVersion: 1,
      type: "selection.ready",
      snapshot: { requestId: "request:one", ranked: [] },
    };
    publishSourceSelectionEvent(() => owner, event);
    expect(sent).toEqual([{ channel: CHANNELS.event, value: event }]);
    expect(JSON.stringify(sent)).not.toContain("bitfield");
    expect(JSON.stringify(sent)).not.toContain("/private/");
  } finally {
    cleanup();
  }
});
