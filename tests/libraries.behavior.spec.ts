import { test, expect, type Page } from "@playwright/test";
import { enterDiscovery } from "./discovery.helpers";
async function editor(page: Page) {
  await enterDiscovery(page);
  await page.getByRole("button", { name: "Bibliotecas", exact: true }).click();
  await page.getByRole("button", { name: "Criar biblioteca" }).click();
}
async function curate(page: Page) {
  await editor(page);
  await page
    .getByLabel("Nome da biblioteca", { exact: true })
    .fill("Minha curadoria");
  await page.getByRole("button", { name: "Conteúdos", exact: true }).click();
  await page.getByRole("button", { name: "Usar catálogo sintético" }).click();
  await page.getByLabel("Horizonte Azul", { exact: true }).first().check();
  await page
    .getByLabel("Título nesta biblioteca: Horizonte Azul")
    .fill("Horizonte da curadoria");
  await page.getByRole("button", { name: "Coleções", exact: true }).click();
  await page.getByRole("button", { name: "Adicionar coleção" }).click();
  await page.getByLabel("Horizonte da curadoria", { exact: true }).check();
  await page.getByRole("button", { name: "Seções", exact: true }).click();
  await page.getByRole("button", { name: "Adicionar seção" }).click();
  await page.getByLabel("Título da seção 1").fill("Escolhas");
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await expect(page.getByRole("status")).toContainText("Rascunho salvo");
}
test("M12 curadoria reabre, prévia conecta player e mantém override local", async ({
  page,
}) => {
  await curate(page);
  await page.getByRole("button", { name: "Voltar às bibliotecas" }).click();
  await page.getByRole("button", { name: "Editar Minha curadoria" }).click();
  await page.getByRole("button", { name: "Prévia", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Escolhas" })).toBeVisible();
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
    await page.waitForTimeout(200);
    await page.screenshot({
      path: `docs/milestones/M12-curation-editor/evidence/preview-${height}.png`,
    });
  }
  await page
    .getByRole("button", { name: "Horizonte da curadoria", exact: true })
    .click();
  await page.getByRole("button", { name: "Assistir", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Reproduzindo · primeiro frame simulado",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Voltar aos detalhes" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Horizonte da curadoria",
  );
  await page.getByRole("button", { name: "Voltar à prévia" }).click();
  await expect(
    page.getByRole("button", { name: "Horizonte da curadoria", exact: true }),
  ).toBeFocused();
});
test("M12 inválido, erro, retry, cancelamento e descarte preservam confirmado", async ({
  page,
}) => {
  await editor(page);
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await expect(page.getByRole("alert")).toContainText("nome");
  await page.getByLabel("Nome da biblioteca", { exact: true }).fill("Salva");
  await page.getByText("Cenários de curadoria", { exact: true }).click();
  await page.getByLabel("Estado da curadoria").selectOption("error");
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await expect(page.getByRole("alert")).toContainText("Não foi possível");
  await page.getByLabel("Estado da curadoria").selectOption("normal");
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await expect(page.getByRole("status")).toContainText("salvo");
  await page
    .getByLabel("Nome da biblioteca", { exact: true })
    .fill("Não salva");
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await page.getByRole("button", { name: "Voltar às bibliotecas" }).click();
  await page.getByRole("button", { name: "Voltar às bibliotecas" }).click();
  await expect(page.getByRole("dialog")).toContainText("Descartar");
  await page.getByRole("button", { name: "Continuar editando" }).click();
  await expect(
    page.getByLabel("Nome da biblioteca", { exact: true }),
  ).toHaveValue("Não salva");
  await page.getByRole("button", { name: "Voltar às bibliotecas" }).click();
  await page.getByRole("button", { name: "Descartar e voltar" }).click();
  await page.getByRole("button", { name: "Editar Salva" }).click();
  await expect(
    page.getByLabel("Nome da biblioteca", { exact: true }),
  ).toHaveValue("Salva");
  await page.getByLabel("Estado da curadoria").selectOption("offline");
  await expect(page.getByRole("status")).toContainText("Offline");
});
