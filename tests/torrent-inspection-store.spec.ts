import { expect, test } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { Configuration, ConfigurationSnapshot } from "@ushark/types";
import type { MovieCatalogResult, MovieDraft } from "@ushark/types/movies";

interface StoreResult<T> {
  ok: boolean;
  value?: T;
  error?: { code: string; message: string };
}

interface TorrentState {
  schemaVersion: number;
  runtimes: Array<{ infoHash: string; torrentId: string }>;
  sources: Array<{ sourceId: string; infoHash: string }>;
  contentSources: Array<{
    contentSourceId: string;
    contentId: string;
    sourceId: string;
    selector: { type: string; fileId?: string };
  }>;
}

interface TorrentStore {
  savePending(
    input: Record<string, unknown>,
  ): StoreResult<Record<string, unknown>>;
  listPending(): StoreResult<Array<Record<string, unknown>>>;
  loadPendingForRetry(
    input: Record<string, unknown>,
  ): StoreResult<{ privateInput: string; attempts: number }>;
  confirmSource(
    input: Record<string, unknown>,
  ): StoreResult<Record<string, unknown>>;
  snapshot(): StoreResult<TorrentState>;
  close(): void;
}

const { ConfigurationStore } = require("@ushark/core/configuration") as {
  ConfigurationStore: new (
    databasePath: string,
    dataRoot: string,
  ) => {
    read(): ConfigurationSnapshot;
    save(
      value: Configuration,
      options?: { completeOnboarding?: boolean },
    ): ConfigurationSnapshot;
    close(): void;
  };
};
const { MovieCatalogStore } = require("@ushark/core/movies") as {
  MovieCatalogStore: new (databasePath: string) => {
    save(input: {
      libraryId: string;
      draft: MovieDraft;
      mutation: { idempotencyKey: string };
    }): MovieCatalogResult<unknown>;
    read(input: { libraryId: string }): MovieCatalogResult<unknown>;
    close(): void;
  };
};
const { TorrentInspectionStore } =
  require("@ushark/core/torrent-inspection-store") as {
    TorrentInspectionStore: new (databasePath: string) => TorrentStore;
  };

function value<T>(result: StoreResult<T>): T {
  expect(result.ok, result.error?.message).toBe(true);
  return result.value!;
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-torrent-store-"));
  const databasePath = path.join(root, "state", "ushark.db");
  const configuration = new ConfigurationStore(
    databasePath,
    path.join(root, "managed"),
  );
  const base = configuration.read().configuration;
  const saved = configuration.save(
    {
      ...base,
      libraryPath: path.join(root, "library"),
      cachePath: path.join(root, "cache"),
    },
    { completeOnboarding: true },
  ).configuration;
  configuration.close();
  const catalog = new MovieCatalogStore(databasePath);
  for (const [id, title] of [
    ["movie:local:first", "Primeiro"],
    ["movie:local:second", "Segundo"],
  ]) {
    const result = catalog.save({
      libraryId: saved.libraryId,
      draft: {
        metadata: { id, title, genres: [], cast: [] },
      },
      mutation: { idempotencyKey: `catalog:${id}` },
    });
    expect(result.ok).toBe(true);
  }
  catalog.close();
  return {
    root,
    databasePath,
    libraryId: saved.libraryId,
    store: new TorrentInspectionStore(databasePath),
  };
}

const infoHash = "0123456789abcdef0123456789abcdef01234567";
const files = [
  {
    id: "file:0",
    path: "Pack/Primeiro.mkv",
    sizeBytes: 1_000_000_000,
    kind: "video",
    selectable: true,
  },
  {
    id: "file:1",
    path: "Pack/Segundo.mkv",
    sizeBytes: 1_100_000_000,
    kind: "video",
    selectable: true,
  },
  {
    id: "file:2",
    path: "Pack/sample.mkv",
    sizeBytes: 1_000,
    kind: "sample",
    selectable: false,
  },
];

function confirmation(
  contentId: string,
  fileId: string,
  idempotencyKey: string,
) {
  return {
    operationId: "operation:pack",
    contentId,
    infoHash,
    inputType: "torrent-file",
    inputLabel: "Pack.torrent",
    displayName: "Pack",
    files,
    selector: { type: "manual", fileId },
    mutation: { idempotencyKey },
  };
}

test("M06 persiste um runtime/source e selectors distintos por conteúdo", () => {
  const { root, databasePath, store } = fixture();
  try {
    const first = value(
      store.confirmSource(
        confirmation("movie:local:first", "file:0", "confirm:first"),
      ),
    );
    const replay = value(
      store.confirmSource(
        confirmation("movie:local:first", "file:0", "confirm:first"),
      ),
    );
    expect(replay).toEqual(first);
    value(
      store.confirmSource(
        confirmation("movie:local:second", "file:1", "confirm:second"),
      ),
    );
    const snapshot = value(store.snapshot());
    expect(snapshot.runtimes).toHaveLength(1);
    expect(snapshot.sources).toHaveLength(1);
    expect(snapshot.contentSources).toHaveLength(2);
    expect(snapshot.contentSources.map((item) => item.selector.fileId)).toEqual(
      ["file:0", "file:1"],
    );
    expect(
      new Set(snapshot.contentSources.map((item) => item.sourceId)).size,
    ).toBe(1);
    store.close();

    const reopened = new TorrentInspectionStore(databasePath);
    expect(value(reopened.snapshot())).toEqual(snapshot);
    reopened.close();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("M06 pendência sobrevive restart sem expor magnet na listagem", () => {
  const { root, databasePath, store } = fixture();
  const magnet = `magnet:?xt=urn:btih:${infoHash}&dn=Privado&tr=https%3A%2F%2Ftracker.invalid%2Fsecret`;
  try {
    const pending = value(
      store.savePending({
        operationId: "operation:pending",
        inputType: "magnet",
        inputLabel: "Privado · 01234567",
        privateInput: magnet,
        snapshot: {
          schemaVersion: 1,
          operationId: "operation:pending",
          state: "failed",
          inputLabel: "Privado · 01234567",
          totalFileCount: 0,
          files: [],
          filesComplete: true,
        },
        mutation: { idempotencyKey: "pending:first" },
      }),
    );
    expect(JSON.stringify(pending)).not.toContain("tracker.invalid");
    expect(JSON.stringify(value(store.listPending()))).not.toContain(
      "tracker.invalid",
    );
    const pendingId = pending.pendingId as string;
    store.close();

    const reopened = new TorrentInspectionStore(databasePath);
    const retryInput = {
      pendingId,
      mutation: { idempotencyKey: "retry:pending:first" },
    };
    const retry = value(reopened.loadPendingForRetry(retryInput));
    expect(retry).toMatchObject({ privateInput: magnet, attempts: 1 });
    expect(value(reopened.loadPendingForRetry(retryInput))).toEqual(retry);
    expect(value(reopened.listPending())[0]).toMatchObject({ attempts: 1 });
    reopened.close();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("M06 rejeita sample e rollback não deixa runtime órfão", () => {
  const { root, databasePath, store } = fixture();
  try {
    expect(
      store.confirmSource(
        confirmation("movie:local:first", "file:2", "confirm:sample"),
      ),
    ).toMatchObject({
      ok: false,
      error: { code: "TORRENT_INPUT_INVALID" },
    });
    const database = new DatabaseSync(databasePath);
    database.exec(`
      CREATE TRIGGER fail_torrent_relation
      BEFORE INSERT ON content_source_selectors
      BEGIN
        SELECT RAISE(ABORT, 'injected torrent relation failure');
      END;
    `);
    database.close();
    expect(
      store.confirmSource(
        confirmation("movie:local:first", "file:0", "confirm:rollback"),
      ),
    ).toMatchObject({
      ok: false,
      error: { code: "TORRENT_STORAGE_FAILED" },
    });
    expect(value(store.snapshot())).toMatchObject({
      runtimes: [],
      sources: [],
      contentSources: [],
    });
    store.close();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("M06 schema v5 permanece legível pelos stores M01 e M02", () => {
  const { root, databasePath, libraryId, store } = fixture();
  try {
    value(
      store.confirmSource(
        confirmation("movie:local:first", "file:0", "confirm:compatibility"),
      ),
    );
    store.close();
    const configuration = new ConfigurationStore(
      databasePath,
      path.join(root, "managed"),
    );
    expect(configuration.read().completed).toBe(true);
    configuration.close();
    const catalog = new MovieCatalogStore(databasePath);
    expect(catalog.read({ libraryId }).ok).toBe(true);
    catalog.close();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
