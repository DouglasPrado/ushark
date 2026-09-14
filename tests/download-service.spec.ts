import { expect, test } from "@playwright/test";
/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const { ConfigurationStore } = require("@ushark/core/configuration");
const { MovieCatalogStore } = require("@ushark/core/movies");
const {
  DownloadApplicationService,
  DownloadStore,
} = require("@ushark/core/downloads");

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-downloads-"));
  const databasePath = path.join(root, "state", "ushark.db");
  const configuration = new ConfigurationStore(
    databasePath,
    path.join(root, "managed"),
  );
  const base = configuration.read().configuration;
  const saved = configuration.save(
    {
      ...base,
      libraryPath: path.join(root, "library"),
      cachePath: path.join(root, "cache"),
    },
    { completeOnboarding: true },
  ).configuration;
  configuration.close();
  const movies = new MovieCatalogStore(databasePath);
  expect(
    movies.save({
      libraryId: saved.libraryId,
      draft: {
        metadata: {
          id: "movie:download:test",
          title: "Download",
          duration: 120,
          genres: [],
          cast: [],
        },
        source: {
          id: "source:download:test",
          name: "download.mkv",
          availability: "available",
          fileAvailable: false,
        },
      },
      mutation: { idempotencyKey: "download-seed" },
    }).ok,
  ).toBe(true);
  movies.close();
  return { root, databasePath };
}

function input(key = "download:enqueue:one") {
  return {
    contentId: "movie:download:test",
    contentTitle: "Download",
    sourceId: "source:download:test",
    sourceName: "download.mkv",
    fileId: "file:0",
    destination: "cache",
    sizeBytes: 1000,
    mutation: { idempotencyKey: key },
  };
}

function runtime() {
  const calls: Array<{ method: string; value?: unknown }> = [];
  let completed = 0;
  const daemon = {
    async start() {
      calls.push({ method: "start" });
    },
    async configureDownloads(value: unknown) {
      calls.push({ method: "configure", value });
      return value;
    },
    async startDownload(value: any) {
      calls.push({ method: "startDownload", value });
      return {};
    },
    async downloadStatus(downloadId: string) {
      calls.push({ method: "status", value: downloadId });
      completed += 100;
      return {
        state: completed >= 1000 ? "complete" : "downloading",
        bytesCompleted: Math.min(1000, completed),
        bytesTotal: 1000,
        downloadRateBytesPerSecond: 100,
        connectedPeers: 3,
        priority: 1,
        playbackYielding: false,
      };
    },
    async downloadCommand(downloadId: string, action: string) {
      calls.push({ method: action, value: downloadId });
      return {};
    },
    async setDownloadPriority(downloadId: string, priority: number) {
      calls.push({ method: "priority", value: { downloadId, priority } });
      return {};
    },
    async removeDownloadData(downloadId: string) {
      calls.push({ method: "remove", value: downloadId });
      return {};
    },
    async saveDownloadResume(downloadId: string) {
      calls.push({ method: "resume-data", value: downloadId });
      return {};
    },
  };
  const sourceResolver = {
    async resolve() {
      return { torrentId: `torrent:${"a".repeat(40)}`, fileId: "file:0" };
    },
  };
  return { calls, daemon, sourceResolver };
}

test("fila vazia não inicializa o runtime de torrent", async () => {
  const { databasePath } = fixture();
  const store = new DownloadStore(databasePath);
  const fake = runtime();
  const service = new DownloadApplicationService({
    store,
    daemon: fake.daemon,
    sourceResolver: fake.sourceResolver,
  });

  await expect(service.tick({ playbackActive: true })).resolves.toMatchObject({
    ok: true,
    value: { items: [] },
  });
  expect(fake.calls).toEqual([]);
  store.close();
});

test("M09 S04 fila idempotente, progresso, pause e resume persistem no restart", async () => {
  const { databasePath } = fixture();
  let store = new DownloadStore(databasePath);
  const fake = runtime();
  let service = new DownloadApplicationService({
    store,
    daemon: fake.daemon,
    sourceResolver: fake.sourceResolver,
  });
  const first = service.enqueue(input());
  expect(first).toMatchObject({
    ok: true,
    value: { state: "queued", bytesTotal: 1000 },
  });
  expect(service.enqueue(input())).toEqual(first);
  await service.tick({ playbackActive: false });
  const active = service.list();
  expect(active).toMatchObject({
    ok: true,
    value: { items: [{ state: "downloading", bytesCompleted: 100 }] },
  });
  const id = (active as any).value.items[0].id;
  expect(
    await service.command({
      downloadId: id,
      action: "pause",
      mutation: { idempotencyKey: "download:pause:one" },
    }),
  ).toMatchObject({ ok: true, value: { state: "paused" } });
  store.close();
  store = new DownloadStore(databasePath);
  service = new DownloadApplicationService({
    store,
    daemon: fake.daemon,
    sourceResolver: fake.sourceResolver,
  });
  expect(service.list()).toMatchObject({
    ok: true,
    value: { items: [{ state: "paused", bytesCompleted: 100 }] },
  });
  expect(
    await service.command({
      downloadId: id,
      action: "resume",
      mutation: { idempotencyKey: "download:resume:one" },
    }),
  ).toMatchObject({ ok: true, value: { state: "queued" } });
  await service.tick({ playbackActive: true });
  expect(service.list()).toMatchObject({
    ok: true,
    value: { items: [{ state: "downloading", bytesCompleted: 200 }] },
  });
  expect(fake.calls).toContainEqual({
    method: "configure",
    value: {
      downloadLimitBytesPerSecond: 8 * 1024 ** 2,
      uploadLimitBytesPerSecond: 1024 ** 2,
      playbackActive: true,
    },
  });
  store.close();
});

test("cancelar preserva Content e remover exige confirmação distinta", async () => {
  const { databasePath } = fixture();
  const store = new DownloadStore(databasePath);
  const fake = runtime();
  const service = new DownloadApplicationService({
    store,
    daemon: fake.daemon,
    sourceResolver: fake.sourceResolver,
  });
  const queued = service.enqueue(input("download:enqueue:cancel"));
  if (!queued.ok) throw new Error(queued.error.message);
  await service.tick();
  expect(
    await service.command({
      downloadId: queued.value.id,
      action: "cancel",
      mutation: { idempotencyKey: "download:cancel:one" },
    }),
  ).toMatchObject({ ok: true, value: { state: "cancelled" } });
  expect(
    await service.removeData({
      downloadId: queued.value.id,
      confirmed: false,
      mutation: { idempotencyKey: "download:remove:no" },
    }),
  ).toMatchObject({ ok: false, error: { code: "DOWNLOAD_INVALID" } });
  expect(
    new DatabaseSync(databasePath, { readOnly: true })
      .prepare("SELECT COUNT(*) AS count FROM contents WHERE id=?")
      .get("movie:download:test")!.count,
  ).toBe(1);
  expect(
    await service.removeData({
      downloadId: queued.value.id,
      confirmed: true,
      mutation: { idempotencyKey: "download:remove:yes" },
    }),
  ).toMatchObject({ ok: true, value: { removed: true } });
  expect(service.list()).toMatchObject({ ok: true, value: { items: [] } });
  expect(
    new DatabaseSync(databasePath, { readOnly: true })
      .prepare("SELECT COUNT(*) AS count FROM contents WHERE id=?")
      .get("movie:download:test")!.count,
  ).toBe(1);
  store.close();
});

test("limites e prioridade são validados e persistidos", async () => {
  const { databasePath } = fixture();
  const store = new DownloadStore(databasePath);
  const fake = runtime();
  const service = new DownloadApplicationService({
    store,
    daemon: fake.daemon,
    sourceResolver: fake.sourceResolver,
  });
  const queued = service.enqueue(input("download:enqueue:priority"));
  if (!queued.ok) throw new Error(queued.error.message);
  expect(
    await service.setPriority({
      downloadId: queued.value.id,
      priority: 2,
      mutation: { idempotencyKey: "priority:two" },
    }),
  ).toMatchObject({ ok: true, value: { priority: 2 } });
  expect(
    await service.setLimits({
      limits: {
        download: 20,
        upload: 2,
        sessions: 3,
        concurrent: 2,
        probes: 1,
      },
      mutation: { idempotencyKey: "limits:one" },
    }),
  ).toMatchObject({ ok: true, value: { download: 20, sessions: 3 } });
  expect(
    await service.setLimits({
      limits: {
        download: 20,
        upload: 2,
        sessions: 1,
        concurrent: 2,
        probes: 1,
      },
      mutation: { idempotencyKey: "limits:bad" },
    }),
  ).toMatchObject({ ok: false, error: { code: "DOWNLOAD_INVALID" } });
  store.close();
  const reopened = new DownloadStore(databasePath);
  expect(reopened.limits()).toEqual({
    download: 20,
    upload: 2,
    sessions: 3,
    concurrent: 2,
    probes: 1,
  });
  reopened.close();
});
