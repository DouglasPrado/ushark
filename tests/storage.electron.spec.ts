import { _electron, expect, test } from "@playwright/test";
import electron from "electron";
import fs from "node:fs";
import path from "node:path";
import type { Configuration } from "@ushark/types";

const { ConfigurationStore } = require("@ushark/core/configuration");
const { MovieCatalogStore } = require("@ushark/core/movies");
const { StoragePolicyService } = require("@ushark/core/storage-policy");

test("M10 Electron promove Keep e limpa arquivo real", async ({
  browserName,
}, testInfo) => {
  const userData = testInfo.outputPath(`${browserName}-storage-user-data`);
  const databasePath = path.join(userData, "ushark.db");
  const libraryPath = testInfo.outputPath("library");
  const cachePath = testInfo.outputPath("cache");
  const cacheRoot = path.join(cachePath, "torrent-runtime");
  fs.mkdirSync(userData, { recursive: true });
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
  for (const id of ["old", "move"])
    expect(
      movies.save({
        libraryId: saved.libraryId,
        draft: {
          metadata: {
            id: `movie:storage:${id}`,
            title: `Storage ${id}`,
            genres: [],
            cast: [],
          },
          source: {
            id: `source:storage:${id}`,
            name: `${id}.mkv`,
            availability: "available",
            fileAvailable: false,
          },
        },
        mutation: { idempotencyKey: `storage-electron:${id}` },
      }).ok,
    ).toBe(true);
  movies.close();
  fs.mkdirSync(cacheRoot, { recursive: true });
  const oldPath = path.join(cacheRoot, "old.mkv");
  const movePath = path.join(cacheRoot, "move.mkv");
  fs.writeFileSync(oldPath, Buffer.alloc(2048));
  fs.writeFileSync(movePath, Buffer.alloc(4096));
  const seed = new StoragePolicyService({
    databasePath,
    cacheRoot,
    libraryRoot: libraryPath,
  });
  seed.registerAsset({
    id: "old",
    contentId: "movie:storage:old",
    sourceId: "source:storage:old",
    name: "Old",
    managedPath: oldPath,
    lastUsed: 1,
  });
  seed.registerAsset({
    id: "move",
    contentId: "movie:storage:move",
    sourceId: "source:storage:move",
    name: "Move",
    managedPath: movePath,
    lastUsed: 2,
  });
  seed.close();
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
    const before = await page.evaluate(() => window.ushark!.storage.read());
    expect(before).toMatchObject({
      ok: true,
      value: { entries: [{ id: "old" }, { id: "move" }] },
    });
    if (!before.ok) throw new Error(before.error.message);
    const promoted = await page.evaluate(
      async ({ revision }) =>
        window.ushark!.storage.retain({
          id: "move",
          keep: true,
          expectedRevision: revision,
          mutation: { idempotencyKey: "storage-electron-retain" },
        }),
      { revision: before.value.revision },
    );
    expect(promoted).toMatchObject({
      ok: true,
      value: {
        entries: expect.arrayContaining([
          expect.objectContaining({ id: "move", keep: true }),
        ]),
      },
    });
    if (!promoted.ok) throw new Error(promoted.error.message);
    const cleaned = await page.evaluate(
      async ({ revision }) =>
        window.ushark!.storage.clean({
          ids: ["old"],
          expectedRevision: revision,
          mutation: { idempotencyKey: "storage-electron-clean" },
        }),
      { revision: promoted.value.revision },
    );
    expect(cleaned).toMatchObject({ ok: true, value: { freedBytes: 2048 } });
    expect(fs.existsSync(oldPath)).toBe(false);
    expect(fs.existsSync(movePath)).toBe(false);
    expect(fs.existsSync(path.join(libraryPath, "move.mkv"))).toBe(true);
    await page.getByRole("button", { name: "Ajustar preferências" }).click();
    await page.getByRole("button", { name: "Espaço e retenção" }).click();
    await expect(
      page.getByText("Uso físico dos diretórios gerenciados", { exact: false }),
    ).toBeVisible();
    await expect(page.getByText("Cenários de armazenamento")).toHaveCount(0);
  } finally {
    await app.close();
  }
});
