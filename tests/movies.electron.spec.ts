import { _electron, expect, test } from "@playwright/test";
import electron from "electron";
import path from "node:path";

// Some IDE hosts export Node mode; the test must launch the desktop runtime.
const electronEnv = Object.fromEntries(
  Object.entries(process.env).filter(
    (entry): entry is [string, string] =>
      entry[0] !== "ELECTRON_RUN_AS_NODE" && entry[1] !== undefined,
  ),
);
import { enterMovies } from "./movies.helpers";

test("M02 Electron empacotado: filme manual persiste offline, favorito e retorno à Home", async ({
  browserName,
}, testInfo) => {
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
    await enterMovies(page, false, true);
    await expect(
      page.getByRole("heading", {
        name: "Sua próxima história começa aqui.",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.locator(".movie-preview-tools")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Importar torrent ou magnet" }),
    ).toBeVisible();
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
      .fill("Um filme salvo no catálogo local.");
    await page
      .getByRole("button", { name: "Revisar filme", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Confirmar filme", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Cinema Persistente", exact: true }),
    ).toBeVisible();
    expect(page.url()).toMatch(/^file:/);
    await page.getByRole("button", { name: "Favoritar", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Favoritado", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.screenshot({
      path: "docs/milestones/M02-movies/evidence/electron-details.png",
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Todos os filmes", exact: true })
      .click();
    await page.getByRole("button", { name: "Início", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Minha biblioteca", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Ver meus filmes", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Abrir Cinema Persistente", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Favoritado", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => "require" in window)).toBe(false);
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Minha biblioteca", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Começar", exact: true }),
    ).toHaveCount(0);
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
    await page.getByRole("button", { name: "Filmes", exact: true }).click();
    await expect(
      page.getByRole("button", {
        name: "Abrir Cinema Persistente",
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Abrir Cinema Persistente", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Favoritado", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByText("Um filme salvo no catálogo local."),
    ).toBeVisible();
  } finally {
    await reopened.close();
  }
});
