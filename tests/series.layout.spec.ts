import { test, expect } from "@playwright/test";
import { enterSeries, openPack } from "./series.helpers";
for (const [width, height] of [
  [1920, 1080],
  [2560, 1440],
  [3840, 2160],
])
  test(`M03 layout ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await enterSeries(page);
    await openPack(page);
    await expect(
      page.getByRole("button", {
        name: "Especiais · 1 arquivo(s)",
        exact: true,
      }),
    ).toBeVisible();
    await page.screenshot({
      path: `docs/milestones/M03-series/evidence/review-${width}.png`,
    });
    const box = await page.getByRole("dialog").boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(height);
    expect(
      await page
        .locator('[role="dialog"]')
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await page
      .getByRole("button", { name: "Confirmar série", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Entre Órbitas", exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: `docs/milestones/M03-series/evidence/seasons-${width}.png`,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
