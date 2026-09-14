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
          };
        };
        const prefs = contents.getLastWebPreferences();
        return {
          bounds: window.getBounds(),
          display: screen.getDisplayMatching(window.getBounds()).bounds,
          sandbox: prefs.sandbox,
          contextIsolation: prefs.contextIsolation,
          nodeIntegration: prefs.nodeIntegration,
        };
      });
      expect(state).toMatchObject({
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
      });
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
  try {
    const page = await firstRun.firstWindow();
    await page.getByRole("button", { name: "Começar", exact: true }).click();
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await page.getByRole("button", { name: "Abrir minha biblioteca" }).click();
    await expect(
      page.getByRole("heading", { name: "Minha biblioteca", exact: true }),
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
      page.getByRole("heading", { name: "Minha biblioteca", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Começar", exact: true }),
    ).toHaveCount(0);
  } finally {
    await reopened.close();
  }
});
