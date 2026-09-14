import { expect, test } from "@playwright/test";
/* eslint-disable @typescript-eslint/no-explicit-any -- typed facades do not exist for the CommonJS integration harness */
import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

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

function torrentFor(content: Buffer, name: string) {
  const pieceLength = 1024 * 1024;
  const hashes: Buffer[] = [];
  for (let offset = 0; offset < content.length; offset += pieceLength)
    hashes.push(
      createHash("sha1")
        .update(content.subarray(offset, offset + pieceLength))
        .digest(),
    );
  return bencode({
    info: {
      length: content.length,
      name,
      "piece length": pieceLength,
      pieces: Buffer.concat(hashes),
    },
  });
}

function seederPort(child: ReturnType<typeof spawn>) {
  return new Promise<number>((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(
      () => reject(new Error("seeder timeout")),
      5_000,
    );
    child.once("error", reject);
    child.stdout!.on("data", (chunk) => {
      output += chunk.toString("utf8");
      const line = output.split(/\r?\n/, 1)[0];
      if (!/^\d+$/.test(line)) return;
      clearTimeout(timeout);
      resolve(Number(line));
    });
    child.stderr!.on("data", (chunk) => {
      output += chunk.toString("utf8");
    });
  });
}

function waitForEvent(
  service: {
    subscribe(listener: (event: Record<string, any>) => void): () => void;
  },
  predicate: (event: Record<string, any>) => boolean,
  timeoutMs = 20_000,
) {
  return new Promise<Record<string, any>>((resolve, reject) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      reject(new Error("stream event timeout"));
    }, timeoutMs);
    const unsubscribe = service.subscribe((event) => {
      if (!predicate(event)) return;
      clearTimeout(timeout);
      unsubscribe();
      resolve(event);
    });
  });
}

const pythonExecutable =
  "/Users/douglasprado/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3";
const pythonPath = process.env.USHARK_TEST_LIBTORRENT_PYTHONPATH;
const runtimeAvailable =
  fs.existsSync(pythonExecutable) &&
  Boolean(pythonPath) &&
  fs.existsSync("/opt/homebrew/bin/ffmpeg") &&
  fs.existsSync("/opt/homebrew/bin/mpv");

test("M07 S05 swarm local toca antes de completar, busca fora do cache e mantém última geração", async () => {
  test.setTimeout(120_000);
  test.skip(
    !runtimeAvailable,
    "Requer CPython/libtorrent, FFmpeg e MPV locais verificados.",
  );
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-stream-real-"));
  const seedRoot = path.join(root, "seed");
  const importRoot = path.join(root, "imports");
  const dataRoot = path.join(root, "leech");
  fs.mkdirSync(seedRoot, { recursive: true });
  const mediaName = "m07-controlled.mp4";
  const mediaPath = path.join(seedRoot, mediaName);
  execFileSync("/opt/homebrew/bin/ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-f",
    "lavfi",
    "-i",
    "testsrc2=size=640x360:rate=24",
    "-f",
    "lavfi",
    "-i",
    "sine=frequency=440:sample_rate=48000",
    "-t",
    "240",
    "-c:v",
    "libx264",
    "-b:v",
    "6M",
    "-minrate",
    "6M",
    "-maxrate",
    "6M",
    "-bufsize",
    "12M",
    "-x264-params",
    "nal-hrd=cbr:force-cfr=1",
    "-g",
    "24",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-movflags",
    "+faststart",
    "-y",
    mediaPath,
  ]);
  const media = fs.readFileSync(mediaPath);
  expect(media.length).toBeGreaterThan(32 * 1024 * 1024);

  const torrentPath = path.join(root, "controlled.torrent");
  fs.writeFileSync(torrentPath, torrentFor(media, mediaName));

  const seederScript = path.resolve("tests/fixtures/libtorrent-seeder.py");
  const connectFile = path.join(root, "leecher-port.txt");
  const seeder = spawn(
    pythonExecutable,
    [
      "-I",
      "-c",
      "import runpy,sys;p=sys.argv[1];f=sys.argv[2];sys.path.insert(0,p);sys.argv=[f,*sys.argv[3:]];runpy.run_path(f,run_name='__main__')",
      pythonPath!,
      seederScript,
      torrentPath,
      seedRoot,
      String(32 * 1024 * 1024),
      connectFile,
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  let seederLog = "";
  seeder.stderr.on("data", (chunk) => {
    seederLog = `${seederLog}${chunk.toString("utf8")}`.slice(-4_096);
  });
  await seederPort(seeder);

  const { TorrentInputStore } = require("@ushark/core/torrent-input") as any;
  const { TorrentDaemonClient } = require("@ushark/core/torrent-daemon") as any;
  const { MpvAdapter } = require("@ushark/core/mpv-adapter") as any;
  const { ProgressiveStreamApplicationService } =
    require("@ushark/core/progressive-stream-service") as any;
  const inputStore = new TorrentInputStore(importRoot);
  const managed = inputStore.resolve(
    inputStore.select(torrentPath).selectionId,
  );
  const daemon = new TorrentDaemonClient({
    pythonExecutable,
    pythonPath,
    daemonScript: path.resolve("apps/torrentd/torrentd.py"),
    dataRoot,
    importRoot,
    requestTimeoutMs: 10_000,
  });
  let service: any;
  try {
    await daemon.start();
    const operationId = "operation:m07-real";
    const filesReady = new Promise<Record<string, any>>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("metadata timeout")),
        10_000,
      );
      daemon.on("event", (event: Record<string, any>) => {
        if (
          event.operationId === operationId &&
          event.type === "inspection.files-ready"
        ) {
          clearTimeout(timeout);
          resolve(event.snapshot);
        }
      });
    });
    await daemon.inspect({
      type: "torrent-file",
      path: managed.managedPath,
      inputLabel: "controlled.torrent",
      operationId,
      correlationId: "correlation:m07-real",
    });
    const inspected = await filesReady;
    const torrentId = inspected.runtime.torrentId;
    const initialGeometry = await daemon.describeStream(torrentId, "file:0");
    fs.writeFileSync(connectFile, String(initialGeometry.listenPort));
    const playerEvents: Array<Record<string, unknown>> = [];
    service = new ProgressiveStreamApplicationService({
      daemon,
      sourceResolver: {
        resolve: async () => ({ torrentId, fileId: "file:0" }),
      },
      playerFactory: () => {
        const adapter = new MpvAdapter({
          executable: "/opt/homebrew/bin/mpv",
          ipcRoot: "/tmp/ushark-m07-real-ipc",
          extraArgs: ["--vo=null", "--ao=null", "--really-quiet"],
          commandTimeoutMs: 2_000,
          startupTimeoutMs: 5_000,
        });
        adapter.on("event", (event: Record<string, unknown>) =>
          playerEvents.push(event),
        );
        return adapter;
      },
    });
    const serviceLog: Array<Record<string, any>> = [];
    service.subscribe((event: Record<string, any>) => serviceLog.push(event));
    const startedAt = Date.now();
    const ready = waitForEvent(service, (event) =>
      ["stream.ready", "stream.failed"].includes(String(event.type)),
    );
    const prepared = await service.prepare({
      requestId: "request:m07-real",
      contentId: "content:m07-real",
      sourceId: "source:m07-real",
      fileId: "file:0",
      mode: "stream-only",
      startPositionSeconds: 0,
      durationSeconds: 240,
      mediaBitrateBitsPerSecond: (media.length * 8) / 240,
      throughputBitsPerSecond: 32 * 1024 * 1024 * 8,
      tailRequired: true,
    });
    expect(prepared.ok, JSON.stringify(prepared)).toBeTruthy();
    let readyEvent;
    try {
      readyEvent = await ready;
    } catch (error) {
      const diagnostic = await daemon.describeStream(torrentId, "file:0");
      throw new Error(
        `stream event timeout: ${JSON.stringify(diagnostic)}; service=${JSON.stringify(serviceLog.slice(-4))}; seeder=${seederLog}; daemon=${daemon.lastError}`,
        { cause: error },
      );
    }
    expect(readyEvent.type, JSON.stringify(readyEvent)).toBe("stream.ready");
    const streamReadyMs = Date.now() - startedAt;
    const atStreamReady = await daemon.describeStream(torrentId, "file:0");
    const deliveryAtReady = await daemon.getStreamDelivery(
      readyEvent.snapshot.streamSessionId,
    );
    console.log(
      `M07 swarm: initial stream ready ${JSON.stringify({ streamReadyMs, completedPieces: atStreamReady.completedPieceCount, requiredPieces: deliveryAtReady.requiredPieceCount })}`,
    );
    await expect
      .poll(() => playerEvents.some((event) => event.type === "first-frame"), {
        timeout: 5_000,
      })
      .toBeTruthy();
    const startupMs = Date.now() - startedAt;
    const beforeSeek = await daemon.describeStream(torrentId, "file:0");
    expect(beforeSeek.complete).toBeFalsy();
    expect(beforeSeek.completedPieceCount).toBeLessThan(beforeSeek.pieceCount);

    const sessionId = readyEvent.snapshot.streamSessionId;
    const seekStartedAt = Date.now();
    const seekReady = waitForEvent(
      service,
      (event) =>
        event.type === "stream.ready" && event.snapshot.seekGeneration === 1,
    );
    expect(
      await service.seek({
        streamSessionId: sessionId,
        positionSeconds: 220,
        seekGeneration: 1,
        mutation: { idempotencyKey: "seek:m07-outside" },
      }),
    ).toMatchObject({ ok: true });
    await seekReady;
    console.log("M07 swarm: outside-cache seek ready");
    const seekMs = Date.now() - seekStartedAt;

    const finalReady = waitForEvent(
      service,
      (event) =>
        (event.type === "stream.ready" &&
          event.snapshot.seekGeneration === 4) ||
        event.type === "stream.failed",
    );
    await Promise.all([
      service.seek({
        streamSessionId: sessionId,
        positionSeconds: 60,
        seekGeneration: 2,
        mutation: { idempotencyKey: "seek:m07-2" },
      }),
      service.seek({
        streamSessionId: sessionId,
        positionSeconds: 120,
        seekGeneration: 3,
        mutation: { idempotencyKey: "seek:m07-3" },
      }),
      service.seek({
        streamSessionId: sessionId,
        positionSeconds: 200,
        seekGeneration: 4,
        mutation: { idempotencyKey: "seek:m07-4" },
      }),
    ]);
    let finalReadyEvent;
    try {
      finalReadyEvent = await finalReady;
    } catch (error) {
      const diagnostic = await daemon.describeStream(torrentId, "file:0");
      throw new Error(
        `rapid seek timeout: ${JSON.stringify(diagnostic)}; service=${JSON.stringify(serviceLog.slice(-6))}`,
        { cause: error },
      );
    }
    expect(finalReadyEvent.type, JSON.stringify(finalReadyEvent)).toBe(
      "stream.ready",
    );
    console.log("M07 swarm: rapid-seek final generation ready");
    expect(finalReadyEvent.snapshot).toMatchObject({
      seekGeneration: 4,
      positionSeconds: 200,
    });
    console.log(
      `M07 swarm metrics ${JSON.stringify({
        startupMs,
        streamReadyMs,
        seekMs,
        completedAtFirstFrame: beforeSeek.completedPieceCount,
        totalPieces: beforeSeek.pieceCount,
        mediaBytes: media.length,
        uploadLimitBytesPerSecond: 32 * 1024 * 1024,
      })}`,
    );
    expect(startupMs).toBeLessThanOrEqual(10_000);
    expect(seekMs).toBeLessThanOrEqual(5_000);
    await service.stop({
      streamSessionId: sessionId,
      mutation: {
        expectedSeekGeneration: 4,
        idempotencyKey: "stop:m07-real",
      },
    });
  } finally {
    await service?.close().catch(() => {});
    await daemon.stop().catch(() => {});
    seeder.kill("SIGTERM");
    fs.rmSync(root, { recursive: true, force: true });
  }
});
