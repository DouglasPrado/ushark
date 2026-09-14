import { test, expect } from "@playwright/test";
import { enterSeries, openPack } from "./series.helpers";

test("M03 catálogo inicial usa séries e artes reais do snapshot IMDb", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await enterSeries(page, true, true);
  const cards = page.locator(".series-card");
  await expect(cards).toHaveCount(8);
  await expect(cards.first()).toContainText("Breaking Bad");
  await expect(cards.first()).toContainText("2008–2013");
  await expect(cards.first()).toContainText("IMDb");
  await expect(cards.first()).toContainText("tt0903747");
  const breakingHealth = cards.first().locator(".torrent-health-badge");
  await expect(breakingHealth).toContainText("Média · Muito bom");
  await expect(breakingHealth.locator(".is-active")).toHaveCount(4);
  await expect(cards.first().locator(".series-card-meta")).toContainText("4K");
  await expect(
    page
      .getByRole("button", { name: "Abrir The Office", exact: true })
      .locator(".torrent-health-badge"),
  ).toContainText("Média · Bom");
  await expect(
    page
      .getByRole("button", { name: "Abrir The Office", exact: true })
      .locator(".series-card-meta"),
  ).toContainText("1080p");
  await expect(cards.first().locator("img")).toHaveAttribute(
    "src",
    "./series-art/imdb/tt0903747-backdrop.jpg",
  );
  await expect
    .poll(() =>
      cards
        .first()
        .locator("img")
        .evaluate((image) => (image as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  await page.screenshot({
    fullPage: true,
    path: "docs/milestones/M03-series/evidence/imdb-series-1920.png",
  });
  await cards.first().click();
  await expect(
    page.getByRole("heading", { name: "Breaking Bad", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".series-detail")).toContainText("2,7 mi votos");
  await expect(page.locator(".series-detail")).toContainText("tt0903747");
  await expect(page.locator(".series-detail-backdrop img")).toHaveAttribute(
    "src",
    "./series-art/imdb/tt0903747-backdrop.jpg",
  );
  await expect(page.locator(".series-summary")).toContainText("2 temporadas");
  await expect(page.locator(".series-summary")).toContainText("6 episódios");
  await expect(page.locator(".series-summary")).toContainText(
    "Melhor resolução: 4K",
  );
  await expect(page.locator(".series-summary")).toContainText(
    "Média do Torrent Health: Muito bom",
  );
  await page.screenshot({
    fullPage: true,
    path: "docs/milestones/M03-series/evidence/imdb-series-detail-1920.png",
  });
  await page
    .getByRole("button", { name: "Temporada 1 3 episódios", exact: true })
    .click();
  await expect(page.locator(".series-episode")).toHaveCount(3);
  await expect(page.locator(".series-episode").first()).toContainText("Piloto");
  await expect(page.locator(".series-episode").first()).toContainText("4K");
  await expect(
    page
      .locator(".series-episode")
      .first()
      .locator(".series-episode-artwork img"),
  ).toHaveAttribute("src", "./series-art/imdb/tt0903747-backdrop.jpg");
  const episodeHealth = page
    .locator(".series-episode")
    .first()
    .locator(".torrent-health-badge");
  await expect(episodeHealth).toContainText("Muito bom");
  await expect(episodeHealth.locator(".is-active")).toHaveCount(4);
  await page.screenshot({
    fullPage: true,
    path: "docs/milestones/M03-series/evidence/imdb-series-episodes-1920.png",
  });
});

test("M03 organiza o catálogo padrão em trilhos por categoria", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await enterSeries(page, true, true);

  const categories = page.locator('[data-catalog-view="categories"]');
  await expect(categories).toBeVisible();
  await expect(
    categories.getByRole("region", { name: "Em destaque", exact: true }),
  ).toBeVisible();
  const drama = categories.getByRole("region", {
    name: "Drama",
    exact: true,
  });
  await expect(drama).toBeVisible();
  await expect(drama.locator('[data-orientation="landscape"]')).toHaveCount(7);
  const dramaCard = drama.getByRole("button", {
    name: "Na categoria Drama: abrir Breaking Bad",
  });
  await expect(dramaCard).toBeVisible();
  await dramaCard.click();
  await page
    .getByRole("button", { name: "Todas as séries", exact: true })
    .click();
  await expect(dramaCard).toBeFocused();

  await page.getByRole("button", { name: "Buscar séries" }).click();
  await page
    .getByRole("searchbox", { name: "Buscar na lista de séries" })
    .fill("Ruptura");
  await expect(categories).toBeHidden();
  await expect(page.locator(".series-grid .series-card")).toHaveCount(1);
  await expect(page.locator(".series-grid .series-card")).toHaveAttribute(
    "data-orientation",
    "portrait",
  );
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("searchbox", { name: "Buscar na lista de séries" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Buscar séries" }),
  ).toBeFocused();
  await expect(categories).toBeVisible();
});

test("M03 episódio aceita imagem ou GIF e atualiza o card na sessão", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await enterSeries(page, true, true);
  await page
    .getByRole("button", { name: "Abrir Breaking Bad", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Temporada 1 3 episódios", exact: true })
    .click();
  const episodeCard = page.getByRole("button", { name: /^E01 Piloto/ });
  await episodeCard.click();
  const upload = page.getByLabel("Enviar imagem ou GIF do episódio", {
    exact: true,
  });
  await page.screenshot({
    fullPage: true,
    path: "docs/milestones/M03-series/evidence/episode-artwork-upload-1920.png",
  });
  await upload.setInputFiles({
    name: "episodio.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("não é uma imagem"),
  });
  await expect(page.getByRole("alert")).toContainText("JPEG, PNG, WebP ou GIF");
  await upload.setInputFiles({
    name: "piloto.gif",
    mimeType: "image/gif",
    buffer: Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
      "base64",
    ),
  });
  await expect(
    page.getByText("GIF aplicado ao episódio nesta sessão.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".episode-artwork-panel .series-episode-artwork img"),
  ).toHaveAttribute("src", /^data:image\/gif;base64,/);
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect(
    episodeCard.locator(".series-episode-artwork img"),
  ).toHaveAttribute("src", /^data:image\/gif;base64,/);
});

test("M03 correção isolada, colisão, episódio duplo, rascunho e retry", async ({
  page,
}) => {
  await enterSeries(page);
  await openPack(page, "Pack com pendências");
  const unknown = page.locator('[data-file="Show.02.mkv"]');
  const alternative = page.locator(
    '[data-file="Entre.Orbitas.S01E01.alternativo.mkv"]',
  );
  const double = page.locator('[data-file="Entre.Orbitas.S01E01E02.mkv"]');
  const incorrect = page.locator('[data-file="Entre.Orbitas.S01E04.mkv"]');
  await expect(
    page.getByRole("button", { name: "Confirmar série", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Filtrar pendências", exact: true })
    .click();
  const field = unknown.getByLabel("Temporada", { exact: false });
  await field.fill("0");
  await expect(field).toBeFocused();
  await unknown.getByLabel("Episódio", { exact: false }).fill("1");
  await expect(unknown).toBeVisible();
  await alternative
    .getByRole("button", { name: "Deixar para depois", exact: true })
    .click();
  await expect(double).toContainText("Revisão manual");
  await double
    .getByRole("button", { name: "Deixar para depois", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Mostrar todos os arquivos", exact: true })
    .click();
  await incorrect.getByLabel("Episódio", { exact: false }).fill("4");
  await incorrect
    .getByLabel("Legenda", { exact: false })
    .selectOption({ index: 1 });
  await page
    .getByRole("button", { name: "Temporada 1 · 3 arquivo(s)", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Adicionar série", exact: true }),
  ).toBeFocused();
  await expect(page.locator(".series-card")).toHaveCount(0);
  await page.getByRole("button", { name: "Início", exact: true }).click();
  await page.getByRole("button", { name: "Séries", exact: true }).click();
  await page
    .getByRole("button", { name: "Adicionar série", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Temporada 1 · 3 arquivo(s)",
      exact: true,
    }),
  ).toHaveAttribute("aria-expanded", "false");
  await page.getByLabel("Simular falha ao salvar").check();
  await page
    .getByRole("button", { name: "Confirmar série", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("rascunho foi mantido");
  await page.getByLabel("Simular falha ao salvar").uncheck();
  await page
    .getByRole("button", { name: "Confirmar série", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Entre Órbitas", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".series-summary")).toContainText("3 episódios");
  await page
    .getByRole("button", { name: "Temporada 1 2 episódios", exact: true })
    .click();
  await page.getByRole("button", { name: /^E04 / }).click();
  await expect(page.getByRole("dialog")).toContainText("Escolha manual");
  await expect(page.getByRole("dialog")).toContainText(".pt-BR.srt");
  await page
    .getByRole("button", {
      name: "Revisar associações desta fonte",
      exact: true,
    })
    .click();
  await expect(incorrect.getByLabel("Episódio", { exact: false })).toHaveValue(
    "4",
  );
  await expect(double).toContainText("Deixado para depois");
  await expect(
    page.getByText("Fonte já cadastrada.", { exact: false }),
  ).toBeVisible();
});

test("M03 metadata ausente, múltiplas fontes, teclado e retorno à hierarquia", async ({
  page,
}) => {
  await enterSeries(page);
  await openPack(page, "Sem metadata");
  await expect(
    page.getByRole("button", { name: "Confirmar série", exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel("Título da série", { exact: true })
    .fill("Entre Órbitas");
  await page
    .getByRole("button", { name: "Confirmar série", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Entre Órbitas", exact: true }),
  ).toBeVisible();
  await openPack(page, "Episódio avulso");
  await page
    .getByRole("button", { name: "Confirmar série", exact: true })
    .click();
  await expect(page.locator(".series-summary")).toContainText("2 fontes");
  await page
    .getByRole("button", { name: "Temporada 1 8 episódios", exact: true })
    .click();
  const episode = page.getByRole("button", { name: /^E01 / });
  await episode.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog").locator(".series-file")).toHaveCount(2);
  await page.keyboard.press("Escape");
  await expect(episode).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Temporada 1 8 episódios", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator(".series-card")).toBeFocused();
});

test("M03 resposta antiga, offline, erro recuperável e 20.000 episódios paginados", async ({
  page,
}) => {
  await enterSeries(page);
  await page.getByText("Inspecionar prévia", { exact: true }).click();
  await page.getByLabel("Cenário de séries").selectOption("slow");
  await page.getByLabel("Cenário de séries").selectOption("list-error");
  await expect(page.getByRole("alert")).toContainText("Não foi possível");
  // Wait beyond the old slow response: it must not erase the newer error.
  await page.waitForTimeout(1750);
  await expect(page.getByRole("alert")).toBeVisible();
  await page
    .getByRole("button", { name: "Tentar novamente", exact: true })
    .click();
  await expect(page.getByRole("alert")).toBeHidden();
  await page.getByLabel("Coleção de exemplo").selectOption("large");
  await expect(page.locator(".series-card")).toContainText("20.000");
  await page.getByLabel("Cenário de séries").selectOption("offline");
  await expect(page.getByText("Abrindo suas séries…")).toBeHidden();
  await page.locator(".series-card").click();
  await expect(page.locator(".series-seasons > button")).toHaveCount(20);
  await page
    .getByRole("button", { name: "Próxima página", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Temporada 21 200 episódios", exact: true })
    .click();
  await expect(page.locator(".series-episode")).toHaveCount(20);
  await page
    .getByRole("button", { name: "Próxima página", exact: true })
    .click();
  await page.getByRole("button", { name: /^E21 / }).click();
  await expect(page.getByRole("dialog")).toContainText("ainda não tem fontes");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /^E21 / })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", {
      name: "Temporada 21 200 episódios",
      exact: true,
    }),
  ).toBeFocused();
});

test("M03 gamepad sintético, foco preso e confirmação dupla", async ({
  page,
}) => {
  await enterSeries(page);
  const add = page.getByRole("button", {
    name: "Adicionar série",
    exact: true,
  });
  await add.focus();
  const pad = async (action: "a" | "b" | "right" | "release") => {
    await page.evaluate(
      (action) =>
        Object.defineProperty(navigator, "getGamepads", {
          configurable: true,
          value: () =>
            action === "release"
              ? []
              : [
                  {
                    buttons: [
                      { pressed: action === "a" },
                      { pressed: action === "b" },
                    ],
                    axes: [action === "right" ? 1 : 0, 0],
                  },
                ],
        }),
      action,
    );
  };
  await pad("a");
  await expect(page.getByRole("dialog")).toBeVisible();
  await pad("release");
  await page
    .getByRole("button", { name: "Episódio avulso", exact: true })
    .click();
  const subtitle = page.getByLabel("Legenda de Entre.Orbitas.S01E01.mkv", {
    exact: true,
  });
  await subtitle.focus();
  await pad("right");
  await expect(subtitle).toHaveValue("Entre.Orbitas.S01E01.pt-BR.srt");
  await pad("release");
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(
        () => !!document.activeElement?.closest('[role="dialog"]'),
      ),
    ).toBe(true);
  }
  await pad("b");
  await expect(page.getByRole("dialog")).toBeHidden();
  await pad("release");
  await expect(add).toBeFocused();
  await expect(
    page.getByRole("heading", { name: "Séries", exact: true }),
  ).toBeVisible();
  await add.click();
  await page
    .getByRole("button", { name: "Confirmar série", exact: true })
    .evaluate((el) => {
      (el as HTMLButtonElement).click();
      (el as HTMLButtonElement).click();
    });
  await expect(page.locator(".series-summary")).toContainText("1 episódios");
  await page
    .getByRole("button", { name: "Todas as séries", exact: true })
    .click();
  await expect(page.locator(".series-card")).toHaveCount(1);
});
