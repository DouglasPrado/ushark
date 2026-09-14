import { expect, test } from "@playwright/test";

const {
  CHANNELS,
  registerConfigurationIpc,
}: {
  CHANNELS: Record<string, string>;
  registerConfigurationIpc(options: {
    ipcMain: {
      handle(channel: string, handler: IpcHandler): void;
      removeHandler(channel: string): void;
    };
    dialog: { showOpenDialog(): Promise<unknown> };
    getStore(): Store;
    getWindow(): OwnerWindow;
  }): () => void;
} = require("../apps/desktop/src/main/configuration-ipc.cjs");

type IpcHandler = (
  event: IpcEvent,
  payload: Record<string, unknown>,
) => unknown;
type IpcEvent = {
  sender: { id: number; mainFrame: object };
  senderFrame: object;
};
type OwnerWindow = {
  isDestroyed(): boolean;
  webContents: { id: number };
};
type Store = {
  read(): object;
  save(value: unknown, options: unknown): object;
  resetPlayback(): object;
};

function fixture() {
  const handlers = new Map<string, IpcHandler>();
  const mainFrame = {};
  const event = { sender: { id: 7, mainFrame }, senderFrame: mainFrame };
  const store: Store = {
    read: () => ({ schemaVersion: 1, completed: false, configuration: {} }),
    save: (value, options) => ({ value, options }),
    resetPlayback: () => ({ reset: true }),
  };
  const cleanup = registerConfigurationIpc({
    ipcMain: {
      handle: (channel, handler) => handlers.set(channel, handler),
      removeHandler: (channel) => handlers.delete(channel),
    },
    dialog: { showOpenDialog: async () => ({ canceled: true, filePaths: [] }) },
    getStore: () => store,
    getWindow: () => ({
      isDestroyed: () => false,
      webContents: { id: 7 },
    }),
  });
  return { handlers, event, cleanup };
}

test("IPC expõe somente a allowlist versionada e valida payload", async () => {
  const { handlers, event, cleanup } = fixture();
  try {
    expect([...handlers.keys()].sort()).toEqual(Object.values(CHANNELS).sort());
    await expect(
      handlers.get(CHANNELS.read)?.(event, { protocolVersion: 1 }),
    ).resolves.toMatchObject({ ok: true, value: { schemaVersion: 1 } });
    await expect(
      handlers.get(CHANNELS.save)?.(event, {
        protocolVersion: 1,
        value: {},
        options: { completeOnboarding: "yes" },
      }),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "CONFIG_INVALID" },
    });
    await expect(
      handlers.get(CHANNELS.save)?.(event, {
        protocolVersion: 1,
        value: {},
        options: { completeOnboarding: true, arbitrary: true },
      }),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "CONFIG_INVALID" },
    });
    await expect(
      handlers.get(CHANNELS.chooseDirectory)?.(event, {
        protocolVersion: 1,
        kind: "arbitrary-filesystem",
      }),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "CONFIG_INVALID" },
    });
  } finally {
    cleanup();
  }
});

test("IPC rejeita protocolo desconhecido e sender não autorizado", async () => {
  const { handlers, event, cleanup } = fixture();
  try {
    await expect(
      handlers.get(CHANNELS.read)?.(event, { protocolVersion: 99 }),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "CONFIG_PROTOCOL_UNSUPPORTED" },
    });
    await expect(
      handlers.get(CHANNELS.read)?.(
        { ...event, sender: { ...event.sender, id: 8 } },
        { protocolVersion: 1 },
      ),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "CONFIG_UNAUTHORIZED" },
    });
  } finally {
    cleanup();
  }
});
