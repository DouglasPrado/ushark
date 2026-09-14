import { expect, test } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const { ConfigurationStore } = require("@ushark/core/configuration");
const { MovieCatalogStore } = require("@ushark/core/movies");
const { SeriesCatalogStore } = require("@ushark/core/series");
const {
  TorrentInspectionStore,
} = require("@ushark/core/torrent-inspection-store");
const {
  LibraryDraftApplicationService,
} = require("@ushark/core/library-drafts");

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-draft-"));
  const databasePath = path.join(root, "ushark.db");
  const configuration = new ConfigurationStore(
    databasePath,
    path.join(root, "managed"),
  );
  const initial = configuration.read().configuration;
  const config = configuration.save(initial, {
    completeOnboarding: true,
  }).configuration;
  configuration.close();
  const movies = new MovieCatalogStore(databasePath);
  const saved = movies.save({
    libraryId: config.libraryId,
    draft: {
      metadata: {
        id: "movie:draft",
        title: "Título global",
        synopsis: "Global",
        genres: [],
        cast: [],
      },
      source: {
        id: "source:draft",
        name: "draft.mkv",
        availability: "unavailable",
        fileAvailable: false,
      },
    },
    mutation: { idempotencyKey: "seed:draft" },
  });
  if (!saved.ok) throw new Error(`${saved.error.code}: ${saved.error.message}`);
  movies.close();
  new TorrentInspectionStore(databasePath).close();
  new SeriesCatalogStore(databasePath).close();
  const service = new LibraryDraftApplicationService(databasePath);
  const draft = {
    id: "draft:one",
    revision: 0,
    name: "Minha curadoria",
    description: "Descrição",
    author: "Douglas",
    avatar: "",
    logo: "",
    banner: "",
    accent: "#87bbef",
    memberships: [
      {
        contentId: "movie:draft",
        sourceIds: ["source:draft"],
        titleOverride: "Título curado",
      },
    ],
    collections: [
      { id: "collection:one", name: "Destaques", items: ["movie:draft"] },
    ],
    sections: [
      {
        id: "section:one",
        title: "Hero",
        type: "hero" as const,
        collectionId: "collection:one",
      },
    ],
  };
  return { service, databasePath, draft };
}

test("M12 S04.1 salva e reabre draft com revisão", () => {
  const { service, draft, databasePath } = fixture();
  const saved = service.save({
    draft,
    mutation: { idempotencyKey: "draft:save:one" },
  });
  expect(saved).toMatchObject({
    ok: true,
    value: { id: "draft:one", revision: 1, name: "Minha curadoria" },
  });
  service.close();
  const reopened = new LibraryDraftApplicationService(databasePath);
  expect(reopened.list()).toMatchObject({
    ok: true,
    value: [{ id: "draft:one", revision: 1 }],
  });
  reopened.close();
});

test("M12 S04.2 reordena preservando IDs e metadata global", () => {
  const { service, draft, databasePath } = fixture();
  const first = service.save({
    draft,
    mutation: { idempotencyKey: "draft:save:first" },
  });
  if (!first.ok) throw new Error(first.error.message);
  const second = service.save({
    draft: {
      ...first.value,
      collections: [{ ...first.value.collections[0], name: "Renomeada" }],
    },
    mutation: { idempotencyKey: "draft:save:second" },
  });
  expect(second).toMatchObject({
    ok: true,
    value: {
      revision: 2,
      collections: [{ id: "collection:one", name: "Renomeada" }],
      sections: [{ id: "section:one" }],
    },
  });
  const database = new DatabaseSync(databasePath);
  expect(
    JSON.parse(
      database
        .prepare("SELECT metadata_json FROM movies WHERE content_id=?")
        .get("movie:draft")!.metadata_json as string,
    ).title,
  ).toBe("Título global");
  database.close();
  service.close();
});

test("M12 S04.3 leitura de preview exclui estado pessoal e não publica", () => {
  const { service, draft, databasePath } = fixture();
  const saved = service.save({
    draft,
    mutation: { idempotencyKey: "draft:preview" },
  });
  if (!saved.ok) throw new Error(saved.error.message);
  const listed = service.list();
  expect(listed).toEqual({ ok: true, value: [saved.value] });
  expect(JSON.stringify(listed)).not.toMatch(
    /favorite|progress|history|preferences/,
  );
  const database = new DatabaseSync(databasePath);
  expect(
    database
      .prepare("SELECT private FROM library_drafts WHERE id='draft:one'")
      .get()!.private,
  ).toBe(1);
  expect(
    database
      .prepare("SELECT name FROM sqlite_master WHERE name LIKE '%publish%'")
      .all(),
  ).toEqual([]);
  database.close();
  service.close();
});
