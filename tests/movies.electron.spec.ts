import { _electron, expect, test } from "@playwright/test";
import electron from "electron";
import path from "node:path";

// Some IDE hosts export Node mode; the test must launch the desktop runtime.
const electronEnv = Object.fromEntries(
  Object.entries(process.env).filter(
    (entry): entry is [string, string] =>
      entry[0] !== "ELECTRON_RUN_AS_NODE" && entry[1] !== undefined,
  ),
);
import { enterMovies, movieFixtures } from "./movies.helpers";

test("M02 Electron empacotado: catálogo offline, assets locais, favorito e retorno à Home", async ({
  browserName,
}, testInfo) => {
  const app = await _electron.launch({
    executablePath: electron as unknown as string,
    env: electronEnv,
    args: [
      path.resolve("apps/desktop/src/main/index.cjs"),
      `--user-data-dir=${testInfo.outputPath(`${browserName}-electron-user-data`)}`,
    ],
  });
  try {
    const page = await app.firstWindow();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.context().setOffline(true);
    await enterMovies(page, false, true);
    await expect(page.locator(".movie-card")).toHaveCount(8);
    await expect
      .poll(() =>
        page
          .locator(".movie-card img")
          .evaluateAll((images) =>
            images.every(
              (image) =>
                (image as HTMLImageElement).complete &&
                (image as HTMLImageElement).naturalWidth > 0 &&
                (image as HTMLImageElement).src.includes(
                  "/movie-art/imdb/tt",
                ) &&
                (image as HTMLImageElement).src.endsWith("-poster.jpg"),
            ),
          ),
      )
      .toBe(true);
    await page
      .getByRole("button", { name: "Abrir Interestelar", exact: true })
      .click();
    await expect
      .poll(() =>
        page
          .locator(".discovery-detail-hero .discovery-art img")
          .evaluate(
            (image) =>
              (image as HTMLImageElement).naturalWidth > 0 &&
              (image as HTMLImageElement).src.endsWith(
                "/movie-art/imdb/tt0816692-backdrop.jpg",
              ),
          ),
      )
      .toBe(true);
    await page
      .getByRole("button", { name: "Todos os filmes", exact: true })
      .click();
    await movieFixtures(page, "collection");
    await expect(page.locator(".movie-card")).toHaveCount(4);
    await expect
      .poll(() =>
        page
          .locator(".movie-card img")
          .evaluateAll((images) =>
            images.every(
              (img) =>
                (img as HTMLImageElement).complete &&
                (img as HTMLImageElement).naturalWidth > 0,
            ),
          ),
      )
      .toBe(true);
    expect(page.url()).toMatch(/^file:/);
    await page
      .getByRole("button", { name: "Abrir Horizonte Azul", exact: true })
      .click();
    await expect(
      page.locator(".discovery-detail-hero .discovery-art img"),
    ).toBeVisible();
    await expect
      .poll(() =>
        page
          .locator(".discovery-detail-hero .discovery-art img")
          .evaluate((img) => (img as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
    await page.getByRole("button", { name: "Favoritar", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Favoritado", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.screenshot({
      path: "docs/milestones/M02-movies/evidence/electron-details.png",
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Todos os filmes", exact: true })
      .click();
    await page.getByRole("button", { name: "Início", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Minha biblioteca", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Ver meus filmes", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Abrir Horizonte Azul", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Favoritado", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => "require" in window)).toBe(false);
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Minha biblioteca", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Começar", exact: true }),
    ).toHaveCount(0);
  } finally {
    await app.close();
  }
});
