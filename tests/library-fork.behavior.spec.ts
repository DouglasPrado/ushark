import { test, expect, type Page } from "@playwright/test";
import { enterDiscovery } from "./discovery.helpers";
async function source(page: Page) {
  await enterDiscovery(page);
  await page.getByRole("button", { name: "Bibliotecas", exact: true }).click();
  await page.getByRole("button", { name: "Assinaturas", exact: true }).click();
  await page.getByRole("button", { name: "Usar código de exemplo" }).click();
  await page.getByRole("button", { name: "Revisar biblioteca" }).click();
  await page
    .getByRole("button", { name: "Confirmar assinatura simulada" })
    .click();
  await expect(page.getByRole("dialog")).toBeHidden();
}
test("M17 copia para editor, alterações e retirada da origem preservam cópia", async ({
  page,
}) => {
  await source(page);
  await page.getByRole("button", { name: "Duplicar curadoria" }).click();
  await page.getByLabel("Novo nome").fill("Minha cópia");
  await page.getByRole("button", { name: "Criar cópia e editar" }).click();
  await expect(
    page.getByRole("heading", { name: "Editar curadoria" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Nome da biblioteca", { exact: true }),
  ).toHaveValue("Minha cópia");
  await page.getByRole("button", { name: "Prévia", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Horizonte Azul", exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(200);
  await page.screenshot({
    path: "docs/milestones/M17-library-fork/evidence/fork-preview.png",
  });
  await page.getByRole("button", { name: "Identidade", exact: true }).click();
  await page
    .getByLabel("Nome da biblioteca", { exact: true })
    .fill("Editada pessoalmente");
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await expect(page.getByRole("status")).toContainText("salvo");
  await page.getByRole("button", { name: "Voltar às bibliotecas" }).click();
  await page.getByRole("button", { name: "Assinaturas", exact: true }).click();
  await page.getByRole("button", { name: "Abrir Cinema portátil" }).click();
  await page.getByRole("button", { name: "Deixar de assinar" }).click();
  await page
    .getByRole("button", { name: "Confirmar remoção da assinatura" })
    .click();
  await page.getByRole("button", { name: "Voltar às bibliotecas" }).click();
  await page
    .getByRole("button", { name: "Editar Editada pessoalmente" })
    .click();
  await page.getByRole("button", { name: "Prévia", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Horizonte Azul", exact: true }),
  ).toBeVisible();
});
test("M17 vazio, falha, snapshot ausente, cancelamento e cópia offline", async ({
  page,
}) => {
  await source(page);
  await page.getByRole("button", { name: "Duplicar curadoria" }).click();
  await page.getByLabel("Novo nome").fill("");
  await page.getByRole("button", { name: "Criar cópia e editar" }).click();
  await expect(page.getByRole("alert")).toContainText("Informe um nome");
  await page.getByLabel("Novo nome").fill("Independente");
  await page.getByText("Cenários de cópia", { exact: true }).click();
  for (const scenario of ["error", "missing"]) {
    await page.getByLabel("Estado da cópia").selectOption(scenario);
    await page.getByRole("button", { name: "Criar cópia e editar" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
  }
  await page.getByLabel("Estado da cópia").selectOption("normal");
  await page.getByRole("button", { name: "Criar cópia e editar" }).click();
  await page.getByRole("button", { name: "Cancelar cópia" }).click();
  await expect(
    page.getByRole("button", { name: "Duplicar curadoria" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Duplicar curadoria" }).click();
  await page.getByText("Cenários de cópia", { exact: true }).click();
  await page.getByLabel("Estado da cópia").selectOption("offline");
  await page.getByRole("button", { name: "Criar cópia e editar" }).click();
  await expect(
    page.getByRole("heading", { name: "Editar curadoria" }),
  ).toBeVisible();
});
