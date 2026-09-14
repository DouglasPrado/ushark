import { test, expect, type Page } from "@playwright/test";
import { enterDiscovery } from "./discovery.helpers";
async function recoveryFromHome(page: Page) {
  await page.getByRole("button", { name: "Ajustar preferências" }).click();
  await page
    .getByRole("button", { name: "Backup e recuperação", exact: true })
    .click();
}
async function backup(page: Page) {
  await page.getByRole("button", { name: "Criar backup simulado" }).click();
  await expect(page.getByRole("status")).toContainText("Backup consistente");
}
test("M21 backup restaura curadoria alterada e mantém snapshot de segurança", async ({
  page,
}) => {
  await enterDiscovery(page);
  await page.getByRole("button", { name: "Bibliotecas", exact: true }).click();
  await page.getByRole("button", { name: "Criar biblioteca" }).click();
  await page.getByLabel("Nome da biblioteca", { exact: true }).fill("Antes");
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await expect(page.getByRole("status")).toContainText("salvo");
  await page.getByRole("button", { name: "Voltar às bibliotecas" }).click();
  await page.getByRole("button", { name: "Voltar ao início" }).click();
  await recoveryFromHome(page);
  await backup(page);
  await page
    .getByRole("button", { name: "Abrir biblioteca", exact: true })
    .click();
  await page.getByRole("button", { name: "Bibliotecas", exact: true }).click();
  await page.getByRole("button", { name: "Editar Antes" }).click();
  await page.getByLabel("Nome da biblioteca", { exact: true }).fill("Depois");
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await expect(page.getByRole("status")).toContainText("salvo");
  await page.getByRole("button", { name: "Voltar às bibliotecas" }).click();
  await page.getByRole("button", { name: "Voltar ao início" }).click();
  await recoveryFromHome(page);
  await page
    .getByRole("button", { name: "Revisar restauração de Backup da sessão" })
    .click();
  await page
    .getByRole("button", { name: "Confirmar restauração em memória" })
    .click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(
    page.getByRole("heading", { name: "Segurança antes da restauração" }),
  ).toBeVisible();
  for (const [width, height] of [
    [1920, 1080],
    [2560, 1440],
    [3840, 2160],
  ]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `docs/milestones/M21-backup-recovery/evidence/recovered-${height}.png`,
    });
  }
  await page
    .getByRole("button", { name: "Abrir biblioteca", exact: true })
    .click();
  await page.getByRole("button", { name: "Bibliotecas", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Editar Antes" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Editar Depois" })).toHaveCount(
    0,
  );
});
test("M21 validações, cancelamento, supervisor limitado e shutdown com timeout", async ({
  page,
}) => {
  await enterDiscovery(page);
  await recoveryFromHome(page);
  await backup(page);
  await page.getByText("Cenários de recuperação", { exact: true }).click();
  for (const scenario of [
    "invalid",
    "incompatible",
    "locked",
    "full",
    "migration",
    "partial",
  ]) {
    await page.getByLabel("Estado do backup").selectOption(scenario);
    await page
      .getByRole("button", { name: "Revisar restauração de Backup da sessão" })
      .click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByRole("dialog")).toBeHidden();
  }
  await page.getByLabel("Estado do backup").selectOption("offline");
  await page
    .getByRole("button", { name: "Revisar restauração de Backup da sessão" })
    .click();
  await page
    .getByRole("button", { name: "Confirmar restauração em memória" })
    .click();
  await page.getByRole("button", { name: "Cancelar operação" }).click();
  await page.getByRole("button", { name: "Voltar sem confirmar" }).click();
  await expect(
    page.getByRole("heading", { name: "Segurança antes da restauração" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Simular inicialização após falha" })
    .click();
  await page.getByLabel("Simular falha de recuperação/shutdown").check();
  for (let i = 0; i < 4; i++) {
    await page
      .getByRole("button", { name: "Tentar recuperar componente" })
      .click();
    await expect(page.getByRole("alert")).toBeVisible();
  }
  await expect(page.getByRole("alert")).toContainText("Limite de 3");
  await page
    .getByRole("button", { name: "Rearmar supervisor simulado" })
    .click();
  await page
    .getByRole("button", { name: "Simular encerramento global" })
    .click();
  await page
    .getByRole("button", { name: "Confirmar shutdown simulado" })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "Timeout",
  );
  await page.getByRole("button", { name: "Voltar sem confirmar" }).click();
  await page.getByLabel("Simular falha de recuperação/shutdown").uncheck();
  await page
    .getByRole("button", { name: "Tentar recuperar componente" })
    .click();
  await expect(page.getByRole("status")).toContainText("recuperado");
  await page
    .getByRole("button", { name: "Simular encerramento global" })
    .click();
  await page
    .getByRole("button", { name: "Confirmar shutdown simulado" })
    .click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(
    page.getByRole("heading", { name: "Shutdown simulado" }),
  ).toBeVisible();
});
