import { _electron, test, expect } from "@playwright/test";
import electron from "electron";
import path from "node:path";
import { enterSeries, openPack } from "./series.helpers";
test("M03 Electron macOS offline: revisão, temporada, arquivo e sessão", async ({
  browserName,
}, testInfo) => {
  const env = Object.fromEntries(
    Object.entries(process.env).filter(
      (entry): entry is [string, string] =>
        entry[0] !== "ELECTRON_RUN_AS_NODE" && entry[1] !== undefined,
    ),
  );
  const app = await _electron.launch({
    executablePath: electron as unknown as string,
    env,
    args: [
      path.resolve("apps/desktop/src/main/index.cjs"),
      `--user-data-dir=${testInfo.outputPath(`${browserName}-electron-user-data`)}`,
    ],
  });
  try {
    const page = await app.firstWindow();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.context().setOffline(true);
    await enterSeries(page, false);
    await openPack(page, "Temporada completa");
    await page
      .getByRole("button", { name: "Confirmar série", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Temporada 1 8 episódios", exact: true })
      .click();
    await page.getByRole("button", { name: /^E01 / }).click();
    await expect(page.getByRole("dialog")).toContainText(
      "Entre.Orbitas.S01E01.mkv",
    );
    await page.screenshot({
      path: "docs/milestones/M03-series/evidence/electron-episode.png",
    });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: /^E01 / })).toBeFocused();
    expect(page.url()).toMatch(/^file:/);
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => "require" in window)).toBe(false);
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Minha biblioteca", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Séries", exact: true }).click();
    await expect(page.getByText("Abrindo suas séries…")).toBeHidden();
    await expect(page.locator(".series-card")).toHaveCount(8);
    await expect
      .poll(() =>
        page
          .locator(".series-card img")
          .first()
          .evaluate((image) => (image as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
  } finally {
    await app.close();
  }
});
