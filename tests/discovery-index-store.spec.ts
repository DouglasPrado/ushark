import { expect, test } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { Configuration, ConfigurationSnapshot } from "@ushark/types";
import type {
  ApplyDiscoveryIndexInput,
  DiscoveryHomeSnapshot,
  DiscoveryInvalidationEvent,
  DiscoverySearchSnapshot,
  DiscoveryScopeSnapshot,
  DiscoveryServiceResult,
} from "@ushark/types/discovery";

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
  MovieCatalogStore: new (databasePath: string) => { close(): void };
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
      mutation: { idempotencyKey: string; expectedRevision?: number };
    }): DiscoveryServiceResult<DiscoveryInvalidationEvent>;
    readHome(input: {
      libraryId: string;
      sectionLimit?: number;
    }): DiscoveryServiceResult<DiscoveryHomeSnapshot>;
    readScope(input: {
      libraryId: string;
      scopeId: string;
      cursor?: { value: string };
      limit?: number;
    }): DiscoveryServiceResult<DiscoveryScopeSnapshot>;
    search(input: {
      libraryId: string;
      query: string;
      type?: "movie" | "series" | "episode";
      favorite?: boolean;
      recent?: boolean;
      continuing?: boolean;
      genre?: string;
      collectionId?: string;
      scopeId?: string;
      cursor?: { value: string };
      limit?: number;
      requestId: string;
    }): DiscoveryServiceResult<DiscoverySearchSnapshot>;
    cancelRequest(input: { requestId: string }): DiscoveryServiceResult<{
      requestId: string;
      cancelled: boolean;
    }>;
    apply(
      input: ApplyDiscoveryIndexInput,
    ): DiscoveryServiceResult<DiscoveryInvalidationEvent>;
    rebuildSearchIndex(input: {
      libraryId: string;
      mutation: { idempotencyKey: string; expectedRevision?: number };
    }): DiscoveryServiceResult<DiscoveryInvalidationEvent>;
    diagnostics():
      | {
          projectionQueryCount: number;
          projectedContentCount: number;
          changedContentCount: number;
          removedContentCount: number;
          durationMs: number;
        }
      | undefined;
    close(): void;
  };
};

type SqlValue = string | number | bigint | null | Uint8Array;

function value<T>(result: DiscoveryServiceResult<T>): T {
  expect(result.ok, result.ok ? undefined : result.error.message).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

function initialize() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-discovery-"));
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
  new MovieCatalogStore(databasePath).close();
  new TorrentInspectionStore(databasePath).close();
  new SeriesCatalogStore(databasePath).close();
  return { root, databasePath, libraryId: saved.libraryId };
}

function run(database: DatabaseSync, sql: string, ...parameters: SqlValue[]) {
  database.prepare(sql).run(...parameters);
}

function addLibrary(
  database: DatabaseSync,
  id: string,
  name: string,
  rootPath: string,
) {
  run(
    database,
    `INSERT INTO local_libraries(id, name, root_path, created_at, updated_at)
     VALUES (?, ?, ?, unixepoch(), unixepoch())`,
    id,
    name,
    rootPath,
  );
}

function addMovie(
  database: DatabaseSync,
  input: {
    id: string;
    title: string;
    memberships: Array<{ libraryId: string; position: number }>;
    year?: number;
    favorite?: boolean;
    progress?: number;
    history?: unknown[];
    sourceId?: string;
    genres?: unknown[];
  },
) {
  const metadata = {
    id: input.id,
    title: input.title,
    year: input.year ?? 2025,
    duration: 120,
    synopsis: `${input.title} synopsis`,
    genres: input.genres ?? ["Drama"],
    cast: ["Pessoa Um"],
    poster: `ushark-asset://poster/${input.id}`,
    backdrop: `ushark-asset://backdrop/${input.id}`,
    externalIds: {},
  };
  run(
    database,
    `INSERT INTO contents(id, type, created_at, updated_at)
     VALUES (?, 'movie', unixepoch(), unixepoch())`,
    input.id,
  );
  run(
    database,
    `INSERT INTO movies(content_id, metadata_json, updated_at)
     VALUES (?, ?, unixepoch())`,
    input.id,
    JSON.stringify(metadata),
  );
  run(
    database,
    `INSERT INTO user_content_state(
       content_id, favorite, progress, history_json, preferences_json, updated_at
     ) VALUES (?, ?, ?, ?, '[]', unixepoch())`,
    input.id,
    input.favorite ? 1 : 0,
    input.progress ?? 0,
    JSON.stringify(input.history ?? []),
  );
  for (const membership of input.memberships)
    run(
      database,
      `INSERT INTO library_memberships(
         library_id, content_id, order_index, preserved_overrides_json,
         created_at, updated_at
       ) VALUES (?, ?, ?, '[]', unixepoch(), unixepoch())`,
      membership.libraryId,
      input.id,
      membership.position,
    );
  if (input.sourceId) {
    run(
      database,
      `INSERT INTO sources(
         id, descriptor_json, created_at, updated_at
       ) VALUES (?, ?, unixepoch(), unixepoch())`,
      input.sourceId,
      JSON.stringify({
        id: input.sourceId,
        name: `${input.title}.2160p.mkv`,
        resolution: "2160p",
        availability: "available",
        fileAvailable: true,
      }),
    );
    run(
      database,
      `INSERT INTO content_sources(content_id, source_id, created_at)
       VALUES (?, ?, unixepoch())`,
      input.id,
      input.sourceId,
    );
  }
}

function addSeries(database: DatabaseSync, libraryId: string) {
  const seriesId = "series:local:batch";
  run(
    database,
    `INSERT INTO contents(id, type, created_at, updated_at)
     VALUES (?, 'series', unixepoch(), unixepoch())`,
    seriesId,
  );
  run(
    database,
    `INSERT INTO series(content_id, metadata_json, updated_at)
     VALUES (?, ?, unixepoch())`,
    seriesId,
    JSON.stringify({
      title: "Série em Lote",
      originalTitle: "Batch Series",
      synopsis: "Uma série persistida.",
      startYear: 2024,
      genres: ["Ficção científica"],
      cast: ["Pessoa Dois"],
      poster: "ushark-asset://poster/series",
      backdrop: "ushark-asset://backdrop/series",
      externalIds: {},
    }),
  );
  run(
    database,
    `INSERT INTO user_content_state(
       content_id, favorite, progress, history_json, preferences_json, updated_at
     ) VALUES (?, 1, 0, '[]', '[]', unixepoch())`,
    seriesId,
  );
  run(
    database,
    `INSERT INTO library_memberships(
       library_id, content_id, order_index, preserved_overrides_json,
       created_at, updated_at
     ) VALUES (?, ?, 20, '[]', unixepoch(), unixepoch())`,
    libraryId,
    seriesId,
  );
  const files: Array<{ id: string; index: number; name: string }> = [];
  for (const [index, season, episode] of [
    [0, 1, 1],
    [1, 1, 2],
    [2, 2, 1],
  ]) {
    const episodeId = `episode:local:batch:${season}:${episode}`;
    const fileId = `file:batch:${episode}`;
    files.push({
      id: fileId,
      index,
      name: `Batch.S0${season}E0${episode}.1080P.mkv`,
    });
    run(
      database,
      `INSERT INTO contents(id, type, created_at, updated_at)
       VALUES (?, 'episode', unixepoch(), unixepoch())`,
      episodeId,
    );
    run(
      database,
      `INSERT INTO episodes(
         content_id, series_content_id, season_number, episode_number,
         metadata_json, updated_at
       ) VALUES (?, ?, ?, ?, ?, unixepoch())`,
      episodeId,
      seriesId,
      season,
      episode,
      JSON.stringify({
        title: `Episódio ${season}.${episode}`,
        synopsis: "Episódio distinto.",
        runtimeSeconds: 2_400,
        airDate: `202${season}-01-0${episode}`,
        externalIds: {},
      }),
    );
    run(
      database,
      `INSERT INTO user_content_state(
         content_id, favorite, progress, history_json, preferences_json, updated_at
       ) VALUES (?, 0, ?, ?, '[]', unixepoch())`,
      episodeId,
      episode === 1 ? 600 : 0,
      JSON.stringify(
        episode === 1 ? [{ startedAt: "2026-09-14T12:00:00.000Z" }] : [],
      ),
    );
  }
  const infoHash = "0123456789abcdef0123456789abcdef01234567";
  run(
    database,
    `INSERT INTO torrent_runtimes(
       info_hash, torrent_id, display_name, metadata_json, created_at, updated_at
     ) VALUES (?, ?, ?, ?, unixepoch(), unixepoch())`,
    infoHash,
    `torrent:${infoHash}`,
    "Série em Lote",
    JSON.stringify({ files }),
  );
  run(
    database,
    `INSERT INTO torrent_sources(
       source_id, info_hash, input_type, input_label, created_at, updated_at
     ) VALUES ('source:torrent:batch', ?, 'torrent-file', 'batch.torrent', unixepoch(), unixepoch())`,
    infoHash,
  );
  for (const [episode, file] of [1, 2, 3].map(
    (number, index) =>
      [
        `episode:local:batch:${index === 2 ? 2 : 1}:${index === 2 ? 1 : number}`,
        files[index],
      ] as const,
  ))
    run(
      database,
      `INSERT INTO content_source_selectors(
         content_source_id, content_id, source_id, selector_json,
         created_at, updated_at
       ) VALUES (?, ?, 'source:torrent:batch', ?, unixepoch(), unixepoch())`,
      `selector:${episode}`,
      episode,
      JSON.stringify({ type: "episode", fileId: file.id }),
    );
}

test("M04 S04.1 projeta Home e escopos sem fundir IDs ou vazar outra biblioteca", () => {
  const { root, databasePath, libraryId } = initialize();
  const database = new DatabaseSync(databasePath);
  const libraryB = "library:secondary";
  const libraryC = "library:private";
  addLibrary(database, libraryB, "Biblioteca B", path.join(root, "library-b"));
  addLibrary(database, libraryC, "Biblioteca C", path.join(root, "library-c"));
  addMovie(database, {
    id: "movie:local:shared",
    title: "Mesmo título",
    memberships: [
      { libraryId, position: 1 },
      { libraryId: libraryB, position: 2 },
    ],
    favorite: true,
    progress: 1_800,
    history: [{ endedAt: "2026-09-14T13:00:00.000Z" }],
    sourceId: "source:movie:shared",
  });
  addMovie(database, {
    id: "movie:local:same-title",
    title: "Mesmo título",
    memberships: [{ libraryId, position: 2 }],
  });
  addMovie(database, {
    id: "movie:local:third",
    title: "Terceiro",
    memberships: [{ libraryId, position: 3 }],
  });
  addMovie(database, {
    id: "movie:local:private",
    title: "Privado",
    memberships: [{ libraryId: libraryC, position: 1 }],
  });
  addSeries(database, libraryId);
  database.close();

  const store = new DiscoveryIndexStore(databasePath);
  try {
    const firstEvent = value(
      store.synchronizeCatalog({
        libraryId,
        mutation: { idempotencyKey: "discovery-first-sync" },
      }),
    );
    expect(firstEvent).toMatchObject({ revision: 1, reason: "catalog" });
    const replay = value(
      store.synchronizeCatalog({
        libraryId,
        mutation: { idempotencyKey: "discovery-first-sync" },
      }),
    );
    expect(replay).toEqual(firstEvent);

    const home = value(store.readHome({ libraryId, sectionLimit: 24 }));
    const movies = home.sections.find((section) => section.kind === "movies")!;
    const series = home.sections.find((section) => section.kind === "series")!;
    const recent = home.sections.find((section) => section.kind === "recent")!;
    expect(movies.items.map((item) => item.contentId)).toEqual([
      "movie:local:shared",
      "movie:local:same-title",
      "movie:local:third",
    ]);
    expect(
      movies.items.filter((item) => item.title === "Mesmo título"),
    ).toHaveLength(2);
    expect(
      recent.items.some((item) => item.contentId === "movie:local:private"),
    ).toBe(false);
    expect(movies.items[0]).toMatchObject({
      favorite: true,
      progress: { positionSeconds: 1_800, durationSeconds: 7_200 },
      memberships: [
        { id: libraryId, kind: "local" },
        { id: libraryB, kind: "local" },
      ],
      sources: [{ id: "source:movie:shared", quality: "4K" }],
    });
    expect(series.items[0]).toMatchObject({
      contentId: "series:local:batch",
      seasonCount: 2,
      episodeCount: 3,
      sources: [
        {
          id: "source:torrent:batch",
          quality: "1080p",
          availability: "available",
          localFileAvailable: false,
        },
      ],
    });
    expect(
      recent.items
        .filter((item) => item.type === "episode")
        .map((item) => item.contentId),
    ).toHaveLength(3);

    const firstPage = value(
      store.readScope({ libraryId, scopeId: libraryId, limit: 2 }),
    );
    const secondPage = value(
      store.readScope({
        libraryId,
        scopeId: libraryId,
        limit: 2,
        cursor: firstPage.page.nextCursor,
      }),
    );
    expect(firstPage.page.total).toBe(7);
    expect(
      new Set([
        ...firstPage.page.items.map((item) => item.contentId),
        ...secondPage.page.items.map((item) => item.contentId),
      ]).size,
    ).toBe(4);
    expect(
      store.readScope({ libraryId, scopeId: libraryC, limit: 2 }),
    ).toMatchObject({
      ok: false,
      error: { code: "DISCOVERY_UNAUTHORIZED" },
    });

    const mutationDatabase = new DatabaseSync(databasePath);
    run(
      mutationDatabase,
      "UPDATE movies SET metadata_json = json_set(metadata_json, '$.title', 'Título alterado') WHERE content_id = 'movie:local:third'",
    );
    mutationDatabase.close();
    value(
      store.synchronizeCatalog({
        libraryId,
        mutation: {
          idempotencyKey: "discovery-second-sync",
          expectedRevision: 1,
        },
      }),
    );
    expect(
      store.readScope({
        libraryId,
        scopeId: libraryId,
        limit: 2,
        cursor: firstPage.page.nextCursor,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: "DISCOVERY_CURSOR_STALE", retryable: true },
    });
  } finally {
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("M04 S04.1 preserva último snapshot em falha e o reabre sem reconstrução", () => {
  const { root, databasePath, libraryId } = initialize();
  const database = new DatabaseSync(databasePath);
  addMovie(database, {
    id: "movie:local:durable",
    title: "Durável",
    memberships: [{ libraryId, position: 1 }],
  });
  database.close();
  let store = new DiscoveryIndexStore(databasePath);
  try {
    value(
      store.synchronizeCatalog({
        libraryId,
        mutation: { idempotencyKey: "discovery-durable-sync" },
      }),
    );
    const corruption = new DatabaseSync(databasePath);
    run(
      corruption,
      "UPDATE movies SET metadata_json = json_set(metadata_json, '$.genres', json_array('Drama', NULL)) WHERE content_id = 'movie:local:durable'",
    );
    corruption.close();
    expect(
      store.synchronizeCatalog({
        libraryId,
        mutation: { idempotencyKey: "discovery-invalid-sync" },
      }),
    ).toMatchObject({
      ok: false,
      error: { code: "DISCOVERY_STORAGE_FAILED", recoverable: true },
    });
    expect(value(store.readHome({ libraryId })).hero?.title).toBe("Durável");
    store.close();

    store = new DiscoveryIndexStore(databasePath);
    const reopened = value(store.readHome({ libraryId }));
    expect(reopened).toMatchObject({ revision: 1, hero: { title: "Durável" } });
    const persisted = new DatabaseSync(databasePath);
    expect(
      persisted.prepare("SELECT COUNT(*) AS count FROM movies").get() as {
        count: number;
      },
    ).toMatchObject({ count: 1 });
    expect(
      persisted
        .prepare(
          "SELECT COUNT(*) AS count FROM schema_migrations WHERE version = 7",
        )
        .get() as { count: number },
    ).toMatchObject({ count: 1 });
    persisted.close();
  } finally {
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("M04 S04.1 mantém cinco queries de projeção em catálogo de dez mil itens", () => {
  test.slow();
  const { root, databasePath, libraryId } = initialize();
  const database = new DatabaseSync(databasePath);
  const insertContent = database.prepare(
    `INSERT INTO contents(id, type, created_at, updated_at)
     VALUES (?, 'movie', unixepoch(), unixepoch())`,
  );
  const insertMovie = database.prepare(
    `INSERT INTO movies(content_id, metadata_json, updated_at)
     VALUES (?, ?, unixepoch())`,
  );
  const insertState = database.prepare(
    `INSERT INTO user_content_state(
       content_id, favorite, progress, history_json, preferences_json, updated_at
     ) VALUES (?, 0, 0, '[]', '[]', unixepoch())`,
  );
  const insertMembership = database.prepare(
    `INSERT INTO library_memberships(
       library_id, content_id, order_index, preserved_overrides_json,
       created_at, updated_at
     ) VALUES (?, ?, ?, '[]', unixepoch(), unixepoch())`,
  );
  database.exec("BEGIN IMMEDIATE");
  for (let index = 0; index < 10_000; index += 1) {
    const id = `movie:corpus:${String(index).padStart(5, "0")}`;
    insertContent.run(id);
    insertMovie.run(
      id,
      JSON.stringify({
        id,
        title: `Filme ${String(index).padStart(5, "0")}`,
        duration: 90,
        genres: [],
        cast: [],
        externalIds: {},
      }),
    );
    insertState.run(id);
    insertMembership.run(libraryId, id, index);
  }
  database.exec("COMMIT");
  database.close();

  const store = new DiscoveryIndexStore(databasePath);
  try {
    value(
      store.synchronizeCatalog({
        libraryId,
        mutation: { idempotencyKey: "discovery-corpus-sync" },
      }),
    );
    expect(store.diagnostics()).toMatchObject({
      projectionQueryCount: 5,
      projectedContentCount: 10_000,
      changedContentCount: 10_000,
      removedContentCount: 0,
    });
    expect(
      value(store.readHome({ libraryId, sectionLimit: 24 })),
    ).toMatchObject({
      revision: 1,
      sections: expect.arrayContaining([
        expect.objectContaining({ kind: "movies", items: expect.any(Array) }),
      ]),
    });
    const page = value(
      store.readScope({ libraryId, scopeId: libraryId, limit: 128 }),
    );
    expect(page.page).toMatchObject({ total: 10_000 });
    expect(page.page.items).toHaveLength(128);
    const outsideWindow = value(
      store.search({
        libraryId,
        query: "Filme 09999",
        requestId: "request:outside-window",
      }),
    );
    expect(outsideWindow.page.items).toMatchObject([
      { contentId: "movie:corpus:09999" },
    ]);

    store.close();
    const planDatabase = new DatabaseSync(databasePath);
    const homePlan = planDatabase
      .prepare(
        `EXPLAIN QUERY PLAN
         SELECT snapshot_json FROM discovery_documents
         WHERE content_type = 'movie'
         ORDER BY sort_position, title_sort, content_id LIMIT 24`,
      )
      .all()
      .map((row) => String(row.detail));
    const scopePlan = planDatabase
      .prepare(
        `EXPLAIN QUERY PLAN
         SELECT d.content_id FROM discovery_origins o
         JOIN discovery_documents d ON d.content_id = o.content_id
         WHERE o.origin_id = ?
         ORDER BY d.sort_position, d.title_sort, d.content_id LIMIT 128`,
      )
      .all(libraryId)
      .map((row) => String(row.detail));
    expect(homePlan.join(" ")).toContain("idx_discovery_type_position");
    expect(scopePlan.join(" ")).toContain("idx_discovery_origins_scope");
    planDatabase.close();
  } finally {
    try {
      store.close();
    } catch {
      // The plan inspection closes the store before the shared cleanup.
    }
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("M04 S04.2 busca todos os campos e intersecta filtros sem interpretar operadores", () => {
  const { root, databasePath, libraryId } = initialize();
  const database = new DatabaseSync(databasePath);
  const secondaryId = "library:search-secondary";
  addLibrary(
    database,
    secondaryId,
    "Biblioteca Secundária",
    path.join(root, "secondary"),
  );
  addMovie(database, {
    id: "movie:search:heart-one",
    title: "Coração Valente",
    memberships: [
      { libraryId, position: 1 },
      { libraryId: secondaryId, position: 1 },
    ],
    favorite: true,
    progress: 900,
    history: [{ startedAt: "2026-09-14T10:00:00.000Z" }],
  });
  addMovie(database, {
    id: "movie:search:heart-two",
    title: "Coração Valente",
    memberships: [{ libraryId, position: 2 }],
  });
  addMovie(database, {
    id: "movie:search:synopsis",
    title: "Outro filme",
    memberships: [{ libraryId, position: 3 }],
    genres: ["Mistério"],
  });
  run(
    database,
    `UPDATE movies
     SET metadata_json = json_set(
       metadata_json,
       '$.originalTitle', 'Hidden Story',
       '$.synopsis', 'Uma investigação subterrânea'
     )
     WHERE content_id = 'movie:search:synopsis'`,
  );
  addSeries(database, libraryId);
  database.close();

  const store = new DiscoveryIndexStore(databasePath);
  try {
    value(
      store.synchronizeCatalog({
        libraryId,
        mutation: { idempotencyKey: "discovery-search-seed" },
      }),
    );
    expect(
      value(
        store.search({
          libraryId,
          query: "CORACAO val",
          requestId: "request:accent-prefix",
        }),
      )
        .page.items.map((item) => item.contentId)
        .sort(),
    ).toEqual(["movie:search:heart-one", "movie:search:heart-two"]);
    const firstHeartPage = value(
      store.search({
        libraryId,
        query: "coração",
        limit: 1,
        requestId: "request:heart-page-one",
      }),
    );
    const secondHeartPage = value(
      store.search({
        libraryId,
        query: "coração",
        limit: 1,
        cursor: firstHeartPage.page.nextCursor,
        requestId: "request:heart-page-two",
      }),
    );
    expect(firstHeartPage.page.total).toBe(2);
    expect(
      new Set([
        firstHeartPage.page.items[0].contentId,
        secondHeartPage.page.items[0].contentId,
      ]).size,
    ).toBe(2);
    expect(
      value(
        store.search({
          libraryId,
          query: "hidden subterranea",
          requestId: "request:original-synopsis",
        }),
      ).page.items,
    ).toMatchObject([{ contentId: "movie:search:synopsis" }]);
    expect(
      value(
        store.search({
          libraryId,
          query: "serie em lote episodio",
          type: "episode",
          requestId: "request:series-episode",
        }),
      ).page.items,
    ).toHaveLength(3);
    expect(
      value(
        store.search({
          libraryId,
          query: "biblioteca secundaria",
          requestId: "request:origin-name",
        }),
      ).page.items,
    ).toMatchObject([{ contentId: "movie:search:heart-one" }]);
    expect(
      value(
        store.search({
          libraryId,
          query: "",
          type: "movie",
          favorite: true,
          continuing: true,
          recent: true,
          scopeId: libraryId,
          requestId: "request:combined-filters",
        }),
      ).page.items,
    ).toMatchObject([{ contentId: "movie:search:heart-one" }]);
    expect(
      value(
        store.search({
          libraryId,
          query: "",
          genre: "Mistério",
          requestId: "request:genre-filter",
        }),
      ).page.items,
    ).toMatchObject([{ contentId: "movie:search:synopsis" }]);
    expect(
      store.search({
        libraryId,
        query: `' " OR * NEAR() -`,
        requestId: "request:hostile-expression",
      }).ok,
    ).toBe(true);
    expect(
      store.search({
        libraryId,
        query: "x".repeat(513),
        requestId: "request:oversized-query",
      }),
    ).toMatchObject({ ok: false, error: { code: "DISCOVERY_INVALID" } });
    value(store.cancelRequest({ requestId: "request:cancelled" }));
    expect(
      store.search({
        libraryId,
        query: "coração",
        requestId: "request:cancelled",
      }),
    ).toMatchObject({ ok: false, error: { code: "DISCOVERY_CANCELLED" } });
  } finally {
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("M04 S04.2 aplica rename/delete somente aos documentos afetados e faz rollback", () => {
  const { root, databasePath, libraryId } = initialize();
  const database = new DatabaseSync(databasePath);
  addMovie(database, {
    id: "movie:incremental:one",
    title: "Título Antigo",
    memberships: [{ libraryId, position: 1 }],
  });
  addMovie(database, {
    id: "movie:incremental:untouched",
    title: "Documento Intocado",
    memberships: [{ libraryId, position: 2 }],
  });
  database.close();
  const store = new DiscoveryIndexStore(databasePath);
  try {
    value(
      store.synchronizeCatalog({
        libraryId,
        mutation: { idempotencyKey: "discovery-incremental-seed" },
      }),
    );
    const oldSnapshot = value(
      store.search({
        libraryId,
        query: "titulo antigo",
        requestId: "request:before-rename",
      }),
    ).page.items[0];
    const inspection = new DatabaseSync(databasePath);
    const untouchedBefore = inspection
      .prepare(
        `SELECT rowid, title FROM discovery_search
         WHERE content_id = 'movie:incremental:untouched'`,
      )
      .get() as { rowid: number; title: string };
    inspection.close();
    const renamedDocument: ApplyDiscoveryIndexInput["upserts"][number] = {
      content: {
        ...oldSnapshot,
        title: "Título Incremental",
        synopsis: "Sinopse atualizada",
        memberships: oldSnapshot.memberships.map((membership) => ({
          ...membership,
          name: "Origem Renomeada",
        })),
        collections: [
          {
            id: "collection:cinema",
            kind: "collection",
            name: "Coleção Cinema",
            available: true,
          },
        ],
      },
      searchText: {
        title: "Título Incremental",
        originalTitle: oldSnapshot.originalTitle,
        synopsis: "Sinopse atualizada",
        seriesTitle: oldSnapshot.seriesTitle,
        episodeTitle: undefined,
        originNames: ["Origem Renomeada"],
        collectionNames: ["Coleção Cinema"],
      },
    };
    const renamed = value(
      store.apply({
        libraryId,
        upserts: [renamedDocument],
        removals: [],
        reason: "file-renamed",
        mutation: {
          idempotencyKey: "discovery-rename-document",
          expectedRevision: 1,
        },
      }),
    );
    expect(renamed).toMatchObject({
      revision: 2,
      contentIds: ["movie:incremental:one"],
      reason: "file-renamed",
    });
    expect(
      value(
        store.apply({
          libraryId,
          upserts: [renamedDocument],
          removals: [],
          reason: "file-renamed",
          mutation: {
            idempotencyKey: "discovery-rename-document",
            expectedRevision: 1,
          },
        }),
      ),
    ).toEqual(renamed);
    expect(
      value(
        store.search({
          libraryId,
          query: "titulo antigo",
          requestId: "request:after-rename-old",
        }),
      ).page.total,
    ).toBe(0);
    expect(
      value(
        store.search({
          libraryId,
          query: "origem renomeada",
          requestId: "request:after-origin-rename",
        }),
      ).page.items,
    ).toMatchObject([{ contentId: "movie:incremental:one" }]);
    expect(
      value(
        store.search({
          libraryId,
          query: "colecao cinema",
          collectionId: "collection:cinema",
          requestId: "request:collection-name-filter",
        }),
      ).page.items,
    ).toMatchObject([{ contentId: "movie:incremental:one" }]);
    const afterRename = new DatabaseSync(databasePath);
    expect(
      afterRename
        .prepare(
          `SELECT rowid, title FROM discovery_search
           WHERE content_id = 'movie:incremental:untouched'`,
        )
        .get(),
    ).toEqual(untouchedBefore);
    afterRename.close();

    const invalidDocument = structuredClone(renamedDocument);
    invalidDocument.content.contentId = "movie:missing:rollback";
    invalidDocument.content.title = "Não deve persistir";
    invalidDocument.searchText.title = "Não deve persistir";
    expect(
      store.apply({
        libraryId,
        upserts: [
          {
            ...renamedDocument,
            content: {
              ...renamedDocument.content,
              title: "Também não persiste",
            },
            searchText: {
              ...renamedDocument.searchText,
              title: "Também não persiste",
            },
          },
          invalidDocument,
        ],
        removals: [],
        reason: "file-changed",
        mutation: {
          idempotencyKey: "discovery-rollback-apply",
          expectedRevision: 2,
        },
      }),
    ).toMatchObject({ ok: false, error: { code: "DISCOVERY_STORAGE_FAILED" } });
    expect(
      value(
        store.search({
          libraryId,
          query: "titulo incremental",
          requestId: "request:after-rollback",
        }),
      ).page.items,
    ).toMatchObject([{ contentId: "movie:incremental:one" }]);

    value(
      store.apply({
        libraryId,
        upserts: [],
        removals: ["movie:incremental:one"],
        reason: "file-removed",
        mutation: {
          idempotencyKey: "discovery-remove-document",
          expectedRevision: 2,
        },
      }),
    );
    expect(
      value(
        store.search({
          libraryId,
          query: "titulo incremental",
          requestId: "request:after-delete",
        }),
      ).page.total,
    ).toBe(0);
  } finally {
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("M04 S04.2 migra v7, preserva FTS intacto no restart e recupera índice ausente", () => {
  const { root, databasePath, libraryId } = initialize();
  const database = new DatabaseSync(databasePath);
  addMovie(database, {
    id: "movie:search:durable",
    title: "Busca Durável",
    memberships: [{ libraryId, position: 1 }],
  });
  database.close();
  let store = new DiscoveryIndexStore(databasePath);
  try {
    value(
      store.synchronizeCatalog({
        libraryId,
        mutation: { idempotencyKey: "discovery-fts-durable" },
      }),
    );
    store.close();

    const v7 = new DatabaseSync(databasePath);
    v7.exec("DROP TABLE discovery_search");
    run(v7, "DELETE FROM schema_migrations WHERE version = 8");
    v7.close();
    store = new DiscoveryIndexStore(databasePath);
    expect(
      value(
        store.search({
          libraryId,
          query: "busca duravel",
          requestId: "request:v7-backfill",
        }),
      ).page.items,
    ).toMatchObject([{ contentId: "movie:search:durable" }]);
    const migrationDatabase = new DatabaseSync(databasePath);
    const beforeRestart = migrationDatabase
      .prepare("SELECT rowid, content_id, title FROM discovery_search")
      .all();
    migrationDatabase.close();
    store.close();

    store = new DiscoveryIndexStore(databasePath);
    const afterRestartDatabase = new DatabaseSync(databasePath);
    expect(
      afterRestartDatabase
        .prepare("SELECT rowid, content_id, title FROM discovery_search")
        .all(),
    ).toEqual(beforeRestart);
    store.close();
    afterRestartDatabase.exec("DROP TABLE discovery_search");
    afterRestartDatabase.close();

    store = new DiscoveryIndexStore(databasePath);
    expect(value(store.readHome({ libraryId })).hero?.title).toBe(
      "Busca Durável",
    );
    expect(
      store.search({
        libraryId,
        query: "duravel",
        requestId: "request:corrupt-before-recovery",
      }),
    ).toMatchObject({
      ok: false,
      error: { code: "DISCOVERY_INDEX_CORRUPT", retryable: true },
    });
    value(
      store.rebuildSearchIndex({
        libraryId,
        mutation: { idempotencyKey: "discovery-explicit-rebuild" },
      }),
    );
    expect(
      value(
        store.search({
          libraryId,
          query: "duravel",
          requestId: "request:after-recovery",
        }),
      ).page.items,
    ).toMatchObject([{ contentId: "movie:search:durable" }]);
  } finally {
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});
