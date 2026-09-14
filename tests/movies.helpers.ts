import { expect, type Page } from "@playwright/test";
export async function enterMovies(
  page: Page,
  navigate = true,
  preserveDefault = false,
) {
  if (navigate) await page.goto("/");
  await page.getByRole("button", { name: "Começar", exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Abrir minha biblioteca" }).click();
  await page.getByRole("button", { name: "Filmes", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Filmes", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Abrindo suas histórias…")).toBeHidden();
  if (!preserveDefault) await movieFixtures(page, "empty");
}
export async function movieFixtures(page: Page, value: string) {
  const tools = page.locator(".movie-preview-tools");
  if (!(await tools.evaluate((el) => el.hasAttribute("open"))))
    await tools.locator("summary").click();
  await page.getByLabel("Conteúdo da biblioteca").selectOption(value);
  await expect(page.getByText("Abrindo suas histórias…")).toBeHidden();
  await tools.locator("summary").click();
}
export async function movieScenario(page: Page, value: string) {
  const tools = page.locator(".movie-preview-tools");
  if (!(await tools.evaluate((el) => el.hasAttribute("open"))))
    await tools.locator("summary").click();
  await page.getByLabel("Estado da interface").selectOption(value);
  await expect(page.getByText("Abrindo suas histórias…")).toBeHidden();
  await tools.locator("summary").click();
}
