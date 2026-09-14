import { test, expect } from "@playwright/test";
import { enterDiscovery } from "./discovery.helpers";
test("M06 importa magnet, deduplica source e confirma catálogo", async ({
  page,
}) => {
  await enterDiscovery(page);
  await page.getByRole("button", { name: "Filmes", exact: true }).click();
  const trigger = page.getByRole("button", {
    name: "Importar torrent ou magnet",
  });
  await trigger.click();
  await page.getByRole("button", { name: "Resolver metadata" }).click();
  await expect(page.getByRole("alert")).toContainText("magnet válido");
  await page.getByRole("button", { name: "Preencher magnet" }).click();
  await page.getByRole("button", { name: "Resolver metadata" }).click();
  await expect(page.getByText("InfoHash:", { exact: false })).toBeVisible();
  await expect(page.getByRole("checkbox").first()).toBeChecked();
  await expect(page.getByRole("checkbox").nth(1)).not.toBeChecked();
  await page.getByRole("button", { name: "Confirmar arquivos" }).click();
  await expect(page.getByRole("status")).toContainText("1 origem(ns)");
  await expect(
    page.getByRole("button", { name: /Abrir Horizonte 2024/ }),
  ).toBeVisible();
  await trigger.click();
  await page.getByRole("button", { name: "Confirmar arquivos" }).click();
  await expect(page.getByRole("status")).toContainText("1 origem(ns)");
  await expect(
    page.getByRole("button", { name: /Abrir Horizonte 2024/ }),
  ).toHaveCount(1);
});
test("M06 pendência, cancelamento, path hostil e revisão de série", async ({
  page,
}) => {
  await enterDiscovery(page);
  await page.getByRole("button", { name: "Séries", exact: true }).click();
  await page
    .getByRole("button", { name: "Importar torrent ou magnet" })
    .click();
  await page.getByRole("button", { name: "Selecionar serie.torrent" }).click();
  await page.getByText("Opções avançadas", { exact: true }).click();
  await page.getByLabel("Condição da origem").selectOption("no-peers");
  await page.getByRole("button", { name: "Resolver metadata" }).click();
  await expect(page.getByRole("alert")).toContainText("Sem peers");
  await page.getByRole("button", { name: "Salvar pendente" }).click();
  await expect(
    page.getByRole("button", { name: "Repetir pendência 1" }),
  ).toBeVisible();
  await page.getByLabel("Condição da origem").selectOption("normal");
  await page.getByRole("button", { name: "Repetir pendência 1" }).click();
  await page.getByRole("button", { name: "Cancelar resolução" }).click();
  await page.waitForTimeout(800);
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Importar torrent ou magnet" }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Importar torrent ou magnet" })
    .click();
  await page.getByRole("button", { name: "Repetir pendência 1" }).click();
  await expect(page.getByRole("checkbox")).toHaveCount(4);
  await page.getByRole("button", { name: "Confirmar arquivos" }).click();
  await expect(page.getByRole("alert")).toContainText("Escolha pelo menos");
  await page.getByRole("checkbox").nth(0).check();
  await page.getByRole("checkbox").nth(1).check();
  await page.screenshot({
    path: "docs/milestones/M06-torrent-import/evidence/review.png",
  });
  await page.getByRole("button", { name: "Confirmar arquivos" }).click();
  await expect(page.getByRole("status")).toContainText("Importação concluída");
  await expect(page.getByText("Entre Órbitas", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Importar torrent ou magnet" })
    .click();
  await page.getByRole("button", { name: "Editar entrada" }).click();
  await page.getByText("Opções avançadas", { exact: true }).click();
  await page.getByLabel("Condição da origem").selectOption("hostile");
  await page.getByRole("button", { name: "Resolver metadata" }).click();
  await expect(page.getByRole("alert")).toContainText("caminho fora");
});

test("M06 fixtures de falha, teclado e resoluções", async ({ page }) => {
  await enterDiscovery(page);
  await page.getByRole("button", { name: "Filmes", exact: true }).click();
  await page
    .getByRole("button", { name: "Importar torrent ou magnet" })
    .click();
  await page.getByRole("button", { name: "Preencher magnet" }).click();
  await page.getByText("Opções avançadas", { exact: true }).click();
  for (const scenario of ["timeout", "daemon", "offline", "bencode"]) {
    await page.getByLabel("Condição da origem").selectOption(scenario);
    await page.getByRole("button", { name: "Resolver metadata" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
  }
  await page.getByLabel("Condição da origem").selectOption("ambiguous");
  await page.getByRole("button", { name: "Resolver metadata" }).click();
  await expect(page.getByRole("checkbox")).toHaveCount(4);
  await expect(page.getByRole("checkbox").first()).not.toBeChecked();
  for (const [width, height] of [
    [1920, 1080],
    [2560, 1440],
    [3840, 2160],
  ]) {
    await page.setViewportSize({ width, height });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `docs/milestones/M06-torrent-import/evidence/import-${height}.png`,
    });
  }
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Importar torrent ou magnet" }),
  ).toBeFocused();
});
