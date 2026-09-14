import { test, expect } from "@playwright/test";
import { enterDiscovery, discoveryScenario } from "./discovery.helpers";

test("marca Ushark é visual e não participa da navegação", async ({ page }) => {
  await enterDiscovery(page);

  const expectStaticBrand = async (selector: string) => {
    const brand = page.locator(selector);
    await expect(brand).toHaveText("Ushark");
    await expect(brand).toHaveCSS("user-select", "none");
    expect(await brand.evaluate((element) => element.tagName)).toBe("SPAN");
    expect(
      await brand.evaluate((element) => (element as HTMLElement).tabIndex),
    ).toBe(-1);
  };

  await expectStaticBrand(".discovery-brand");
  await expect(page.getByRole("button", { name: "Ushark" })).toHaveCount(0);

  const navigation = page.getByRole("navigation", {
    name: "Navegação principal",
  });
  await navigation.getByRole("button", { name: "Filmes" }).click();
  await expectStaticBrand(".movies-brand");
  await expect(page.getByRole("button", { name: "Ushark" })).toHaveCount(0);

  await page
    .getByRole("navigation", { name: "Navegação principal" })
    .getByRole("button", { name: "Séries" })
    .click();
  await expectStaticBrand(".movies-brand");
  await expect(page.getByRole("button", { name: "Ushark" })).toHaveCount(0);
});

test("M04 Home usa navegação principal e trilhos horizontais por controle", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await enterDiscovery(page);
  await expect
    .poll(() =>
      page
        .locator(".discovery-hero-image")
        .evaluate((element) => (element as HTMLElement).style.backgroundImage),
    )
    .toContain("/movie-art/imdb/tt0816692-backdrop.jpg");
  const currentRail = page
    .locator(".discovery-section")
    .filter({
      has: page.getByRole("heading", { name: "Filmes para descobrir" }),
    })
    .locator(".discovery-row");
  await expect(currentRail.locator("img").first()).toHaveAttribute(
    "src",
    "./movie-art/imdb/tt0816692-backdrop.jpg",
  );
  const seriesRail = page
    .locator(".discovery-section")
    .filter({ has: page.getByRole("heading", { name: "Séries" }) })
    .locator(".discovery-row");
  await expect(seriesRail.locator("img").first()).toHaveAttribute(
    "src",
    "./series-art/imdb/tt0903747-backdrop.jpg",
  );
  const seriesHealth = seriesRail.locator(".torrent-health-badge").first();
  await expect(seriesHealth).toContainText("Média · Muito bom");
  await expect(seriesHealth.locator(".is-active")).toHaveCount(4);
  const movieHealth = currentRail.locator(".torrent-health-badge").first();
  await expect(movieHealth).toContainText("Excelente");
  await expect(movieHealth.locator(".is-active")).toHaveCount(5);
  await expect(
    seriesRail.locator(".discovery-card-copy").first(),
  ).toContainText("4K");
  await page.screenshot({
    fullPage: true,
    path: "docs/milestones/M04-home-search/evidence/imdb-home-1920.png",
  });
  await discoveryScenario(page, "editorial");
  await page.evaluate(() => window.scrollTo(0, 0));
  const navigation = page.getByRole("navigation", {
    name: "Navegação principal",
  });
  await expect(
    navigation.getByRole("button", { name: "Início" }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    navigation.getByRole("button", { name: "Filmes" }),
  ).toBeVisible();
  await expect(
    navigation.getByRole("button", { name: "Séries" }),
  ).toBeVisible();
  await expect(
    navigation.getByRole("button", { name: "Bibliotecas" }),
  ).toBeVisible();

  const rail = page
    .locator(".discovery-section")
    .filter({
      has: page.getByRole("heading", { name: "Filmes para descobrir" }),
    })
    .locator(".discovery-row");
  const cards = rail.locator(".discovery-card");
  await cards.first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(cards.nth(1)).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(cards.nth(4)).toBeFocused();
  await expect
    .poll(() => rail.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0);
});

test("M04 detalhe rico reúne sinopse, badges, ações próximas e trailer", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await enterDiscovery(page);

  const movieCard = page
    .locator(".discovery-section")
    .filter({
      has: page.getByRole("heading", { name: "Filmes para descobrir" }),
    })
    .locator(".discovery-card")
    .first();
  await movieCard.click();

  const detail = page.getByRole("main", { name: "Interestelar" });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    detail.getByRole("heading", { name: "Interestelar" }),
  ).toBeVisible();
  await expect(detail.getByRole("heading", { name: "Sinopse" })).toBeVisible();
  await expect(detail).toContainText("Exploradores atravessam o espaço");
  await expect(detail.locator(".discovery-detail-badges")).toContainText(
    "IMDb 8.7",
  );
  await expect(detail.locator(".discovery-detail-badges")).toContainText(
    "2h 49min",
  );
  await expect(detail.locator(".discovery-detail-badges")).toContainText("4K");
  await expect(
    detail.locator(".discovery-detail-badges .torrent-health-badge"),
  ).toContainText("Excelente");
  await expect(detail.locator(".discovery-genre-badges")).toContainText(
    "Ficção científica",
  );
  await expect(detail.locator(".discovery-detail-facts")).toHaveCount(0);
  await expect(
    detail.getByText("Título original", { exact: true }),
  ).toHaveCount(0);
  const movieRecommendations = detail.getByRole("region", {
    name: "Recomendados",
  });
  await expect(movieRecommendations).toBeVisible();
  expect(
    await detail
      .locator(".discovery-detail-hero")
      .evaluate((hero) =>
        hero.nextElementSibling?.classList.contains(
          "discovery-recommendations",
        ),
      ),
  ).toBe(true);

  const actions = detail.locator(".selection-launch > button");
  const synopsisHeading = detail.getByRole("heading", { name: "Sinopse" });
  await expect(actions).toHaveCount(4);
  await expect(actions.nth(0)).toHaveAccessibleName("Voltar");
  await expect(actions.nth(0)).toHaveText("");
  await expect(actions.nth(1)).toHaveAccessibleName(/^Assistir$|^Continuar de/);
  await expect(actions.nth(1)).toBeFocused();
  await expect(actions.nth(2)).toHaveAccessibleName("Trailer");
  const actionTops = await actions.evaluateAll((buttons) =>
    buttons.map((button) => Math.round(button.getBoundingClientRect().top)),
  );
  expect(Math.max(...actionTops) - Math.min(...actionTops)).toBeLessThanOrEqual(
    2,
  );
  expect(
    await detail
      .locator(".discovery-detail-actions")
      .evaluate((actionBlock) => {
        return actionBlock.parentElement?.classList.contains(
          "discovery-detail-hero-copy",
        );
      }),
  ).toBe(true);
  await expect(
    detail.locator(".discovery-detail-hero-overview").getByRole("heading", {
      name: "Sinopse",
    }),
  ).toBeVisible();
  expect((await synopsisHeading.boundingBox())!.x).toBeGreaterThan(
    (await actions.first().boundingBox())!.x,
  );
  expect(
    (await detail.getByRole("heading", { name: "Interestelar" }).boundingBox())!
      .y,
  ).toBeLessThan((await actions.first().boundingBox())!.y);
  await page.screenshot({
    path: "docs/milestones/M04-home-search/evidence/rich-movie-detail-1920.png",
  });

  await detail.getByRole("button", { name: "Trailer", exact: true }).click();
  await expect(detail.getByLabel("Trailer de Interestelar")).toBeVisible();
  await expect(
    detail.getByRole("button", { name: "Pausar trailer" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      detail
        .getByLabel("Progresso do trailer")
        .evaluate((progress: HTMLProgressElement) => progress.value),
    )
    .toBeGreaterThan(0);
  await page.screenshot({
    path: "docs/milestones/M04-home-search/evidence/rich-movie-trailer-1920.png",
  });
  await page.keyboard.press("Escape");
  await expect(detail.getByLabel("Trailer de Interestelar")).toHaveCount(0);
  await expect(detail).toBeVisible();
  await detail.getByRole("button", { name: "Voltar" }).click();
  await expect(detail).toBeHidden();
  await expect(movieCard).toBeFocused();

  const seriesCard = page
    .locator(".discovery-section")
    .filter({ has: page.getByRole("heading", { name: "Séries" }) })
    .locator(".discovery-card")
    .first();
  await seriesCard.click();
  await expect(
    page.getByRole("dialog").getByRole("heading", { name: "Breaking Bad" }),
  ).toBeVisible();
  await expect(
    page.getByRole("dialog").locator("[data-detail-primary-action]"),
  ).toBeFocused();
  const seriesDialog = page.getByRole("dialog");
  expect(
    (await seriesDialog
      .locator(".selection-launch > button")
      .first()
      .boundingBox())!.y,
  ).toBeLessThan(
    (await seriesDialog
      .getByRole("heading", { name: "Sinopse" })
      .boundingBox())!.y,
  );
  await expect(page.getByRole("dialog")).toContainText("2 temporadas");
  await expect(page.getByRole("dialog")).toContainText("6 episódios");
  await expect(
    page.getByRole("dialog").locator(".discovery-detail-badges"),
  ).toContainText("IMDb 9.5");
  await page.screenshot({
    path: "docs/milestones/M04-home-search/evidence/rich-series-detail-1920.png",
  });
  const recommendations = page
    .getByRole("dialog")
    .getByRole("region", { name: "Recomendados" });
  await expect(recommendations).toBeVisible();
  const recommendationCards = recommendations.locator(".discovery-rail-card");
  await expect(recommendationCards).toHaveCount(6);
  await expect(recommendationCards.first()).toHaveClass(
    /discovery-card.*discovery-rail-card/,
  );
  await expect(
    recommendationCards.first().locator(".discovery-card-media"),
  ).toBeVisible();
  await recommendations.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "docs/milestones/M04-home-search/evidence/rich-series-recommendations-1920.png",
  });
  const nextTitle = await recommendationCards
    .first()
    .locator("strong")
    .innerText();
  await recommendationCards.first().click();
  await expect(
    page.getByRole("dialog").locator(".discovery-detail-hero-copy h2"),
  ).toHaveText(nextTitle);
  await expect
    .poll(() => page.getByRole("dialog").evaluate((modal) => modal.scrollTop))
    .toBe(0);
  await expect(
    page.getByRole("dialog").locator("[data-detail-primary-action]"),
  ).toBeFocused();
});

test("M02 e M04 abrem filmes na mesma página canônica de detalhes", async ({
  page,
}) => {
  await enterDiscovery(page);
  const homeCard = page
    .locator(".discovery-section")
    .filter({
      has: page.getByRole("heading", { name: "Filmes para descobrir" }),
    })
    .locator(".discovery-card")
    .first();
  await homeCard.click();

  const homeDetail = page.getByRole("main", { name: "Interestelar" });
  await expect(
    homeDetail.locator("[data-detail-primary-action]"),
  ).toBeFocused();
  await expect(homeDetail).toHaveClass(
    "discovery-detail discovery-detail-page",
  );
  await expect(page).toHaveURL(/#\/content\/movie%3Alocal%3Aimdb-tt0816692$/);
  const homeBackdrop = await homeDetail
    .locator(".discovery-detail-hero .discovery-art img")
    .getAttribute("src");
  await homeDetail.getByRole("button", { name: "Voltar" }).click();
  await expect(homeCard).toBeFocused();

  await page
    .getByRole("navigation", { name: "Navegação principal" })
    .getByRole("button", { name: "Filmes", exact: true })
    .click();
  const moviesCard = page.locator(".movie-grid").getByRole("button", {
    name: "Abrir Interestelar",
    exact: true,
  });
  await moviesCard.click();

  const moviesDetail = page.getByRole("main", { name: "Interestelar" });
  await expect(
    moviesDetail.locator("[data-detail-primary-action]"),
  ).toBeFocused();
  await expect(moviesDetail).toHaveClass(
    "discovery-detail discovery-detail-page",
  );
  await expect(page).toHaveURL(/#\/content\/movie%3Alocal%3Aimdb-tt0816692$/);
  await expect(
    moviesDetail.locator(".discovery-detail-hero .discovery-art img"),
  ).toHaveAttribute("src", homeBackdrop ?? "");
  await expect(
    moviesDetail.getByRole("heading", { name: "Sinopse" }),
  ).toBeVisible();
  await expect(
    moviesDetail.getByRole("region", { name: "Recomendados" }),
  ).toBeVisible();
  await expect(
    moviesDetail.getByRole("button", { name: "Trailer", exact: true }),
  ).toBeVisible();
  await moviesDetail.locator("[data-movie-back]").click();
  await expect(moviesCard).toBeFocused();
});

test("M04 busca global consolida identidade, filtra e restaura foco", async ({
  page,
}) => {
  await enterDiscovery(page);
  await discoveryScenario(page, "editorial");
  await page.getByRole("button", { name: "Busca", exact: true }).click();
  const search = page.getByRole("textbox", { name: "Busca global" });
  const cards = page.locator(".discovery-results .discovery-card");
  await search.fill("blue horizon");
  await expect(cards).toHaveCount(1);
  await cards.first().click();
  const detailPage = page.getByRole("main", { name: "Horizonte Azul" });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(detailPage).toContainText("4K");
  await expect(
    detailPage.getByRole("button", { name: /Cinema em casa/ }),
  ).toHaveCount(2);
  await detailPage.getByRole("button", { name: /Continuar de/ }).click();
  await expect(page.getByLabel("Posição", { exact: true })).toHaveValue("3737");
  await page.keyboard.press("Escape");
  await expect(detailPage).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(cards.first()).toBeFocused();
  await expect(search).toHaveValue("blue horizon");
  await search.fill("horizonte");
  await expect(cards).toHaveCount(2);
  await page.getByRole("button", { name: "Favoritos", exact: true }).click();
  await expect(cards).toHaveCount(1);
  await page.getByLabel("Gênero", { exact: true }).selectOption("Aventura");
  await expect(cards).toHaveCount(1);
  await page
    .getByRole("button", { name: "Limpar filtros", exact: true })
    .click();
  await search.fill("cinema em casa");
  await expect(cards).toHaveCount(5);
  await search.fill("histórias de sábado");
  await expect(cards).toHaveCount(5);
  await search.fill("entre orbitas s01e01");
  await expect(cards).toHaveCount(1);
  await page.getByLabel("Tipo", { exact: true }).selectOption("movie");
  await expect(cards).toHaveCount(0);
  await expect(page.getByText("Nenhuma história por aqui")).toBeVisible();
});

test("M04 10000 itens, falha de página, retry e resposta antiga", async ({
  page,
}) => {
  await enterDiscovery(page);
  await discoveryScenario(page, "large");
  await page.getByRole("button", { name: "Busca", exact: true }).click();
  const cards = page.locator(".discovery-results .discovery-card");
  await expect(cards).toHaveCount(24);
  await page
    .getByRole("textbox", { name: "Busca global" })
    .fill("história 09999");
  await expect(cards).toHaveCount(1);
  await expect(cards).toContainText("09999");
  await page.getByRole("button", { name: "Limpar busca", exact: true }).click();
  await expect(cards).toHaveCount(24);
  await page
    .getByRole("button", { name: "Falhar próxima página", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Próxima página", exact: true })
    .click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(cards.first()).toContainText("Horizonte Azul");
  await expect(
    page.getByText("Página 1 de 417", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Tentar novamente", exact: true })
    .click();
  await expect(cards.first()).toContainText("00024");
  await expect(cards.first()).toBeFocused();
  await cards.nth(5).click();
  await page.keyboard.press("Escape");
  await expect(cards.nth(5)).toBeFocused();
  await expect(
    page.getByText("Página 2 de 417", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Cenário da Home").selectOption("slow");
  const search = page.getByRole("textbox", { name: "Busca global" });
  await search.fill("ho");
  await search.fill("papel");
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText("Noite de Papel");
  await page.waitForTimeout(1000);
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText("Noite de Papel");
});

test("M04 teclado TV cancela rascunho, aplica e prende foco", async ({
  page,
}) => {
  await enterDiscovery(page);
  await discoveryScenario(page, "editorial");
  await page.getByRole("button", { name: "Busca", exact: true }).click();
  const trigger = page.getByRole("button", { name: "Abrir teclado na tela" });
  await trigger.click();
  await page.getByRole("button", { name: "Z", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(page.getByRole("textbox", { name: "Busca global" })).toHaveValue(
    "",
  );
  await trigger.click();
  for (const letter of "PAPEL")
    await page
      .getByRole("dialog")
      .getByRole("button", { name: letter, exact: true })
      .click();
  for (let i = 0; i < 45; i++) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(
        () => !!document.activeElement?.closest('[role="dialog"]'),
      ),
    ).toBe(true);
  }
  await page
    .getByRole("button", { name: "Concluir busca", exact: true })
    .click();
  await expect(page.getByRole("textbox", { name: "Busca global" })).toHaveValue(
    "PAPEL",
  );
  await expect(page.locator(".discovery-results .discovery-card")).toHaveCount(
    1,
  );
  await expect(trigger).toBeFocused();
});

test("M04 hydration conserva nó/foco e remoção recupera resultado", async ({
  page,
}) => {
  await enterDiscovery(page);
  await discoveryScenario(page, "hydration");
  await page.getByRole("button", { name: "Busca", exact: true }).click();
  const cards = page.locator(".discovery-results .discovery-card");
  await cards.first().focus();
  await cards.first().evaluate((el) => {
    (window as unknown as { focusedCard: Element }).focusedCard = el;
  });
  await expect(cards.first().locator("img")).toBeVisible();
  expect(
    await cards
      .first()
      .evaluate(
        (el) =>
          el === (window as unknown as { focusedCard: Element }).focusedCard,
      ),
  ).toBe(true);
  await expect(cards.first()).toBeFocused();
  await cards.first().click();
  await page.getByText("Cenários do detalhe", { exact: true }).click();
  await page
    .getByRole("button", {
      name: "Simular remoção deste conteúdo",
      exact: true,
    })
    .click();
  await expect(page.locator(".discovery-detail-page")).toBeHidden();
  await expect(cards).toHaveCount(6);
  await expect(cards.first()).toBeFocused();
  await expect(cards.first()).toContainText("1998");
  await page
    .getByRole("button", { name: "Simular alteração externa", exact: true })
    .click();
  await expect(cards.first()).toContainText("Uma nova história");
});

test("M04 offline, origem, coleção, sem source e recuperação de erro", async ({
  page,
}) => {
  await enterDiscovery(page);
  await discoveryScenario(page, "offline");
  await page.context().setOffline(true);
  await page.getByRole("button", { name: /Histórias de sábado/ }).click();
  await expect(
    page.getByRole("heading", { name: "Histórias de sábado", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".discovery-results .discovery-card")).toHaveCount(
    5,
  );
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Busca", exact: true }).click();
  await page.getByRole("textbox", { name: "Busca global" }).fill("entre marés");
  await expect(page.locator(".discovery-results .discovery-card")).toHaveCount(
    1,
  );
  await page.locator(".discovery-results .discovery-card").click();
  await expect(page.locator(".discovery-detail-page")).toContainText(
    "Nenhuma fonte disponível",
  );
  await page.keyboard.press("Escape");
  await page.getByLabel("Cenário da Home").selectOption("error");
  await expect(page.getByRole("alert")).toBeVisible();
  await page
    .getByRole("button", { name: "Tentar novamente", exact: true })
    .click();
  await expect(page.getByRole("alert")).toBeHidden();
  await expect(page.locator(".discovery-results .discovery-card")).toHaveCount(
    7,
  );
});
