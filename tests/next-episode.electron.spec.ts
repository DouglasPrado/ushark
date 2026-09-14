import { _electron, expect, test } from "@playwright/test";
import electron from "electron";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { Configuration } from "@ushark/types";

const { ConfigurationStore } = require("@ushark/core/configuration");
const { MovieCatalogStore } = require("@ushark/core/movies");
const { SeriesCatalogStore } = require("@ushark/core/series");
const {
  TorrentInspectionStore,
} = require("@ushark/core/torrent-inspection-store");
const { StoragePolicyService } = require("@ushark/core/storage-policy");

test("M11 Electron resolve, prepara local e impede início duplicado", async ({
  browserName,
}, testInfo) => {
  const userData = testInfo.outputPath(`${browserName}-next-user-data`);
  const databasePath = path.join(userData, "ushark.db");
  const libraryPath = testInfo.outputPath("library");
  const cachePath = testInfo.outputPath("cache");
  fs.mkdirSync(userData, { recursive: true });
  const configuration = new ConfigurationStore(
    databasePath,
    path.join(userData, "managed"),
  );
  const initial = configuration.read().configuration as Configuration;
  configuration.save(
    { ...initial, libraryPath, cachePath },
    { completeOnboarding: true },
  );
  configuration.close();
  new MovieCatalogStore(databasePath).close();
  new TorrentInspectionStore(databasePath).close();
  new SeriesCatalogStore(databasePath).close();
  const database = new DatabaseSync(databasePath);
  database.exec(`
    INSERT INTO contents VALUES('series:electron','series',unixepoch(),unixepoch());
    INSERT INTO contents VALUES('episode:electron:1','episode',unixepoch(),unixepoch());
    INSERT INTO contents VALUES('episode:electron:2','episode',unixepoch(),unixepoch());
    INSERT INTO series VALUES('series:electron','{"title":"Electron Series","genres":[],"cast":[]}',unixepoch());
    INSERT INTO episodes(content_id,series_content_id,season_number,episode_number,metadata_json,updated_at)
      VALUES('episode:electron:1','series:electron',1,1,'{"runtimeSeconds":1200}',unixepoch());
    INSERT INTO episodes(content_id,series_content_id,season_number,episode_number,metadata_json,updated_at)
      VALUES('episode:electron:2','series:electron',1,2,'{"runtimeSeconds":1200}',unixepoch());
    INSERT INTO torrent_runtimes VALUES('hash:electron','torrent:electron','Electron.pack','{"files":[{"id":"file:1","sizeBytes":1024},{"id":"file:2","sizeBytes":2048}]}',NULL,unixepoch(),unixepoch());
    INSERT INTO torrent_sources VALUES('source:electron','hash:electron','magnet','Electron.pack',unixepoch(),unixepoch());
    INSERT INTO content_source_selectors(content_source_id,content_id,source_id,selector_json,created_at,updated_at)
      VALUES('relation:electron:1','episode:electron:1','source:electron','{"type":"episode","fileId":"file:1"}',unixepoch(),unixepoch());
    INSERT INTO content_source_selectors(content_source_id,content_id,source_id,selector_json,created_at,updated_at)
      VALUES('relation:electron:2','episode:electron:2','source:electron','{"type":"episode","fileId":"file:2"}',unixepoch(),unixepoch());
  `);
  database.close();
  fs.mkdirSync(libraryPath, { recursive: true });
  const local = path.join(libraryPath, "episode-electron-2.mkv");
  fs.writeFileSync(local, Buffer.alloc(2048));
  const storage = new StoragePolicyService({
    databasePath,
    cacheRoot: path.join(cachePath, "torrent-runtime"),
    libraryRoot: libraryPath,
  });
  storage.registerAsset({
    id: "next-local",
    contentId: "episode:electron:2",
    sourceId: "source:electron",
    name: "Electron Series S1E2",
    managedPath: local,
    keep: true,
  });
  storage.close();
  const env = Object.fromEntries(
    Object.entries(process.env).filter(
      (entry): entry is [string, string] =>
        entry[0] !== "ELECTRON_RUN_AS_NODE" && entry[1] !== undefined,
    ),
  );
  const app = await _electron.launch({
    executablePath: electron as unknown as string,
    env,
    args: [
      path.resolve("apps/desktop/src/main/index.cjs"),
      `--user-data-dir=${userData}`,
    ],
  });
  try {
    const page = await app.firstWindow();
    const resolved = await page.evaluate(() =>
      window.ushark!.nextEpisode.resolve({
        contentId: "episode:electron:1",
      }),
    );
    expect(resolved).toMatchObject({
      ok: true,
      value: {
        kind: "next",
        next: { id: "episode:electron:2", progressive: false },
      },
    });
    if (!resolved.ok) throw new Error(resolved.error.message);
    const prepared = await page.evaluate(
      ({ sessionId, generation }) =>
        window.ushark!.nextEpisode.prepare({
          sessionId,
          generation,
          sourceId: "source:electron",
          fileId: "file:2",
          mutation: { idempotencyKey: "next-electron-prepare" },
        }),
      resolved.value,
    );
    expect(prepared).toMatchObject({ ok: true, value: { state: "ready" } });
    const started = await page.evaluate(
      ({ sessionId, generation }) =>
        window.ushark!.nextEpisode.claimStart({
          sessionId,
          generation,
          mutation: { idempotencyKey: "next-electron-start" },
        }),
      resolved.value,
    );
    expect(started).toMatchObject({ ok: true, value: { state: "started" } });
    await expect(
      page.evaluate(
        ({ sessionId, generation }) =>
          window.ushark!.nextEpisode.claimStart({
            sessionId,
            generation,
            mutation: { idempotencyKey: "next-electron-start-second" },
          }),
        resolved.value,
      ),
    ).resolves.toMatchObject({ ok: false, error: { code: "NEXT_CONFLICT" } });
  } finally {
    await app.close();
  }
});
