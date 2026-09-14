import { expect, test } from "@playwright/test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const desktopSrc = resolve(root, "apps/desktop/src");
const renderer = resolve(desktopSrc, "renderer");
const mocks = resolve(root, "packages/mocks");
const ui = resolve(root, "packages/ui/src");

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

test("A11 mantém main, preload e renderer como boundaries físicos", () => {
  for (const area of ["main", "preload", "renderer"])
    expect(existsSync(resolve(desktopSrc, area))).toBe(true);

  const looseFiles = readdirSync(desktopSrc, { withFileTypes: true }).filter(
    (entry) => entry.isFile(),
  );
  expect(looseFiles).toEqual([]);

  const desktopPackage = JSON.parse(
    readFileSync(resolve(root, "apps/desktop/package.json"), "utf8"),
  ) as { main: string };
  expect(desktopPackage.main).toBe("src/main/index.cjs");

  const electronMain = readFileSync(
    resolve(desktopSrc, "main/index.cjs"),
    "utf8",
  );
  expect(electronMain).toContain("../preload/index.cjs");
  expect(electronMain).toContain('path.join(__dirname, "../..")');
  expect(electronMain).toContain('path.join(desktopRoot, "dist/index.html")');
});

test("A11 mantém mocks separados e consumo por exports públicos", () => {
  for (const area of ["data", "services", "scenarios"])
    expect(existsSync(resolve(mocks, area))).toBe(true);

  const rendererSources = sourceFiles(renderer)
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  expect(rendererSources).not.toMatch(
    /from\s+["'][^"']*packages\/(ui|mocks|types)\//,
  );
  expect(rendererSources).toContain("@ushark/ui");
  expect(rendererSources).toContain("@ushark/mocks");
  expect(rendererSources).toContain("@ushark/types");
});

test("renderer organiza telas por responsabilidade e mantém estilos colocalizados", () => {
  for (const area of [
    "app",
    "catalog",
    "playback",
    "workspace",
    "system",
    "tv",
    "torrent",
  ]) {
    expect(existsSync(resolve(renderer, area))).toBe(true);
  }

  const looseImplementationFiles = readdirSync(renderer, {
    withFileTypes: true,
  })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name !== "main.tsx" && name !== "vite-env.d.ts");
  expect(looseImplementationFiles).toEqual([]);

  for (const area of [
    "app",
    "catalog",
    "playback",
    "workspace",
    "system",
    "tv",
  ]) {
    const entries = readdirSync(resolve(renderer, area));
    expect(entries.some((entry) => entry.endsWith(".tsx"))).toBe(true);
    expect(entries.some((entry) => entry.endsWith(".css"))).toBe(true);
  }
});

test("design system mantém dois botões, uma toolbar e um card responsivo", () => {
  const button = readFileSync(resolve(ui, "Button/Button.tsx"), "utf8");
  expect(button).toContain('primary: "primary"');
  expect(button).toContain('secondary: "secondary"');
  expect(button).not.toMatch(/ghost|default:/);

  const catalogSources = ["Movies.tsx", "Series.tsx", "Discovery.tsx"]
    .map((file) => readFileSync(resolve(renderer, "catalog", file), "utf8"))
    .join("\n");
  expect(catalogSources.match(/<FilterToolbar/g)).toHaveLength(3);
  expect(catalogSources).not.toContain('variant="ghost"');

  for (const file of ["Movies.tsx", "Series.tsx", "DiscoveryRail.tsx"]) {
    expect(readFileSync(resolve(renderer, "catalog", file), "utf8")).toContain(
      "<MediaCard",
    );
  }
});
