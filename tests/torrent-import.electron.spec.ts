import { _electron, expect, test } from "@playwright/test";
import electron from "electron";
import fs from "node:fs";
import path from "node:path";
import { enterMovies } from "./movies.helpers";

type BValue = string | number | Buffer | BValue[] | { [key: string]: BValue };

function bencode(value: BValue): Buffer {
  if (Buffer.isBuffer(value))
    return Buffer.concat([Buffer.from(`${value.length}:`), value]);
  if (typeof value === "string") return bencode(Buffer.from(value));
  if (typeof value === "number") return Buffer.from(`i${value}e`);
  if (Array.isArray(value))
    return Buffer.concat([
      Buffer.from("l"),
      ...value.map(bencode),
      Buffer.from("e"),
    ]);
  return Buffer.concat([
    Buffer.from("d"),
    ...Object.keys(value)
      .sort((left, right) =>
        Buffer.compare(Buffer.from(left), Buffer.from(right)),
      )
      .flatMap((key) => [bencode(key), bencode(value[key])]),
    Buffer.from("e"),
  ]);
}

function torrentFixture() {
  return bencode({
    announce: "https://tracker.invalid/announce",
    info: {
      length: 80 * 1_024 * 1_024,
      name: "Horizonte.2024.1080p.mkv",
      "piece length": 4 * 1_024 * 1_024,
      pieces: Buffer.alloc(20 * 20, 9),
    },
  });
}

const pythonExecutable = process.env.USHARK_TEST_PYTHON;
const pythonPath = process.env.USHARK_TEST_LIBTORRENT_PYTHONPATH;

test.skip(
  !pythonExecutable || !pythonPath,
  "Requer CPython 3.12 e wheel libtorrent 2.1.1 verificado.",
);

test("M06 Electron importa .torrent real, salva pendência e reidrata após restart", async ({
  browserName,
}, testInfo) => {
  test.setTimeout(60_000);
  const userData = testInfo.outputPath(`${browserName}-torrent-user-data`);
  const source = testInfo.outputPath("Horizonte.torrent");
  fs.writeFileSync(source, torrentFixture());
  const environment = Object.fromEntries(
    Object.entries({
      ...process.env,
      USHARK_TORRENTD_PYTHON: pythonExecutable,
      USHARK_TORRENTD_PYTHONPATH: pythonPath,
      USHARK_TORRENTD_SCRIPT: path.resolve("apps/torrentd/torrentd.py"),
      USHARK_TORRENTD_SOFT_TIMEOUT_MS: "100",
      USHARK_TORRENTD_HARD_TIMEOUT_MS: "400",
    }).filter(
      (entry): entry is [string, string] =>
        entry[0] !== "ELECTRON_RUN_AS_NODE" && entry[1] !== undefined,
    ),
  );
  const args = [
    path.resolve("apps/desktop/src/main/index.cjs"),
    `--user-data-dir=${userData}`,
  ];
  const first = await _electron.launch({
    executablePath: electron as unknown as string,
    env: environment,
    args,
  });
  try {
    const page = await first.firstWindow();
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await enterMovies(page, false, true);
    await first.evaluate(({ dialog }, selectedPath) => {
      dialog.showOpenDialog = async () => ({
        canceled: false,
        filePaths: [selectedPath],
        bookmarks: [],
      });
    }, source);
    await page
      .getByRole("button", { name: "Importar torrent ou magnet" })
      .click();
    await page
      .getByRole("button", { name: "Selecionar arquivo .torrent" })
      .click();
    await expect(page.getByLabel("Magnet link")).toHaveValue(
      "Horizonte.torrent",
    );
    await page.getByRole("button", { name: "Resolver metadata" }).click();
    await expect(
      page.getByRole("heading", {
        name: "Horizonte.2024.1080p.mkv",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByText(/InfoHash: [a-f0-9]{40}/)).toBeVisible();
    await page.getByRole("button", { name: "Confirmar arquivos" }).click();
    await expect(
      page.getByRole("button", {
        name: "Abrir Horizonte 2024 1080p mkv",
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: "Abrir Horizonte 2024 1080p mkv",
        exact: true,
      })
      .click();
    await page.getByRole("button", { name: "Fontes (1)" }).click();
    await expect(page.getByText("Horizonte.2024.1080p.mkv")).toBeVisible();
    await page.getByRole("button", { name: "Fechar fontes" }).click();
    await page.getByRole("button", { name: "Todos os filmes" }).click();
    await page.getByRole("button", { name: "Início", exact: true }).click();
    await page.getByRole("button", { name: "Filmes", exact: true }).click();

    await page
      .getByRole("button", { name: "Importar torrent ou magnet" })
      .click();
    const magnet =
      "magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567&dn=NoPeers";
    await page.getByLabel("Magnet link").fill(magnet);
    await page.getByRole("button", { name: "Resolver metadata" }).click();
    await expect(page.getByRole("alert")).toContainText(
      "A metadata não chegou no tempo limite",
    );
    await page.getByRole("button", { name: "Salvar pendente" }).click();
    await expect(page.getByRole("status")).toContainText(
      "Importação salva como pendente",
    );
    expect(pageErrors).toEqual([]);
  } finally {
    await first.close();
  }

  const reopened = await _electron.launch({
    executablePath: electron as unknown as string,
    env: environment,
    args,
  });
  try {
    const page = await reopened.firstWindow();
    await page.getByRole("button", { name: "Filmes", exact: true }).click();
    await expect(
      page.getByRole("button", {
        name: "Abrir Horizonte 2024 1080p mkv",
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Importar torrent ou magnet" })
      .click();
    await expect(
      page.getByText(/Pendente 1 · NoPeers · 01234567/),
    ).toBeVisible();
    await page.getByRole("button", { name: "Repetir pendência 1" }).click();
    await expect(page.getByRole("alert")).toContainText(
      "A metadata não chegou no tempo limite",
    );
  } finally {
    await reopened.close();
  }
});
