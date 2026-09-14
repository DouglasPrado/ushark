import { _electron, expect, test } from "@playwright/test";
import electron from "electron";
import path from "node:path";
import { enterDiscovery } from "./discovery.helpers";

const electronEnv = Object.fromEntries(
  Object.entries(process.env).filter(
    (entry): entry is [string, string] =>
      entry[0] !== "ELECTRON_RUN_AS_NODE" && entry[1] !== undefined,
  ),
);

test("M04 Electron: catálogo real atualiza a Home, busca offline e persiste no reinício", async ({
  browserName,
}, testInfo) => {
  test.setTimeout(60_000);
  const args = [
    path.resolve("apps/desktop/src/main/index.cjs"),
    `--user-data-dir=${testInfo.outputPath(`${browserName}-electron-user-data`)}`,
  ];
  const app = await _electron.launch({
    executablePath: electron as unknown as string,
    env: electronEnv,
    args,
  });
  try {
    const page = await app.firstWindow();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.context().setOffline(true);
    await enterDiscovery(page, false);
    await expect(page.locator(".discovery-footer")).toContainText(
      "Catálogo local persistido",
    );
    await expect(
      page.getByText("Cenários da prévia", { exact: true }),
    ).toHaveCount(0);

    await page.getByRole("button", { name: "Filmes", exact: true }).click();
    await page
      .getByRole("button", { name: "Adicionar filme", exact: true })
      .click();
    await page
      .getByLabel("Título do filme", { exact: true })
      .fill("Cinema Persistente");
    await page
      .getByRole("button", { name: "Buscar filme", exact: true })
      .click();
    await expect(page.getByRole("alert")).toContainText("token TMDB");
    await page
      .getByRole("button", { name: "Criar manualmente", exact: true })
      .click();
    await page.getByLabel("Título", { exact: true }).fill("Cinema Persistente");
    await page.getByLabel("Ano (opcional)").fill("2026");
    await page
      .getByLabel("Sinopse (opcional)")
      .fill("Um filme encontrado pelo índice local persistente.");
    await page
      .getByRole("button", { name: "Revisar filme", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Confirmar filme", exact: true })
      .click();

    await page
      .getByRole("button", { name: "Todos os filmes", exact: true })
      .click();
    await page.getByRole("button", { name: "Início", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Cinema Persistente", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Busca", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Busca global" })
      .fill("cinema persistente");
    await expect(
      page.locator(".discovery-results .discovery-card"),
    ).toHaveCount(1);
    await page.locator(".discovery-results .discovery-card").click();
    await expect(page.locator(".discovery-detail-page")).toContainText(
      "Um filme encontrado pelo índice local persistente.",
    );
    await expect(page.locator(".torrent-health-badge")).toHaveCount(0);
    await page.screenshot({
      path: "docs/milestones/M04-home-search/evidence/electron-real-search.png",
      fullPage: true,
    });
    expect(errors).toEqual([]);
    expect(page.url()).toMatch(/^file:/);
    expect(await page.evaluate(() => "require" in window)).toBe(false);
  } finally {
    await app.close();
  }

  const reopened = await _electron.launch({
    executablePath: electron as unknown as string,
    env: electronEnv,
    args,
  });
  try {
    const page = await reopened.firstWindow();
    await page.context().setOffline(true);
    await expect(
      page.getByRole("heading", { name: "Minha biblioteca", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Cinema Persistente", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Busca", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Busca global" })
      .fill("persistente");
    await expect(
      page.locator(".discovery-results .discovery-card"),
    ).toHaveCount(1);
  } finally {
    await reopened.close();
  }
});
