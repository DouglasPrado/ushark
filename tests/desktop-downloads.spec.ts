import { expect, test } from "@playwright/test";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { DesktopDownloadPreview } from "../apps/desktop/src/renderer/downloads/desktop-downloads";
import type {
  DownloadDesktopApi,
  DownloadSnapshot,
} from "@ushark/types/downloads";

const snapshot = (state: DownloadSnapshot["state"]): DownloadSnapshot => ({
  schemaVersion: 1,
  id: "download:one",
  contentId: "movie:one",
  contentTitle: "Movie",
  sourceId: "source:one",
  sourceName: "Source",
  fileId: "file:0",
  destination: "cache",
  state,
  bytesCompleted: 10,
  bytesTotal: 100,
  downloadRateBytesPerSecond: 5,
  connectedPeers: 2,
  priority: 1,
  resumeVersion: 1,
  playbackYielding: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

test("M09 S05 adapter hidrata, enfileira e traduz comandos reais", async () => {
  const calls: any[] = [];
  let listener: (event: any) => void = () => {};
  const api = {
    protocolVersion: 1 as const,
    list: async () => ({
      ok: true as const,
      value: {
        items: [snapshot("paused")],
        limits: {
          download: 8,
          upload: 1,
          sessions: 4,
          concurrent: 2,
          probes: 1,
        },
      },
    }),
    enqueue: async (input: any) => {
      calls.push(["enqueue", input]);
      return { ok: true as const, value: snapshot("queued") };
    },
    command: async (input: any) => {
      calls.push(["command", input]);
      return {
        ok: true as const,
        value: snapshot(
          input.action === "cancel"
            ? "cancelled"
            : input.action === "pause"
              ? "paused"
              : "queued",
        ),
      };
    },
    removeData: async (input: any) => {
      calls.push(["remove", input]);
      return {
        ok: true as const,
        value: { downloadId: input.downloadId, removed: true as const },
      };
    },
    setPriority: async (input: any) => ({
      ok: true as const,
      value: { ...snapshot("queued"), priority: input.priority },
    }),
    setLimits: async (input: any) => ({
      ok: true as const,
      value: input.limits,
    }),
    tick: async () => ({
      ok: true as const,
      value: { items: [snapshot("downloading")] },
    }),
    subscribe: (value: (event: any) => void) => {
      listener = value;
      return () => {};
    },
  } satisfies DownloadDesktopApi;
  const service = new DesktopDownloadPreview(api);
  await expect.poll(() => service.list()[0]?.state).toBe("paused");
  await service.enqueue(
    {
      content: { id: "movie:one", title: "Movie" },
      source: {
        id: "source:one",
        name: "Source",
        local: false,
        selector: "file:0",
      },
    },
    "Cache",
  );
  expect(calls[0][1]).toMatchObject({
    destination: "cache",
    contentId: "movie:one",
    fileId: "file:0",
  });
  await service.command("download:one", "cancel");
  expect(service.list()[0].state).toBe("cancelled");
  listener({ type: "download.updated", snapshot: snapshot("complete") });
  expect(service.list()[0].state).toBe("complete");
  await service.command("download:one", "remove");
  expect(service.list()).toEqual([]);
});
