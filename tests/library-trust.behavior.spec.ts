import { test, expect, type Page } from "@playwright/test";
import { enterDiscovery } from "./discovery.helpers";
async function review(page: Page) {
  await enterDiscovery(page);
  await page.getByRole("button", { name: "Bibliotecas", exact: true }).click();
  await page
    .getByRole("button", { name: "Arquivos de biblioteca", exact: true })
    .click();
  await page.getByRole("button", { name: "Escolher .tslib sintético" }).click();
  await expect(
    page.getByRole("button", { name: "Confirmar importação simulada" }),
  ).toBeEnabled();
  await page.getByText("Cenários de autoria", { exact: true }).click();
}
test("M14 primeira confiança, pin e chave alterada exigem escolha", async ({
  page,
}) => {
  await review(page);
  await page.getByLabel("Estado da autoria").selectOption("valid");
  await expect(
    page.getByRole("button", { name: "Aceitar identidade nesta sessão" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Confirmar importação simulada" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Aceitar identidade nesta sessão" })
    .click();
  await expect(
    page.getByRole("button", { name: "Confirmar importação simulada" }),
  ).toBeEnabled();
  await page.getByLabel("Estado da autoria").selectOption("changed");
  await expect(
    page.getByRole("button", { name: "Aceitar nova identidade" }),
  ).toBeDisabled();
  await expect(page.getByText("Chave anterior: DEMO-PUBLIC-A")).toBeVisible();
  await page.getByLabel("Conferi a mudança de identidade").check();
  await page.screenshot({
    path: "docs/milestones/M14-library-trust/evidence/key-change.png",
  });
  await page.getByRole("button", { name: "Aceitar nova identidade" }).click();
  await expect(
    page.getByRole("button", { name: "Confirmar importação simulada" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Voltar sem importar" }).click();
  await page.getByRole("button", { name: "Escolher .tslib sintético" }).click();
  await page.getByText("Cenários de autoria", { exact: true }).click();
  await page.getByLabel("Estado da autoria").selectOption("changed");
  await expect(
    page.getByText(/identidade lembrada nesta sessão/),
  ).toBeVisible();
});
test("M14 inválida, hash, storage, erro e cancelamento bloqueiam import", async ({
  page,
}) => {
  await review(page);
  for (const scenario of ["invalid", "hash"]) {
    await page.getByLabel("Estado da autoria").selectOption(scenario);
    await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
      "bloqueada",
    );
    await expect(
      page.getByRole("button", { name: "Confirmar importação simulada" }),
    ).toBeDisabled();
  }
  await page.getByLabel("Estado da autoria").selectOption("storage");
  await page
    .getByRole("button", { name: "Aceitar identidade nesta sessão" })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "identidade não aceita",
  );
  await page.getByLabel("Estado da autoria").selectOption("error");
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "indisponível",
  );
  await page.getByLabel("Estado da autoria").selectOption("valid");
  await page.getByRole("button", { name: "Cancelar verificação" }).click();
  await expect(
    page.getByRole("button", { name: "Confirmar importação simulada" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Tentar verificar novamente" })
    .click();
  await page
    .getByRole("button", { name: "Aceitar identidade nesta sessão" })
    .click();
  await expect(
    page.getByRole("button", { name: "Confirmar importação simulada" }),
  ).toBeEnabled();
});
test("M14 assina exportação, falha de storage recupera e reimport reconhece assinatura", async ({
  page,
}) => {
  await enterDiscovery(page);
  await page.getByRole("button", { name: "Bibliotecas", exact: true }).click();
  await page.getByRole("button", { name: "Criar biblioteca" }).click();
  await page.getByLabel("Nome da biblioteca", { exact: true }).fill("Assinada");
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await expect(page.getByRole("status")).toContainText("salvo");
  await page.getByRole("button", { name: "Voltar às bibliotecas" }).click();
  await page
    .getByRole("button", { name: "Arquivos de biblioteca", exact: true })
    .click();
  await page.getByLabel("Rascunho salvo").selectOption({ label: "Assinada" });
  await page.getByRole("button", { name: "Preparar pacote simulado" }).click();
  await page.getByLabel("Simular armazenamento seguro indisponível").check();
  await page.getByRole("button", { name: "Assinar simulação" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "continua não assinado",
  );
  await page.getByLabel("Simular armazenamento seguro indisponível").uncheck();
  await page.getByRole("button", { name: "Assinar simulação" }).click();
  await expect(
    page.getByText("Assinatura demonstrativa anexada; sem criptografia real."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Concluir exportação simulada" })
    .click();
  await page.getByRole("button", { name: "Importar Assinada v1" }).click();
  await expect(
    page.getByRole("button", { name: "Aceitar identidade nesta sessão" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Aceitar identidade nesta sessão" })
    .click();
  await page
    .getByRole("button", { name: "Confirmar importação simulada" })
    .click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.getByRole("button", { name: "Abrir Assinada offline" }).click();
  await expect(
    page.getByRole("heading", { name: "Assinada", exact: true }),
  ).toBeVisible();
});
