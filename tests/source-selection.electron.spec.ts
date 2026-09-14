import { _electron, expect, test } from "@playwright/test";
import electron from "electron";
import fs from "node:fs";
import path from "node:path";
import type { Configuration } from "@ushark/types";
import type { MovieDraft } from "@ushark/types/movies";

const { ConfigurationStore } = require("@ushark/core/configuration");
const { MovieCatalogStore } = require("@ushark/core/movies");
const electronEnv = Object.fromEntries(
  Object.entries(process.env).filter(
    (entry): entry is [string, string] =>
      entry[0] !== "ELECTRON_RUN_AS_NODE" && entry[1] !== undefined,
  ),
);

test("M08 Electron real mede source local, escolhe e reidrata override", async ({
  browserName,
}, testInfo) => {
  test.setTimeout(60_000);
  const userData = testInfo.outputPath(`${browserName}-selection-user-data`);
  const databasePath = path.join(userData, "ushark.db");
  fs.mkdirSync(userData, { recursive: true });
  const configuration = new ConfigurationStore(
    databasePath,
    path.join(userData, "managed"),
  );
  const initial = configuration.read().configuration as Configuration;
  const saved = configuration.save(
    {
      ...initial,
      libraryPath: testInfo.outputPath("library"),
      cachePath: testInfo.outputPath("cache"),
    },
    { completeOnboarding: true },
  ).configuration as Configuration;
  configuration.close();
  const movies = new MovieCatalogStore(databasePath);
  const draft: MovieDraft = {
    metadata: {
      id: "movie:selection:electron",
      title: "Selection Real",
      duration: 120,
      genres: [],
      cast: [],
    },
    source: {
      id: "source:selection:electron",
      name: "local.mp4",
      resolution: "1080p",
      availability: "available",
      fileAvailable: true,
    },
  };
  expect(
    movies.save({
      libraryId: saved.libraryId,
      draft,
      mutation: { idempotencyKey: "selection-electron-seed" },
    }).ok,
  ).toBe(true);
  movies.close();
  const args = [
    path.resolve("apps/desktop/src/main/index.cjs"),
    `--user-data-dir=${userData}`,
  ];
  const first = await _electron.launch({
    executablePath: electron as unknown as string,
    env: electronEnv,
    args,
  });
  try {
    const page = await first.firstWindow();
    await expect(
      page.getByRole("heading", { name: "Selection Real", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Abrir Selection Real", exact: true })
      .first()
      .click();
    await page
      .getByText("Comparar fontes e preferências", { exact: true })
      .click();
    await expect(page.getByText(/^Arquivo local/)).toBeVisible();
    await page
      .getByRole("button", { name: "Escolher 1080p", exact: true })
      .click();
    await expect(page.getByText(/Escolha manual ativa/)).toBeVisible();
    await page
      .getByRole("button", { name: "Retirar escolha manual", exact: true })
      .click();
    await expect(page.getByText(/Escolha manual ativa/)).toHaveCount(0);
    const result = await page.evaluate(async () => {
      const api = window.ushark!.sourceSelection;
      const preflight = await api.preflight({
        requestId: "request:selection:electron",
        contentId: "movie:selection:electron",
        context: "details",
        strategy: "balanced",
        resolutionLimit: "1080p",
        candidates: [
          {
            sourceId: "source:selection:electron",
            name: "Local",
            completedLocal: true,
            resolutionHeight: 1080,
          },
        ],
      });
      const override = await api.setOverride({
        contentId: "movie:selection:electron",
        sourceId: "source:selection:electron",
        mutation: { idempotencyKey: "selection-electron-override" },
      });
      return { preflight, override };
    });
    expect(result.preflight).toMatchObject({
      ok: true,
      value: {
        state: "ready",
        selectedSourceId: "source:selection:electron",
        candidates: [{ health: { score: 100, confidence: 1 } }],
      },
    });
    expect(result.override).toMatchObject({
      ok: true,
      value: { sourceId: "source:selection:electron" },
    });
  } finally {
    await first.close();
  }

  const reopened = await _electron.launch({
    executablePath: electron as unknown as string,
    env: electronEnv,
    args,
  });
  try {
    const page = await reopened.firstWindow();
    const override = await page.evaluate(() =>
      window.ushark!.sourceSelection.readOverride({
        contentId: "movie:selection:electron",
      }),
    );
    expect(override).toMatchObject({
      ok: true,
      value: { sourceId: "source:selection:electron" },
    });
    expect(await page.evaluate(() => "require" in window)).toBe(false);
  } finally {
    await reopened.close();
  }
});
