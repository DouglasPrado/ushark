import { expect, test } from "@playwright/test";
/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const { NextEpisodeApplicationService } = require("@ushark/core/next-episode");

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-next-"));
  const databasePath = path.join(root, "ushark.db");
  const database = new DatabaseSync(databasePath);
  database.exec(`
    CREATE TABLE series(content_id TEXT PRIMARY KEY, metadata_json TEXT NOT NULL);
    CREATE TABLE episodes(content_id TEXT PRIMARY KEY, series_content_id TEXT NOT NULL, season_number INTEGER NOT NULL, episode_number INTEGER NOT NULL, metadata_json TEXT NOT NULL);
    CREATE TABLE content_source_selectors(content_source_id TEXT PRIMARY KEY,content_id TEXT NOT NULL,source_id TEXT NOT NULL,selector_json TEXT NOT NULL,created_at INTEGER NOT NULL);
    CREATE TABLE torrent_sources(source_id TEXT PRIMARY KEY,info_hash TEXT NOT NULL,input_label TEXT NOT NULL);
    CREATE TABLE torrent_runtimes(info_hash TEXT PRIMARY KEY,metadata_json TEXT NOT NULL);
    CREATE TABLE user_source_overrides(content_id TEXT PRIMARY KEY,source_id TEXT NOT NULL);
  `);
  const addSeries = (id: string, episodes: Array<[number, number]>) => {
    database
      .prepare("INSERT INTO series VALUES(?,?)")
      .run(id, JSON.stringify({ title: id }));
    for (const [season, number] of episodes) {
      const episodeId = `${id}:s${season}:e${number}`;
      const sourceId = `${id}:pack`;
      const fileId = `file:${season}:${number}`;
      database
        .prepare("INSERT INTO episodes VALUES(?,?,?,?,?)")
        .run(
          episodeId,
          id,
          season,
          number,
          JSON.stringify({ runtimeSeconds: 1200 }),
        );
      database
        .prepare(
          "INSERT INTO content_source_selectors VALUES(?,?,?,?,unixepoch())",
        )
        .run(
          `relation:${episodeId}`,
          episodeId,
          sourceId,
          JSON.stringify({ type: "episode", fileId }),
        );
    }
    database
      .prepare("INSERT OR IGNORE INTO torrent_sources VALUES(?,?,?)")
      .run(`${id}:pack`, `${id}:hash`, `${id}.torrent`);
    database.prepare("INSERT OR IGNORE INTO torrent_runtimes VALUES(?,?)").run(
      `${id}:hash`,
      JSON.stringify({
        files: episodes.map(([season, number]) => ({
          id: `file:${season}:${number}`,
          sizeBytes: 1024,
        })),
      }),
    );
  };
  addSeries("series:normal", [
    [1, 1],
    [1, 2],
    [2, 1],
  ]);
  addSeries("series:gap", [
    [1, 1],
    [1, 3],
  ]);
  addSeries("series:special", [[0, 1]]);
  database.close();
  const calls: any[] = [];
  const selectionService = {
    preflight: async (input: any) => {
      calls.push(input);
      return {
        ok: true,
        value: { selectedSourceId: input.candidates[0].sourceId },
      };
    },
    cancel: () => ({ ok: true, value: { cancelled: true } }),
  };
  const service = new NextEpisodeApplicationService({
    databasePath,
    preferences: () => ({
      autoSelect: true,
      strategy: "balanced",
      resolution: "1080p",
    }),
    selectionService,
  });
  return { service, calls };
}

test("M11 S04.1 resolve ordem estrita, fim, lacuna e especial", () => {
  const { service } = fixture();
  const next = service.resolve({ contentId: "series:normal:s1:e1" });
  expect(next).toMatchObject({
    ok: true,
    value: {
      kind: "next",
      next: { id: "series:normal:s1:e2", sourceId: "series:normal:pack" },
      countdownSeconds: 5,
    },
  });
  expect(service.resolve({ contentId: "series:normal:s1:e2" })).toMatchObject({
    ok: true,
    value: { kind: "season-end", next: { id: "series:normal:s2:e1" } },
  });
  const gap = service.resolve({ contentId: "series:gap:s1:e1" });
  expect(gap).toMatchObject({
    ok: true,
    value: { kind: "missing" },
  });
  if (gap.ok) expect(gap.value.next).toBeUndefined();
  const special = service.resolve({ contentId: "series:special:s0:e1" });
  expect(special).toMatchObject({
    ok: true,
    value: { kind: "series-end" },
  });
  if (special.ok) expect(special.value.next).toBeUndefined();
  service.close();
});

test("M11 S04.2 preflight único reutiliza source do pack", async () => {
  const { service, calls } = fixture();
  const resolved = service.resolve({ contentId: "series:normal:s1:e1" });
  if (!resolved.ok) throw new Error(resolved.error.message);
  const prepared = await service.prepare({
    sessionId: resolved.value.sessionId,
    generation: resolved.value.generation,
    sourceId: "series:normal:pack",
    fileId: "file:1:2",
    mutation: { idempotencyKey: "prepare:normal" },
  });
  expect(prepared).toMatchObject({
    ok: true,
    value: { state: "ready", selectedSourceId: "series:normal:pack" },
  });
  expect(calls).toHaveLength(1);
  expect(calls[0]).toMatchObject({
    contentId: "series:normal:s1:e2",
    context: "next-episode",
    candidates: [{ sourceId: "series:normal:pack" }],
  });
  service.close();
});

test("M11 S04.3 cancelamento bloqueia início e claim é idempotente", async () => {
  const { service } = fixture();
  const first = service.resolve({ contentId: "series:normal:s1:e1" });
  if (!first.ok) throw new Error(first.error.message);
  await service.prepare({
    sessionId: first.value.sessionId,
    generation: 1,
    sourceId: "series:normal:pack",
    mutation: { idempotencyKey: "prepare:cancel" },
  });
  expect(
    service.cancel({
      sessionId: first.value.sessionId,
      generation: 1,
      mutation: { idempotencyKey: "cancel:one" },
    }),
  ).toMatchObject({ ok: true, value: { state: "cancelled" } });
  expect(
    service.claimStart({
      sessionId: first.value.sessionId,
      generation: 1,
      mutation: { idempotencyKey: "start:cancelled" },
    }),
  ).toMatchObject({ ok: false, error: { code: "NEXT_CANCELLED" } });

  const second = service.resolve({ contentId: "series:normal:s1:e1" });
  if (!second.ok) throw new Error(second.error.message);
  await service.prepare({
    sessionId: second.value.sessionId,
    generation: 1,
    sourceId: "series:normal:pack",
    mutation: { idempotencyKey: "prepare:start" },
  });
  const start = {
    sessionId: second.value.sessionId,
    generation: 1,
    mutation: { idempotencyKey: "start:once" },
  };
  expect(service.claimStart(start)).toMatchObject({
    ok: true,
    value: { state: "started" },
  });
  expect(service.claimStart(start)).toMatchObject({
    ok: true,
    value: { state: "started" },
  });
  service.close();
});
