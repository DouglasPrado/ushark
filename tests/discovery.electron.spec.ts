import { _electron, test, expect } from "@playwright/test";
import electron from "electron";
import path from "node:path";
import { enterDiscovery, discoveryScenario } from "./discovery.helpers";
test("M04 Electron macOS: busca offline e controle sintético no teclado TV", async ({
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
    await enterDiscovery(page, false);
    await discoveryScenario(page, "editorial");
    await page.getByRole("button", { name: "Busca", exact: true }).click();
    const trigger = page.getByRole("button", { name: "Abrir teclado na tela" });
    await expect(
      page.getByRole("textbox", { name: "Busca global" }),
    ).toBeFocused();
    await trigger.focus();
    await expect(trigger).toBeFocused();
    await page.evaluate(() => {
      const state = { button: -1 };
      (window as unknown as { padState: typeof state }).padState = state;
      Object.defineProperty(navigator, "getGamepads", {
        value: () => [
          {
            axes: [0, 0],
            buttons: Array.from({ length: 16 }, (_, i) => ({
              pressed: i === state.button,
              value: i === state.button ? 1 : 0,
              touched: false,
            })),
          },
        ],
        configurable: true,
      });
    });
    const press = async (button: number) => {
      await page.evaluate((b) => {
        (
          window as unknown as { padState: { button: number } }
        ).padState.button = b;
      }, button);
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      await page.evaluate(() => {
        (
          window as unknown as { padState: { button: number } }
        ).padState.button = -1;
      });
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
    };
    await press(0);
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "A", exact: true }).focus();
    await press(15);
    await expect(
      page.getByRole("button", { name: "B", exact: true }),
    ).toBeFocused();
    expect(
      await page
        .getByRole("button", { name: "B", exact: true })
        .evaluate((el) => getComputedStyle(el).outlineWidth),
    ).toBe("3px");
    await press(0);
    await expect(page.getByLabel("Texto do teclado")).toHaveText("B");
    await press(1);
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(trigger).toBeFocused();
    await page
      .getByRole("textbox", { name: "Busca global" })
      .fill("blue horizon");
    await expect(
      page.locator(".discovery-results .discovery-card"),
    ).toHaveCount(1);
    await page.locator(".discovery-results .discovery-card").click();
    await expect(page.locator(".discovery-detail-page")).toContainText("4K");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.screenshot({
      path: "docs/milestones/M04-home-search/evidence/electron-detail.png",
    });
    await press(1);
    await expect(page.locator(".discovery-detail-page")).toBeHidden();
    await expect(
      page.locator(".discovery-results .discovery-card"),
    ).toBeFocused();
    expect(errors).toEqual([]);
    expect(page.url()).toMatch(/^file:/);
    expect(await page.evaluate(() => "require" in window)).toBe(false);
  } finally {
    await app.close();
  }
});
