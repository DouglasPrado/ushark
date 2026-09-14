import { test, expect, type Page } from "@playwright/test";
import { enterDiscovery } from "./discovery.helpers";
async function enter(page: Page) {
  await enterDiscovery(page);
  await page.getByRole("button", { name: "Bibliotecas", exact: true }).click();
  await page.getByRole("button", { name: "Assinaturas", exact: true }).click();
}
async function install(page: Page) {
  await enter(page);
  await page.getByRole("button", { name: "Usar código de exemplo" }).click();
  await page.getByRole("button", { name: "Revisar biblioteca" }).click();
  await page
    .getByRole("button", { name: "Confirmar assinatura simulada" })
    .click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByText(/Versão instalada: 1/)).toBeVisible();
}
async function scenario(page: Page, value: string) {
  const label = page.getByLabel("Estado da sincronização");
  if (!(await label.isVisible()))
    await page.getByText("Cenários de assinatura", { exact: true }).click();
  await label.selectOption(value);
}
test("M16 assinatura abre player, salva pessoal, remove origem e preserva favorito", async ({
  page,
}) => {
  await install(page);
  await page
    .getByRole("button", { name: "Horizonte Azul", exact: true })
    .click();
  await page.getByRole("button", { name: "Favoritar", exact: true }).click();
  await page
    .getByRole("button", { name: "Salvar na biblioteca pessoal" })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Conteúdo salvo");
  await page.getByRole("button", { name: "Assistir", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Reproduzindo · primeiro frame simulado",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Voltar aos detalhes" }).click();
  await expect(page.getByRole("dialog")).toContainText("Remover favorito");
  await page.getByRole("button", { name: "Ocultar nesta biblioteca" }).click();
  await page.getByRole("button", { name: "Restaurar Horizonte Azul" }).click();
  await expect(
    page.getByRole("button", { name: "Horizonte Azul", exact: true }),
  ).toBeVisible();
  await scenario(page, "remove");
  await page
    .getByRole("button", { name: "Verificar atualização", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Aplicar atualização simulada" })
    .click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByText(/Versão instalada: 2/)).toBeVisible();
  await page.getByRole("button", { name: "Deixar de assinar" }).click();
  await expect(page.getByRole("dialog")).toContainText("favoritos");
  await page
    .getByRole("button", { name: "Confirmar remoção da assinatura" })
    .click();
  await page.getByRole("button", { name: "Voltar às bibliotecas" }).click();
  await page.getByRole("button", { name: "Voltar ao início" }).click();
  await expect(
    page
      .locator(".discovery-card")
      .filter({ hasText: "Horizonte Azul" })
      .first(),
  ).toBeVisible();
});
test("M16 crashes preservam versão, retry aplica e rollback retorna", async ({
  page,
}) => {
  await install(page);
  for (const value of ["stage-crash", "verify-crash", "commit-crash"]) {
    await scenario(page, value);
    await page
      .getByRole("button", { name: "Verificar atualização", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Aplicar atualização simulada" })
      .click();
    await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
      "Versão anterior preservada",
    );
    await page.getByRole("button", { name: "Voltar sem alterar" }).click();
    await expect(page.getByText(/Versão instalada: 1/)).toBeVisible();
  }
  for (const value of ["offline", "hash", "downgrade"]) {
    await scenario(page, value);
    await page
      .getByRole("button", { name: "Verificar atualização", exact: true })
      .click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByRole("dialog")).toBeHidden();
  }
  await scenario(page, "update");
  await page
    .getByRole("button", { name: "Verificar atualização", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Aplicar atualização simulada" })
    .click();
  await page.getByRole("button", { name: "Cancelar sincronização" }).click();
  await page.getByRole("button", { name: "Voltar sem alterar" }).click();
  await expect(page.getByText(/Versão instalada: 1/)).toBeVisible();
  await page
    .getByRole("button", { name: "Verificar atualização", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Aplicar atualização simulada" })
    .click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByText(/Versão instalada: 2/)).toBeVisible();
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
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `docs/milestones/M16-library-subscriptions/evidence/subscription-${height}.png`,
    });
  }
  await page
    .getByRole("button", { name: "Reverter à versão anterior" })
    .click();
  await page.getByRole("button", { name: "Confirmar rollback" }).click();
  await expect(page.getByText(/Versão instalada: 1/)).toBeVisible();
});
test("M16 valida deep link, offline, fonte ausente e ciclo automático pausável", async ({
  page,
}) => {
  await enter(page);
  await page.getByLabel("Link, código ou deep link").fill("file:///etc/passwd");
  await page.getByRole("button", { name: "Revisar biblioteca" }).click();
  await expect(page.getByRole("alert")).toContainText("não encontrado");
  await scenario(page, "offline");
  await page.getByRole("button", { name: "Usar código de exemplo" }).click();
  await page.getByRole("button", { name: "Revisar biblioteca" }).click();
  await expect(page.getByRole("alert")).toContainText("Offline");
  await scenario(page, "normal");
  await page
    .getByLabel("Link, código ou deep link")
    .fill("ushark://library/DEMO-CINEMA");
  await page.getByRole("button", { name: "Revisar biblioteca" }).click();
  await page
    .getByRole("button", { name: "Confirmar assinatura simulada" })
    .click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await scenario(page, "no-sources");
  await page.getByLabel("Verificar automaticamente (ciclo simulado)").check();
  await page.getByLabel("Pausar verificações automáticas").check();
  await page.waitForTimeout(8500);
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.getByLabel("Pausar verificações automáticas").uncheck();
  await expect(
    page.getByRole("button", { name: "Aplicar atualização simulada" }),
  ).toBeVisible({ timeout: 10000 });
  await page
    .getByRole("button", { name: "Aplicar atualização simulada" })
    .click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.getByLabel("Pausar verificações automáticas").check();
  await page
    .getByRole("button", { name: "Horizonte Azul", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Assistir", exact: true }),
  ).toBeDisabled();
});
