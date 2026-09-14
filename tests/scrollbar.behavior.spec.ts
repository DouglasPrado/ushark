import { expect, test } from "@playwright/test";

test("scroll vertical usa o azul padrão do Ushark", async ({ page }) => {
  await page.goto("/");

  const scrollbar = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    return {
      accent: root.getPropertyValue("--accent").trim(),
      thumb: root.getPropertyValue("--scrollbar-thumb").trim(),
      track: root.getPropertyValue("--scrollbar-track").trim(),
      color: root.scrollbarColor,
      width: root.scrollbarWidth,
    };
  });

  expect(scrollbar.accent).toBe("#87bbef");
  expect(scrollbar.thumb).toBe("#87bbef");
  expect(scrollbar.track).toBe("#0a1118");
  expect(scrollbar.color).toBe("rgb(135, 187, 239) rgb(10, 17, 24)");
  expect(scrollbar.width).toBe("thin");
});
