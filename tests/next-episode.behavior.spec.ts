import { test, expect } from "@playwright/test";
import { enterDiscovery } from "./discovery.helpers";
async function episode(page: import("@playwright/test").Page, manual = false) {
  await enterDiscovery(page);
  if (manual) {
    await page.getByRole("button", { name: "Ajustar preferências" }).click();
    await page.getByRole("button", { name: "Automação e modo TV" }).click();
    await page
      .getByRole("switch", { name: "Selecionar a melhor fonte" })
      .click();
    await page.getByRole("button", { name: "Salvar preferências" }).click();
    await expect(page.getByRole("status")).toContainText(
      "Preferências atualizadas",
    );
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Ajustar preferências" }),
    ).toBeVisible();
  }
  await page.getByRole("button", { name: "Séries", exact: true }).click();
  await page
    .getByRole("button", { name: "Importar torrent ou magnet" })
    .click();
  await page.getByRole("button", { name: "Selecionar serie.torrent" }).click();
  await page.getByRole("button", { name: "Resolver metadata" }).click();
  await page.getByRole("checkbox").nth(0).check();
  await page.getByRole("checkbox").nth(1).check();
  await page.getByRole("button", { name: "Confirmar arquivos" }).click();
  await page
    .getByRole("button", { name: "Abrir Entre Órbitas", exact: true })
    .click();
  await page.getByRole("button", { name: /Temporada 1 2 episódios/ }).click();
  await page.getByRole("button", { name: /^E01 / }).click();
  if (manual) {
    await page
      .getByText("Comparar fontes e preferências", { exact: true })
      .click();
    await page
      .getByRole("button", { name: /^Escolher / })
      .first()
      .click();
  }
  await page.getByRole("button", { name: "Assistir episódio" }).click();
  await expect(
    page.getByRole("heading", { name: "Pronto parcial · Stream Only" }),
  ).toBeVisible();
  await page.getByText("Sequência de episódios", { exact: true }).click();
}
test("M11 countdown cancela, autoplay desligado não avança, tocar agora mantém episódio correto", async ({
  page,
}) => {
  await episode(page);
  await page.getByLabel("Reproduzir próximo automaticamente").check();
  await page.getByRole("button", { name: "Simular fim do episódio" }).click();
  await expect(page.getByRole("dialog")).toContainText("S1E2");
  await page.getByRole("button", { name: "Cancelar próximo" }).click();
  await page.waitForTimeout(5200);
  await expect(page.locator(".player-controls h1")).toHaveText(
    "Entre Órbitas · S1E1",
  );
  await page.getByRole("button", { name: "Reabrir próximo episódio" }).click();
  await page.getByLabel("Autoplay nesta sessão").uncheck();
  await expect(page.getByRole("dialog")).toContainText("Autoplay desligado");
  await page.waitForTimeout(5200);
  await expect(page.locator(".player-controls h1")).toHaveText(
    "Entre Órbitas · S1E1",
  );
  await page.screenshot({
    path: "docs/milestones/M11-episode-sequence/evidence/next.png",
  });
  await page.getByRole("button", { name: "Tocar agora" }).click();
  await expect(
    page.getByRole("heading", { name: "Entre Órbitas · S1E2", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Posição", { exact: true })).toHaveValue("0");
  await page.getByText("Sequência de episódios", { exact: true }).click();
  await page.getByRole("button", { name: "Simular fim do episódio" }).click();
  await expect(
    page.getByText("Fim de série. Nenhum próximo episódio cadastrado.").first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Voltar aos detalhes" }).click();
  await expect(page.getByRole("dialog")).toContainText("S01E02");
});
test("M11 preflight falha recuperável, Escape cancela camada antes de sair", async ({
  page,
}) => {
  await episode(page);
  await page.getByLabel("Simular falha no preflight").check();
  await page.getByRole("button", { name: "Simular fim do episódio" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "Preflight do próximo falhou",
  );
  await page
    .getByRole("button", { name: "Tentar preflight novamente" })
    .click();
  await expect(page.getByRole("button", { name: "Tocar agora" })).toBeEnabled();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.locator(".player-controls h1")).toHaveText(
    "Entre Órbitas · S1E1",
  );
});
test("M11 autoplay inicia uma vez e reinicia posição", async ({ page }) => {
  await episode(page);
  await page.getByLabel("Reproduzir próximo automaticamente").check();
  await page.getByRole("button", { name: "Simular fim do episódio" }).click();
  await expect(page.getByRole("dialog")).toContainText("Próximo em");
  await expect(page.locator(".player-controls h1")).toHaveText(
    "Entre Órbitas · S1E2",
    { timeout: 9000 },
  );
  expect(
    Number(await page.getByLabel("Posição", { exact: true }).inputValue()),
  ).toBeLessThan(3);
});

test("M01 M08 M11 seleção manual impede autoplay sem escolha de fonte", async ({
  page,
}) => {
  await episode(page, true);
  await page.getByLabel("Reproduzir próximo automaticamente").check();
  await page.getByRole("button", { name: "Simular fim do episódio" }).click();
  await expect(
    page.getByRole("button", { name: "Tocar agora" }),
  ).toBeDisabled();
  await page.waitForTimeout(5200);
  await expect(page.locator(".player-controls h1")).toHaveText(
    "Entre Órbitas · S1E1",
  );
  await page.getByLabel("Fonte do próximo episódio").selectOption({ index: 1 });
  await expect(page.getByRole("button", { name: "Tocar agora" })).toBeEnabled();
  await page.getByRole("button", { name: "Tocar agora" }).click();
  await expect(page.locator(".player-controls h1")).toHaveText(
    "Entre Órbitas · S1E2",
  );
});
