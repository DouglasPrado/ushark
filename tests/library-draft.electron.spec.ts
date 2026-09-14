import { _electron, expect, test } from "@playwright/test";
import electron from "electron";
import fs from "node:fs";
import path from "node:path";
import type { Configuration } from "@ushark/types";

const { ConfigurationStore } = require("@ushark/core/configuration");
const { MovieCatalogStore } = require("@ushark/core/movies");

test("M12 Electron salva, reabre e renderiza preview persistido", async ({
  browserName,
}, testInfo) => {
  test.setTimeout(45_000);
  const userData = testInfo.outputPath(`${browserName}-draft-user-data`);
  const databasePath = path.join(userData, "ushark.db");
  fs.mkdirSync(userData, { recursive: true });
  const configuration = new ConfigurationStore(
    databasePath,
    path.join(userData, "managed"),
  );
  const initial = configuration.read().configuration as Configuration;
  const savedConfig = configuration.save(
    {
      ...initial,
      libraryPath: testInfo.outputPath("library"),
      cachePath: testInfo.outputPath("cache"),
    },
    { completeOnboarding: true },
  ).configuration as Configuration;
  configuration.close();
  const movies = new MovieCatalogStore(databasePath);
  const savedMovie = movies.save({
    libraryId: savedConfig.libraryId,
    draft: {
      metadata: {
        id: "movie:curation:electron",
        title: "Filme Real",
        synopsis: "Catálogo persistido",
        genres: [],
        cast: [],
      },
      source: {
        id: "source:curation:electron",
        name: "filme-real.mkv",
        availability: "unavailable",
        fileAvailable: false,
      },
    },
    mutation: { idempotencyKey: "curation-electron-seed" },
  });
  if (!savedMovie.ok) throw new Error(savedMovie.error.message);
  movies.close();
  const env = Object.fromEntries(
    Object.entries(process.env).filter(
      (entry): entry is [string, string] =>
        entry[0] !== "ELECTRON_RUN_AS_NODE" && entry[1] !== undefined,
    ),
  );
  const launch = () =>
    _electron.launch({
      executablePath: electron as unknown as string,
      env,
      args: [
        path.resolve("apps/desktop/src/main/index.cjs"),
        `--user-data-dir=${userData}`,
      ],
    });
  const first = await launch();
  try {
    const page = await first.firstWindow();
    await page
      .getByRole("button", { name: "Bibliotecas", exact: true })
      .click();
    await page.getByRole("button", { name: "Criar biblioteca" }).click();
    await page
      .getByLabel("Nome da biblioteca", { exact: true })
      .fill("Curadoria Real");
    await page.getByRole("button", { name: "Conteúdos", exact: true }).click();
    await page.getByLabel("Filme Real", { exact: true }).check();
    await page
      .getByLabel("Título nesta biblioteca: Filme Real")
      .fill("Filme Curado");
    await page.getByRole("button", { name: "Coleções", exact: true }).click();
    await page.getByRole("button", { name: "Adicionar coleção" }).click();
    await page.getByLabel("Filme Curado", { exact: true }).check();
    await page.getByRole("button", { name: "Seções", exact: true }).click();
    await page.getByRole("button", { name: "Adicionar seção" }).click();
    await page.getByLabel("Título da seção 1").fill("Escolhas reais");
    await page.getByRole("button", { name: "Prévia", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Escolhas reais" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Filme Curado/ }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Salvar rascunho" }).click();
    await expect(page.getByRole("status")).toContainText("salvo localmente");
    await expect(page.getByText("Cenários de curadoria")).toHaveCount(0);
  } finally {
    await first.close();
  }
  const reopened = await launch();
  try {
    const page = await reopened.firstWindow();
    await page
      .getByRole("button", { name: "Bibliotecas", exact: true })
      .click();
    await page.getByRole("button", { name: "Editar Curadoria Real" }).click();
    await page.getByRole("button", { name: "Prévia", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Escolhas reais" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Filme Curado/ }),
    ).toBeVisible();
  } finally {
    await reopened.close();
  }
});
