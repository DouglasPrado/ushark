import { _electron, expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import electron from "electron";
import fs from "node:fs";
import path from "node:path";
import type { Configuration } from "@ushark/types";
import type { MovieDraft } from "@ushark/types/movies";

const electronEnv = Object.fromEntries(
  Object.entries(process.env).filter(
    (entry): entry is [string, string] =>
      entry[0] !== "ELECTRON_RUN_AS_NODE" && entry[1] !== undefined,
  ),
);
const { ConfigurationStore } = require("@ushark/core/configuration");
const { MovieCatalogStore } = require("@ushark/core/movies");

test("M05 Electron real: reproduz, controla, sai e retoma arquivo local", async ({
  browserName,
}, testInfo) => {
  test.setTimeout(90_000);
  const userData = testInfo.outputPath(`${browserName}-electron-user-data`);
  const libraryPath = testInfo.outputPath("library");
  const cachePath = testInfo.outputPath("cache");
  const databasePath = path.join(userData, "ushark.db");
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
  const mediaPath = path.join(libraryPath, "playback-real.mp4");
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
    "12",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-y",
    mediaPath,
  ]);
  const movies = new MovieCatalogStore(databasePath, {
    managedLibraryRoot: libraryPath,
  });
  const draft: MovieDraft = {
    metadata: {
      id: "movie:playback:electron",
      title: "Playback Real",
      synopsis: "Arquivo local validado de ponta a ponta.",
      duration: 12,
      genres: ["Teste"],
      cast: [],
    },
    source: {
      id: "source:playback:electron",
      name: "playback-real.mp4",
      resolution: "1080p",
      availability: "available",
      fileAvailable: true,
    },
  };
  expect(
    movies.save({
      libraryId: saved.libraryId,
      draft,
      mutation: { idempotencyKey: "playback-electron-seed" },
    }).ok,
  ).toBe(true);
  movies.registerManagedFile("source:playback:electron", mediaPath);
  movies.close();

  const args = [
    path.resolve("apps/desktop/src/main/index.cjs"),
    `--user-data-dir=${userData}`,
  ];
  const env = {
    ...electronEnv,
    USHARK_MPV_PATH: "/opt/homebrew/bin/mpv",
    USHARK_MPV_TEST_HEADLESS: "1",
  };
  const app = await _electron.launch({
    executablePath: electron as unknown as string,
    env,
    args,
  });
  try {
    const page = await app.firstWindow();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await expect(
      page.getByRole("heading", { name: "Minha biblioteca", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Playback Real", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Abrir Playback Real", exact: true })
      .first()
      .click();
    await page.evaluate(() => {
      const scope = globalThis as unknown as {
        playbackEvents?: string[];
        ushark: {
          playback: {
            subscribe(
              listener: (event: {
                type: string;
                session?: { state: string };
              }) => void,
            ): () => void;
          };
        };
      };
      scope.playbackEvents = [];
      scope.ushark.playback.subscribe((event) =>
        scope.playbackEvents?.push(
          `${event.type}:${event.session?.state ?? "none"}`,
        ),
      );
    });
    await page.getByRole("button", { name: "Assistir", exact: true }).click();
    await expect(page.locator(".player-preview")).toHaveAttribute(
      "data-player-runtime",
      "desktop",
    );
    await expect(page.locator(".player-scene img")).toHaveCount(0);
    await expect(page.locator("html")).toHaveClass(/native-playback-surface/);
    await expect(
      page.getByRole("heading", { name: "Reproduzindo", exact: true }),
    ).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "Pausar", exact: true }).click();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (globalThis as unknown as { playbackEvents?: string[] })
              .playbackEvents,
        ),
      )
      .toContain("paused:paused");
    await expect(page.locator(".player-preview")).toHaveAttribute(
      "data-player-status",
      "paused",
    );
    await expect(
      page.getByRole("heading", { name: "Pausado", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Reproduzir", exact: true }).click();
    await page.waitForTimeout(1_500);
    await expect
      .poll(() =>
        page.evaluate(() =>
          Number(
            (
              document.querySelector(
                'input[aria-label="Posição"]',
              ) as HTMLInputElement
            )?.value ?? -1,
          ),
        ),
      )
      .toBeGreaterThan(0);
    await page
      .getByRole("button", { name: "Voltar aos detalhes", exact: true })
      .click();
    await expect(page.locator(".player-preview")).toHaveCount(0);
    await expect(page.locator("html")).not.toHaveClass(
      /native-playback-surface/,
    );
    const progress = await page.evaluate(async () => {
      const api = (
        window as unknown as {
          ushark: {
            playback: {
              readProgress(input: { contentId: string }): Promise<{
                ok: boolean;
                value?: { positionSeconds: number; watched: boolean };
              }>;
            };
          };
        }
      ).ushark.playback;
      return api.readProgress({ contentId: "movie:playback:electron" });
    });
    expect(progress).toMatchObject({
      ok: true,
      value: { positionSeconds: expect.any(Number), watched: false },
    });
    expect(progress.value?.positionSeconds ?? 0).toBeGreaterThan(0);
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => "require" in window)).toBe(false);
  } finally {
    await app.close();
  }

  const reopened = await _electron.launch({
    executablePath: electron as unknown as string,
    env,
    args,
  });
  try {
    const page = await reopened.firstWindow();
    await expect(
      page.getByRole("heading", { name: "Playback Real", exact: true }),
    ).toBeVisible();
    const progress = await page.evaluate(async () => {
      const api = (
        window as unknown as {
          ushark: {
            playback: {
              readProgress(input: { contentId: string }): Promise<{
                ok: boolean;
                value?: { positionSeconds: number };
              }>;
            };
          };
        }
      ).ushark.playback;
      return api.readProgress({ contentId: "movie:playback:electron" });
    });
    expect(progress.ok).toBe(true);
    expect(progress.value?.positionSeconds ?? 0).toBeGreaterThan(0);
  } finally {
    await reopened.close();
  }
});
