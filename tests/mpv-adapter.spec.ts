import { expect, test } from "@playwright/test";
import { spawn } from "node:child_process";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

type AdapterEvent = {
  type: string;
  name?: string;
  state?: Record<string, unknown>;
};
type MpvAdapter = {
  start(options?: Record<string, unknown>): Promise<{
    executable: string;
    arguments: string[];
  }>;
  load(mediaPath: string, options?: Record<string, unknown>): Promise<unknown>;
  setPaused(paused: boolean): Promise<unknown>;
  seek(positionSeconds: number): Promise<unknown>;
  setVolume(volumePercent: number): Promise<unknown>;
  setMuted(muted: boolean): Promise<unknown>;
  selectAudio(trackId: string): Promise<unknown>;
  selectSubtitle(trackId?: string): Promise<unknown>;
  snapshot(): Record<string, unknown>;
  stop(): Promise<void>;
  on(name: "event", listener: (event: AdapterEvent) => void): MpvAdapter;
};

const { MpvAdapter } = require("@ushark/core/mpv-adapter") as {
  MpvAdapter: new (options: Record<string, unknown>) => MpvAdapter;
};

function waitForEvent(events: AdapterEvent[], type: string, timeoutMs = 2_000) {
  return expect
    .poll(() => events.find((event) => event.type === type), {
      timeout: timeoutMs,
    })
    .not.toBeUndefined();
}

test("M05 S04.1 isola processo, usa argumentos estruturados e observa primeiro frame", async () => {
  const root = fs.mkdtempSync("/tmp/ushark-mpv-adapter-");
  const mediaPath = path.join(root, "fixture.mp4");
  fs.writeFileSync(mediaPath, "fixture");
  const events: AdapterEvent[] = [];
  const surfaceStates: boolean[] = [];
  let publishGeometry: ((geometry: string) => void) | undefined;
  let surfaceUnsubscribed = false;
  const adapter = new MpvAdapter({
    executable: process.execPath,
    spawnProcess: (executable: string, args: string[], options: object) =>
      spawn(executable, args, {
        ...options,
        stdio: ["ignore", "ignore", "inherit"],
      }),
    prefixArgs: [path.resolve("tests/fixtures/fake-mpv.cjs")],
    ipcRoot: path.join(root, "ipc"),
    commandTimeoutMs: 1_000,
    startupTimeoutMs: 2_000,
    surface: {
      geometry: () => "1280x720+40+80",
      activate: () => surfaceStates.push(true),
      deactivate: () => surfaceStates.push(false),
      subscribeGeometry: (listener: (geometry: string) => void) => {
        publishGeometry = listener;
        return () => {
          surfaceUnsubscribed = true;
        };
      },
    },
  });
  adapter.on("event", (event) => events.push(event));
  try {
    const started = await adapter.start({ fullscreen: true });
    expect(started.executable).toMatch(/^node/);
    expect(started.arguments).toContain("--fullscreen=yes");
    expect(started.arguments).toContain("--hwdec=auto-safe");
    expect(started.arguments).toContain("--no-terminal");
    expect(started.arguments).toContain("--geometry=1280x720+40+80");
    expect(surfaceStates).toEqual([true]);
    expect(
      started.arguments.some((value) => value.includes("fixture.mp4")),
    ).toBe(false);
    await adapter.load(mediaPath, { startPositionSeconds: 12 });
    await waitForEvent(events, "first-frame");
    expect(
      events.findIndex((event) => event.type === "file-loaded"),
    ).toBeLessThan(events.findIndex((event) => event.type === "first-frame"));
    await expect(adapter.setPaused(true)).resolves.toBeNull();
    await expect(adapter.seek(45)).resolves.toBeNull();
    await expect(adapter.setVolume(62)).resolves.toBeNull();
    await expect(adapter.setMuted(true)).resolves.toBeNull();
    await expect(adapter.selectAudio("1")).resolves.toBeNull();
    await expect(adapter.selectSubtitle("2")).resolves.toBeNull();
    await expect(adapter.selectSubtitle()).resolves.toBeNull();
    publishGeometry?.("1920x1080-1920+0");
    await expect
      .poll(() => adapter.snapshot())
      .toMatchObject({
        positionSeconds: 45,
        paused: true,
        durationSeconds: 120,
        audioTracks: [{ id: "1", kind: "audio", selected: true }],
        subtitleTracks: [{ id: "2", kind: "subtitle" }],
      });
  } finally {
    await adapter.stop();
    expect(surfaceStates).toEqual([true, false]);
    expect(surfaceUnsubscribed).toBe(true);
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("M05 S04.1 serializa comandos, valida limites e isola crash", async () => {
  const root = fs.mkdtempSync("/tmp/ushark-mpv-crash-");
  const adapter = new MpvAdapter({
    executable: process.execPath,
    spawnProcess: (executable: string, args: string[], options: object) =>
      spawn(executable, args, {
        ...options,
        stdio: ["ignore", "ignore", "inherit"],
      }),
    prefixArgs: [path.resolve("tests/fixtures/fake-mpv.cjs")],
    ipcRoot: path.join(root, "ipc"),
    commandTimeoutMs: 1_000,
    startupTimeoutMs: 2_000,
  });
  try {
    await adapter.start();
    await expect(adapter.load("relative.mp4")).rejects.toMatchObject({
      code: "PLAYBACK_INVALID",
    });
    await expect(adapter.seek(-1)).rejects.toMatchObject({
      code: "PLAYBACK_INVALID",
    });
    await expect(adapter.setVolume(101)).rejects.toMatchObject({
      code: "PLAYBACK_INVALID",
    });
  } finally {
    await adapter.stop();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("M05 S04.1 MPV real faz direct play local e emite primeiro frame", async () => {
  const root = fs.mkdtempSync("/tmp/ushark-mpv-real-");
  const mediaPath = path.join(root, "synthetic.mp4");
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
  const events: AdapterEvent[] = [];
  const adapter = new MpvAdapter({
    executable: "/opt/homebrew/bin/mpv",
    ipcRoot: path.join(root, "ipc"),
    extraArgs: ["--vo=null", "--ao=null", "--really-quiet"],
    commandTimeoutMs: 2_000,
    startupTimeoutMs: 5_000,
  });
  adapter.on("event", (event) => events.push(event));
  try {
    const started = await adapter.start({ hardwareDecode: true });
    expect(started.executable).toBe("mpv");
    await adapter.load(mediaPath);
    await waitForEvent(events, "first-frame", 5_000);
    await expect
      .poll(() => adapter.snapshot(), { timeout: 5_000 })
      .toMatchObject({
        videoCodec: expect.stringMatching(/h\.264|h264/i),
        audioCodec: "aac",
        durationSeconds: expect.any(Number),
      });
    await adapter.setPaused(true);
    await adapter.seek(1);
  } finally {
    await adapter.stop();
    fs.rmSync(root, { recursive: true, force: true });
  }
});
