import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

interface StreamResult {
  ok: boolean;
  value?: {
    streamSessionId: string;
    state: string;
    seekGeneration: number;
    delivery: { kind: string; ready: boolean };
  };
  error?: { code: string };
}

interface StreamEvent {
  type: string;
  snapshot?: {
    streamSessionId: string;
    seekGeneration: number;
    state: string;
  };
}

interface Service {
  prepare(input: Record<string, unknown>): Promise<StreamResult>;
  setPosition(input: Record<string, unknown>): Promise<StreamResult>;
  seek(input: Record<string, unknown>): Promise<StreamResult>;
  stop(input: Record<string, unknown>): Promise<StreamResult>;
  cancel(input: Record<string, unknown>): Promise<StreamResult>;
  subscribe(listener: (event: StreamEvent) => void): () => void;
  close(): Promise<void>;
}

const { ProgressiveStreamApplicationService } =
  require("@ushark/core/progressive-stream-service") as {
    ProgressiveStreamApplicationService: new (
      options: Record<string, unknown>,
    ) => Service;
  };

class FakeDaemon {
  schedules: Array<Record<string, unknown>> = [];
  stopped: Array<{ streamSessionId: string; seekGeneration: number }> = [];
  deliveryReady = true;
  deliveryPath = "/managed/partial/movie.mp4";
  applyDelays = new Map<number, number>();
  geometry = {
    fileOffsetBytes: 3 * 1024 * 1024,
    fileSizeBytes: 800 * 1024 * 1024,
    pieceLengthBytes: 4 * 1024 * 1024,
  };

  async describeStream() {
    return this.geometry;
  }

  async applyStreamSchedule(payload: Record<string, unknown>) {
    this.schedules.push(payload);
    const generation = payload.seekGeneration as number;
    const wait = this.applyDelays.get(generation) ?? 0;
    if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
    return { applied: true, activeGeneration: generation };
  }

  async getStreamDelivery(streamSessionId: string) {
    return {
      streamSessionId,
      ready: this.deliveryReady,
      completedRequiredPieceCount: this.deliveryReady ? 8 : 2,
      requiredPieceCount: 8,
      ...(this.deliveryReady ? { managedPath: this.deliveryPath } : {}),
    };
  }

  async stopStream(streamSessionId: string, seekGeneration: number) {
    this.stopped.push({ streamSessionId, seekGeneration });
    return { stopped: true };
  }
}

class FakePlayer {
  starts = 0;
  loads: Array<{ mediaPath: string; position: number }> = [];
  seeks: number[] = [];
  stops = 0;

  async start() {
    this.starts += 1;
  }

  async load(mediaPath: string, input: { startPositionSeconds: number }) {
    this.loads.push({ mediaPath, position: input.startPositionSeconds });
  }

  async seek(positionSeconds: number) {
    this.seeks.push(positionSeconds);
  }

  async stop() {
    this.stops += 1;
  }
}

function fixture(daemon = new FakeDaemon(), player = new FakePlayer()) {
  const service = new ProgressiveStreamApplicationService({
    daemon,
    sourceResolver: {
      resolve: async () => ({
        torrentId: "torrent:0123456789abcdef0123456789abcdef01234567",
      }),
    },
    playerFactory: () => player,
    pollIntervalMs: 250,
  });
  return { daemon, player, service };
}

function prepareInput(requestId = "request:prepare") {
  return {
    requestId,
    contentId: "content:movie",
    sourceId: "source:torrent",
    fileId: "file:0",
    mode: "stream-only",
    startPositionSeconds: 40,
    durationSeconds: 800,
    mediaBitrateBitsPerSecond: 8 * 1024 * 1024,
    throughputBitsPerSecond: 16 * 1024 * 1024,
    tailRequired: true,
  };
}

function waitForEvent(service: Service, type: string, timeoutMs = 2_000) {
  return new Promise<StreamEvent>((resolve, reject) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      reject(new Error(`timeout waiting for ${type}`));
    }, timeoutMs);
    const unsubscribe = service.subscribe((event) => {
      if (event.type !== type) return;
      clearTimeout(timeout);
      unsubscribe();
      resolve(event);
    });
  });
}

test("M07 S04.3 entrega path somente ao MPV e publica snapshot sem path", async () => {
  const { daemon, player, service } = fixture();
  const feedback: Array<{ type: string; elapsed: number }> = [];
  const started = Date.now();
  const unsubscribe = service.subscribe((event) =>
    feedback.push({ type: event.type, elapsed: Date.now() - started }),
  );
  const readyEvent = waitForEvent(service, "stream.ready");
  try {
    const prepared = await service.prepare(prepareInput());
    expect(prepared).toMatchObject({
      ok: true,
      value: {
        state: "buffering",
        seekGeneration: 0,
        delivery: { kind: "partial-file", ready: false },
      },
    });
    const ready = await readyEvent;
    expect(feedback[0]).toMatchObject({ type: "stream.preparing" });
    expect(feedback[0].elapsed).toBeLessThanOrEqual(250);
    expect(player.starts).toBe(1);
    expect(player.loads).toEqual([
      { mediaPath: daemon.deliveryPath, position: 40 },
    ]);
    expect(JSON.stringify(ready)).not.toContain(daemon.deliveryPath);
    expect(JSON.stringify(ready)).not.toContain("pieceIndex");
  } finally {
    unsubscribe();
    await service.close();
  }
});

test("M07 S04.3 três seeks rápidos entregam ao MPV somente a última geração", async () => {
  const { daemon, player, service } = fixture();
  const initialReady = waitForEvent(service, "stream.ready");
  const prepared = await service.prepare(prepareInput("request:rapid"));
  await initialReady;
  const sessionId = prepared.value!.streamSessionId;
  daemon.applyDelays.set(1, 60);
  daemon.applyDelays.set(2, 30);
  daemon.applyDelays.set(3, 1);
  const lastReady = waitForEvent(service, "stream.ready");

  const results = await Promise.all([
    service.seek({
      streamSessionId: sessionId,
      positionSeconds: 100,
      seekGeneration: 1,
      mutation: { idempotencyKey: "seek:1" },
    }),
    service.seek({
      streamSessionId: sessionId,
      positionSeconds: 200,
      seekGeneration: 2,
      mutation: { idempotencyKey: "seek:2" },
    }),
    service.seek({
      streamSessionId: sessionId,
      positionSeconds: 300,
      seekGeneration: 3,
      mutation: { idempotencyKey: "seek:3" },
    }),
  ]);
  expect(results.every((result) => result.ok)).toBeTruthy();
  expect((await lastReady).snapshot).toMatchObject({ seekGeneration: 3 });
  expect(player.seeks).toEqual([300]);
  expect(
    await service.seek({
      streamSessionId: sessionId,
      positionSeconds: 250,
      seekGeneration: 2,
      mutation: { idempotencyKey: "seek:stale" },
    }),
  ).toMatchObject({ ok: false, error: { code: "STREAM_CONFLICT" } });

  const stopped = await service.stop({
    streamSessionId: sessionId,
    mutation: { expectedSeekGeneration: 3, idempotencyKey: "stop:rapid" },
  });
  expect(stopped).toMatchObject({ ok: true, value: { state: "stopped" } });
  expect(daemon.stopped).toEqual([
    { streamSessionId: sessionId, seekGeneration: 3 },
  ]);
  expect(player.stops).toBe(1);
});

test("M07 S04.3 atualiza scheduler na mesma geração e cancela preparação", async () => {
  const { daemon, service } = fixture();
  const prepared = await service.prepare(prepareInput("request:position"));
  const sessionId = prepared.value!.streamSessionId;
  const updated = await service.setPosition({
    streamSessionId: sessionId,
    positionSeconds: 45,
    seekGeneration: 0,
  });
  expect(updated).toMatchObject({ ok: true, value: { seekGeneration: 0 } });
  expect(daemon.schedules.at(-1)).toMatchObject({ scheduleSequence: 1 });
  await service.close();

  const second = fixture().service;
  expect(await second.cancel({ requestId: "request:cancelled" })).toMatchObject(
    {
      ok: true,
      value: { requestId: "request:cancelled", cancelled: false },
    },
  );
  expect(await second.prepare(prepareInput("request:cancelled"))).toMatchObject(
    {
      ok: false,
      error: { code: "STREAM_CANCELLED" },
    },
  );
  await second.close();
});

test("cancela preparação enquanto a source ainda está sendo resolvida", async () => {
  const daemon = new FakeDaemon();
  const player = new FakePlayer();
  let releaseResolve!: () => void;
  let markResolving!: () => void;
  const resolving = new Promise<void>((resolve) => {
    markResolving = resolve;
  });
  const resolveGate = new Promise<void>((resolve) => {
    releaseResolve = resolve;
  });
  const service = new ProgressiveStreamApplicationService({
    daemon,
    sourceResolver: {
      resolve: async () => {
        markResolving();
        await resolveGate;
        return {
          torrentId: "torrent:0123456789abcdef0123456789abcdef01234567",
          fileId: "file:0",
        };
      },
    },
    playerFactory: () => player,
    pollIntervalMs: 250,
  }) as Service;
  const events: StreamEvent[] = [];
  service.subscribe((event) => events.push(event));
  const preparing = service.prepare(prepareInput("request:resolving"));
  await resolving;

  await expect(
    service.cancel({ requestId: "request:resolving" }),
  ).resolves.toMatchObject({
    ok: true,
    value: { requestId: "request:resolving", cancelled: false },
  });
  releaseResolve();

  await expect(preparing).resolves.toMatchObject({
    ok: false,
    error: { code: "STREAM_CANCELLED" },
  });
  expect(daemon.schedules).toHaveLength(0);
  expect(player.starts).toBe(0);
  expect(events.some((event) => event.type === "stream.failed")).toBe(false);
  await service.close();
});

test("M07 S04.3 entrega arquivo gerenciado ao MPV real até o primeiro frame", async () => {
  test.skip(
    !fs.existsSync("/opt/homebrew/bin/mpv") ||
      !fs.existsSync("/opt/homebrew/bin/ffmpeg"),
    "Requer MPV/FFmpeg locais verificados.",
  );
  const root = fs.mkdtempSync("/tmp/ushark-stream-mpv-");
  const mediaPath = path.join(root, "partial-delivery.mp4");
  execFileSync("/opt/homebrew/bin/ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-f",
    "lavfi",
    "-i",
    "testsrc2=size=320x180:rate=24",
    "-f",
    "lavfi",
    "-i",
    "sine=frequency=440:sample_rate=48000",
    "-t",
    "2",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-y",
    mediaPath,
  ]);
  const daemon = new FakeDaemon();
  daemon.deliveryPath = mediaPath;
  daemon.geometry = {
    fileOffsetBytes: 0,
    fileSizeBytes: fs.statSync(mediaPath).size,
    pieceLengthBytes: 16 * 1024,
  };
  const playerEvents: Array<{ type: string }> = [];
  const { MpvAdapter } = require("@ushark/core/mpv-adapter") as {
    MpvAdapter: new (options: Record<string, unknown>) => {
      on(name: string, listener: (event: { type: string }) => void): void;
      start(input?: object): Promise<unknown>;
      load(media: string, input?: object): Promise<unknown>;
      seek(position: number): Promise<unknown>;
      stop(): Promise<void>;
    };
  };
  const adapter = new MpvAdapter({
    executable: "/opt/homebrew/bin/mpv",
    ipcRoot: path.join(root, "ipc"),
    extraArgs: ["--vo=null", "--ao=null", "--really-quiet"],
    commandTimeoutMs: 2_000,
    startupTimeoutMs: 5_000,
  });
  adapter.on("event", (event) => playerEvents.push(event));
  const service = new ProgressiveStreamApplicationService({
    daemon,
    sourceResolver: {
      resolve: async () => ({
        torrentId: "torrent:0123456789abcdef0123456789abcdef01234567",
      }),
    },
    playerFactory: () => adapter,
  });
  const serviceEvents: StreamEvent[] = [];
  service.subscribe((event) => serviceEvents.push(event));
  try {
    expect(
      await service.prepare({
        ...prepareInput("request:real-mpv"),
        startPositionSeconds: 0,
        durationSeconds: 2,
      }),
    ).toMatchObject({
      ok: true,
    });
    await expect
      .poll(
        () =>
          serviceEvents.find((event) =>
            ["stream.ready", "stream.failed"].includes(event.type),
          ),
        { timeout: 10_000 },
      )
      .toBeTruthy();
    const terminalEvent = serviceEvents.find((event) =>
      ["stream.ready", "stream.failed"].includes(event.type),
    );
    expect(terminalEvent, JSON.stringify(terminalEvent)).toMatchObject({
      type: "stream.ready",
    });
    await expect
      .poll(() => playerEvents.some((event) => event.type === "first-frame"), {
        timeout: 5_000,
      })
      .toBeTruthy();
  } finally {
    await service.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});
