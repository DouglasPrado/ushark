import { test, expect } from "@playwright/test";
import { MockConfigurationService, initial } from "@ushark/mocks";
import {
  gamepadAction,
  remoteActionForKey,
} from "../apps/desktop/src/renderer/app/navigation";

test("percurso, validação, rascunho, falha e retry, reset seletivo", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Começar", exact: true }).click();
  await page.getByLabel("Nome da biblioteca").fill("Minha cinemateca");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByLabel("Limite do cache").fill("0");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("limite inteiro");
  await page.getByLabel("Limite do cache").fill("250");
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await expect(page.getByLabel("Nome da biblioteca")).toHaveValue(
    "Minha cinemateca",
  );
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByLabel("Limite do cache")).toHaveValue("250");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page
    .getByRole("button", { name: "Melhor qualidade", exact: true })
    .click();
  await page.getByLabel("Cenário de teste").selectOption("error");
  await page.getByRole("button", { name: "Abrir minha biblioteca" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Não foi possível salvar",
  );
  await page.getByLabel("Cenário de teste").selectOption("offline");
  await page.getByRole("button", { name: "Abrir minha biblioteca" }).click();
  await expect(
    page.getByRole("heading", { name: "Minha cinemateca" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Interestelar", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ajustar preferências" }).click();
  await page
    .getByRole("button", { name: "Restaurar preferências", exact: true })
    .click();
  await page.getByRole("button", { name: "Restaurar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Melhor equilíbrio" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Limite do cache")).toHaveValue("250");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Minha biblioteca", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Começar", exact: true }),
  ).toHaveCount(0);
});
test("seletor simulado prende foco e restaura origem", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Começar", exact: true }).click();
  const trigger = page.getByRole("button", { name: "Escolher pasta" });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(
        () => !!document.activeElement?.closest("[role=dialog]"),
      ),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole("button", { name: "D:\\Cinema\\Library" }).click();
  await expect(trigger).toBeFocused();
  await expect(page.getByText("D:\\Cinema\\Library")).toBeVisible();
});
test("pasta inacessível e salvamento lento preservam percurso", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Começar", exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByLabel("Cenário de teste").selectOption("folder-error");
  await page.getByRole("button", { name: "Abrir minha biblioteca" }).click();
  await expect(page.getByRole("alert")).toContainText("acessar a pasta");
  await page.getByLabel("Cenário de teste").selectOption("loading");
  await page.getByRole("button", { name: "Abrir minha biblioteca" }).click();
  await expect(
    page.getByRole("button", { name: "Preparando…" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("heading", { name: "Minha biblioteca" }),
  ).toBeVisible();
});
test("reset do adapter preserva dados pessoais, paths e cache", async () => {
  const service = new MockConfigurationService();
  const data = structuredClone(service.personalData);
  await service.save({
    ...initial,
    name: "Filmes",
    cacheGB: 450,
    preferences: { ...initial.preferences, strategy: "quality" },
  });
  const reset = await service.resetPlayback();
  expect(reset.configuration.cacheGB).toBe(450);
  expect(reset.configuration.name).toBe("Filmes");
  expect(reset.configuration.preferences.strategy).toBe("balanced");
  expect(service.personalData).toEqual(data);
});
test("controle mapeia botões/analógico e retorna ao soltar", () => {
  const pad = {
    buttons: Array.from({ length: 16 }, () => ({
      pressed: false,
      touched: false,
      value: 0,
    })),
    axes: [0, 0],
  };
  expect(gamepadAction(pad)).toBeNull();
  pad.buttons[0].pressed = true;
  expect(gamepadAction(pad)).toBe("confirm");
  pad.buttons[0].pressed = false;
  pad.axes[1] = -0.8;
  expect(gamepadAction(pad)).toBe("up");
  pad.buttons[1].pressed = true;
  expect(gamepadAction(pad)).toBe("back");
  expect(remoteActionForKey("ArrowRight")).toBe("right");
  expect(remoteActionForKey("Enter")).toBe("confirm");
  expect(remoteActionForKey("BrowserBack")).toBe("back");
  expect(remoteActionForKey("Unidentified", 10009)).toBe("back");
  expect(remoteActionForKey("AudioVolumeUp")).toBeNull();
});
test("setas navegam com foco visível e controle virtual confirma", async ({
  page,
}) => {
  await page.goto("/");
  const start = page.getByRole("button", { name: "Começar", exact: true });
  await expect(start).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByLabel("Cenário de teste")).toBeFocused();
  await start.focus();
  await page.evaluate(() => {
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [
        { buttons: [{ pressed: true }, { pressed: false }], axes: [0, 0] },
      ],
    });
  });
  await expect(page.getByLabel("Nome da biblioteca")).toBeVisible();
  await page.evaluate(() =>
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [],
    }),
  );
});

test("navegação local observa p95 e frame pacing sem rede", async ({
  page,
}, testInfo) => {
  await page.addInitScript(() =>
    window.localStorage.setItem("ushark.onboarding.completed.v1", "true"),
  );
  await page.goto("/");
  const metrics = await page.evaluate(async () => {
    const memory = () =>
      (
        performance as Performance & {
          memory?: { usedJSHeapSize: number };
        }
      ).memory?.usedJSHeapSize ?? null;
    const heapBefore = memory();
    const frame = () =>
      new Promise<number>((resolve) => requestAnimationFrame(resolve));
    const transitions: number[] = [];
    for (let index = 0; index < 50; index++) {
      const label = index % 2 === 0 ? "Ajustar preferências" : "Voltar";
      const button = [...document.querySelectorAll("button")].find(
        (candidate) =>
          candidate.getAttribute("aria-label") === label ||
          candidate.textContent?.trim() === label,
      );
      if (!button) throw new Error(`Ação local ausente: ${label}`);
      const started = performance.now();
      button.click();
      await frame();
      await frame();
      transitions.push(performance.now() - started);
    }
    const frameDeltas: number[] = [];
    let previous = await frame();
    for (let index = 0; index < 60; index++) {
      const current = await frame();
      frameDeltas.push(current - previous);
      previous = current;
    }
    const percentile95 = (values: number[]) =>
      [...values].sort((a, b) => a - b)[Math.ceil(values.length * 0.95) - 1];
    const heapAfter = memory();
    return {
      transitionP95Ms: percentile95(transitions),
      frameP95Ms: percentile95(frameDeltas),
      heapBeforeBytes: heapBefore,
      heapAfterBytes: heapAfter,
      heapGrowthBytes:
        heapBefore === null || heapAfter === null
          ? null
          : heapAfter - heapBefore,
    };
  });
  testInfo.annotations.push({
    type: "M01 local metrics",
    description: JSON.stringify(metrics),
  });
  expect(metrics.transitionP95Ms).toBeLessThan(100);
  expect(metrics.frameP95Ms).toBeLessThan(100);
  if (metrics.heapGrowthBytes !== null)
    expect(metrics.heapGrowthBytes).toBeLessThan(64 * 1024 * 1024);
});

for (const [width, height] of [
  [1920, 1080],
  [2560, 1440],
  [3840, 2160],
])
  test(`layout ${width} sem overflow horizontal`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Começar", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `docs/milestones/M01-onboarding/evidence/welcome-${width}.png`,
    });
  });
