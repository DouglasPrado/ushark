import { expect, test, type Page } from "@playwright/test";
import { enterMovies, movieFixtures, movieScenario } from "./movies.helpers";

test("M02 M03 catálogos buscam e ordenam por votos ou título", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await enterMovies(page, true, true);

  const movieSearch = page.getByRole("searchbox", {
    name: "Buscar na lista de filmes",
  });
  const movieSort = page.getByLabel("Ordenar filmes");
  await movieSearch.fill("viagem chihiro");
  await expect(page.locator(".movie-card")).toHaveCount(1);
  await expect(page.locator(".movie-card")).toContainText(
    "A Viagem de Chihiro",
  );
  await movieSearch.fill("Everything Everywhere");
  await expect(page.locator(".movie-card")).toHaveCount(1);
  await expect(page.locator(".movie-card")).toContainText(
    "Tudo em Todo Lugar ao Mesmo Tempo",
  );
  await movieSearch.fill("animacao");
  await expect(page.locator(".movie-card")).toHaveCount(1);
  await expect(page.locator(".movie-card")).toContainText(
    "A Viagem de Chihiro",
  );
  await movieSearch.fill("");
  await movieSort.selectOption("title");
  const movieTitles = await page
    .locator(".movie-card > strong")
    .allTextContents();
  expect(movieTitles).toEqual(
    [...movieTitles].sort((left, right) =>
      left.localeCompare(right, "pt-BR", { sensitivity: "base" }),
    ),
  );
  await page.screenshot({
    path: "docs/milestones/M02-movies/evidence/catalog-search-sort-1920.png",
    fullPage: true,
  });
  await movieSort.selectOption("votes");
  await expect(page.locator(".movie-card").first()).toContainText(
    "Batman: O Cavaleiro das Trevas",
  );

  await page
    .getByRole("navigation", { name: "Navegação principal" })
    .getByRole("button", { name: "Séries", exact: true })
    .click();
  await expect(page.getByText("Abrindo suas séries…")).toBeHidden();
  const seriesSearch = page.getByRole("searchbox", {
    name: "Buscar na lista de séries",
  });
  const seriesSort = page.getByLabel("Ordenar séries");
  await seriesSearch.fill("ruptura");
  await expect(page.locator(".series-card")).toHaveCount(1);
  await expect(page.locator(".series-card")).toContainText("Ruptura");
  await seriesSearch.fill("Severance");
  await expect(page.locator(".series-card")).toHaveCount(1);
  await expect(page.locator(".series-card")).toContainText("Ruptura");
  await seriesSearch.fill("ficcao cientifica");
  await expect(page.locator(".series-card")).toHaveCount(1);
  await expect(page.locator(".series-card")).toContainText("Ruptura");
  await seriesSearch.fill("");
  await seriesSort.selectOption("title");
  const seriesTitles = await page
    .locator(".series-card > strong")
    .allTextContents();
  expect(seriesTitles).toEqual(
    [...seriesTitles].sort((left, right) =>
      left.localeCompare(right, "pt-BR", { sensitivity: "base" }),
    ),
  );
  await page.screenshot({
    path: "docs/milestones/M03-series/evidence/catalog-search-sort-1920.png",
    fullPage: true,
  });
  await seriesSort.selectOption("votes");
  await expect(page.locator(".series-card").first()).toContainText(
    "Breaking Bad",
  );
});

test("catálogo padrão expõe os dados obtidos do IMDb", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await enterMovies(page, true, true);
  const posters = page.locator(".movie-card img");
  await expect(posters).toHaveCount(8);
  await expect
    .poll(() =>
      posters.evaluateAll((images) =>
        images.every(
          (image) =>
            (image as HTMLImageElement).complete &&
            (image as HTMLImageElement).naturalWidth > 0 &&
            (image as HTMLImageElement).src.includes("/movie-art/imdb/tt") &&
            (image as HTMLImageElement).src.endsWith("-poster.jpg"),
        ),
      ),
    )
    .toBe(true);
  const card = page.getByRole("button", {
    name: "Abrir Interestelar",
    exact: true,
  });
  await expect(card).toContainText("2014 · 169 min");
  await expect(card).toContainText("IMDb");
  await expect(card).toContainText("8,7");
  await expect(card).toContainText("2,6 mi votos");
  await expect(card).toContainText("tt0816692");
  await expect(card).toContainText("Aventura / Drama / Ficção científica");
  const torrentHealth = card.locator(".torrent-health-badge");
  await expect(torrentHealth).toContainText("Excelente");
  await expect(torrentHealth.locator(".is-active")).toHaveCount(5);
  await expect(card.locator(".movie-card-year")).toContainText("4K");
  await page.screenshot({
    path: "docs/milestones/M02-movies/evidence/imdb-movies-1920.png",
    fullPage: true,
  });

  await card.click();
  const detail = page.getByRole("main", { name: "Interestelar" });
  await expect(detail.locator("[data-detail-primary-action]")).toBeFocused();
  await expect(detail).toHaveClass(/discovery-detail-page/);
  await expect(page).toHaveURL(/#\/content\/movie%3Alocal%3Aimdb-tt0816692$/);
  const backdrop = detail.locator(".discovery-detail-hero .discovery-art img");
  await expect(backdrop).toBeVisible();
  await expect
    .poll(() =>
      backdrop.evaluate(
        (image) =>
          (image as HTMLImageElement).naturalWidth > 0 &&
          (image as HTMLImageElement).src.endsWith(
            "/movie-art/imdb/tt0816692-backdrop.jpg",
          ),
      ),
    )
    .toBe(true);
  const facts = detail.locator(".discovery-detail-facts");
  await expect(facts).toContainText("Título original");
  await expect(facts).toContainText("Interstellar");
  await expect(facts).toContainText("8.7 de 10");
  await expect(facts).toContainText("2.605.028 votos");
  await expect(facts).toContainText("tt0816692");
  await expect(detail.locator(".discovery-detail-badges")).toContainText(
    "2h 49min",
  );
  await page.screenshot({
    path: "docs/milestones/M02-movies/evidence/imdb-details-1920.png",
  });
});

test("M02 usa shell limpo e ações secundárias por ícones", async ({ page }) => {
  await enterMovies(page);
  const navigation = page.getByRole("navigation", {
    name: "Navegação principal",
  });
  await expect(
    navigation.getByRole("button", { name: "Filmes", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(page.locator(".movies-sidebar, .movies-footer")).toHaveCount(0);
  await expect(
    page.getByText(/Prévia em memória|Inspecionar cenários|Dados de exemplo/),
  ).toHaveCount(0);

  const add = page.getByRole("button", {
    name: "Adicionar filme",
    exact: true,
  });
  await expect(add.locator("svg")).toBeVisible();
  expect((await add.textContent())?.trim()).toBe("");

  await movieFixtures(page, "collection");
  await page
    .getByRole("button", { name: "Abrir Horizonte Azul", exact: true })
    .click();
  for (const name of [
    "Fontes (2)",
    "Editar identificação",
    "Atualizar dados",
    "Remover da biblioteca",
  ]) {
    const action = page.getByRole("button", { name, exact: true });
    await expect(action.locator("svg")).toBeVisible();
    expect((await action.textContent())?.trim()).toBe("");
  }
});

async function searchMovie(page: Page, title = "Horizonte Azul") {
  await page.getByLabel("Título do filme", { exact: true }).fill(title);
  await page.getByRole("button", { name: "Buscar filme", exact: true }).click();
}
async function chooseHorizon(page: Page) {
  await page.getByRole("button", { name: /Horizonte Azul 2024/ }).click();
}
async function saveMovie(page: Page) {
  await page
    .getByRole("button", { name: "Confirmar filme", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeHidden();
}

test("cadastro ambíguo com source, favorito e duplicata reutilizam o filme", async ({
  page,
}) => {
  await enterMovies(page);
  await page
    .getByRole("button", { name: "Adicionar filme", exact: true })
    .click();
  await page.getByLabel("Fonte inicial").selectOption("source:example-1080");
  await searchMovie(page);
  await expect(page.locator(".search-results > button")).toHaveCount(2);
  await chooseHorizon(page);
  await expect(page.getByRole("dialog")).toContainText(
    "Horizonte.Azul.1080p.mkv",
  );
  await saveMovie(page);
  const identity = page.url();
  await expect(
    page.getByRole("heading", { name: "Horizonte Azul", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Favoritar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Favoritado", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Todos os filmes", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Abrir Horizonte Azul", exact: true }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Favoritos", exact: true }).click();
  await expect(page.locator(".movie-card")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Adicionar filme", exact: true })
    .click();
  await searchMovie(page);
  await chooseHorizon(page);
  await expect(page.getByRole("dialog")).toContainText("Este filme já existe");
  // Fire the same confirmation twice in the same event loop, before a React commit.
  await page
    .getByRole("button", { name: "Confirmar filme", exact: true })
    .evaluate((button: HTMLButtonElement) => {
      button.click();
      button.click();
    });
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page).toHaveURL(identity);
  await expect(
    page.getByRole("button", { name: "Favoritado", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Fontes (1)", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Todos os filmes", exact: true })
    .click();
  await expect(page.locator(".movie-card")).toHaveCount(1);
});

test("manual offline valida campos, preserva rascunho e funciona sem fonte/imagem", async ({
  page,
}) => {
  await enterMovies(page);
  await movieScenario(page, "offline");
  await page.context().setOffline(true);
  const add = page.getByRole("button", {
    name: "Adicionar filme",
    exact: true,
  });
  await add.click();
  await searchMovie(page, "Meu curta");
  await expect(page.getByRole("alert")).toContainText(
    "busca está indisponível",
  );
  await page
    .getByRole("button", { name: "Criar manualmente", exact: true })
    .click();
  await expect(page.getByLabel("Título", { exact: true })).toBeFocused();
  await page.getByLabel("Título", { exact: true }).fill(" ");
  await page
    .getByRole("button", { name: "Revisar filme", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Dê um título");
  await page.getByLabel("Título", { exact: true }).fill("Meu curta");
  await page.getByLabel("Ano (opcional)").fill("1700");
  await page
    .getByRole("button", { name: "Revisar filme", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("1888 e 2100");
  await page.getByLabel("Ano (opcional)").fill("2025");
  await page
    .getByLabel("Sinopse (opcional)")
    .fill("Uma história que eu criei.");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(add).toBeFocused();
  await add.click();
  await page
    .getByRole("button", { name: "Criar manualmente", exact: true })
    .click();
  await expect(page.getByLabel("Sinopse (opcional)")).toHaveValue(
    "Uma história que eu criei.",
  );
  await page
    .getByRole("button", { name: "Revisar filme", exact: true })
    .click();
  await saveMovie(page);
  await expect(
    page.getByRole("heading", { name: "Meu curta", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Poster indisponível", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Fontes (0)", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Uma história que eu criei.", { exact: true }),
  ).toBeVisible();
});

test("falha ao salvar permite retomar revisão e retry sem perder escolhas", async ({
  page,
}) => {
  await enterMovies(page);
  await movieScenario(page, "save-error");
  await page
    .getByRole("button", { name: "Adicionar filme", exact: true })
    .click();
  await searchMovie(page);
  await chooseHorizon(page);
  await page
    .getByRole("button", { name: "Confirmar filme", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Não foi possível salvar",
  );
  await expect(
    page.getByRole("button", { name: "Confirmar filme", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await movieScenario(page, "normal");
  await page
    .getByRole("button", { name: "Adicionar filme", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Retomar revisão", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Horizonte Azul");
  await saveMovie(page);
  await page
    .getByRole("button", { name: "Todos os filmes", exact: true })
    .click();
  await expect(page.locator(".movie-card")).toHaveCount(1);
});

test("busca lenta, troca de consulta e cancelamento descartam resposta antiga", async ({
  page,
}) => {
  await enterMovies(page);
  await movieScenario(page, "slow");
  await page.clock.install();
  await page
    .getByRole("button", { name: "Adicionar filme", exact: true })
    .click();
  await searchMovie(page, "Horizonte");
  await expect(page.getByRole("status")).toContainText(
    "Buscando correspondências",
  );
  await page.getByLabel("Título do filme", { exact: true }).fill("Estação");
  await page.clock.fastForward(2000);
  await expect(page.locator(".search-results > button")).toHaveCount(0);
  await page.getByRole("button", { name: "Buscar filme", exact: true }).click();
  await page.clock.fastForward(2000);
  await expect(page.locator(".search-results > button")).toHaveCount(1);
  await expect(page.locator(".search-results")).toContainText(
    "A Última Estação",
  );
  await searchMovie(page, "Horizonte");
  await page
    .getByRole("button", { name: "Cancelar busca", exact: true })
    .click();
  await page.clock.fastForward(2000);
  await expect(page.locator(".search-results > button")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.clock.fastForward(2000);
  await expect(
    page.getByRole("heading", { name: "Filmes", exact: true }),
  ).toBeVisible();
});

test("corrigir identidade exige revisão, cancelamento não une e refresh preserva override", async ({
  page,
}) => {
  await enterMovies(page);
  await movieFixtures(page, "conflict");
  await page
    .getByRole("button", { name: "Abrir Minha descoberta", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Editar identificação", exact: true })
    .click();
  await searchMovie(page);
  await chooseHorizon(page);
  await expect(page.getByRole("dialog")).toContainText(
    "Confirmar unirá os dois registros",
  );
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("heading", { name: "Minha descoberta", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Editar identificação", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Retomar revisão", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmar união", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeHidden();
  const identity = page.url();
  await expect(
    page.getByRole("heading", {
      name: "Horizonte · edição da coleção",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Favoritado", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Fontes (3)", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Atualizar dados", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Identificação atualizada" }),
  ).toBeVisible();
  await expect(page).toHaveURL(identity);
  await expect(
    page.getByRole("heading", {
      name: "Horizonte · edição da coleção",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".movie-synopsis")).toContainText(
    "Uma nova perspectiva",
  );
  await page
    .getByRole("button", { name: "Todos os filmes", exact: true })
    .click();
  await expect(page.locator(".movie-card")).toHaveCount(4);
  await expect(
    page.getByRole("button", { name: "Abrir Minha descoberta", exact: true }),
  ).toHaveCount(0);
});

test("remoções distintas, confirmação cancelável, última fonte e retorno de foco", async ({
  page,
}) => {
  await enterMovies(page);
  await movieFixtures(page, "collection");
  await page
    .getByRole("button", { name: "Abrir Horizonte Azul", exact: true })
    .click();
  const sources = page.getByRole("button", { name: "Fontes (2)", exact: true });
  await sources.click();
  const firstSource = page.locator(".source-list article").first();
  await firstSource
    .getByRole("button", { name: "Apagar arquivo", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "apaga somente o arquivo selecionado",
  );
  await expect(
    page.getByRole("button", { name: "Cancelar", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Fontes do filme", exact: true }),
  ).toBeVisible();
  await expect(
    firstSource.getByRole("button", {
      name: "Apagar arquivo",
      exact: true,
    }),
  ).toBeEnabled();
  await firstSource
    .getByRole("button", { name: "Apagar arquivo", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmar exclusão do arquivo", exact: true })
    .click();
  await expect(firstSource).toContainText("Sem arquivo local disponível");
  await expect(
    firstSource.getByRole("button", {
      name: "Apagar arquivo",
      exact: true,
    }),
  ).toBeDisabled();
  for (let i = 0; i < 2; i++) {
    await page
      .locator(".source-list article")
      .first()
      .getByRole("button", { name: "Remover fonte", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Confirmar remoção da fonte", exact: true })
      .click();
    await expect(
      page.getByRole("dialog", { name: "Fontes do filme", exact: true }),
    ).toBeVisible();
  }
  await expect(page.getByRole("dialog")).toContainText(
    "Nenhuma fonte adicionada",
  );
  await page
    .getByLabel("Adicionar fonte")
    .selectOption("source:example-unknown");
  await page
    .getByRole("button", { name: "Adicionar fonte", exact: true })
    .click();
  await expect(page.locator(".source-list article")).toHaveCount(1);
  await expect(page.locator(".source-list article")).toContainText(
    "Não informado",
  );
  await page
    .locator(".source-list article")
    .getByRole("button", { name: "Remover fonte", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmar remoção da fonte", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Fontes do filme", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".source-list article")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Fechar fontes", exact: true }),
  ).toBeEnabled();

  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Fontes (0)", exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole("heading", { name: "Horizonte Azul", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Remover da biblioteca", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Remover da biblioteca", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Remover da biblioteca", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmar remoção", exact: true })
    .click();
  await expect(page.locator(".movie-card")).toHaveCount(3);
  await expect(page.locator(".movie-card").first()).toBeFocused();
});

test("lista e imagens com erro recuperam sem perder catálogo; provider não bloqueia detalhes", async ({
  page,
}) => {
  await enterMovies(page);
  await movieFixtures(page, "collection");
  await movieScenario(page, "list-error");
  await expect(page.getByRole("alert")).toContainText(
    "Sua coleção continua aqui",
  );
  await page
    .getByRole("button", { name: "Tentar novamente", exact: true })
    .click();
  await expect(page.getByRole("alert")).toBeVisible();
  await movieScenario(page, "image-error");
  await expect(page.locator(".movie-card")).toHaveCount(4);
  await expect(page.locator(".poster-fallback")).toHaveCount(4);
  await movieScenario(page, "provider-error");
  await page
    .getByRole("button", { name: "Abrir Horizonte Azul", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Atualizar dados", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "dados que você já tem continuam disponíveis",
  );
  await expect(
    page.getByRole("heading", { name: "Horizonte Azul", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Atualizar dados", exact: true }),
  ).toBeFocused();
});

test("gamepad virtual e Escape não duplicam navegação e diálogo retém foco", async ({
  page,
}) => {
  await enterMovies(page);
  const add = page.getByRole("button", {
    name: "Adicionar filme",
    exact: true,
  });
  await add.focus();
  await page.evaluate(() => {
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [
        { buttons: [{ pressed: true }, { pressed: false }], axes: [0, 0] },
      ],
    });
  });
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.evaluate(() =>
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [],
    }),
  );
  await page
    .getByRole("button", { name: "Criar manualmente", exact: true })
    .click();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(
        () => !!document.activeElement?.closest('[role="dialog"]'),
      ),
    ).toBe(true);
  }
  await page.evaluate(() =>
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [
        { buttons: [{ pressed: false }, { pressed: true }], axes: [0, 0] },
      ],
    }),
  );
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(
    page.getByRole("heading", { name: "Filmes", exact: true }),
  ).toBeVisible();
  await page.evaluate(() =>
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [],
    }),
  );
  await expect(add).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("heading", { name: "Minha biblioteca", exact: true }),
  ).toBeVisible();
});

test("gamepad ajusta fonte de exemplo e busca vazia permite cadastro manual", async ({
  page,
}) => {
  await enterMovies(page);
  await movieScenario(page, "search-empty");
  await page
    .getByRole("button", { name: "Adicionar filme", exact: true })
    .click();
  const source = page.getByLabel("Fonte inicial");
  await source.focus();
  await page.evaluate(() =>
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [{ buttons: [], axes: [1, 0] }],
    }),
  );
  await expect(source).toHaveValue("source:example-1080");
  await page.evaluate(() =>
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [],
    }),
  );
  await searchMovie(page);
  await expect(page.getByRole("status")).toContainText(
    "Nenhuma correspondência",
  );
  await page
    .getByRole("button", { name: "Criar manualmente", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Revisar filme", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("1080p.mkv");
  await saveMovie(page);
  await expect(
    page.getByRole("button", { name: "Fontes (1)", exact: true }),
  ).toBeVisible();
});

test("foco do controle continua visível após interação com mouse", async ({
  page,
}) => {
  await enterMovies(page);
  await movieFixtures(page, "collection");
  await page
    .getByRole("button", { name: "Abrir Horizonte Azul", exact: true })
    .click();
  await page.getByRole("button", { name: "Fontes (2)", exact: true }).click();
  const close = page.getByRole("button", {
    name: "Fechar diálogo",
    exact: true,
  });
  await expect(close).toBeFocused();
  await page.evaluate(() =>
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [{ buttons: [], axes: [1, 0] }],
    }),
  );
  await expect(page.locator(".movies-app")).toHaveAttribute(
    "data-input",
    "gamepad",
  );
  await expect(close).toHaveCSS("outline-style", "solid");
  await expect(close).toHaveCSS("outline-width", "3px");
  await page.evaluate(() =>
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [],
    }),
  );
});
