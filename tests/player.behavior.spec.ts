import { test, expect } from "@playwright/test";
import { enterDiscovery, discoveryScenario } from "./discovery.helpers";
async function openPlayer(page: import("@playwright/test").Page) {
  await enterDiscovery(page);
  await discoveryScenario(page, "editorial");
  await page.locator(".discovery-card").first().click();
  await page.getByRole("button", { name: /^Assistir$|^Continuar de/ }).click();
}
test("player: controles, tracks canceláveis, erro e retomada no mesmo detalhe", async ({
  page,
}) => {
  await openPlayer(page);
  await expect(
    page.getByRole("heading", {
      name: "Reproduzindo · primeiro frame simulado",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pausar", exact: true }).click();
  await page.getByLabel("Posição", { exact: true }).fill("123");
  await expect(
    page.getByRole("heading", { name: "Pausado", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Áudio e legendas", exact: true })
    .click();
  await page.getByLabel("Faixa de áudio").selectOption("English");
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(
    page.getByText("Áudio: Português", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Áudio e legendas", exact: true })
    .click();
  await page
    .getByLabel("Nome da legenda externa simulada")
    .fill("https://example.com/a.srt");
  await page
    .getByRole("button", { name: "Adicionar legenda simulada" })
    .click();
  await expect(page.getByRole("alert")).toContainText("sem caminho ou URL");
  await page
    .getByLabel("Nome da legenda externa simulada")
    .fill("Minha legenda.srt");
  await page
    .getByRole("button", { name: "Adicionar legenda simulada" })
    .click();
  await page.getByRole("button", { name: "Aplicar", exact: true }).click();
  await page
    .getByRole("button", { name: "Voltar aos detalhes", exact: true })
    .click();
  await expect(page.locator(".discovery-detail-page")).toBeVisible();
  await page.getByRole("button", { name: /^Assistir$|^Continuar de/ }).click();
  await expect(
    page.getByRole("heading", {
      name: "Reproduzindo · primeiro frame simulado",
    }),
  ).toBeVisible();
  expect(
    Number(await page.getByLabel("Posição", { exact: true }).inputValue()),
  ).toBeGreaterThanOrEqual(123);
  await page.getByText("Cenários do player", { exact: true }).click();
  await page.getByLabel("Estado simulado").selectOption("crash");
  await expect(page.getByRole("alert")).toContainText("continua disponível");
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Reproduzindo · primeiro frame simulado",
    }),
  ).toBeVisible();
  await page.getByLabel("Estado simulado").selectOption("offline");
  await expect(
    page.getByText("Offline · arquivo local simulado"),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Reproduzindo · primeiro frame simulado",
    }),
  ).toBeVisible();
});
test("player: cancelamento invalida preparação e layouts sem overflow", async ({
  page,
}) => {
  await openPlayer(page);
  await page
    .getByRole("button", { name: "Cancelar preparação", exact: true })
    .click();
  await expect(page.locator(".discovery-detail-page")).toBeVisible();
  await page.waitForTimeout(750);
  await expect(
    page.getByRole("heading", {
      name: "Reproduzindo · primeiro frame simulado",
    }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: /^Assistir$|^Continuar de/ }).click();
  await expect(
    page.getByRole("heading", {
      name: "Reproduzindo · primeiro frame simulado",
    }),
  ).toBeVisible();
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
      path: `docs/milestones/M05-local-playback/evidence/player-${height}.png`,
    });
  }
  await page
    .getByRole("button", { name: "Áudio e legendas", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Áudio e legendas", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator(".discovery-detail-page")).toBeVisible();
});

test("player: chrome sutil usa ícones, some em reprodução e permanece ao pausar", async ({
  page,
}) => {
  await openPlayer(page);
  await expect(
    page.getByRole("heading", {
      name: "Reproduzindo · primeiro frame simulado",
    }),
  ).toBeVisible();

  const toolbar = page.getByRole("toolbar", {
    name: "Controles de reprodução",
  });
  await expect(toolbar).toBeVisible();
  await expect(toolbar.locator("button")).toHaveCount(9);
  expect(
    await toolbar
      .locator("button")
      .evaluateAll((buttons) =>
        buttons.every(
          (button) =>
            button.textContent?.trim() === "" &&
            Boolean(button.getAttribute("aria-label")) &&
            Boolean(button.querySelector("svg")),
        ),
      ),
  ).toBe(true);
  expect(
    await toolbar.evaluate(
      (element) => getComputedStyle(element).flexWrap === "nowrap",
    ),
  ).toBe(true);

  const controls = page.locator(".player-controls");
  await expect(controls).toHaveClass(/resting/, { timeout: 5_500 });
  await expect(page.locator(".player-chrome")).toHaveCSS("opacity", "0");

  await page.mouse.move(320, 240);
  await expect(controls).not.toHaveClass(/resting/);
  await expect(page.locator(".player-chrome")).toHaveCSS("opacity", "1");

  await page.getByRole("button", { name: "Pausar", exact: true }).click();
  await page.waitForTimeout(4_300);
  await expect(controls).not.toHaveClass(/resting/);
  await expect(page.locator(".player-chrome")).toHaveCSS("opacity", "1");
});

test("player: experiência comum oculta ferramentas e linguagem de revisão", async ({
  page,
}) => {
  await page.goto("/");
  await enterDiscovery(page, false);
  await page.locator(".discovery-card").first().click();
  await page.getByRole("button", { name: /^Assistir$|^Continuar de/ }).click();
  await expect(
    page.getByRole("heading", { name: "Reproduzindo", exact: true }),
  ).toBeVisible();

  await expect(
    page.getByText("Cenários do player", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Diagnóstico" })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: "Recuperar fonte" }),
  ).toHaveCount(0);
  await expect(page.getByText(/simulaç|simulad|prévia local/i)).toHaveCount(0);

  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.mouse.move(900, 900);
  await page.screenshot({
    path: "docs/milestones/M05-local-playback/evidence/player-streaming-1080.png",
  });
});
