import { test, expect } from "@playwright/test";
import { enterMovies, movieFixtures } from "./movies.helpers";

for (const [width, height] of [
  [1920, 1080],
  [2560, 1440],
  [3840, 2160],
]) {
  test(`M02 layout ${width}: lista, detalhes e cadastro`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await enterMovies(page);
    await expect(
      page.getByRole("button", { name: "Adicionar filme", exact: true }),
    ).toBeInViewport();
    await page.screenshot({
      path: `docs/milestones/M02-movies/evidence/empty-${width}.png`,
    });
    await movieFixtures(page, "collection");
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.locator(".movie-card")).toHaveCount(4);
    await expect(page.locator(".movie-card").last()).toBeInViewport();
    await page.screenshot({
      path: `docs/milestones/M02-movies/evidence/list-${width}.png`,
    });
    await page
      .getByRole("button", { name: "Abrir Horizonte Azul", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Horizonte Azul", exact: true }),
    ).toBeVisible();
    const detail = page.locator(".discovery-detail-page");
    const detailAction = await detail
      .locator(".selection-launch > button")
      .first()
      .boundingBox();
    const detailHero = await detail
      .locator(".discovery-detail-hero")
      .boundingBox();
    const synopsis = await detail
      .getByRole("heading", { name: "Sinopse" })
      .boundingBox();
    const detailTitle = await detail
      .locator(".discovery-detail-hero-copy h1")
      .boundingBox();
    const heroCopy = await detail
      .locator(".discovery-detail-hero-copy")
      .boundingBox();
    const heroOverview = await detail
      .locator(".discovery-detail-hero-overview")
      .boundingBox();
    expect(detailAction).not.toBeNull();
    expect(detailHero).not.toBeNull();
    expect(synopsis).not.toBeNull();
    expect(detailTitle).not.toBeNull();
    expect(heroCopy).not.toBeNull();
    expect(heroOverview).not.toBeNull();
    expect(
      Math.abs(
        heroCopy!.y +
          heroCopy!.height / 2 -
          (heroOverview!.y + heroOverview!.height / 2),
      ),
    ).toBeLessThanOrEqual(2);
    expect(detailTitle!.y).toBeLessThan(detailAction!.y);
    expect(detailAction!.y + detailAction!.height).toBeLessThanOrEqual(
      detailHero!.y + detailHero!.height,
    );
    expect(synopsis!.x).toBeGreaterThan(detailAction!.x);
    expect(synopsis!.y).toBeGreaterThanOrEqual(detailHero!.y);
    expect(synopsis!.y + synopsis!.height).toBeLessThanOrEqual(
      detailHero!.y + detailHero!.height,
    );
    const synopsisStyle = await detail
      .locator(".discovery-detail-hero-overview")
      .evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          backgroundColor: style.backgroundColor,
          backdropFilter: style.backdropFilter,
        };
      });
    expect(synopsisStyle.backgroundColor).toBe("rgba(8, 12, 18, 0.58)");
    expect(synopsisStyle.backdropFilter).toContain("blur(14px)");
    await expect(
      detail.locator(".discovery-detail-hero-copy .discovery-detail-actions"),
    ).toHaveCount(1);
    await expect(detail.locator(".discovery-detail-facts")).toHaveCount(0);
    const recommendations = await detail
      .getByRole("region", { name: "Recomendados" })
      .boundingBox();
    expect(recommendations).not.toBeNull();
    expect(
      Math.abs(recommendations!.y - (detailHero!.y + detailHero!.height)),
    ).toBeLessThanOrEqual(1);
    const sourcesAction = page.getByRole("button", {
      name: "Fontes (2)",
      exact: true,
    });
    await sourcesAction.scrollIntoViewIfNeeded();
    await expect(sourcesAction).toBeInViewport();
    await page.screenshot({
      path: `docs/milestones/M02-movies/evidence/details-${width}.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "Editar identificação" }).click();
    await expect(page.getByRole("dialog")).toBeInViewport();
    await page
      .getByRole("button", { name: "Buscar filme", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: /Horizonte Azul 2024/ }),
    ).toBeVisible();
    await page.screenshot({
      path: `docs/milestones/M02-movies/evidence/search-${width}.png`,
    });
    await page.keyboard.press("Escape");
    await sourcesAction.scrollIntoViewIfNeeded();
    await sourcesAction.click();
    const close = page.getByRole("button", {
      name: "Fechar diálogo",
      exact: true,
    });
    await expect(close).toBeFocused();
    await expect(close).toBeInViewport();
    const bounds = await page.getByRole("dialog").boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(height);
    await page.screenshot({
      path: `docs/milestones/M02-movies/evidence/sources-${width}.png`,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
}
