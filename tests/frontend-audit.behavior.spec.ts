import { test, expect } from "@playwright/test";
import { enterDiscovery, discoveryScenario } from "./discovery.helpers";

test("M01 M05 M18 preferências chegam aos tracks e gamepad altera volume sem sair do slider", async ({
  page,
}) => {
  await enterDiscovery(page);
  await page.getByRole("button", { name: "Ajustar preferências" }).click();
  await page
    .getByRole("group", { name: "Idioma de áudio" })
    .getByRole("button", { name: "English", exact: true })
    .click();
  await page.getByRole("button", { name: "Desligadas", exact: true }).click();
  await page.getByRole("button", { name: "Salvar preferências" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Preferências atualizadas",
  );
  await page.keyboard.press("Escape");
  await discoveryScenario(page, "editorial");
  await page.locator(".discovery-card").first().click();
  await page.getByRole("button", { name: /Continuar de/ }).click();
  await expect(
    page.getByRole("heading", {
      name: "Reproduzindo · primeiro frame simulado",
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Áudio e legendas", exact: true })
    .click();
  await expect(page.getByLabel("Faixa de áudio")).toHaveValue("English");
  await expect(
    page.getByRole("combobox", { name: "Legenda", exact: true }),
  ).toHaveValue("Desativada");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Áudio e legendas", exact: true }),
  ).toBeFocused();
  const slider = page.getByLabel("Volume", { exact: true });
  await slider.focus();
  await page.evaluate(() =>
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [{ buttons: [], axes: [1, 0] }],
    }),
  );
  await expect
    .poll(async () => Number(await slider.inputValue()))
    .toBeGreaterThan(70);
  await page.evaluate(() =>
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [],
    }),
  );
  await expect(slider).toBeFocused();
});

test("M01 M10 alterar apenas limite preserva caminho confirmado", async ({
  page,
}) => {
  await enterDiscovery(page);
  await page.getByRole("button", { name: "Ajustar preferências" }).click();
  await expect(page.locator(".folder-field")).toHaveCount(2);
  const before = await page.locator(".folder-field").allTextContents();
  await page.getByRole("button", { name: "Espaço e retenção" }).click();
  await page.getByLabel("Limite de cache (GB)").fill("80");
  await page.getByRole("button", { name: "Aplicar política" }).click();
  await page.getByRole("button", { name: "Voltar às configurações" }).click();
  expect(await page.locator(".folder-field").allTextContents()).toEqual(before);
  await expect(page.getByLabel("Limite do cache (GB)")).toHaveValue("80");
});
