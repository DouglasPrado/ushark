import { expect, test } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { Configuration, ConfigurationSnapshot } from "@ushark/types";
import type {
  MovieCatalogCommandResult,
  MovieCatalogResult,
  MovieCatalogSnapshot,
  MovieDraft,
} from "@ushark/types/movies";

const {
  ConfigurationStore,
}: {
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
} = require("@ushark/core/configuration");

const {
  MovieCatalogStore,
}: {
  MovieCatalogStore: new (
    databasePath: string,
    options?: { managedLibraryRoot?: string },
  ) => {
    read(input: {
      libraryId: string;
    }): MovieCatalogResult<MovieCatalogSnapshot>;
    save(input: {
      libraryId: string;
      draft: MovieDraft;
      mutation: { idempotencyKey: string; expectedRevision?: number };
    }): MovieCatalogResult<MovieCatalogCommandResult>;
    toggleFavorite(input: {
      libraryId: string;
      contentId: string;
      mutation: { idempotencyKey: string; expectedRevision?: number };
    }): MovieCatalogResult<MovieCatalogCommandResult>;
    removeSource(input: {
      libraryId: string;
      contentId: string;
      sourceId: string;
      mutation: { idempotencyKey: string };
    }): MovieCatalogResult<MovieCatalogCommandResult>;
    removeMembership(input: {
      libraryId: string;
      contentId: string;
      membershipLibraryId: string;
      mutation: { idempotencyKey: string };
    }): MovieCatalogResult<MovieCatalogCommandResult>;
    registerManagedFile(sourceId: string, filePath: string): void;
    deleteManagedFile(input: {
      libraryId: string;
      contentId: string;
      sourceId: string;
      confirm: boolean;
      mutation: { idempotencyKey: string };
    }): MovieCatalogResult<MovieCatalogCommandResult>;
    close(): void;
  };
} = require("@ushark/core/movies");

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-movies-"));
  const databasePath = path.join(root, "state", "ushark.db");
  const configurationStore = new ConfigurationStore(
    databasePath,
    path.join(root, "managed"),
  );
  const base = configurationStore.read().configuration;
  const configuration = configurationStore.save(
    {
      ...base,
      libraryPath: path.join(root, "library"),
      cachePath: path.join(root, "cache"),
    },
    { completeOnboarding: true },
  ).configuration;
  configurationStore.close();
  return {
    root,
    databasePath,
    libraryId: configuration.libraryId,
    store: new MovieCatalogStore(databasePath),
  };
}

function draft(
  id: string,
  title: string,
  sourceId = `source:${id}`,
): MovieDraft {
  return {
    metadata: {
      id,
      title,
      genres: ["Drama"],
      cast: [],
      externalIds: id.includes(":tmdb:")
        ? { tmdb: id.split(":").at(-1) }
        : undefined,
    },
    source: {
      id: sourceId,
      name: `${title}.mkv`,
      availability: "declared",
      fileAvailable: false,
    },
  };
}

function value<T>(result: MovieCatalogResult<T>): T {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

test("M02 store persiste catálogo relacional, ordem e favorito após restart", () => {
  const { root, databasePath, libraryId, store } = fixture();
  try {
    value(
      store.save({
        libraryId,
        draft: draft("movie:local:first", "Primeiro"),
        mutation: { idempotencyKey: "save-first-0001" },
      }),
    );
    value(
      store.save({
        libraryId,
        draft: draft("movie:local:second", "Segundo"),
        mutation: { idempotencyKey: "save-second-0001" },
      }),
    );
    value(
      store.toggleFavorite({
        libraryId,
        contentId: "movie:local:second",
        mutation: { idempotencyKey: "favorite-second-0001" },
      }),
    );
    store.close();

    const reopened = new MovieCatalogStore(databasePath);
    const snapshot = value(reopened.read({ libraryId }));
    expect(snapshot).toMatchObject({ schemaVersion: 1, revision: 3 });
    expect(snapshot.movies.map((movie) => movie.id)).toEqual([
      "movie:local:first",
      "movie:local:second",
    ]);
    expect(snapshot.movies[1]).toMatchObject({
      personal: { favorite: true },
      sources: [{ id: "source:movie:local:second", availability: "declared" }],
    });
    reopened.close();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("M02 store torna retry idempotente e rejeita revisão obsoleta", () => {
  const { root, libraryId, store } = fixture();
  try {
    const input = {
      libraryId,
      draft: draft("movie:local:stable", "Estável"),
      mutation: { idempotencyKey: "save-stable-0001", expectedRevision: 0 },
    };
    const first = value(store.save(input));
    const replay = value(store.save(input));
    expect(replay).toEqual(first);
    expect(value(store.read({ libraryId })).revision).toBe(1);

    const stale = store.save({
      libraryId,
      draft: draft("movie:local:stale", "Obsoleto"),
      mutation: { idempotencyKey: "save-stale-0001", expectedRevision: 0 },
    });
    expect(stale).toMatchObject({
      ok: false,
      error: { code: "CATALOG_REVISION_CONFLICT", retryable: true },
    });
    expect(value(store.read({ libraryId })).movies).toHaveLength(1);
    store.close();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("M02 merge é conservador e preserva relações e estados dos dois lados", () => {
  const { root, databasePath, libraryId, store } = fixture();
  try {
    value(
      store.save({
        libraryId,
        draft: draft("movie:tmdb:42", "Canônico", "source:canonical"),
        mutation: { idempotencyKey: "save-canonical-0001" },
      }),
    );
    value(
      store.save({
        libraryId,
        draft: draft("movie:local:draft", "Local", "source:local"),
        mutation: { idempotencyKey: "save-local-0001" },
      }),
    );
    const database = new DatabaseSync(databasePath);
    database
      .prepare(
        "UPDATE user_content_state SET favorite = 1, progress = 900, history_json = '[\"local\"]' WHERE content_id = ?",
      )
      .run("movie:local:draft");
    database
      .prepare(
        "UPDATE user_content_state SET progress = 400, history_json = '[\"canonical\"]', preferences_json = '[\"audio:pt-BR\"]' WHERE content_id = ?",
      )
      .run("movie:tmdb:42");
    database
      .prepare(
        "UPDATE library_memberships SET title_override = ? WHERE library_id = ? AND content_id = ?",
      )
      .run("Título canônico", libraryId, "movie:tmdb:42");
    database
      .prepare(
        "UPDATE library_memberships SET title_override = ? WHERE library_id = ? AND content_id = ?",
      )
      .run("Título local", libraryId, "movie:local:draft");
    database.exec(`
      CREATE TABLE torrent_sources(source_id TEXT PRIMARY KEY);
      INSERT INTO torrent_sources(source_id) VALUES ('source:local');
      CREATE TABLE content_source_selectors (
        content_source_id TEXT PRIMARY KEY,
        content_id TEXT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
        source_id TEXT NOT NULL REFERENCES torrent_sources(source_id) ON DELETE RESTRICT,
        selector_json TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        selected_subtitle_file_id TEXT,
        UNIQUE(content_id, source_id)
      );
      INSERT INTO content_source_selectors(
        content_source_id, content_id, source_id, selector_json, created_at, updated_at
      ) VALUES (
        'content-source:local', 'movie:local:draft', 'source:local',
        '{"type":"manual","fileId":"file:3"}', unixepoch(), unixepoch()
      );
    `);
    database.close();

    const merged = value(
      store.save({
        libraryId,
        draft: {
          ...draft("movie:tmdb:42", "Canônico", "source:new"),
          editingId: "movie:local:draft",
          confirmMerge: true,
        },
        mutation: { idempotencyKey: "merge-local-canonical-0001" },
      }),
    ).movie!;
    expect(merged.id).toBe("movie:tmdb:42");
    expect(merged.sources.map((source) => source.id).sort()).toEqual([
      "source:canonical",
      "source:local",
      "source:new",
    ]);
    expect(merged.personal).toMatchObject({
      favorite: true,
      progress: 900,
      history: ["canonical", "local"],
      preferences: ["audio:pt-BR"],
    });
    expect(merged.memberships[0]).toMatchObject({
      titleOverride: "Título canônico",
      preservedOverrides: ["Título local"],
    });
    const mergedDatabase = new DatabaseSync(databasePath);
    expect(
      mergedDatabase
        .prepare(
          "SELECT content_id, source_id, selector_json FROM content_source_selectors",
        )
        .get(),
    ).toEqual({
      content_id: "movie:tmdb:42",
      source_id: "source:local",
      selector_json: '{"type":"manual","fileId":"file:3"}',
    });
    mergedDatabase.close();
    expect(value(store.read({ libraryId })).movies).toHaveLength(1);
    store.close();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("M02 falha intermediária de merge faz rollback integral", () => {
  const { root, databasePath, libraryId, store } = fixture();
  try {
    value(
      store.save({
        libraryId,
        draft: draft("movie:tmdb:99", "Destino"),
        mutation: { idempotencyKey: "save-target-0001" },
      }),
    );
    value(
      store.save({
        libraryId,
        draft: draft("movie:local:rollback", "Origem"),
        mutation: { idempotencyKey: "save-rollback-0001" },
      }),
    );
    const database = new DatabaseSync(databasePath);
    database.exec(`
      CREATE TRIGGER reject_merge_delete BEFORE DELETE ON contents
      WHEN OLD.id = 'movie:local:rollback'
      BEGIN SELECT RAISE(ABORT, 'injected merge failure'); END;
    `);
    database.close();

    const result = store.save({
      libraryId,
      draft: {
        ...draft("movie:tmdb:99", "Destino"),
        editingId: "movie:local:rollback",
        confirmMerge: true,
      },
      mutation: { idempotencyKey: "merge-rollback-0001" },
    });
    expect(result).toMatchObject({
      ok: false,
      error: { code: "CATALOG_STORAGE_FAILED" },
    });
    expect(
      value(store.read({ libraryId })).movies.map((movie) => movie.id),
    ).toEqual(["movie:tmdb:99", "movie:local:rollback"]);
    store.close();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("M02 remover vínculo ou source não apaga Content nem arquivo", () => {
  const { root, databasePath, libraryId, store } = fixture();
  try {
    value(
      store.save({
        libraryId,
        draft: draft("movie:local:preserved", "Preservado", "source:preserved"),
        mutation: { idempotencyKey: "save-preserved-0001" },
      }),
    );
    value(
      store.removeSource({
        libraryId,
        contentId: "movie:local:preserved",
        sourceId: "source:preserved",
        mutation: { idempotencyKey: "remove-source-0001" },
      }),
    );
    value(
      store.removeMembership({
        libraryId,
        contentId: "movie:local:preserved",
        membershipLibraryId: libraryId,
        mutation: { idempotencyKey: "remove-membership-0001" },
      }),
    );
    const database = new DatabaseSync(databasePath, { readOnly: true });
    expect(database.prepare("SELECT id FROM contents").get()).toEqual({
      id: "movie:local:preserved",
    });
    expect(database.prepare("SELECT id FROM sources").get()).toEqual({
      id: "source:preserved",
    });
    expect(
      database.prepare("SELECT COUNT(*) AS count FROM content_sources").get(),
    ).toEqual({
      count: 0,
    });
    database.close();
    store.close();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("M02 migração aditiva v2 mantém configuração M01 reabrível", () => {
  const { root, databasePath, libraryId, store } = fixture();
  try {
    store.close();
    const database = new DatabaseSync(databasePath, { readOnly: true });
    expect(
      database
        .prepare("SELECT version, name FROM schema_migrations ORDER BY version")
        .all(),
    ).toEqual([
      { version: 1, name: "m01_configuration" },
      { version: 2, name: "m02_movie_catalog" },
    ]);
    database.close();
    const configuration = new ConfigurationStore(
      databasePath,
      path.join(root, "managed"),
    );
    expect(configuration.read().configuration.libraryId).toBe(libraryId);
    configuration.close();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("M02 exclui somente arquivo registrado dentro da raiz gerenciada", () => {
  const { root, databasePath, libraryId, store: initialStore } = fixture();
  try {
    initialStore.close();
    const libraryRoot = path.join(root, "library");
    fs.mkdirSync(libraryRoot, { recursive: true });
    const managed = path.join(libraryRoot, "managed.mkv");
    const outside = path.join(root, "outside.mkv");
    fs.writeFileSync(managed, "managed fixture");
    fs.writeFileSync(outside, "outside fixture");
    const store = new MovieCatalogStore(databasePath, {
      managedLibraryRoot: libraryRoot,
    });
    value(
      store.save({
        libraryId,
        draft: draft("movie:local:managed", "Gerenciado", "source:managed"),
        mutation: { idempotencyKey: "save-managed-0001" },
      }),
    );
    expect(() => store.registerManagedFile("source:managed", outside)).toThrow(
      /não pertence/,
    );
    store.registerManagedFile("source:managed", managed);

    expect(
      store.deleteManagedFile({
        libraryId,
        contentId: "movie:local:managed",
        sourceId: "source:managed",
        confirm: false,
        mutation: { idempotencyKey: "delete-unconfirmed-0001" },
      }),
    ).toMatchObject({
      ok: false,
      error: { code: "FILE_DELETE_NOT_CONFIRMED" },
    });
    expect(fs.existsSync(managed)).toBe(true);

    const deleted = value(
      store.deleteManagedFile({
        libraryId,
        contentId: "movie:local:managed",
        sourceId: "source:managed",
        confirm: true,
        mutation: { idempotencyKey: "delete-confirmed-0001" },
      }),
    );
    expect(fs.existsSync(managed)).toBe(false);
    expect(fs.existsSync(outside)).toBe(true);
    expect(deleted.movie).toMatchObject({
      id: "movie:local:managed",
      sources: [
        {
          id: "source:managed",
          availability: "missing",
          fileAvailable: false,
          managedFile: false,
        },
      ],
    });
    store.close();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
