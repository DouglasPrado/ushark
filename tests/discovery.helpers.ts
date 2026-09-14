import { expect, type Page } from "@playwright/test";
export async function enterDiscovery(page: Page, navigate = true) {
  if (navigate) await page.goto("/?review=1");
  await page.getByRole("button", { name: "Começar", exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Abrir minha biblioteca" }).click();
  await expect(
    page.getByRole("heading", { name: "Minha biblioteca", exact: true }),
  ).toBeVisible();
}
export async function discoveryScenario(page: Page, scenario: string) {
  await page.getByText("Cenários da prévia", { exact: true }).click();
  const selector = page.getByLabel("Cenário da Home");
  await selector.selectOption(scenario);
  await expect(selector).toHaveValue(scenario);
  await expect(page.getByText("Buscando suas histórias…")).toBeHidden();
  if (scenario === "empty")
    await expect(page.getByText("Nenhuma história por aqui")).toBeVisible();
  else if (scenario === "error")
    await expect(page.getByRole("alert")).toBeVisible();
  else if (scenario === "current")
    await expect(
      page.getByRole("heading", { name: "Interestelar", exact: true }),
    ).toBeVisible();
  else
    await expect(
      page.getByRole("heading", { name: "Horizonte Azul", exact: true }),
    ).toBeVisible();
}
