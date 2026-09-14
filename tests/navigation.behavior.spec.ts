import { expect, test } from "@playwright/test";
import { enterDiscovery } from "./discovery.helpers";

const virtualPad = async (
  page: import("@playwright/test").Page,
  action: "right" | "confirm" | "back" | "release",
) => {
  await page.evaluate((nextAction) => {
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => {
        if (nextAction === "release") return [];
        const buttons = Array.from({ length: 16 }, () => ({
          pressed: false,
          touched: false,
          value: 0,
        }));
        if (nextAction === "confirm") buttons[0].pressed = true;
        if (nextAction === "back") buttons[1].pressed = true;
        return [
          {
            buttons,
            axes: [nextAction === "right" ? 1 : 0, 0],
          },
        ];
      },
    });
  }, action);
};

test("controle remoto navega o trilho, confirma e restaura o foco", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await enterDiscovery(page);
  const rail = page
    .locator(".discovery-section")
    .filter({ has: page.getByRole("heading", { name: "Séries" }) })
    .locator(".discovery-row");
  const cards = rail.locator(".discovery-card");
  await cards.first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(cards.nth(1)).toBeFocused();
  await expect(page.locator(".discovery-app")).toHaveAttribute(
    "data-input",
    "remote",
  );
  const movieCards = page
    .locator(".discovery-section")
    .filter({
      has: page.getByRole("heading", { name: "Filmes para descobrir" }),
    })
    .locator(".discovery-card");
  await page.keyboard.press("ArrowUp");
  await expect(movieCards.nth(1)).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(cards.nth(1)).toBeFocused();

  await page.evaluate(() =>
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    ),
  );
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.evaluate(() =>
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "BrowserBack", bubbles: true }),
    ),
  );
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(cards.nth(1)).toBeFocused();
});

test("navegar para o primeiro botão restaura o topo da tela", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await enterDiscovery(page);
  const navigation = page.getByRole("navigation", {
    name: "Navegação principal",
  });
  const home = navigation.getByRole("button", { name: "Início" });
  const movies = navigation.getByRole("button", { name: "Filmes" });

  await movies.evaluate((element) =>
    (element as HTMLElement).focus({ preventScroll: true }),
  );
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );
  await page.waitForFunction(() => window.scrollY > 200);

  await page.keyboard.press("ArrowLeft");

  await expect(home).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test("direcional segurado repete suavemente sem repetir confirmação", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await enterDiscovery(page);
  const rail = page
    .locator(".discovery-section")
    .filter({
      has: page.getByRole("heading", { name: "Filmes para descobrir" }),
    })
    .locator(".discovery-row");
  const cards = rail.locator(".discovery-card");
  await cards.first().focus();
  await virtualPad(page, "right");
  await expect
    .poll(() =>
      cards.evaluateAll((items) =>
        items.findIndex((item) => item === document.activeElement),
      ),
    )
    .toBeGreaterThanOrEqual(3);
  await virtualPad(page, "release");
  const focused = await page.evaluate(
    () => (document.activeElement as HTMLElement)?.dataset.contentId,
  );
  expect(focused).toBeTruthy();
  await expect(page.locator(".discovery-app")).toHaveAttribute(
    "data-input",
    "gamepad",
  );

  await page.screenshot({
    path: "docs/milestones/M01-onboarding/evidence/fluid-navigation-home-1920.png",
  });
  await virtualPad(page, "confirm");
  await expect(page.locator(".discovery-detail-page")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.waitForTimeout(180);
  await virtualPad(page, "release");
  await virtualPad(page, "back");
  await expect(page.locator(".discovery-detail-page")).toBeHidden();
  await virtualPad(page, "release");
  await expect(rail.locator(`[data-content-id="${focused}"]`)).toBeFocused();
});
