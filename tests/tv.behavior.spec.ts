import { test, expect, type Page } from "@playwright/test";
import { enterDiscovery, discoveryScenario } from "./discovery.helpers";
import { movieFixtures } from "./movies.helpers";
async function setup(page: Page) {
  await page.goto("/?review=1");
  await enterDiscovery(page, false);
  await discoveryScenario(page, "editorial");
  await page.getByRole("button", { name: "Filmes", exact: true }).click();
  await movieFixtures(page, "collection");
  await page.getByRole("button", { name: "Início", exact: true }).click();
  await page.getByRole("button", { name: "Ajustar preferências" }).click();
  await page.getByRole("button", { name: "Sessão de TV", exact: true }).click();
  await page
    .getByLabel("Solicitar tela cheia do navegador ao iniciar")
    .uncheck();
}
async function menu(page: Page) {
  await page.getByRole("button", { name: "Abrir controles da TV" }).click();
  await page.getByText("Ferramentas de revisão", { exact: true }).click();
}
test("M18 modo TV iniciado diretamente expõe apenas navegação de consumo", async ({
  page,
}) => {
  await page.goto("/?mode=tv");
  await enterDiscovery(page, false);
  await expect(page.locator(".discovery-app")).toHaveAttribute(
    "data-tv-mode",
    "true",
  );
  for (const name of ["Bibliotecas", "Downloads", "Ajustar preferências"])
    await expect(page.getByRole("button", { name, exact: true })).toHaveCount(
      0,
    );
  await expect(page.locator(".discovery-footer")).toHaveCount(0);

  await page.getByRole("button", { name: "Filmes", exact: true }).click();
  await expect(page.locator(".movies-app")).toHaveAttribute(
    "data-tv-mode",
    "true",
  );
  await expect(
    page.getByRole("button", { name: "Adicionar filme", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Importar torrent ou magnet" }),
  ).toHaveCount(0);
  await expect(page.locator(".movie-preview-tools")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Bibliotecas", exact: true }),
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Séries", exact: true }).click();
  await expect(page.locator(".series-app")).toHaveAttribute(
    "data-tv-mode",
    "true",
  );
  await expect(
    page.getByRole("button", { name: "Adicionar série", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Importar torrent ou magnet" }),
  ).toHaveCount(0);
  await expect(page.locator(".series-tools, .series-app > footer")).toHaveCount(
    0,
  );
});

test("M18 Filmes mantém somente catálogo, favoritos e reprodução na TV", async ({
  page,
}) => {
  await setup(page);
  await page
    .getByRole("button", { name: "Iniciar sessão TV simulada" })
    .click();
  await page.getByRole("button", { name: "Filmes", exact: true }).click();
  await expect(page.locator(".movies-app")).toHaveAttribute(
    "data-tv-mode",
    "true",
  );
  for (const name of [
    "Adicionar filme",
    "Importar torrent ou magnet",
    "Downloads",
    "Bibliotecas",
  ])
    await expect(page.getByRole("button", { name, exact: true })).toHaveCount(
      0,
    );
  await expect(page.locator(".movie-preview-tools")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Abrir Horizonte Azul", exact: true })
    .click();
  for (const name of [
    "Fontes (2)",
    "Editar identificação",
    "Atualizar dados",
    "Remover da biblioteca",
    "Baixar",
  ])
    await expect(page.getByRole("button", { name, exact: true })).toHaveCount(
      0,
    );
  await expect(
    page.getByText("Comparar fontes e preferências", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Assistir", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.screenshot({
    path: "docs/milestones/M18-tv-session/evidence/tv-movies-1080.png",
  });
});

test("M18 TV pausa/reconecta, hotplug e encerramento preservam posição", async ({
  page,
}) => {
  await setup(page);
  await page
    .getByRole("button", { name: "Iniciar sessão TV simulada" })
    .click();
  await expect(page.locator(".discovery-app")).toHaveAttribute(
    "data-tv-mode",
    "true",
  );
  for (const name of ["Bibliotecas", "Downloads", "Ajustar preferências"])
    await expect(page.getByRole("button", { name, exact: true })).toHaveCount(
      0,
    );
  await expect(page.locator(".discovery-footer")).toHaveCount(0);
  const tvControls = page.getByRole("button", {
    name: "Abrir controles da TV",
  });
  await expect(tvControls).toBeVisible();
  await expect(tvControls.locator(".tv-power-symbol")).toBeVisible();
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.screenshot({
    path: "docs/milestones/M18-tv-session/evidence/tv-home-1080.png",
  });
  await page.locator(".discovery-card").first().click();
  await expect(
    page.getByText("Fontes disponíveis", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Comparar fontes e preferências", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Baixar", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: /Continuar de/ }).click();
  await expect(
    page.getByRole("heading", { name: "Reproduzindo", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Diagnóstico", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Cenários do player", { exact: true }),
  ).toHaveCount(0);
  await menu(page);
  await page
    .getByRole("button", { name: "Simular controle desconectado" })
    .click();
  await expect(page.getByRole("dialog")).toContainText("controle desconectado");
  await page
    .getByRole("button", { name: "Reconectar controle simulado" })
    .click();
  await page
    .getByRole("button", { name: "Simular desconexão Moonlight" })
    .click();
  await page.screenshot({
    path: "docs/milestones/M18-tv-session/evidence/disconnected.png",
  });
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Pausado", exact: true }),
  ).toBeVisible();
  await menu(page);
  await page.getByRole("button", { name: "Reconectar", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Conexão: ativa");
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Pausado", exact: true }),
  ).toBeVisible();
  await menu(page);
  await page
    .getByRole("button", { name: "Sair do modo TV", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Continuar assistindo", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Sair do modo TV", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmar saída", exact: true })
    .click();
  await expect(page.locator(".player-preview")).toHaveCount(0);
  await expect(page.locator(".discovery-detail-page")).toContainText(
    "Horizonte Azul",
  );
});
test("M18 falha/retry, cancelamento e fullscreen da superfície", async ({
  page,
}) => {
  await setup(page);
  await page.getByLabel("Simular sessão indisponível/offline").check();
  await page
    .getByRole("button", { name: "Iniciar sessão TV simulada" })
    .click();
  await expect(page.getByRole("alert")).toContainText("indisponível");
  await page.getByLabel("Simular sessão indisponível/offline").uncheck();
  await page
    .getByRole("button", { name: "Iniciar sessão TV simulada" })
    .click();
  await page.getByRole("button", { name: "Cancelar início" }).click();
  await expect(
    page.getByRole("heading", { name: "Sessão de TV", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Solicitar tela cheia do navegador ao iniciar").check();
  await page
    .getByRole("button", { name: "Iniciar sessão TV simulada" })
    .click();
  await expect(
    page.getByRole("button", { name: "Abrir controles da TV" }),
  ).toBeVisible();
  expect(await page.evaluate(() => !!document.fullscreenElement)).toBe(true);
  await menu(page);
  await page.getByLabel("Ao perder a sessão").selectOption("continue");
  await page
    .getByRole("button", { name: "Simular desconexão Moonlight" })
    .click();
  await expect(page.getByRole("dialog")).toContainText("continua conforme");
  await page.getByLabel("Simular falha de conexão ou encerramento").check();
  await page.getByRole("button", { name: "Reconectar", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "indisponível",
  );
  await page.getByLabel("Simular falha de conexão ou encerramento").uncheck();
  await page.getByRole("button", { name: "Reconectar", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Conexão: ativa");
  await page.keyboard.press("Escape");
  await expect(page.locator(".tv-session-dialog")).toHaveCount(0);
});
test("M18 política continuar mantém player e B sintético fecha apenas painel", async ({
  page,
}) => {
  await setup(page);
  await page
    .getByRole("button", { name: "Iniciar sessão TV simulada" })
    .click();
  await page.locator(".discovery-card").first().click();
  await page.getByRole("button", { name: /Continuar de/ }).click();
  await expect(
    page.getByRole("heading", { name: "Reproduzindo", exact: true }),
  ).toBeVisible();
  await menu(page);
  await page.getByLabel("Ao perder a sessão").selectOption("continue");
  await page
    .getByRole("button", { name: "Simular desconexão Moonlight" })
    .click();
  await page.evaluate(() => {
    const buttons = Array.from({ length: 16 }, (_, i) => ({
      pressed: i === 1,
      touched: i === 1,
      value: i === 1 ? 1 : 0,
    }));
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [
        { buttons, axes: [0, 0], mapping: "standard", connected: true },
      ],
    });
  });
  await expect(page.locator(".tv-session-dialog")).toHaveCount(0);
  await page.evaluate(() =>
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [],
    }),
  );
  await expect(
    page.getByRole("heading", { name: "Reproduzindo", exact: true }),
  ).toBeVisible();
  for (const [width, height] of [
    [1920, 1080],
    [2560, 1440],
    [3840, 2160],
  ]) {
    await page.setViewportSize({ width, height });
    await page.screenshot({
      path: `docs/milestones/M18-tv-session/evidence/tv-player-${height}.png`,
    });
  }
});
