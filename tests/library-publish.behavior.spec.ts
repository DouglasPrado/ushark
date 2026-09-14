import { test, expect, type Page } from "@playwright/test";
import { enterDiscovery } from "./discovery.helpers";
async function publisher(page: Page) {
  await enterDiscovery(page);
  await page.getByRole("button", { name: "Bibliotecas", exact: true }).click();
  await page.getByRole("button", { name: "Criar biblioteca" }).click();
  await page
    .getByLabel("Nome da biblioteca", { exact: true })
    .fill("Publicável");
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await expect(page.getByRole("status")).toContainText("salvo");
  await page.getByRole("button", { name: "Voltar às bibliotecas" }).click();
  await page
    .getByRole("button", { name: "Publicações simuladas", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Revisar publicação" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Entrar como editor simulado" })
    .click();
  await page
    .getByLabel("Biblioteca para publicar")
    .selectOption({ label: "Publicável" });
}
async function publish(page: Page) {
  await page.getByRole("button", { name: "Revisar publicação" }).click();
  await expect(page.getByRole("dialog")).toContainText("Primeira versão");
  await page
    .getByRole("button", { name: "Confirmar publicação simulada" })
    .click();
  await expect(page.getByRole("dialog")).toBeHidden();
}
test("M15 publica, compartilha código, versão anterior gera nova, retirada preserva histórico", async ({
  page,
}) => {
  await publisher(page);
  await publish(page);
  await expect(page.getByLabel("Link de Publicável v1")).toHaveValue(
    /ushark\.invalid/,
  );
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
      path: `docs/milestones/M15-library-publish/evidence/published-${height}.png`,
    });
  }
  await page
    .getByRole("button", { name: "Criar nova versão baseada em v1" })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "atual 1 → nova versão 2",
  );
  await page
    .getByRole("button", { name: "Confirmar publicação simulada" })
    .click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByLabel("Link de Publicável v1")).toHaveValue(/\/v\/1$/);
  await expect(page.getByLabel("Link de Publicável v2")).toHaveValue(/\/v\/2$/);
  await page.getByRole("button", { name: "Retirar publicação v2" }).click();
  await page.getByRole("button", { name: "Voltar sem confirmar" }).click();
  await expect(page.getByText(/Publicada na simulação/)).toHaveCount(2);
  await page.getByRole("button", { name: "Retirar publicação v2" }).click();
  await page
    .getByRole("button", { name: "Confirmar retirada simulada" })
    .click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByText(/Retirada da resolução simulada/)).toHaveCount(2);
});
test("M15 cancelamento e falhas não ativam versões incompletas", async ({
  page,
}) => {
  await publisher(page);
  await page.getByText("Cenários de publicação", { exact: true }).click();
  for (const scenario of [
    "permission",
    "quota",
    "conflict",
    "partial",
    "offline",
  ]) {
    await page.getByLabel("Estado da publicação").selectOption(scenario);
    await page.getByRole("button", { name: "Revisar publicação" }).click();
    await page
      .getByRole("button", { name: "Confirmar publicação simulada" })
      .click();
    await expect(page.getByRole("dialog").getByRole("alert")).toBeVisible();
    await page.getByRole("button", { name: "Voltar sem confirmar" }).click();
    await expect(page.getByLabel("Link de Publicável v1")).toHaveCount(0);
  }
  await page.getByLabel("Estado da publicação").selectOption("normal");
  await page.getByRole("button", { name: "Revisar publicação" }).click();
  await page
    .getByRole("button", { name: "Confirmar publicação simulada" })
    .click();
  await page
    .getByRole("button", { name: "Cancelar operação", exact: true })
    .click();
  await page.getByRole("button", { name: "Voltar sem confirmar" }).click();
  await expect(page.getByLabel("Link de Publicável v1")).toHaveCount(0);
  await publish(page);
  await expect(page.getByLabel("Link de Publicável v1")).toBeVisible();
});

test("M12 M15 M16 código copiado resolve a mesma curadoria no receptor", async ({
  page,
}) => {
  await publisher(page);
  await publish(page);
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          document.documentElement.dataset.clipboardDemo = value;
        },
      },
    }),
  );
  await page
    .getByRole("button", { name: "Copiar código v1", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("copiado");
  const code = await page.evaluate(
    () => document.documentElement.dataset.clipboardDemo!,
  );
  expect(code).toMatch(/^DEMO-/);
  await page.getByRole("button", { name: "Voltar às bibliotecas" }).click();
  await page.getByRole("button", { name: "Assinaturas", exact: true }).click();
  await page.getByLabel("Link, código ou deep link").fill(code);
  await page.getByRole("button", { name: "Revisar biblioteca" }).click();
  await expect(page.getByRole("dialog")).toContainText("Publicável");
  await page
    .getByRole("button", { name: "Confirmar assinatura simulada" })
    .click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(
    page.getByRole("heading", { name: "Publicável", exact: true }),
  ).toBeVisible();
});
