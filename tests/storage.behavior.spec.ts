import { test, expect } from "@playwright/test";
import { enterDiscovery } from "./discovery.helpers";
async function storage(page: import("@playwright/test").Page) {
  await enterDiscovery(page);
  await page.getByRole("button", { name: "Ajustar preferências" }).click();
  await page.getByRole("button", { name: "Espaço e retenção" }).click();
  await expect(page.getByText("Calculando espaço…")).toBeHidden();
}
test("M10 plano revalida ativo, Keep e demotion preservam bytes", async ({
  page,
}) => {
  await storage(page);
  await page
    .getByRole("button", { name: "Revisar limpeza", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Estimativa: 3.00 GB");
  await page
    .getByRole("button", { name: "Simular uso durante revisão" })
    .click();
  await page.getByRole("button", { name: "Confirmar limpeza" }).click();
  await expect(page.getByRole("status")).toContainText("0.00 GB liberados");
  await expect(
    page.getByRole("heading", { name: "Viagem antiga", exact: true }),
  ).toBeVisible();
  await page.getByText("Cenários de armazenamento", { exact: true }).click();
  await page.getByLabel("Estado do armazenamento").selectOption("normal");
  const old = page.locator("article").filter({
    has: page.getByRole("heading", { name: "Viagem antiga", exact: true }),
  });
  await old
    .getByRole("button", { name: "Manter após assistir (Keep)" })
    .click();
  await expect(page.getByRole("status")).toContainText("sem redownload");
  await expect(old).toContainText("3.00 GB · Biblioteca simulada · Keep");
  await old.getByRole("button", { name: "Demover para cache" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancelar", exact: true })
    .click();
  await expect(old).toContainText("Keep");
  await old.getByRole("button", { name: "Demover para cache" }).click();
  await page.getByRole("button", { name: "Confirmar demotion" }).click();
  await page
    .getByRole("button", { name: "Revisar limpeza", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirmar limpeza" }).click();
  await expect(page.getByRole("status")).toContainText("3.00 GB liberados");
  await expect(old).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Minha coleção guardada" }),
  ).toBeVisible();
});
test("M10 política inválida, movimento cancelado, permissão e corrupção", async ({
  page,
}) => {
  await storage(page);
  await page.getByLabel("Limite de cache (GB)").fill("0");
  await page.getByRole("button", { name: "Aplicar política" }).click();
  await expect(page.getByRole("alert")).toContainText("entre 1 e 500");
  await page.getByRole("button", { name: "Descartar alterações" }).click();
  const old = page.locator("article").filter({
    has: page.getByRole("heading", { name: "Viagem antiga", exact: true }),
  });
  await old
    .getByRole("button", { name: "Manter após assistir (Keep)" })
    .click();
  await page.getByRole("button", { name: "Cancelar operação" }).click();
  await page.waitForTimeout(600);
  await expect(old).toContainText("Stream Only");
  await page.getByText("Cenários de armazenamento", { exact: true }).click();
  await page.getByLabel("Estado do armazenamento").selectOption("permission");
  await old
    .getByRole("button", { name: "Manter após assistir (Keep)" })
    .click();
  await expect(page.getByRole("alert")).toContainText("original preservado");
  await expect(old).toContainText("Stream Only");
  await page.getByLabel("Estado do armazenamento").selectOption("corrupt");
  await page.getByRole("button", { name: "Reparar cache" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Metadata e progresso preservados",
  );
  await expect(old).toContainText("0.00 GB");
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
      path: `docs/milestones/M10-storage-retention/evidence/storage-${height}.png`,
    });
  }
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Espaço e retenção" }),
  ).toBeVisible();
});
test("M10 pressão de cache limpa LRU elegível e conserva protegidos", async ({
  page,
}) => {
  await storage(page);
  await page.getByLabel("Limite de cache (GB)").fill("1");
  await page.getByRole("button", { name: "Aplicar política" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Protegidos preservados",
  );
  await expect(
    page.getByRole("heading", { name: "Viagem antiga", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Minha coleção guardada" }),
  ).toBeVisible();
});
