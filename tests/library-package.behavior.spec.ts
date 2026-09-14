import { test, expect, type Page } from "@playwright/test";
import { enterDiscovery } from "./discovery.helpers";
async function files(page: Page) {
  await enterDiscovery(page);
  await page.getByRole("button", { name: "Bibliotecas", exact: true }).click();
  await page
    .getByRole("button", { name: "Arquivos de biblioteca", exact: true })
    .click();
  await page.getByText("Cenários de arquivo", { exact: true }).click();
}
async function choose(page: Page) {
  await page.getByRole("button", { name: "Escolher .tslib sintético" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}
test("M13 importar confirma, abre offline, deduplica e bloqueia conflito", async ({
  page,
}) => {
  await files(page);
  await choose(page);
  await expect(page.getByRole("dialog")).toContainText("Cinema portátil");
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
      path: `docs/milestones/M13-library-file/evidence/package-${height}.png`,
    });
  }
  await page
    .getByRole("button", { name: "Confirmar importação simulada" })
    .click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByRole("status")).toContainText("importada");
  await choose(page);
  await page
    .getByRole("button", { name: "Confirmar importação simulada" })
    .click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByRole("status")).toContainText("Nenhuma duplicação");
  await page.getByLabel("Estado do pacote").selectOption("conflict");
  await choose(page);
  await page
    .getByRole("button", { name: "Confirmar importação simulada" })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "Conflito",
  );
  await page.getByRole("button", { name: "Voltar sem importar" }).click();
  await page.getByLabel("Estado do pacote").selectOption("offline");
  await page
    .getByRole("button", { name: "Abrir Cinema portátil offline" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Cinema portátil" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Horizonte Azul", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Mídia não acompanha");
});
test("M13 rejeições, asset ausente e cancelamento sem modificar receptor", async ({
  page,
}) => {
  await files(page);
  for (const scenario of [
    "major",
    "invalid",
    "signature",
    "traversal",
    "absolute",
    "symlink",
    "bomb",
    "code",
    "limits",
    "protocol",
  ]) {
    await page.getByLabel("Estado do pacote").selectOption(scenario);
    await page
      .getByRole("button", { name: "Escolher .tslib sintético" })
      .click();
    await expect(page.getByRole("alert")).toContainText("catálogo preservado");
    await expect(page.getByRole("dialog")).toBeHidden();
  }
  await page.getByLabel("Estado do pacote").selectOption("asset");
  await choose(page);
  await expect(page.getByRole("dialog")).toContainText("Asset ausente");
  await page
    .getByRole("button", { name: "Confirmar importação simulada" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancelar operação" })
    .click();
  await page.getByRole("button", { name: "Voltar sem importar" }).click();
  await expect(
    page.getByText("Nenhuma biblioteca importada.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Estado do pacote").selectOption("commit-error");
  await choose(page);
  await page
    .getByRole("button", { name: "Confirmar importação simulada" })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "perfil receptor preservado",
  );
  await page.getByRole("button", { name: "Voltar sem importar" }).click();
  await page.getByLabel("Estado do pacote").selectOption("minor");
  await choose(page);
  await expect(page.getByRole("dialog")).toContainText("Minor", {
    ignoreCase: true,
  });
  await page
    .getByRole("button", { name: "Confirmar importação simulada" })
    .click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByRole("status")).toContainText("importada");
});
test("M13 exporta rascunho do editor e importa seu snapshot", async ({
  page,
}) => {
  await enterDiscovery(page);
  await page.getByRole("button", { name: "Bibliotecas", exact: true }).click();
  await page.getByRole("button", { name: "Criar biblioteca" }).click();
  await page
    .getByLabel("Nome da biblioteca", { exact: true })
    .fill("Pacote próprio");
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await expect(page.getByRole("status")).toContainText("salvo");
  await page.getByRole("button", { name: "Voltar às bibliotecas" }).click();
  await page
    .getByRole("button", { name: "Arquivos de biblioteca", exact: true })
    .click();
  await page.getByRole("button", { name: "Preparar pacote simulado" }).click();
  await expect(page.getByRole("alert")).toContainText("Escolha");
  await page
    .getByLabel("Rascunho salvo")
    .selectOption({ label: "Pacote próprio" });
  await page.getByRole("button", { name: "Preparar pacote simulado" }).click();
  await expect(page.getByRole("dialog")).toContainText("Pacote próprio");
  await page
    .getByRole("button", { name: "Concluir exportação simulada" })
    .click();
  await page
    .getByRole("button", { name: "Importar Pacote próprio v1" })
    .click();
  await page
    .getByRole("button", { name: "Confirmar importação simulada" })
    .click();
  await page
    .getByRole("button", { name: "Abrir Pacote próprio offline" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Pacote próprio", exact: true }),
  ).toBeVisible();
});
