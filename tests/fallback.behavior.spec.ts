import { test, expect, type Page } from "@playwright/test";
import { enterDiscovery, discoveryScenario } from "./discovery.helpers";
async function fallback(page: Page) {
  await enterDiscovery(page);
  await discoveryScenario(page, "editorial");
  await page.locator(".discovery-card").first().click();
  await page.getByRole("button", { name: /Continuar de/ }).click();
  await expect(
    page.getByRole("heading", {
      name: "Reproduzindo · primeiro frame simulado",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Recuperar fonte" }).click();
  await expect(page.getByLabel("Cenário de recuperação")).toBeEnabled();
}
test("M19 manual mantém posição, bloqueia incompatível e cancela preparo no seek", async ({
  page,
}) => {
  await fallback(page);
  await page.getByLabel("Cenário de recuperação").selectOption("alternatives");
  const prepare = page.getByRole("button", {
    name: "Preparar Alternativa compatível 1080p",
  });
  await expect(prepare).toBeEnabled();
  await expect(
    page.getByRole("button", {
      name: "Preparar Outra edição · duração diferente",
    }),
  ).toBeDisabled();
  await expect(page.getByRole("dialog")).toContainText("Fonte atual: source-0");
  await prepare.click();
  await page
    .getByRole("button", { name: "Simular seek concorrente +30s" })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Preparo cancelado");
  await expect(page.getByRole("dialog")).toContainText("Fonte atual: source-0");
  await prepare.click();
  await expect(page.getByRole("dialog")).toContainText(
    "Fonte atual: fallback-compatible",
  );
  await expect(page.getByRole("dialog")).toContainText("Cooldown");
  await page.screenshot({
    path: "docs/milestones/M19-playback-fallback/evidence/recovered.png",
  });
  await page
    .getByText("Histórico agregado local (simulação)", { exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("demo-v1");
  await page
    .getByRole("button", { name: "Simular expiração do histórico e cooldown" })
    .click();
  await expect(page.getByRole("dialog")).toContainText("peso 0.00");
  await page.getByRole("button", { name: "Voltar ao player" }).click();
  await expect(page.locator(".player-preview")).toContainText(
    "Fonte: Alternativa compatível 1080p",
  );
});
test("M19 sem peers, offline, falha/retry e auto apenas compatível", async ({
  page,
}) => {
  await fallback(page);
  for (const scenario of ["none", "offline"]) {
    await page.getByLabel("Cenário de recuperação").selectOption(scenario);
    await expect(page.getByRole("dialog")).toContainText(
      "Sem alternativa elegível",
    );
  }
  await page.getByLabel("Cenário de recuperação").selectOption("failure");
  await page
    .getByRole("button", { name: "Preparar Alternativa compatível 1080p" })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "falhou",
  );
  await page
    .getByText("Histórico agregado local (simulação)", { exact: true })
    .click();
  await page
    .getByRole("button", { name: "Simular expiração do histórico e cooldown" })
    .click();
  await page.getByLabel("Cenário de recuperação").selectOption("incompatible");
  await page.getByLabel("Permitir troca automática nesta sessão").check();
  await expect(page.getByRole("dialog")).toContainText("Edição incompatível");
  await expect(page.getByRole("dialog")).toContainText("Fonte atual: source-0");
  await page.getByLabel("Cenário de recuperação").selectOption("alternatives");
  await expect(page.getByRole("dialog")).toContainText(
    "Fonte atual: fallback-compatible",
  );
});
