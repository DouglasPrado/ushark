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

for (const tv of [false, true]) {
  test(`Electron ${tv ? "TV" : "janela"}: isolamento e onboarding offline`, async ({
    browserName,
  }, testInfo) => {
    const app = await _electron.launch({
      executablePath: electron as unknown as string,
      env: electronEnv,
      args: [
        path.resolve("apps/desktop/src/main/index.cjs"),
        `--user-data-dir=${testInfo.outputPath(`${browserName}-electron-user-data`)}`,
        ...(tv ? ["--tv"] : []),
      ],
    });
    try {
      const page = await app.firstWindow();
      const requestedUrls: string[] = [];
      page.on("request", (request) => requestedUrls.push(request.url()));
      await expect(
        page.getByRole("button", { name: "Começar", exact: true }),
      ).toBeVisible();
      await expect
        .poll(() =>
          app.evaluate(({ BrowserWindow }) => {
            const window = BrowserWindow.getAllWindows()[0];
            return process.platform === "darwin"
              ? window.isSimpleFullScreen()
              : window.isFullScreen();
          }),
        )
        .toBe(tv);
      const state = await app.evaluate(({ BrowserWindow, screen }) => {
        const window = BrowserWindow.getAllWindows()[0];
        const contents = window.webContents as typeof window.webContents & {
          getLastWebPreferences(): {
            sandbox?: boolean;
            contextIsolation?: boolean;
            nodeIntegration?: boolean;
            webSecurity?: boolean;
          };
        };
        const prefs = contents.getLastWebPreferences();
        return {
          bounds: window.getBounds(),
          display: screen.getDisplayMatching(window.getBounds()).bounds,
          sandbox: prefs.sandbox,
          contextIsolation: prefs.contextIsolation,
          nodeIntegration: prefs.nodeIntegration,
          webSecurity: prefs.webSecurity,
          devToolsOpened: contents.isDevToolsOpened(),
        };
      });
      expect(state).toMatchObject({
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        webSecurity: true,
        devToolsOpened: false,
      });
      await expect(
        page.locator('meta[http-equiv="Content-Security-Policy"]'),
      ).toHaveAttribute("content", /default-src 'self'/);
      expect(
        await page.evaluate(() => window.open("https://example.com")),
      ).toBeNull();
      if (tv) expect(state.bounds).toEqual(state.display);
      await page.context().setOffline(true);
      await page.getByRole("button", { name: "Começar", exact: true }).click();
      await page
        .getByRole("button", { name: "Continuar", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Continuar", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Abrir minha biblioteca" })
        .click();
      await expect(
        page.getByRole("heading", { name: "Minha biblioteca", exact: true }),
      ).toBeVisible();
      await page.reload();
      await expect(
        page.getByRole("heading", { name: "Minha biblioteca", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Começar", exact: true }),
      ).toHaveCount(0);
      if (tv) {
        await expect(page.locator(".discovery-app")).toHaveAttribute(
          "data-tv-mode",
          "true",
        );
        for (const name of ["Bibliotecas", "Downloads", "Ajustar preferências"])
          await expect(
            page.getByRole("button", { name, exact: true }),
          ).toHaveCount(0);
        await page.getByRole("button", { name: "Filmes", exact: true }).click();
        await expect(
          page.getByRole("button", { name: "Adicionar filme", exact: true }),
        ).toHaveCount(0);
        await expect(
          page.getByRole("button", { name: "Importar torrent ou magnet" }),
        ).toHaveCount(0);
      } else {
        await page
          .getByRole("button", { name: "Ajustar preferências" })
          .click();
        await page.keyboard.press("Escape");
        await expect(
          page.getByRole("heading", { name: "Minha biblioteca", exact: true }),
        ).toBeVisible();
      }
      expect(
        requestedUrls.every(
          (url) => url.startsWith("file:") || url.startsWith("data:"),
        ),
      ).toBe(true);
    } finally {
      await app.close();
    }
  });
}

test("Electron reabre na Home depois do onboarding concluído", async ({
  browserName,
}, testInfo) => {
  const args = [
    path.resolve("apps/desktop/src/main/index.cjs"),
    `--user-data-dir=${testInfo.outputPath(`${browserName}-electron-user-data`)}`,
  ];
  const firstRun = await _electron.launch({
    executablePath: electron as unknown as string,
    env: electronEnv,
    args,
  });
  let selectedLibraryPath: string;
  try {
    const page = await firstRun.firstWindow();
    expect(
      await page.evaluate(() => ({
        root: Object.keys(window.ushark ?? {}).sort(),
        configuration: Object.keys(window.ushark?.configuration ?? {}).sort(),
        discovery: Object.keys(window.ushark?.discovery ?? {}).sort(),
        movieCatalog: Object.keys(window.ushark?.movieCatalog ?? {}).sort(),
        playback: Object.keys(window.ushark?.playback ?? {}).sort(),
        seriesCatalog: Object.keys(window.ushark?.seriesCatalog ?? {}).sort(),
        torrentInspection: Object.keys(
          window.ushark?.torrentInspection ?? {},
        ).sort(),
      })),
    ).toEqual({
      root: [
        "appUpdate",
        "configuration",
        "diagnostics",
        "discovery",
        "downloads",
        "fallback",
        "libraryDrafts",
        "libraryFork",
        "libraryPackage",
        "libraryPublish",
        "libraryTrust",
        "movieCatalog",
        "nextEpisode",
        "playback",
        "recovery",
        "seriesCatalog",
        "sourceSelection",
        "storage",
        "stream",
        "subscriptions",
        "torrentInspection",
        "tvSession",
      ],
      configuration: [
        "chooseDirectory",
        "protocolVersion",
        "read",
        "resetPlayback",
        "save",
      ],
      discovery: [
        "cancelRequest",
        "protocolVersion",
        "readHome",
        "readScope",
        "rebuildSearchIndex",
        "search",
        "subscribe",
      ],
      movieCatalog: [
        "addSource",
        "cancelMetadataRequest",
        "deleteManagedFile",
        "protocolVersion",
        "read",
        "refreshMetadata",
        "removeMembership",
        "removeSource",
        "save",
        "searchMetadata",
        "toggleFavorite",
      ],
      playback: [
        "cancelPreparation",
        "chooseExternalSubtitle",
        "prepare",
        "protocolVersion",
        "readProgress",
        "readSession",
        "seek",
        "selectAudio",
        "selectSubtitle",
        "setMuted",
        "setPaused",
        "setVolume",
        "start",
        "stop",
        "subscribe",
      ],
      seriesCatalog: [
        "beginReview",
        "cancelMetadataRequest",
        "confirmImport",
        "correctMapping",
        "protocolVersion",
        "readCatalog",
        "readEpisodes",
        "readReview",
        "readSeries",
        "readSourceReview",
        "refreshMetadata",
        "searchMetadata",
        "setEpisodeArtwork",
      ],
      torrentInspection: [
        "cancel",
        "capabilities",
        "chooseTorrentFile",
        "confirm",
        "get",
        "getFiles",
        "listPending",
        "protocolVersion",
        "removePending",
        "retry",
        "savePending",
        "start",
        "subscribe",
      ],
    });
    await page.getByRole("button", { name: "Começar", exact: true }).click();
    await page.getByLabel("Nome da biblioteca").fill("Cinema persistente");
    selectedLibraryPath = await firstRun.evaluate(({ app, dialog }) => {
      const selected = `${app.getPath("userData")}/selected-library`;
      dialog.showOpenDialog = async () => ({
        canceled: false,
        filePaths: [selected],
        bookmarks: [],
      });
      return selected;
    });
    await page.getByRole("button", { name: "Escolher pasta" }).click();
    await expect(page.getByText(selectedLibraryPath)).toBeVisible();
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await page.getByLabel("Limite do cache").fill("321");
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await page
      .getByRole("button", { name: "Melhor qualidade", exact: true })
      .click();
    await page.getByRole("button", { name: "Abrir minha biblioteca" }).click();
    await expect(
      page.getByRole("heading", { name: "Cinema persistente", exact: true }),
    ).toBeVisible();
  } finally {
    await firstRun.close();
  }

  const reopened = await _electron.launch({
    executablePath: electron as unknown as string,
    env: electronEnv,
    args,
  });
  try {
    const page = await reopened.firstWindow();
    await expect(
      page.getByRole("heading", { name: "Cinema persistente", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Começar", exact: true }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Ajustar preferências" }).click();
    await expect(
      page.getByRole("button", { name: "Melhor qualidade", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByLabel("Limite do cache")).toHaveValue("321");
    await expect(page.getByText(selectedLibraryPath)).toBeVisible();
    await expect(page.getByText("salvas neste dispositivo")).toBeVisible();
  } finally {
    await reopened.close();
  }
});
