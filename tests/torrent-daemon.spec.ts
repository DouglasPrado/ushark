import { expect, test } from "@playwright/test";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { clearTimeout, setTimeout } from "node:timers";

type BValue = string | number | Buffer | BValue[] | { [key: string]: BValue };

function bencode(value: BValue): Buffer {
  if (Buffer.isBuffer(value))
    return Buffer.concat([Buffer.from(`${value.length}:`), value]);
  if (typeof value === "string") return bencode(Buffer.from(value));
  if (typeof value === "number") return Buffer.from(`i${value}e`);
  if (Array.isArray(value))
    return Buffer.concat([
      Buffer.from("l"),
      ...value.map(bencode),
      Buffer.from("e"),
    ]);
  return Buffer.concat([
    Buffer.from("d"),
    ...Object.keys(value)
      .sort((left, right) =>
        Buffer.compare(Buffer.from(left), Buffer.from(right)),
      )
      .flatMap((key) => [bencode(key), bencode(value[key])]),
    Buffer.from("e"),
  ]);
}

function torrentFixture() {
  return bencode({
    announce: "https://tracker.invalid/announce",
    info: {
      length: 80 * 1_024 * 1_024,
      name: "Horizonte.2024.1080p.mkv",
      "piece length": 4 * 1_024 * 1_024,
      pieces: Buffer.alloc(20 * 20, 5),
    },
  });
}

interface DaemonEvent {
  type: string;
  operationId: string;
  snapshot: {
    state: string;
    runtime?: { infoHash: string; torrentId: string };
    displayName?: string;
    totalFileCount: number;
    files: Array<{ name: string; kind: string }>;
    failure?: { code: string };
  };
}

interface DaemonClient {
  start(): Promise<{
    selectedProtocol: string;
    libtorrentVersion: string;
    capabilities: string[];
  }>;
  inspect(payload: Record<string, unknown>): Promise<{ operationId: string }>;
  cancel(operationId: string): Promise<{ status: string }>;
  get(operationId: string): Promise<{ state: string }>;
  describeStream(
    torrentId: string,
    fileId: string,
  ): Promise<{
    fileOffsetBytes: number;
    fileSizeBytes: number;
    pieceLengthBytes: number;
    firstPiece: number;
    lastPiece: number;
    selectedFilePriority: number;
    piecePriorityCounts: Record<string, number>;
  }>;
  applyStreamSchedule(payload: Record<string, unknown>): Promise<{
    applied: boolean;
    stale?: boolean;
    replay?: boolean;
    activeGeneration: number;
    appliedPieceCount?: number;
  }>;
  getStreamDelivery(streamSessionId: string): Promise<{
    ready: boolean;
    managedPath?: string;
    relativePath?: undefined;
  }>;
  stopStream(
    streamSessionId: string,
    seekGeneration: number,
  ): Promise<{ stopped: boolean }>;
  healthSample(
    torrentId: string,
    fileId: string,
  ): Promise<{
    connectedPeers: number;
    usefulPeers: number;
    wantedPieceAvailabilityMinimum: number;
    wantedPiecesAvailableRatio: number;
  }>;
  startDownload(
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
  downloadStatus(downloadId: string): Promise<Record<string, unknown>>;
  downloadCommand(
    downloadId: string,
    action: "pause" | "resume" | "cancel",
  ): Promise<Record<string, unknown>>;
  setDownloadPriority(
    downloadId: string,
    priority: number,
  ): Promise<Record<string, unknown>>;
  configureDownloads(
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
  saveDownloadResume(downloadId: string): Promise<Record<string, unknown>>;
  request(method: string, payload: object): Promise<unknown>;
  once(name: "event", listener: (event: DaemonEvent) => void): this;
  on(name: "event", listener: (event: DaemonEvent) => void): this;
  off(name: "event", listener: (event: DaemonEvent) => void): this;
  once(name: "exit", listener: (event: { expected: boolean }) => void): this;
  child?: { kill(signal?: NodeJS.Signals): boolean };
  stop(): Promise<void>;
}

const daemonModule = require("@ushark/core/torrent-daemon") as {
  PROTOCOL: string;
  ALLOWED_METHODS: Set<string>;
  TorrentDaemonClient: new (options: {
    pythonExecutable: string;
    pythonPath?: string;
    daemonScript: string;
    dataRoot: string;
    importRoot: string;
  }) => DaemonClient;
};
const inputModule = require("@ushark/core/torrent-input") as {
  TorrentInputStore: new (root: string) => {
    select(source: string): { selectionId: string };
    resolve(selectionId: string): { managedPath: string };
  };
};
const schedulerModule = require("@ushark/core/stream-scheduler") as {
  calculateStreamSchedule(input: Record<string, unknown>): {
    seekGeneration: number;
    mode: string;
    assignments: Array<Record<string, unknown>>;
    cache: Record<string, unknown>;
  };
};

function waitForEvent(
  client: DaemonClient,
  predicate: (event: DaemonEvent) => boolean,
) {
  return new Promise<DaemonEvent>((resolve, reject) => {
    const timeout = setTimeout(() => {
      client.off("event", listener);
      reject(new Error("timed out waiting for torrentd event"));
    }, 10_000);
    const listener = (event: DaemonEvent) => {
      if (!predicate(event)) return;
      clearTimeout(timeout);
      client.off("event", listener);
      resolve(event);
    };
    client.on("event", listener);
  });
}

test("M06 torrentd declara protocolo e allowlist mínimos", () => {
  const runtime = JSON.parse(
    fs.readFileSync(path.resolve("apps/torrentd/runtime.json"), "utf8"),
  );
  expect(runtime).toMatchObject({
    protocol: "ushark-torrentd/1",
    python: "3.12",
    libtorrent: "2.1.1",
  });
  expect(daemonModule.PROTOCOL).toBe(runtime.protocol);
  expect([...daemonModule.ALLOWED_METHODS].sort()).toEqual([
    "download.cancel",
    "download.configure",
    "download.pause",
    "download.removeData",
    "download.resume",
    "download.saveResume",
    "download.setPriority",
    "download.start",
    "download.status",
    "health.sample",
    "hello",
    "operation.cancel",
    "operation.get",
    "operation.getFiles",
    "runtime.shutdown",
    "stream.applySchedule",
    "stream.describe",
    "stream.getDelivery",
    "stream.stop",
    "torrent.inspect",
  ]);
});

const pythonExecutable = process.env.USHARK_TEST_PYTHON;
const pythonPath = process.env.USHARK_TEST_LIBTORRENT_PYTHONPATH;

test.describe("M06 torrentd com libtorrent real", () => {
  test.skip(
    !pythonExecutable || !pythonPath,
    "Requer CPython 3.12 e wheel libtorrent 2.1.1 verificado.",
  );

  test("faz handshake, inspeciona .torrent e reutiliza runtime por infoHash", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-torrentd-"));
    const imports = path.join(root, "imports");
    const source = path.join(root, "source.torrent");
    fs.writeFileSync(source, torrentFixture());
    const inputStore = new inputModule.TorrentInputStore(imports);
    const selection = inputStore.select(source);
    const managed = inputStore.resolve(selection.selectionId);
    const client = new daemonModule.TorrentDaemonClient({
      pythonExecutable: pythonExecutable!,
      pythonPath,
      daemonScript: path.resolve("apps/torrentd/torrentd.py"),
      dataRoot: path.join(root, "data"),
      importRoot: imports,
    });
    try {
      const hello = await client.start();
      expect(hello).toMatchObject({
        selectedProtocol: "ushark-torrentd/1",
        libtorrentVersion: "2.1.1.0",
      });
      expect(hello.capabilities).toContain("torrent-file-metadata");

      const firstEvent = waitForEvent(
        client,
        (event) =>
          event.operationId === "operation:first" &&
          event.type === "inspection.files-ready",
      );
      const first = await client.inspect({
        type: "torrent-file",
        path: managed.managedPath,
        inputLabel: "source.torrent",
        operationId: "operation:first",
        correlationId: "correlation:first",
      });
      expect(first.operationId).toBe("operation:first");
      const ready = await firstEvent;
      expect(ready.snapshot).toMatchObject({
        state: "files-ready",
        displayName: "Horizonte.2024.1080p.mkv",
        totalFileCount: 1,
        files: [{ name: "Horizonte.2024.1080p.mkv", kind: "video" }],
      });

      const secondEvent = waitForEvent(
        client,
        (event) =>
          event.operationId === "operation:second" &&
          event.type === "inspection.files-ready",
      );
      await client.inspect({
        type: "torrent-file",
        path: managed.managedPath,
        inputLabel: "source.torrent",
        operationId: "operation:second",
        correlationId: "correlation:second",
      });
      const second = await secondEvent;
      expect(second.snapshot.runtime).toEqual(ready.snapshot.runtime);
    } finally {
      await client.stop();
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test("aplica prioridades/deadlines reais e rejeita geração antiga", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-scheduler-"));
    const imports = path.join(root, "imports");
    const source = path.join(root, "source.torrent");
    fs.writeFileSync(source, torrentFixture());
    const inputStore = new inputModule.TorrentInputStore(imports);
    const managed = inputStore.resolve(inputStore.select(source).selectionId);
    const client = new daemonModule.TorrentDaemonClient({
      pythonExecutable: pythonExecutable!,
      pythonPath,
      daemonScript: path.resolve("apps/torrentd/torrentd.py"),
      dataRoot: path.join(root, "data"),
      importRoot: imports,
    });
    try {
      await client.start();
      const readyEvent = waitForEvent(
        client,
        (event) =>
          event.operationId === "operation:scheduler" &&
          event.type === "inspection.files-ready",
      );
      await client.inspect({
        type: "torrent-file",
        path: managed.managedPath,
        inputLabel: "source.torrent",
        operationId: "operation:scheduler",
        correlationId: "correlation:scheduler",
      });
      const ready = await readyEvent;
      const torrentId = ready.snapshot.runtime!.torrentId;
      const geometry = await client.describeStream(torrentId, "file:0");
      expect(geometry).toMatchObject({
        fileOffsetBytes: 0,
        fileSizeBytes: 80 * 1_024 * 1_024,
        pieceLengthBytes: 4 * 1_024 * 1_024,
        firstPiece: 0,
        lastPiece: 19,
        selectedFilePriority: 0,
      });
      const schedule = schedulerModule.calculateStreamSchedule({
        mode: "stream-only",
        ...geometry,
        durationSeconds: 800,
        positionSeconds: 400,
        seekGeneration: 2,
        bufferedSeconds: 0,
        tailRequired: true,
      });
      const payload = {
        torrentId,
        fileId: "file:0",
        streamSessionId: "stream:scheduler",
        seekGeneration: schedule.seekGeneration,
        mode: schedule.mode,
        assignments: schedule.assignments,
        cache: schedule.cache,
      };
      const applied = await client.applyStreamSchedule(payload);
      expect(applied).toMatchObject({
        applied: true,
        activeGeneration: 2,
        appliedPieceCount: schedule.assignments.length,
      });
      const actual = await client.describeStream(torrentId, "file:0");
      expect(actual.selectedFilePriority).toBe(1);
      expect(
        Number(actual.piecePriorityCounts["7"] ?? 0),
        JSON.stringify(actual),
      ).toBeGreaterThan(0);
      await expect(
        client.healthSample(torrentId, "file:0"),
      ).resolves.toMatchObject({
        connectedPeers: 0,
        usefulPeers: 0,
        wantedPieceAvailabilityMinimum: 0,
        wantedPiecesAvailableRatio: 0,
      });

      await expect(
        client.applyStreamSchedule({ ...payload, seekGeneration: 1 }),
      ).resolves.toMatchObject({
        applied: false,
        stale: true,
        activeGeneration: 2,
      });
      await expect(client.applyStreamSchedule(payload)).resolves.toMatchObject({
        applied: false,
        replay: true,
        activeGeneration: 2,
      });
      await expect(
        client.applyStreamSchedule({
          ...payload,
          assignments: schedule.assignments.slice(1),
        }),
      ).rejects.toMatchObject({ code: "STREAM_CONFLICT" });

      const delivery = await client.getStreamDelivery("stream:scheduler");
      expect(delivery).toMatchObject({ ready: false });
      expect(delivery.relativePath).toBeUndefined();
      if (delivery.managedPath)
        expect(
          path.relative(
            fs.realpathSync(path.join(root, "data")),
            delivery.managedPath,
          ),
        ).not.toMatch(/^\.\./);
      await expect(client.stopStream("stream:scheduler", 2)).resolves.toEqual({
        streamSessionId: "stream:scheduler",
        stopped: true,
      });
      await expect(client.stopStream("stream:scheduler", 2)).resolves.toEqual({
        streamSessionId: "stream:scheduler",
        stopped: false,
      });
      await expect(
        client.describeStream(torrentId, "file:0"),
      ).resolves.toMatchObject({
        selectedFilePriority: 0,
      });
    } finally {
      await client.stop();
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test("gerencia download, limites e resume data real sem apagar catálogo", async () => {
    const root = fs.mkdtempSync(
      path.join(os.tmpdir(), "ushark-download-runtime-"),
    );
    const imports = path.join(root, "imports");
    const source = path.join(root, "source.torrent");
    fs.writeFileSync(source, torrentFixture());
    const inputStore = new inputModule.TorrentInputStore(imports);
    const managed = inputStore.resolve(inputStore.select(source).selectionId);
    const client = new daemonModule.TorrentDaemonClient({
      pythonExecutable: pythonExecutable!,
      pythonPath,
      daemonScript: path.resolve("apps/torrentd/torrentd.py"),
      dataRoot: path.join(root, "data"),
      importRoot: imports,
    });
    try {
      await client.start();
      const event = waitForEvent(
        client,
        (value) =>
          value.operationId === "operation:download" &&
          value.type === "inspection.files-ready",
      );
      await client.inspect({
        type: "torrent-file",
        path: managed.managedPath,
        inputLabel: "source.torrent",
        operationId: "operation:download",
        correlationId: "correlation:download",
      });
      const ready = await event;
      const torrentId = ready.snapshot.runtime!.torrentId;
      await expect(
        client.configureDownloads({
          downloadLimitBytesPerSecond: 8 * 1024 ** 2,
          uploadLimitBytesPerSecond: 1024 ** 2,
          playbackActive: true,
        }),
      ).resolves.toMatchObject({
        effectiveDownloadLimitBytesPerSecond: 2 * 1024 ** 2,
        playbackActive: true,
      });
      await expect(
        client.startDownload({
          downloadId: "download:runtime:test",
          torrentId,
          fileId: "file:0",
          priority: 2,
        }),
      ).resolves.toMatchObject({
        state: "downloading",
        bytesTotal: 80 * 1024 ** 2,
        priority: 2,
      });
      await expect(
        client.downloadStatus("download:runtime:test"),
      ).resolves.toMatchObject({ state: "downloading", connectedPeers: 0 });
      await expect(
        client.downloadCommand("download:runtime:test", "pause"),
      ).resolves.toMatchObject({ state: "paused" });
      await expect(
        client.saveDownloadResume("download:runtime:test"),
      ).resolves.toMatchObject({ resumeVersion: 1, saved: true });
      expect(
        fs.statSync(
          path.join(root, "data", "resume", `${torrentId.slice(8)}.resume`),
        ).size,
      ).toBeGreaterThan(0);
      await expect(
        client.downloadCommand("download:runtime:test", "resume"),
      ).resolves.toMatchObject({ state: "downloading" });
      await expect(
        client.downloadCommand("download:runtime:test", "cancel"),
      ).resolves.toMatchObject({ state: "cancelled" });
    } finally {
      await client.stop();
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test("rejeita handshake sem o secret efêmero do processo pai", async () => {
    const root = fs.mkdtempSync(
      path.join(os.tmpdir(), "ushark-torrentd-auth-"),
    );
    const daemonScript = path.resolve("apps/torrentd/torrentd.py");
    const child = spawn(
      pythonExecutable!,
      [
        "-I",
        "-c",
        "import runpy,sys;sys.path.insert(0,sys.argv[1]);runpy.run_path(sys.argv[2],run_name='__main__')",
        pythonPath!,
        daemonScript,
      ],
      {
        cwd: root,
        env: {
          ...process.env,
          USHARK_TORRENTD_SECRET: "a".repeat(64),
          USHARK_TORRENTD_DATA_ROOT: path.join(root, "data"),
          USHARK_TORRENTD_IMPORT_ROOT: path.join(root, "imports"),
        },
        shell: false,
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
    try {
      const response = new Promise<Record<string, unknown>>(
        (resolve, reject) => {
          let output = "";
          const timeout = setTimeout(
            () => reject(new Error("torrentd auth timeout")),
            5_000,
          );
          child.stdout.on("data", (chunk: Buffer) => {
            output += chunk.toString("utf8");
            const newline = output.indexOf("\n");
            if (newline < 0) return;
            clearTimeout(timeout);
            resolve(JSON.parse(output.slice(0, newline)));
          });
        },
      );
      child.stdin.write(
        `${JSON.stringify({
          protocolVersion: "ushark-torrentd/1",
          requestId: "request:unauthorized",
          method: "hello",
          payload: { supportedProtocols: ["ushark-torrentd/1"] },
          secret: "b".repeat(64),
        })}\n`,
      );
      await expect(response).resolves.toMatchObject({
        ok: false,
        error: { code: "TORRENT_UNAUTHORIZED" },
      });
    } finally {
      child.stdin.end();
      child.kill();
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test("cancela resolução magnet sem bloquear o Core", async () => {
    const root = fs.mkdtempSync(
      path.join(os.tmpdir(), "ushark-torrentd-cancel-"),
    );
    const client = new daemonModule.TorrentDaemonClient({
      pythonExecutable: pythonExecutable!,
      pythonPath,
      daemonScript: path.resolve("apps/torrentd/torrentd.py"),
      dataRoot: path.join(root, "data"),
      importRoot: path.join(root, "imports"),
    });
    try {
      await client.start();
      const cancelledEvent = waitForEvent(
        client,
        (event) =>
          event.operationId === "operation:cancel" &&
          event.type === "inspection.cancelled",
      );
      await client.inspect({
        type: "magnet",
        magnet:
          "magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567&dn=NoPeers",
        inputLabel: "NoPeers · 01234567",
        operationId: "operation:cancel",
        correlationId: "correlation:cancel",
        softTimeoutMs: 100,
        hardTimeoutMs: 5_000,
      });
      await expect(client.cancel("operation:cancel")).resolves.toMatchObject({
        status: "cancelled",
      });
      await expect(cancelledEvent).resolves.toMatchObject({
        snapshot: {
          state: "cancelled",
          failure: { code: "TORRENT_CANCELLED" },
        },
      });
      await expect(client.request("torrent.shell", {})).rejects.toMatchObject({
        code: "TORRENT_UNAUTHORIZED",
      });
    } finally {
      await client.stop();
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test("crash do daemon é isolado e o cliente reporta indisponibilidade", async () => {
    const root = fs.mkdtempSync(
      path.join(os.tmpdir(), "ushark-torrentd-crash-"),
    );
    const client = new daemonModule.TorrentDaemonClient({
      pythonExecutable: pythonExecutable!,
      pythonPath,
      daemonScript: path.resolve("apps/torrentd/torrentd.py"),
      dataRoot: path.join(root, "data"),
      importRoot: path.join(root, "imports"),
    });
    try {
      await client.start();
      const exited = new Promise<{ expected: boolean }>((resolve) =>
        client.once("exit", resolve),
      );
      expect(client.child?.kill("SIGKILL")).toBe(true);
      await expect(exited).resolves.toEqual({
        code: null,
        signal: "SIGKILL",
        expected: false,
      });
      await expect(client.get("operation:after-crash")).rejects.toMatchObject({
        code: "TORRENT_DAEMON_UNAVAILABLE",
        retryable: true,
      });
    } finally {
      await client.stop();
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
