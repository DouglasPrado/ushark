import { test, expect } from "@playwright/test";
import { enterDiscovery, discoveryScenario } from "./discovery.helpers";
test("M08 compara fontes, 4K inviável, menor tamanho e override no player", async ({
  page,
}) => {
  await enterDiscovery(page);
  await discoveryScenario(page, "editorial");
  await page.locator(".discovery-card").first().click();
  await page
    .getByText("Comparar fontes e preferências", { exact: true })
    .click();
  await page.getByLabel("Condição das fontes").selectOption("comparison");
  await expect(
    page.getByRole("button", { name: "Escolher 4K inviável", exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole("status")).toContainText("Cópia local 1080p");
  await page.getByLabel("Preferência de fonte").selectOption("smallest");
  await expect(page.getByRole("status")).toContainText("720p compacto");
  await page
    .getByRole("button", { name: "Escolher Cópia local 1080p", exact: true })
    .click();
  await page.getByLabel("Preferência de fonte").selectOption("quality");
  await expect(page.getByRole("status")).toContainText("Cópia local 1080p");
  await page.getByRole("button", { name: "Retirar escolha manual" }).click();
  await page.getByLabel("Resolução máxima").selectOption("720p");
  await expect(page.getByRole("status")).toContainText("720p compacto");
  await page.screenshot({
    path: "docs/milestones/M08-source-selection/evidence/comparison.png",
  });
  await page.getByRole("button", { name: /^Continuar de/ }).click();
  await expect(
    page.getByText("Fonte: 720p compacto", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Pronto parcial · Stream Only" }),
  ).toBeVisible();
});
test("M08 medir não bloqueia play, offline e escolha manual", async ({
  page,
}) => {
  await enterDiscovery(page);
  await discoveryScenario(page, "editorial");
  await page.locator(".discovery-card").first().click();
  await expect(
    page.getByRole("button", { name: /^Continuar de/ }),
  ).toBeEnabled();
  await page
    .getByText("Comparar fontes e preferências", { exact: true })
    .click();
  await page.getByLabel("Escolha automática", { exact: true }).uncheck();
  await expect(
    page.getByRole("button", { name: /^Continuar de/ }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Escolher 1080p", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /^Continuar de/ }),
  ).toBeEnabled();
  await page.getByLabel("Condição das fontes").selectOption("error");
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByRole("button", { name: "Medir novamente" }).click();
  await expect(page.getByRole("alert")).toBeHidden();
  await page.getByLabel("Condição das fontes").selectOption("offline");
  await expect(
    page.getByRole("button", { name: "Escolher 1080p", exact: true }),
  ).toBeEnabled();
  await page.keyboard.press("Escape");
  await expect(page.locator(".discovery-card").first()).toBeFocused();
});
test("M08 layout e estados desconhecidos não fabricam score", async ({
  page,
}) => {
  await enterDiscovery(page);
  await discoveryScenario(page, "editorial");
  await page.locator(".discovery-card").first().click();
  await page
    .getByText("Comparar fontes e preferências", { exact: true })
    .click();
  await page.getByLabel("Condição das fontes").selectOption("comparison");
  await expect(
    page.getByRole("button", { name: "Escolher 4K inviável" }),
  ).toBeDisabled();
  for (const [width, height] of [
    [1920, 1080],
    [2560, 1440],
    [3840, 2160],
  ]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => window.scrollTo(0, 0));
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `docs/milestones/M08-source-selection/evidence/selection-${height}.png`,
    });
  }
  await page.getByLabel("Condição das fontes").selectOption("unknown");
  await expect(page.getByRole("meter")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.locator(".discovery-card").first()).toBeFocused();
});
