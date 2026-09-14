import { test, expect } from "@playwright/test";
import { enterDiscovery, discoveryScenario } from "./discovery.helpers";
for (const [width, height] of [
  [1920, 1080],
  [2560, 1440],
  [3840, 2160],
])
  test(`M04 Home e busca ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await enterDiscovery(page);
    await discoveryScenario(page, "editorial");
    await expect(
      page.getByRole("heading", { name: "Horizonte Azul", exact: true }),
    ).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    const hero = page.locator(".discovery-hero");
    await expect(hero).toBeVisible();
    expect((await hero.boundingBox())!.height).toBeGreaterThan(height * 0.55);
    const movieRail = page
      .locator(".discovery-section")
      .filter({
        has: page.getByRole("heading", { name: "Filmes para descobrir" }),
      })
      .locator(".discovery-row");
    expect(
      await movieRail.evaluate(
        (element) => element.scrollWidth > element.clientWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `docs/milestones/M04-home-search/evidence/home-${width}.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "Busca", exact: true }).click();
    await expect(
      page.locator(".discovery-results .discovery-card"),
    ).toHaveCount(7);
    await page.screenshot({
      path: `docs/milestones/M04-home-search/evidence/search-${width}.png`,
      fullPage: true,
    });
    await page.getByLabel("Tipo", { exact: true }).selectOption("movie");
    await page.locator(".discovery-results .discovery-card").first().click();
    const detail = page.locator(".discovery-detail-page");
    await expect(detail).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(detail).toHaveAttribute("role", "main");
    const detailBox = await detail.boundingBox();
    expect(detailBox).not.toBeNull();
    expect(detailBox!.x).toBeGreaterThanOrEqual(0);
    expect(detailBox!.y).toBeGreaterThanOrEqual(0);
    expect(detailBox!.x + detailBox!.width).toBeLessThanOrEqual(width);
    expect(detailBox!.height).toBeGreaterThanOrEqual(height * 0.75);
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
    await page.screenshot({
      path: `docs/milestones/M04-home-search/evidence/rich-detail-${width}.png`,
      fullPage: true,
    });
    await detail.getByRole("button", { name: "Voltar" }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
