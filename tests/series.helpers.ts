import { expect, type Page } from "@playwright/test";
export async function enterSeries(
  page: Page,
  navigate = true,
  preserveDefault = false,
) {
  if (navigate) await page.goto("/");
  await page.getByRole("button", { name: "Começar", exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Abrir minha biblioteca" }).click();
  await page.getByRole("button", { name: "Séries", exact: true }).click();
  await expect(page.getByText("Abrindo suas séries…")).toBeHidden();
  if (!preserveDefault) {
    await page.getByText("Inspecionar prévia", { exact: true }).click();
    await page.getByLabel("Coleção de exemplo").selectOption("empty");
    await expect(page.getByText("Abrindo suas séries…")).toBeHidden();
    await page.getByText("Inspecionar prévia", { exact: true }).click();
  }
}
export async function openPack(
  page: Page,
  name = "Várias temporadas e especiais",
) {
  await page
    .getByRole("button", { name: "Adicionar série", exact: true })
    .click();
  await page.getByRole("button", { name, exact: true }).click();
}
