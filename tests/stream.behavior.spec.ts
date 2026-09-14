import { test, expect } from "@playwright/test";
import { enterDiscovery, discoveryScenario } from "./discovery.helpers";
async function stream(page: import("@playwright/test").Page) {
  await enterDiscovery(page);
  await discoveryScenario(page, "editorial");
  await page.locator(".discovery-card").first().click();
  await page.getByRole("button", { name: /^Continuar de/ }).click();
  await expect(
    page.getByRole("heading", {
      name: "Reproduzindo · primeiro frame simulado",
    }),
  ).toBeVisible();
  await page.getByText("Cenários do player", { exact: true }).click();
  await page.getByLabel("Modo de reprodução").selectOption("progressive");
  await expect(
    page.getByRole("heading", { name: "Pronto parcial · Stream Only" }),
  ).toBeVisible();
}
test("M07 último seek vence, pausa preservada, falhas recuperáveis", async ({
  page,
}) => {
  await stream(page);
  await page.getByRole("button", { name: "Pausar", exact: true }).click();
  const position = page.getByLabel("Posição", { exact: true });
  await position.fill("100");
  await position.fill("900");
  await position.fill("1700");
  await expect(
    page.getByRole("heading", { name: "Pausado", exact: true }),
  ).toBeVisible();
  await expect(position).toHaveValue("1700");
  await expect(page.getByLabel("Buffer simulado")).toHaveAttribute(
    "value",
    "12",
  );
  for (const scenario of ["metadata", "network", "disk"]) {
    await page.getByLabel("Estado do stream").selectOption(scenario);
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByLabel("Buffer simulado")).toHaveAttribute(
      "value",
      "0",
    );
    await page.getByRole("button", { name: "Tentar novamente" }).click();
    await expect(
      page.getByRole("heading", { name: "Pronto parcial · Stream Only" }),
    ).toBeVisible();
  }
  await page.getByLabel("Estado do stream").selectOption("vbr");
  await expect(
    page.getByText("12 s / 12 s · 48 MB · 32 Mbps (valores ilustrativos)"),
  ).toBeVisible();
  await page.getByText("Cenários do player", { exact: true }).click();
  await page.screenshot({
    path: "docs/milestones/M07-progressive-playback/evidence/stream.png",
  });
  await position.fill("2500");
  await page.getByRole("button", { name: "Voltar aos detalhes" }).click();
  await page.waitForTimeout(900);
  await expect(page.locator(".discovery-detail-page")).toBeVisible();
  await page.getByRole("button", { name: /^Continuar de/ }).click();
  expect(Number(await position.inputValue())).toBeLessThan(2500);
});
test("M06→M07 filme importado abre progressivo e retorno preserva detalhe", async ({
  page,
}) => {
  await enterDiscovery(page);
  await page.getByRole("button", { name: "Filmes", exact: true }).click();
  await page
    .getByRole("button", { name: "Importar torrent ou magnet" })
    .click();
  await page.getByRole("button", { name: "Preencher magnet" }).click();
  await page.getByRole("button", { name: "Resolver metadata" }).click();
  await page.getByRole("button", { name: "Confirmar arquivos" }).click();
  await page.getByRole("button", { name: /Abrir Horizonte 2024/ }).click();
  await page.getByRole("button", { name: "Assistir", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Pronto parcial · Stream Only" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Voltar aos detalhes" }).click();
  await expect(
    page.getByRole("button", { name: "Assistir", exact: true }),
  ).toBeFocused();
});
test("M07 episódio importado mantém selector e volta ao episódio", async ({
  page,
}) => {
  await enterDiscovery(page);
  await page.getByRole("button", { name: "Séries", exact: true }).click();
  await page
    .getByRole("button", { name: "Importar torrent ou magnet" })
    .click();
  await page.getByRole("button", { name: "Selecionar serie.torrent" }).click();
  await page.getByRole("button", { name: "Resolver metadata" }).click();
  await page.getByRole("checkbox").first().check();
  await page.getByRole("button", { name: "Confirmar arquivos" }).click();
  await page
    .getByRole("button", { name: "Abrir Entre Órbitas", exact: true })
    .click();
  await page.getByRole("button", { name: /Temporada 1 1 episódios/ }).click();
  await page.getByRole("button", { name: /^E01 / }).click();
  await page.getByRole("button", { name: "Assistir episódio" }).click();
  await expect(
    page.getByRole("heading", { name: "Pronto parcial · Stream Only" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Voltar aos detalhes" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Entre.Orbitas.S01E01.mkv",
  );
});
