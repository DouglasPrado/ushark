import { test, expect, type Page } from "@playwright/test";
import { enterDiscovery, discoveryScenario } from "./discovery.helpers";
async function diagnostic(page: Page) {
  await enterDiscovery(page);
  await page.getByRole("button", { name: "Ajustar preferências" }).click();
  await page.getByRole("button", { name: "Diagnóstico", exact: true }).click();
  await expect(
    page.getByText("Sem sessão de player", { exact: true }),
  ).toBeVisible();
  await page.getByText("Cenários de diagnóstico", { exact: true }).click();
}
test("M20 desconhecido versus zero, sanitização, retenção e limpeza seletiva", async ({
  page,
}) => {
  await diagnostic(page);
  await page.getByLabel("Estado do diagnóstico").selectOption("unknown");
  await page.getByRole("button", { name: "Atualizar diagnóstico" }).click();
  await expect(
    page.locator(".diagnostic-grid article").filter({ hasText: "Throughput" }),
  ).toContainText("Desconhecido");
  await page.getByLabel("Estado do diagnóstico").selectOption("zero");
  await page.getByRole("button", { name: "Atualizar diagnóstico" }).click();
  await expect(
    page.locator(".diagnostic-grid article").filter({ hasText: "Throughput" }),
  ).toContainText("0 Mbps");
  await page.getByLabel("Limite de eventos").fill("3");
  await page.getByRole("button", { name: "Aplicar retenção simulada" }).click();
  await expect(page.getByText(/limite 3 ·/)).toBeVisible();
  await page.getByRole("button", { name: "Simular rajada de eventos" }).click();
  await expect(page.getByText(/3 eventos · limite 3/)).toBeVisible();
  for (const [width, height] of [
    [1920, 1080],
    [2560, 1440],
    [3840, 2160],
  ]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `docs/milestones/M20-diagnostics/evidence/diagnostics-${height}.png`,
    });
  }
  await page
    .getByRole("button", { name: "Revisar exportação sanitizada" })
    .click();
  await expect(page.getByRole("dialog")).not.toContainText("SYNTHETIC_SECRET");
  await expect(page.getByRole("dialog")).not.toContainText("/Users/");
  await page.getByRole("button", { name: "Gerar pacote simulado" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByRole("status")).toContainText("Nenhum arquivo");
  await page.getByRole("button", { name: "Limpar Logs", exact: true }).click();
  await page.getByRole("button", { name: "Voltar sem confirmar" }).click();
  await expect(page.getByText(/3 eventos ·/)).toBeVisible();
  await page.getByRole("button", { name: "Limpar Logs", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirmar limpeza seletiva" })
    .click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByText(/0 eventos ·/)).toBeVisible();
});
test("M20 erro/retry, cancelamento e limpeza parcial preservam protegido", async ({
  page,
}) => {
  await diagnostic(page);
  await page.getByLabel("Estado do diagnóstico").selectOption("error");
  await page.getByRole("button", { name: "Atualizar diagnóstico" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Último snapshot preservado",
  );
  await page.getByLabel("Estado do diagnóstico").selectOption("offline");
  await page.getByRole("button", { name: "Atualizar diagnóstico" }).click();
  await page.getByRole("button", { name: "Cancelar operação" }).click();
  await expect(page.getByRole("status")).toContainText("cancelada");
  await page.getByLabel("Estado do diagnóstico").selectOption("partial");
  await page.getByRole("button", { name: "Limpar Cache elegível" }).click();
  await page
    .getByRole("button", { name: "Confirmar limpeza seletiva" })
    .click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByRole("status")).toContainText("Limpeza parcial");
});
test("M20 painel do player retorna com posição e foco", async ({ page }) => {
  await enterDiscovery(page);
  await discoveryScenario(page, "editorial");
  await page.locator(".discovery-card").first().click();
  await page.getByRole("button", { name: /Continuar de/ }).click();
  await expect(
    page.getByRole("heading", {
      name: "Reproduzindo · primeiro frame simulado",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Diagnóstico", exact: true }).click();
  await expect(page.getByText("Sessão de player simulada ativa")).toBeVisible();
  await page.getByRole("button", { name: "Voltar à experiência" }).click();
  await expect(
    page.getByRole("button", { name: "Diagnóstico", exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole("heading", {
      name: "Reproduzindo · primeiro frame simulado",
    }),
  ).toBeVisible();
});
