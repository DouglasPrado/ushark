import { expect, test, type Locator, type Page } from "@playwright/test";
import { enterDiscovery } from "./discovery.helpers";
import { enterMovies, movieFixtures } from "./movies.helpers";

const viewports = [1920, 1100, 761, 700, 480];

async function expectOverlaysInside(page: Page, surfaces: Locator) {
  for (const width of viewports) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await surfaces.count()).toBeGreaterThan(0);
    expect(
      await surfaces.evaluateAll((items) =>
        items.every((surface) => {
          const bounds = surface.getBoundingClientRect();
          return [
            ...surface.querySelectorAll(
              ":scope > .torrent-health-badge, :scope > .favorite-badge",
            ),
          ].every((overlay) => {
            const overlayBounds = overlay.getBoundingClientRect();
            return (
              overlayBounds.left >= bounds.left &&
              overlayBounds.top >= bounds.top &&
              overlayBounds.right <= bounds.right &&
              overlayBounds.bottom <= bounds.bottom
            );
          });
        }),
      ),
    ).toBe(true);
  }
}

async function expectMovieContentInside(page: Page) {
  for (const width of viewports) {
    await page.setViewportSize({ width, height: 1000 });
    const cards = page.locator(".movie-card");
    expect(await cards.count()).toBeGreaterThan(0);
    expect(
      await cards.evaluateAll((items) =>
        items.every((card) => {
          const bounds = card.getBoundingClientRect();
          return [
            ...card.querySelectorAll(
              ":scope > .movie-card-media, :scope > .movie-card-copy, :scope > .movie-card-copy > strong, :scope > .movie-card-copy > small, :scope > .movie-card-copy > .imdb-facts, :scope > .movie-card-copy > .imdb-facts > *",
            ),
          ].every((content) => {
            const contentBounds = content.getBoundingClientRect();
            return (
              contentBounds.left >= bounds.left &&
              contentBounds.right <= bounds.right
            );
          });
        }),
      ),
    ).toBe(true);
  }
}

test("badges permanecem dentro dos cards na busca", async ({ page }) => {
  await enterDiscovery(page);
  await page.getByRole("button", { name: "Busca", exact: true }).click();
  await expect(page.getByText("Buscando suas histórias…")).toBeHidden();

  await expectOverlaysInside(
    page,
    page.locator(".discovery-results .discovery-card-media"),
  );
});

test("badges permanecem dentro dos cards de filmes", async ({ page }) => {
  await enterMovies(page);
  await movieFixtures(page, "collection");

  await expectOverlaysInside(page, page.locator(".movie-card-media"));
  await expectMovieContentInside(page);
  await expect(page.locator(".movie-card > .movie-card-copy")).toHaveCount(4);
});

test("metadata do catálogo padrão permanece dentro dos cards", async ({
  page,
}) => {
  await enterMovies(page, true, true);

  await expectOverlaysInside(page, page.locator(".movie-card-media"));
  await expectMovieContentInside(page);
  await expect(page.locator(".movie-card > .movie-card-copy")).toHaveCount(8);
  await page.setViewportSize({ width: 761, height: 1000 });
  await page.screenshot({
    path: "docs/milestones/M02-movies/evidence/card-internals-761.png",
    fullPage: true,
  });
});
