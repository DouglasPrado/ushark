import { test, expect, type Page } from "@playwright/test";
import { enterDiscovery } from "./discovery.helpers";
async function about(page: Page) {
  await enterDiscovery(page);
  await page.getByRole("button", { name: "Ajustar preferências" }).click();
  await page
    .getByRole("button", { name: "Sobre e atualização", exact: true })
    .click();
  await page.getByText("Cenários de atualização", { exact: true }).click();
}
test("M22 canais conservam candidato, update gera backup, uninstall preserva e reinstala", async ({
  page,
}) => {
  await about(page);
  for (const channel of ["Canary", "Beta", "Stable"]) {
    await page.getByLabel("Canal de atualização").selectOption(channel);
    await page
      .getByRole("button", { name: "Verificar atualização", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toContainText("DEMO-ARTIFACT-002");
    await expect(page.getByRole("dialog")).toContainText(channel);
    await page.getByRole("button", { name: "Voltar sem confirmar" }).click();
  }
  await page
    .getByRole("button", { name: "Verificar atualização", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.waitForTimeout(200);
  for (const [width, height] of [
    [1920, 1080],
    [2560, 1440],
    [3840, 2160],
  ]) {
    await page.setViewportSize({ width, height });
    await page.screenshot({
      path: `docs/milestones/M22-release-update/evidence/candidate-${height}.png`,
    });
  }
  await page
    .getByRole("button", { name: "Aplicar candidato simulado" })
    .click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByText("Versão simulada: 0.2.0-demo")).toBeVisible();
  await page
    .getByRole("button", { name: "Verificar atualização", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Já atualizado");
  await page
    .getByRole("button", { name: "Revisar desinstalação simulada" })
    .click();
  await page
    .getByRole("button", { name: "Confirmar desinstalação simulada" })
    .click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(
    page.getByRole("heading", { name: "Aplicativo ausente na simulação" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Revisar instalação simulada" })
    .click();
  await page
    .getByRole("button", { name: "Aplicar candidato simulado" })
    .click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await page
    .getByRole("button", { name: "Abrir backup e recuperação" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Antes da atualização simulada" }),
  ).toHaveCount(2);
});
test("M22 assinatura/hash/incompatibilidade/migração e cancelamento preservam versão", async ({
  page,
}) => {
  await about(page);
  await page.getByLabel("Estado da atualização").selectOption("offline");
  await page
    .getByRole("button", { name: "Verificar atualização", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Offline");
  for (const value of [
    "signature",
    "hash",
    "incompatible",
    "download-error",
    "migration",
  ]) {
    await page.getByLabel("Estado da atualização").selectOption(value);
    await page
      .getByRole("button", { name: "Verificar atualização", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Aplicar candidato simulado" })
      .click();
    await expect(page.getByRole("dialog").getByRole("alert")).toBeVisible();
    await page.getByRole("button", { name: "Voltar sem confirmar" }).click();
    await expect(page.getByText("Versão simulada: 0.1.0-demo")).toBeVisible();
  }
  await page.getByLabel("Estado da atualização").selectOption("normal");
  await page
    .getByRole("button", { name: "Verificar atualização", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Aplicar candidato simulado" })
    .click();
  await page.getByRole("button", { name: "Cancelar operação" }).click();
  await page.getByRole("button", { name: "Voltar sem confirmar" }).click();
  await expect(page.getByText("Versão simulada: 0.1.0-demo")).toBeVisible();
});
