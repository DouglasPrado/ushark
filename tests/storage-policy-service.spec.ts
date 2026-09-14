import { expect, test } from "@playwright/test";
/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const { ConfigurationStore } = require("@ushark/core/configuration");
const { MovieCatalogStore } = require("@ushark/core/movies");
const {
  LocalPlaybackSourceResolver,
} = require("@ushark/core/playback-service");
const { StoragePolicyService } = require("@ushark/core/storage-policy");

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-storage-"));
  const cacheRoot = path.join(root, "cache");
  const libraryRoot = path.join(root, "library");
  const databasePath = path.join(root, "state", "ushark.db");
  const configuration = new ConfigurationStore(
    databasePath,
    path.join(root, "managed"),
  );
  const base = configuration.read().configuration;
  const saved = configuration.save(
    { ...base, cachePath: cacheRoot, libraryPath: libraryRoot },
    { completeOnboarding: true },
  ).configuration;
  configuration.close();
  const movies = new MovieCatalogStore(databasePath);
  for (const index of [1, 2, 3, 4])
    expect(
      movies.save({
        libraryId: saved.libraryId,
        draft: {
          metadata: {
            id: `movie:storage:${index}`,
            title: `Storage ${index}`,
            genres: [],
            cast: [],
          },
          source: {
            id: `source:storage:${index}`,
            name: `${index}.mkv`,
            availability: "available",
            fileAvailable: false,
          },
        },
        mutation: { idempotencyKey: `storage-seed:${index}` },
      }).ok,
    ).toBe(true);
  movies.close();
  fs.mkdirSync(cacheRoot, { recursive: true });
  fs.mkdirSync(libraryRoot, { recursive: true });
  const files = [1, 2, 3, 4].map((index) => {
    const file = path.join(
      index === 3 ? libraryRoot : cacheRoot,
      `${index}.mkv`,
    );
    fs.writeFileSync(file, Buffer.alloc(index * 1024));
    return file;
  });
  let active = ["source:storage:4"];
  const service = new StoragePolicyService({
    databasePath,
    cacheRoot,
    libraryRoot,
    activeSourceIds: () => active,
  });
  service.registerAsset({
    id: "old",
    contentId: "movie:storage:1",
    sourceId: "source:storage:1",
    name: "Old",
    managedPath: files[0],
    lastUsed: 1,
  });
  service.registerAsset({
    id: "partial",
    contentId: "movie:storage:2",
    sourceId: "source:storage:2",
    name: "Partial",
    managedPath: files[1],
    partial: true,
    lastUsed: 2,
  });
  service.registerAsset({
    id: "keep",
    contentId: "movie:storage:3",
    sourceId: "source:storage:3",
    name: "Keep",
    managedPath: files[2],
    keep: true,
    lastUsed: 3,
  });
  service.registerAsset({
    id: "active",
    contentId: "movie:storage:4",
    sourceId: "source:storage:4",
    name: "Active",
    managedPath: files[3],
    lastUsed: 4,
  });
  return {
    root,
    cacheRoot,
    libraryRoot,
    databasePath,
    service,
    files,
    setActive: (value: string[]) => {
      active = value;
    },
  };
}

test("M10 S04.1 calcula filesystem real e protege partial/ativo/Keep", () => {
  const { service } = fixture();
  const read = service.read();
  expect(read.ok).toBe(true);
  if (!read.ok) throw new Error(read.error.message);
  expect(read.value.physical.capacityBytes).toBeGreaterThan(0);
  expect(
    read.value.entries.find((row: any) => row.id === "active")?.active,
  ).toBe(true);
  expect(
    read.value.entries
      .filter((row: any) => !row.keep && !row.active && !row.partial)
      .map((row: any) => row.id),
  ).toEqual(["old"]);
  service.close();
});

test("M10 S04.2 limpeza revalida revision e remove somente elegível", () => {
  const { service, files } = fixture();
  const before = service.read();
  if (!before.ok) throw new Error(before.error.message);
  expect(
    service.clean({
      ids: ["old", "partial", "active"],
      expectedRevision: before.value.revision - 1,
      mutation: { idempotencyKey: "clean:stale" },
    }),
  ).toMatchObject({ ok: false, error: { code: "STORAGE_CONFLICT" } });
  const cleaned = service.clean({
    ids: ["old", "partial", "active"],
    expectedRevision: before.value.revision,
    mutation: { idempotencyKey: "clean:one" },
  });
  expect(cleaned.ok).toBe(true);
  if (!cleaned.ok) throw new Error(cleaned.error.message);
  expect(cleaned.value.freedBytes).toBe(1024);
  expect(cleaned.value.estimatedBytes).toBe(7 * 1024);
  expect(fs.existsSync(files[0])).toBe(false);
  expect(fs.existsSync(files[1])).toBe(true);
  expect(fs.existsSync(files[3])).toBe(true);
  service.close();
});

test("M10 S04.3 promoção reaproveita bytes e habilita playback local", () => {
  const { service, databasePath, libraryRoot, files } = fixture();
  const before = service.read();
  if (!before.ok) throw new Error(before.error.message);
  const promoted = service.retain({
    id: "old",
    keep: true,
    expectedRevision: before.value.revision,
    mutation: { idempotencyKey: "retain:old" },
  });
  expect(promoted.ok).toBe(true);
  if (!promoted.ok) throw new Error(promoted.error.message);
  expect(fs.existsSync(files[0])).toBe(false);
  expect(fs.readdirSync(libraryRoot)).toEqual(
    expect.arrayContaining(["3.mkv", "old.mkv"]),
  );
  const resolver = new LocalPlaybackSourceResolver(databasePath, libraryRoot);
  expect(
    resolver.resolve({
      contentId: "movie:storage:1",
      sourceId: "source:storage:1",
    }).mediaPath,
  ).toContain(libraryRoot);
  resolver.close();
  service.close();
});

test("falha entre volumes preserva original", () => {
  const { service, files, databasePath, cacheRoot, libraryRoot } = fixture();
  service.close();
  const failed = new StoragePolicyService({
    databasePath,
    cacheRoot,
    libraryRoot,
    copyFile: () => {
      throw Object.assign(new Error("disk full"), { code: "ENOSPC" });
    },
  });
  const before = failed.read();
  if (!before.ok) throw new Error(before.error.message);
  expect(
    failed.retain({
      id: "old",
      keep: true,
      expectedRevision: before.value.revision,
      mutation: { idempotencyKey: "retain:no-space" },
    }),
  ).toMatchObject({ ok: false, error: { code: "STORAGE_DISK_FULL" } });
  expect(fs.existsSync(files[0])).toBe(true);
  expect(fs.readdirSync(libraryRoot)).toEqual(["3.mkv"]);
  failed.close();
});
