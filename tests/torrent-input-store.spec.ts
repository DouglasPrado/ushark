import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

interface ParsedTorrent {
  infoHash: string;
  name: string;
  pieceLengthBytes: number;
  pieceCount: number;
  totalSizeBytes: number;
  files: Array<{
    id: string;
    path: string;
    kind: "video" | "sample" | "extra" | "other";
    selectable: boolean;
  }>;
}

interface ResolvedSelection {
  selectionId: string;
  fileName: string;
  sizeBytes: number;
  managedPath: string;
  sha256: string;
  metadata: ParsedTorrent;
  expiresAt: number;
}

const {
  LIMITS,
  TorrentInputStore,
  assertExistingPathContained,
  parseMagnet,
  parseTorrentFile,
  validateTorrentPathComponents,
}: {
  LIMITS: { torrentFileBytes: number };
  TorrentInputStore: new (
    root: string,
    options?: { selectionTtlMs?: number; now?: () => number },
  ) => {
    select(
      sourcePath: string,
      signal?: AbortSignal,
    ): { selectionId: string; fileName: string; sizeBytes: number };
    resolve(selectionId: string): ResolvedSelection;
    release(selectionId: string): boolean;
  };
  assertExistingPathContained(root: string, candidate: string): string;
  parseMagnet(value: string): {
    type: "magnet";
    infoHash: string;
    displayName: string;
    trackerCount: number;
    inputLabel: string;
  };
  parseTorrentFile(value: Buffer): ParsedTorrent;
  validateTorrentPathComponents(value: string[]): string;
} = require("@ushark/core/torrent-input");

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

function singleFileTorrent(name = "Horizonte.2024.1080p.mkv") {
  const info = {
    length: 1_000,
    name,
    "piece length": 16_384,
    pieces: Buffer.alloc(20, 7),
  };
  return {
    bytes: bencode({ announce: "https://tracker.test/announce", info }),
    info,
  };
}

test("M06 parser normaliza magnet BTIH sem devolver o magnet completo", () => {
  const parsed = parseMagnet(
    "magnet:?xt=urn:btih:0123456789ABCDEF0123456789ABCDEF01234567&dn=Horizonte&tr=https%3A%2F%2Ftracker.test%2Fa",
  );
  expect(parsed).toEqual({
    type: "magnet",
    infoHash: "0123456789abcdef0123456789abcdef01234567",
    displayName: "Horizonte",
    trackerCount: 1,
    inputLabel: "Horizonte · 01234567",
  });
  expect(JSON.stringify(parsed)).not.toContain("tracker.test");
  expect(() => parseMagnet("https://example.test/file.torrent")).toThrow();
  expect(() =>
    parseMagnet(
      "magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567&evil=1",
    ),
  ).toThrow(/não é suportado/);
});

test("M06 parser preserva hash do info bencode e classifica arquivos", () => {
  const pieceLength = 4 * 1_024 * 1_024;
  const total = 120 * 1_024 * 1_024;
  const info = {
    files: [
      { length: 60 * 1_024 * 1_024, path: ["Filme.2024.mkv"] },
      { length: 12 * 1_024 * 1_024, path: ["sample.mkv"] },
      { length: 48 * 1_024 * 1_024, path: ["Making-of.mp4"] },
    ],
    name: "Horizonte",
    "piece length": pieceLength,
    pieces: Buffer.alloc(Math.ceil(total / pieceLength) * 20, 3),
  };
  const encodedInfo = bencode(info);
  const parsed = parseTorrentFile(
    bencode({ announce: "udp://tracker.test:80", info }),
  );
  expect(parsed.infoHash).toBe(
    createHash("sha1").update(encodedInfo).digest("hex"),
  );
  expect(parsed).toMatchObject({
    name: "Horizonte",
    pieceLengthBytes: pieceLength,
    pieceCount: 30,
    totalSizeBytes: total,
  });
  expect(
    parsed.files.map(({ kind, selectable }) => ({ kind, selectable })),
  ).toEqual([
    { kind: "video", selectable: true },
    { kind: "sample", selectable: false },
    { kind: "sample", selectable: false },
  ]);
});

test("M06 rejeita bencode não canônico, paths hostis e orçamento excedido", () => {
  expect(() => parseTorrentFile(Buffer.from("d4:infodi01eee"))).toThrow(
    /não canônico/,
  );
  expect(() => validateTorrentPathComponents(["..", "movie.mkv"])).toThrow();
  expect(() => validateTorrentPathComponents(["C:", "movie.mkv"])).toThrow();
  expect(() => validateTorrentPathComponents(["CON"])).toThrow();
  expect(() =>
    parseTorrentFile(Buffer.alloc(LIMITS.torrentFileBytes + 1)),
  ).toThrow(/10 MiB/);

  const hostileInfo = {
    files: [{ length: 1_000, path: ["..", "outside.mkv"] }],
    name: "Pack",
    "piece length": 16_384,
    pieces: Buffer.alloc(20),
  };
  expect(() => parseTorrentFile(bencode({ info: hostileInfo }))).toThrow();
});

test("M06 staging copia, valida e libera somente a cópia gerenciada", () => {
  const fixture = singleFileTorrent();
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-torrent-input-"));
  const source = path.join(root, "source.torrent");
  const managed = path.join(root, "managed");
  fs.writeFileSync(source, fixture.bytes);
  const store = new TorrentInputStore(managed);
  try {
    const selection = store.select(source);
    expect(selection).toMatchObject({
      fileName: "source.torrent",
      sizeBytes: fixture.bytes.length,
    });
    expect(selection).not.toHaveProperty("managedPath");
    const resolved = store.resolve(selection.selectionId);
    expect(resolved.metadata.name).toBe("Horizonte.2024.1080p.mkv");
    expect(
      resolved.managedPath.startsWith(`${fs.realpathSync(managed)}${path.sep}`),
    ).toBe(true);
    expect(fs.readFileSync(resolved.managedPath)).toEqual(fixture.bytes);
    expect(store.release(selection.selectionId)).toBe(true);
    expect(fs.existsSync(resolved.managedPath)).toBe(false);
    expect(fs.existsSync(source)).toBe(true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("M06 staging rejeita symlink, cancelamento e prefixo textual semelhante", () => {
  const fixture = singleFileTorrent();
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-torrent-guard-"));
  const managed = path.join(root, "safe");
  const outside = path.join(root, "safe-evil");
  const source = path.join(outside, "source.torrent");
  fs.mkdirSync(outside);
  fs.writeFileSync(source, fixture.bytes);
  const symlink = path.join(root, "link.torrent");
  fs.symlinkSync(source, symlink);
  const store = new TorrentInputStore(managed);
  try {
    expect(() => assertExistingPathContained(managed, source)).toThrow(/fora/);
    expect(() => store.select(symlink)).toThrow(/regular/);
    const controller = new AbortController();
    controller.abort();
    expect(() => store.select(source, controller.signal)).toThrow(/cancelada/);
    expect(fs.readdirSync(managed)).toEqual([]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
