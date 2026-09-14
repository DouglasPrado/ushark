import { _electron, expect, test } from "@playwright/test";
import { createHash } from "node:crypto";
import electron from "electron";
import fs from "node:fs";
import path from "node:path";
import type { Configuration } from "@ushark/types";

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

const { ConfigurationStore } = require("@ushark/core/configuration");
const { MovieCatalogStore } = require("@ushark/core/movies");
const { TorrentInputStore } = require("@ushark/core/torrent-input");
const {
  TorrentInspectionStore,
} = require("@ushark/core/torrent-inspection-store");
const pythonExecutable = process.env.USHARK_TEST_PYTHON;
const pythonPath = process.env.USHARK_TEST_LIBTORRENT_PYTHONPATH;
test.skip(!pythonExecutable || !pythonPath, "Requer CPython/libtorrent real.");

test("M09 Electron enfileira, pausa, reinicia, retoma e cancela preservando catálogo", async ({
  browserName,
}, testInfo) => {
  test.setTimeout(90_000);
  const userData = testInfo.outputPath(`${browserName}-download-user-data`);
  fs.mkdirSync(userData, { recursive: true });
  const databasePath = path.join(userData, "ushark.db");
  const libraryPath = testInfo.outputPath("library");
  const cachePath = testInfo.outputPath("cache");
  const configuration = new ConfigurationStore(
    databasePath,
    path.join(userData, "managed"),
  );
  const initial = configuration.read().configuration as Configuration;
  const saved = configuration.save(
    { ...initial, libraryPath, cachePath },
    { completeOnboarding: true },
  ).configuration as Configuration;
  configuration.close();
  const movies = new MovieCatalogStore(databasePath);
  expect(
    movies.save({
      libraryId: saved.libraryId,
      draft: {
        metadata: {
          id: "movie:download:electron",
          title: "Download Real",
          duration: 120,
          genres: [],
          cast: [],
        },
        source: {
          id: "source:catalog:download",
          name: "placeholder.mkv",
          availability: "unavailable",
          fileAvailable: false,
        },
      },
      mutation: { idempotencyKey: "download-electron-seed" },
    }).ok,
  ).toBe(true);
  movies.close();
  const info = {
    length: 80 * 1024 * 1024,
    name: "Download.Real.1080p.mkv",
    "piece length": 4 * 1024 * 1024,
    pieces: Buffer.alloc(20 * 20, 7),
  };
  const sourcePath = testInfo.outputPath("download.torrent");
  fs.writeFileSync(
    sourcePath,
    bencode({ announce: "https://tracker.invalid/announce", info }),
  );
  const inputs = new TorrentInputStore(
    path.join(userData, "managed", "torrent-input"),
  );
  const managed = inputs.resolve(inputs.select(sourcePath).selectionId);
  const torrents = new TorrentInspectionStore(databasePath);
  const confirmed = torrents.confirmSource({
    operationId: "operation:download:electron",
    contentId: "movie:download:electron",
    infoHash: createHash("sha1").update(bencode(info)).digest("hex"),
    inputType: "torrent-file",
    inputLabel: "download.torrent",
    displayName: info.name,
    managedTorrentPath: managed.managedPath,
    files: [
      {
        id: "file:0",
        path: info.name,
        name: info.name,
        sizeBytes: info.length,
        kind: "video",
        selectable: true,
      },
    ],
    selector: { type: "manual", fileId: "file:0" },
    mutation: { idempotencyKey: "download-electron-source" },
  });
  expect(confirmed.ok).toBe(true);
  if (!confirmed.ok) throw new Error(confirmed.error.message);
  torrents.close();
  const env = Object.fromEntries(
    Object.entries({
      ...process.env,
      USHARK_TORRENTD_PYTHON: pythonExecutable,
      USHARK_TORRENTD_PYTHONPATH: pythonPath,
      USHARK_TORRENTD_SCRIPT: path.resolve("apps/torrentd/torrentd.py"),
    }).filter(
      (entry): entry is [string, string] =>
        entry[0] !== "ELECTRON_RUN_AS_NODE" && entry[1] !== undefined,
    ),
  );
  const args = [
    path.resolve("apps/desktop/src/main/index.cjs"),
    `--user-data-dir=${userData}`,
  ];
  const first = await _electron.launch({
    executablePath: electron as unknown as string,
    env,
    args,
  });
  let downloadId: string | undefined;
  try {
    const page = await first.firstWindow();
    await expect(
      page.getByRole("heading", { name: "Download Real", exact: true }),
    ).toBeVisible();
    const enqueue = await page.evaluate(
      async ({ sourceId }) =>
        window.ushark!.downloads.enqueue({
          contentId: "movie:download:electron",
          contentTitle: "Download Real",
          sourceId,
          sourceName: "Download.Real.1080p.mkv",
          fileId: "file:0",
          destination: "cache",
          sizeBytes: 80 * 1024 * 1024,
          mutation: { idempotencyKey: "download-electron-enqueue" },
        }),
      { sourceId: confirmed.value.sourceId },
    );
    expect(enqueue).toMatchObject({ ok: true, value: { state: "queued" } });
    if (!enqueue.ok) throw new Error(enqueue.error.message);
    downloadId = enqueue.value.id;
    await page.getByRole("button", { name: "Downloads", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Downloads", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Download Real", exact: true }),
    ).toBeVisible();
    await expect
      .poll(async () => {
        const value = await page.evaluate(() =>
          window.ushark!.downloads.list(),
        );
        return value.ok ? value.value.items[0]?.state : value.error.code;
      })
      .toBe("downloading");
    await page.getByRole("button", { name: "Pausar", exact: true }).click();
    await expect(page.getByText("Pausado", { exact: true })).toBeVisible();
  } finally {
    await first.close();
  }
  if (!downloadId) throw new Error("O download não foi criado.");
  expect(
    fs
      .readdirSync(path.join(cachePath, "torrent-runtime", "resume"))
      .some((name) => name.endsWith(".resume")),
  ).toBe(true);
  const reopened = await _electron.launch({
    executablePath: electron as unknown as string,
    env,
    args,
  });
  try {
    const page = await reopened.firstWindow();
    const restored = await page.evaluate(() => window.ushark!.downloads.list());
    expect(restored).toMatchObject({
      ok: true,
      value: { items: [{ state: "paused", bytesTotal: 80 * 1024 * 1024 }] },
    });
    await expect(
      page.evaluate(
        (id) =>
          window.ushark!.downloads.command({
            downloadId: id,
            action: "resume",
            mutation: { idempotencyKey: "download-electron-resume" },
          }),
        downloadId,
      ),
    ).resolves.toMatchObject({ ok: true, value: { state: "queued" } });
    await page.evaluate(() =>
      window.ushark!.downloads.tick({ playbackActive: true }),
    );
    await expect(
      page.evaluate(
        (id) =>
          window.ushark!.downloads.command({
            downloadId: id,
            action: "cancel",
            mutation: { idempotencyKey: "download-electron-cancel" },
          }),
        downloadId,
      ),
    ).resolves.toMatchObject({ ok: true, value: { state: "cancelled" } });
    await expect(
      page.getByRole("heading", { name: "Download Real", exact: true }),
    ).toBeVisible();
  } finally {
    await reopened.close();
  }
});
