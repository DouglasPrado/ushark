import { test, expect } from "@playwright/test";
import { enterDiscovery, discoveryScenario } from "./discovery.helpers";
async function enqueue(page: import("@playwright/test").Page) {
  await enterDiscovery(page);
  await discoveryScenario(page, "editorial");
  await page.locator(".discovery-card").first().click();
  await page.getByRole("button", { name: "Baixar", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar download" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "destino",
  );
  await page
    .getByLabel("Destino", { exact: true })
    .selectOption("Biblioteca simulada");
  await page.getByRole("button", { name: "Confirmar download" }).click();
  await expect(
    page.getByRole("heading", { name: "Downloads", exact: true }),
  ).toBeVisible();
}
test("M09 fila pausa, restart simulado, resume, cancelar e apagar separados", async ({
  page,
}) => {
  await enqueue(page);
  await expect(page.getByText("Baixando", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Pausar", exact: true }).click();
  await expect(page.getByText("Pausado", { exact: true })).toBeVisible();
  await page.getByText("Cenários de download", { exact: true }).click();
  await page.getByRole("button", { name: "Simular reinício" }).click();
  await expect(page.getByRole("status")).toContainText(
    "snapshot em memória restaurado",
  );
  await page.getByRole("button", { name: "Retomar", exact: true }).click();
  await expect(page.getByText("Baixando", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar download" }).click();
  await expect(
    page.getByText("Cancelado · catálogo preservado", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Apagar dados" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancelar", exact: true })
    .click();
  await expect(page.locator(".workspace-list article")).toHaveCount(1);
  await page.getByRole("button", { name: "Apagar dados" }).click();
  await page
    .getByRole("button", { name: "Confirmar remoção dos dados" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Nenhum download na fila" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Voltar à biblioteca" }).click();
  await expect(page.locator(".discovery-detail-page")).toContainText(
    "Horizonte Azul",
  );
});
test("M09 falhas/retry, limites, detalhe e player do download completo", async ({
  page,
}) => {
  await enqueue(page);
  await page.getByText("Cenários de download", { exact: true }).click();
  await page.getByLabel("Estado das transferências").selectOption("disk");
  await expect(page.getByText(/Sem espaço: escrita pausada/)).toBeVisible();
  await page.getByRole("button", { name: "Retomar", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Condição de falha");
  await page.getByLabel("Estado das transferências").selectOption("normal");
  await page.getByRole("button", { name: "Retomar", exact: true }).click();
  await page.getByRole("button", { name: "Limites", exact: true }).click();
  await page.getByLabel("Downloads simultâneos").fill("99");
  await page.getByRole("button", { name: "Aplicar limites" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "não podem exceder",
  );
  await page.getByLabel("Downloads simultâneos").fill("1");
  await page.getByRole("button", { name: "Aplicar limites" }).click();
  await page.getByText("Fixture deste download", { exact: true }).click();
  await page.getByRole("button", { name: "Simular conclusão" }).click();
  await expect(page.getByText("Completo", { exact: true })).toBeVisible();
  await page.screenshot({
    path: "docs/milestones/M09-downloads/evidence/downloads.png",
  });
  await page
    .getByRole("button", { name: "Horizonte Azul", exact: true })
    .click();
  await page.getByRole("button", { name: "Assistir conteúdo" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Reproduzindo · primeiro frame simulado",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Voltar aos detalhes" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Destino: Biblioteca simulada",
  );
});

test("M09 fila em três resoluções e recuperação offline/resume", async ({
  page,
}) => {
  await enqueue(page);
  await page.getByText("Cenários de download", { exact: true }).click();
  for (const scenario of ["offline", "resume", "error"]) {
    await page.getByLabel("Estado das transferências").selectOption(scenario);
    await expect(page.getByText(/Transferência interrompida/)).toBeVisible();
    await page.getByLabel("Estado das transferências").selectOption("normal");
    await page.getByRole("button", { name: "Retomar", exact: true }).click();
  }
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
      path: `docs/milestones/M09-downloads/evidence/queue-${height}.png`,
    });
  }
});
