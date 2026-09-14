import { _electron, expect, test } from "@playwright/test";
import electron from "electron";
import fs from "node:fs";
import path from "node:path";
import { enterSeries } from "./series.helpers";

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

function seriesTorrentFixture() {
  const lengths = [80, 82, 76].map((value) => value * 1_024 * 1_024);
  const subtitleLength = 4_096;
  const pieceLength = 4 * 1_024 * 1_024;
  const total = lengths.reduce((sum, value) => sum + value, subtitleLength);
  return bencode({
    announce: "https://tracker.invalid/announce",
    info: {
      files: [
        {
          length: lengths[0],
          path: ["Entre.Orbitas.S01E01.1080p.mkv"],
        },
        { length: lengths[1], path: ["Entre.Orbitas.1x02.mkv"] },
        {
          length: lengths[2],
          path: ["Entre.Orbitas.Season.0.Episode.1.mkv"],
        },
        {
          length: subtitleLength,
          path: ["Entre.Orbitas.S01E01.1080p.pt-BR.srt"],
        },
      ],
      name: "Entre.Orbitas.Pack",
      "piece length": pieceLength,
      pieces: Buffer.alloc(Math.ceil(total / pieceLength) * 20, 7),
    },
  });
}

const pythonExecutable = process.env.USHARK_TEST_PYTHON;
const pythonPath = process.env.USHARK_TEST_LIBTORRENT_PYTHONPATH;

test.skip(
  !pythonExecutable || !pythonPath,
  "Requer CPython 3.12 e wheel libtorrent 2.1.1 verificado.",
);

test("M03 Electron importa pack real, persiste arte e reabre offline", async ({
  browserName,
}, testInfo) => {
  test.setTimeout(60_000);
  const userData = testInfo.outputPath(`${browserName}-series-user-data`);
  const source = testInfo.outputPath("Entre-Orbitas.torrent");
  fs.writeFileSync(source, seriesTorrentFixture());
  const environment = Object.fromEntries(
    Object.entries({
      ...process.env,
      USHARK_TORRENTD_PYTHON: pythonExecutable,
      USHARK_TORRENTD_PYTHONPATH: pythonPath,
      USHARK_TORRENTD_SCRIPT: path.resolve("apps/torrentd/torrentd.py"),
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
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await enterSeries(page, false, true);
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
    await page.getByRole("button", { name: "Resolver metadata" }).click();
    await expect(
      page.getByRole("heading", { name: "Entre.Orbitas.Pack", exact: true }),
    ).toBeVisible();
    const selectable = page.locator(".torrent-file input:not(:disabled)");
    await expect(selectable).toHaveCount(3);
    for (let index = 0; index < 3; index++) await selectable.nth(index).check();
    await page.getByRole("button", { name: "Confirmar arquivos" }).click();
    await expect(
      page.getByRole("heading", {
        name: "Adicionar e revisar série",
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByLabel("Legenda de Entre.Orbitas.S01E01.1080p.mkv")
      .selectOption({ index: 1 });
    await page
      .getByRole("button", { name: "Confirmar série", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Temporada 1 2 episódios", exact: true })
      .click();
    await page.getByRole("button", { name: /^E01 / }).click();
    await expect(page.getByRole("dialog")).toContainText(
      "Entre.Orbitas.S01E01.1080p.mkv",
    );
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    );
    await page
      .locator('.episode-artwork-upload input[type="file"]')
      .setInputFiles({
        name: "episodio.png",
        mimeType: "image/png",
        buffer: png,
      });
    await expect(page.locator(".episode-artwork-message")).toContainText(
      "Imagem validada e persistida",
    );
    await page.screenshot({
      path: "docs/milestones/M03-series/evidence/electron-real-episode.png",
    });
    expect(errors).toEqual([]);
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
    await page.getByRole("button", { name: "Séries", exact: true }).click();
    await expect(page.locator(".series-card")).toHaveCount(1);
    await page.locator(".series-card").click();
    await page
      .getByRole("button", { name: "Temporada 1 2 episódios", exact: true })
      .click();
    await page.getByRole("button", { name: /^E01 / }).click();
    await expect(page.getByRole("dialog")).toContainText(
      "Entre.Orbitas.S01E01.1080p.mkv",
    );
    const image = page.locator(".series-episode-artwork.is-detail img");
    await expect(image).toHaveAttribute("src", /^ushark-asset:\/\//);
    await expect
      .poll(() =>
        image.evaluate((element) => (element as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
    await page
      .getByRole("button", { name: "Revisar associações desta fonte" })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Adicionar e revisar série",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByLabel("Legenda de Entre.Orbitas.S01E01.1080p.mkv"),
    ).toHaveValue(/file:/);
  } finally {
    await reopened.close();
  }
});
