import { expect, test } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { Configuration, ConfigurationSnapshot } from "@ushark/types";
import type {
  DiscoveryContentSnapshot,
  DiscoveryInvalidationEvent,
  DiscoverySearchSnapshot,
  DiscoveryServiceResult,
  DiscoveryWatchEvent,
  DiscoveryWatchedFileSnapshot,
} from "@ushark/types/discovery";
import type {
  MovieCatalogCommandResult,
  MovieCatalogResult,
  MovieDraft,
} from "@ushark/types/movies";

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
    }): MovieCatalogResult<MovieCatalogCommandResult>;
    close(): void;
  };
};
const { TorrentInspectionStore } =
  require("@ushark/core/torrent-inspection-store") as {
    TorrentInspectionStore: new (databasePath: string) => { close(): void };
  };
const { SeriesCatalogStore } = require("@ushark/core/series") as {
  SeriesCatalogStore: new (databasePath: string) => { close(): void };
};
const { DiscoveryIndexStore } = require("@ushark/core/discovery-index") as {
  DiscoveryIndexStore: new (databasePath: string) => {
    synchronizeCatalog(input: {
      libraryId: string;
      mutation: { idempotencyKey: string };
    }): DiscoveryServiceResult<DiscoveryInvalidationEvent>;
    search(input: {
      libraryId: string;
      query: string;
      requestId: string;
    }): DiscoveryServiceResult<DiscoverySearchSnapshot>;
    apply(
      input: Record<string, unknown>,
    ): DiscoveryServiceResult<DiscoveryInvalidationEvent>;
    close(): void;
  };
};
const { DiscoveryWatcher } = require("@ushark/core/discovery-watcher") as {
  DiscoveryWatcher: new (options: {
    databasePath: string;
    index: { apply(input: Record<string, unknown>): unknown };
    coalesceMs?: number;
    resolveDocument: (snapshot: DiscoveryWatchedFileSnapshot) => Promise<
      | {
          content: DiscoveryContentSnapshot;
          searchText: {
            title: string;
            synopsis?: string;
            originNames: string[];
            collectionNames: string[];
          };
        }
      | undefined
    >;
    onStatus: (event: DiscoveryWatchEvent) => void;
  }) => {
    start(libraryId: string): { libraryId: string; rootPathExposed: false };
    notifyPath(relativePath: string, eventType?: string): boolean;
    flush(): Promise<void>;
    close(): void;
  };
};

function resultValue<T>(result: DiscoveryServiceResult<T>): T {
  expect(result.ok, result.ok ? undefined : result.error.message).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

async function waitForEvent(
  events: DiscoveryWatchEvent[],
  predicate: (event: DiscoveryWatchEvent) => boolean,
  timeoutMs = 5_000,
  startIndex = 0,
) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const event = events.slice(startIndex).find(predicate);
    if (event) return event;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`watcher event timeout: ${JSON.stringify(events)}`);
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-watcher-"));
  const databasePath = path.join(root, "state", "ushark.db");
  const libraryPath = path.join(root, "library");
  const configuration = new ConfigurationStore(
    databasePath,
    path.join(root, "managed"),
  );
  const base = configuration.read().configuration;
  const saved = configuration.save(
    {
      ...base,
      libraryPath,
      cachePath: path.join(root, "cache"),
    },
    { completeOnboarding: true },
  ).configuration;
  configuration.close();
  const movies = new MovieCatalogStore(databasePath);
  const draft: MovieDraft = {
    metadata: {
      id: "movie:watch:stable",
      title: "Conteúdo Estável",
      synopsis: "Snapshot anterior preservado.",
      duration: 100,
      genres: ["Drama"],
      cast: [],
    },
    source: {
      id: "source:watch:stable",
      name: "stable.mkv",
      availability: "declared",
      fileAvailable: false,
    },
  };
  const savedMovie = movies.save({
    libraryId: saved.libraryId,
    draft,
    mutation: { idempotencyKey: "watcher-seed-movie" },
  });
  expect(savedMovie.ok).toBe(true);
  movies.close();
  new TorrentInspectionStore(databasePath).close();
  new SeriesCatalogStore(databasePath).close();
  const index = new DiscoveryIndexStore(databasePath);
  resultValue(
    index.synchronizeCatalog({
      libraryId: saved.libraryId,
      mutation: { idempotencyKey: "watcher-seed-index" },
    }),
  );
  const baseContent = resultValue(
    index.search({
      libraryId: saved.libraryId,
      query: "conteudo estavel",
      requestId: "request:watcher-base",
    }),
  ).page.items[0];
  return {
    root,
    databasePath,
    libraryPath,
    libraryId: saved.libraryId,
    index,
    baseContent,
  };
}

function watcherFor(
  databasePath: string,
  index: { apply(input: Record<string, unknown>): unknown },
  baseContent: DiscoveryContentSnapshot,
  events: DiscoveryWatchEvent[],
) {
  return new DiscoveryWatcher({
    databasePath,
    index,
    coalesceMs: 40,
    onStatus: (event) => events.push(event),
    async resolveDocument(snapshot) {
      if (!/\.(mkv|mp4)$/i.test(snapshot.relativePath)) return undefined;
      const title = path.basename(
        snapshot.relativePath,
        path.extname(snapshot.relativePath),
      );
      const content = {
        ...structuredClone(baseContent),
        contentId: snapshot.previousContentId ?? baseContent.contentId,
        title,
        synopsis: `Fingerprint ${snapshot.fingerprint.slice(0, 12)}`,
      };
      return {
        content,
        searchText: {
          title,
          synopsis: content.synopsis,
          originNames: content.memberships.map((origin) => origin.name),
          collectionNames: [],
        },
      };
    },
  });
}

test("M04 S04.3 observa add/change/rename/delete real e preserva identidade no restart", async () => {
  const { root, databasePath, libraryPath, libraryId, index, baseContent } =
    fixture();
  const events: DiscoveryWatchEvent[] = [];
  let watcher = watcherFor(databasePath, index, baseContent, events);
  try {
    expect(watcher.start(libraryId)).toEqual({
      libraryId,
      rootPathExposed: false,
    });
    const originalPath = path.join(libraryPath, "Original.mkv");
    fs.writeFileSync(originalPath, Buffer.from("primeiro conteúdo"));
    const added = await waitForEvent(
      events,
      (event) =>
        event.status === "indexed" &&
        event.relativePath === "Original.mkv" &&
        event.reason === "file-added",
    );
    expect(added).toMatchObject({
      contentId: "movie:watch:stable",
      reprocessedCount: 1,
    });
    expect(
      resultValue(
        index.search({
          libraryId,
          query: "original",
          requestId: "request:watcher-added",
        }),
      ).page.items,
    ).toMatchObject([{ contentId: "movie:watch:stable" }]);

    const changeStart = events.length;
    for (let index = 0; index < 5; index += 1)
      fs.appendFileSync(originalPath, Buffer.from(`-${index}`));
    await waitForEvent(
      events,
      (event) => event.status === "indexed" && event.reason === "file-changed",
      5_000,
      changeStart,
    );
    expect(
      resultValue(
        index.search({
          libraryId,
          query: "original",
          requestId: "request:watcher-after-burst",
        }),
      ).page.total,
    ).toBe(1);

    const renamedPath = path.join(libraryPath, "Renomeado.mkv");
    const renameStart = events.length;
    fs.renameSync(originalPath, renamedPath);
    watcher.notifyPath("Original.mkv", "rename");
    watcher.notifyPath("Renomeado.mkv", "rename");
    const renamed = await waitForEvent(
      events,
      (event) =>
        event.status === "indexed" &&
        event.relativePath === "Renomeado.mkv" &&
        event.reason === "file-renamed",
      5_000,
      renameStart,
    );
    expect(renamed).toMatchObject({
      previousRelativePath: "Original.mkv",
      contentId: "movie:watch:stable",
    });
    watcher.close();

    watcher = watcherFor(databasePath, index, baseContent, events);
    watcher.start(libraryId);
    const restartedPath = path.join(libraryPath, "Após Restart.mkv");
    const restartStart = events.length;
    fs.renameSync(renamedPath, restartedPath);
    watcher.notifyPath("Renomeado.mkv", "rename");
    watcher.notifyPath("Após Restart.mkv", "rename");
    await waitForEvent(
      events,
      (event) =>
        event.status === "indexed" &&
        event.relativePath === "Após Restart.mkv" &&
        event.previousRelativePath === "Renomeado.mkv",
      5_000,
      restartStart,
    );
    expect(
      resultValue(
        index.search({
          libraryId,
          query: "apos restart",
          requestId: "request:watcher-after-restart",
        }),
      ).page.items,
    ).toMatchObject([{ contentId: "movie:watch:stable" }]);

    const removeStart = events.length;
    fs.unlinkSync(restartedPath);
    watcher.notifyPath("Após Restart.mkv", "rename");
    await waitForEvent(
      events,
      (event) => event.status === "removed" && event.reason === "file-removed",
      5_000,
      removeStart,
    );
    expect(
      resultValue(
        index.search({
          libraryId,
          query: "apos restart",
          requestId: "request:watcher-after-remove",
        }),
      ).page.total,
    ).toBe(0);
  } finally {
    watcher.close();
    index.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("M04 S04.3 coalesce eventos, rejeita escape/symlink e mantém snapshot em pendência", async () => {
  const { root, databasePath, libraryPath, libraryId, index, baseContent } =
    fixture();
  const events: DiscoveryWatchEvent[] = [];
  const watcher = watcherFor(databasePath, index, baseContent, events);
  try {
    watcher.start(libraryId);
    expect(watcher.notifyPath("../fora.mkv", "change")).toBe(false);
    expect(events.at(-1)).toMatchObject({
      status: "rejected",
      error: { code: "DISCOVERY_UNAUTHORIZED" },
    });
    expect(events.at(-1)?.relativePath).toBeUndefined();

    const outside = path.join(root, "outside.mkv");
    fs.writeFileSync(outside, "fora");
    const linked = path.join(libraryPath, "link.mkv");
    fs.symlinkSync(outside, linked);
    watcher.notifyPath("link.mkv", "rename");
    await watcher.flush();
    expect(events).toContainEqual(
      expect.objectContaining({
        relativePath: "link.mkv",
        status: "rejected",
        error: expect.objectContaining({ code: "DISCOVERY_UNAUTHORIZED" }),
      }),
    );
    expect(
      resultValue(
        index.search({
          libraryId,
          query: "conteudo estavel",
          requestId: "request:watcher-preserved-after-link",
        }),
      ).page.total,
    ).toBe(1);

    const pending = path.join(libraryPath, "Pendente.mkv");
    fs.writeFileSync(pending, "incompleto");
    if (process.platform !== "win32") fs.chmodSync(pending, 0o000);
    watcher.notifyPath("Pendente.mkv", "change");
    await watcher.flush();
    if (process.platform !== "win32") {
      expect(events).toContainEqual(
        expect.objectContaining({
          relativePath: "Pendente.mkv",
          status: "pending",
          error: expect.objectContaining({ retryable: true }),
        }),
      );
      fs.chmodSync(pending, 0o600);
    }
    fs.appendFileSync(pending, "-completo");
    const burstStart = events.length;
    for (let count = 0; count < 10; count += 1)
      watcher.notifyPath("Pendente.mkv", "change");
    await watcher.flush();
    const processed = events
      .slice(burstStart)
      .filter(
        (event) =>
          event.relativePath === "Pendente.mkv" && event.status === "indexed",
      );
    expect(processed).toHaveLength(1);
    expect(processed[0].reprocessedCount).toBe(1);

    const database = new DatabaseSync(databasePath);
    expect(
      database
        .prepare(
          `SELECT relative_path, status FROM discovery_watch_files
           WHERE library_id = ? AND content_id = ?`,
        )
        .get(libraryId, "movie:watch:stable"),
    ).toMatchObject({ relative_path: "Pendente.mkv", status: "indexed" });
    expect(
      database
        .prepare(
          "SELECT COUNT(*) AS count FROM schema_migrations WHERE version = 9",
        )
        .get(),
    ).toMatchObject({ count: 1 });
    database.close();
  } finally {
    watcher.close();
    index.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("M04 S04.3 devolve cache antes do scan e hidrata arquivo pré-existente em background", async () => {
  const { root, databasePath, libraryPath, libraryId, index, baseContent } =
    fixture();
  const events: DiscoveryWatchEvent[] = [];
  const watcher = watcherFor(databasePath, index, baseContent, events);
  try {
    fs.writeFileSync(
      path.join(libraryPath, "Pré-existente.mkv"),
      Buffer.alloc(4 * 1024 * 1024, 7),
    );
    const startedAt = Date.now();
    watcher.start(libraryId);
    expect(Date.now() - startedAt).toBeLessThan(100);
    expect(
      resultValue(
        index.search({
          libraryId,
          query: "conteudo estavel",
          requestId: "request:cache-before-hydration",
        }),
      ).page.items,
    ).toMatchObject([{ contentId: "movie:watch:stable" }]);
    await waitForEvent(
      events,
      (event) =>
        event.status === "indexed" &&
        event.relativePath === "Pré-existente.mkv",
    );
    expect(
      resultValue(
        index.search({
          libraryId,
          query: "pre existente",
          requestId: "request:after-progressive-hydration",
        }),
      ).page.items,
    ).toMatchObject([{ contentId: "movie:watch:stable" }]);
  } finally {
    watcher.close();
    index.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});
