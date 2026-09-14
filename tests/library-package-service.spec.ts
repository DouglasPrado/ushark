import { expect, test } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const {
  LibraryPackageApplicationService,
  digest,
} = require("@ushark/core/library-package");

const draft = {
  id: "draft:portable",
  revision: 1,
  name: "Portátil",
  description: "Offline",
  author: "Autor",
  avatar: "",
  logo: "",
  banner: "/movie-art/orbitas.svg",
  accent: "#87bbef",
  memberships: [
    {
      contentId: "movie:portable",
      sourceIds: ["source:portable"],
      titleOverride: "Título portátil",
    },
  ],
  collections: [
    {
      id: "collection:portable",
      name: "Seleção",
      items: ["movie:portable"],
    },
  ],
  sections: [
    {
      id: "section:portable",
      title: "Destaques",
      type: "grid",
      collectionId: "collection:portable",
    },
  ],
};
const catalog = [
  {
    id: "movie:portable",
    title: "Global",
    poster: "/movie-art/orbitas.svg",
    sources: [
      {
        id: "source:portable",
        name: "Source",
        local: true,
        origin: "Local",
      },
    ],
  },
];

function service(root: string, name: string) {
  const databasePath = path.join(root, `${name}.db`);
  const database = new DatabaseSync(databasePath);
  database.exec(
    "CREATE TABLE library_drafts(id TEXT PRIMARY KEY,revision INTEGER,draft_json TEXT,private INTEGER,created_at INTEGER,updated_at INTEGER)",
  );
  database
    .prepare(
      "INSERT INTO library_drafts VALUES(?,?,?,1,unixepoch(),unixepoch())",
    )
    .run(draft.id, draft.revision, JSON.stringify(draft));
  database.close();
  return new LibraryPackageApplicationService({
    databasePath,
    exportRoot: path.join(root, `${name}-exports`),
    catalogProvider: () => ({ ok: true, value: catalog }),
  });
}

test("M13 S04.1 gera versões imutáveis com SHA-256 canônico", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-package-"));
  const writer = service(root, "writer");
  const firstPath = path.join(root, "one.tslib");
  const secondPath = path.join(root, "two.tslib");
  const first = writer.export({ draftId: draft.id, revision: 1 }, firstPath);
  const second = writer.export({ draftId: draft.id, revision: 1 }, secondPath);
  expect(first).toMatchObject({
    ok: true,
    value: { key: "draft:portable@1", schema: "1.0", version: 1 },
  });
  expect(second).toMatchObject({
    ok: true,
    value: { key: "draft:portable@2", version: 2 },
  });
  expect(first.ok && first.value.integrity).toMatch(/^[a-f0-9]{64}$/);
  expect(fs.readFileSync(firstPath, "utf8")).not.toMatch(
    /progress|favorite|preferences|\.mkv|\/Users\//,
  );
  writer.close();
});

test("M13 S04.2 roundtrip offline preserva identidade, ordem e layout", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-package-"));
  const writer = service(root, "writer");
  const reader = service(root, "reader");
  const file = path.join(root, "portable.tslib");
  const exported = writer.export({ draftId: draft.id, revision: 1 }, file);
  if (!exported.ok) throw new Error(exported.error.message);
  const staged = reader.stageFile(file);
  expect(staged).toEqual({
    ok: true,
    value: { ...exported.value, fileName: "portable.tslib" },
  });
  if (!staged.ok) throw new Error(staged.error.message);
  expect(
    reader.commit({
      snapshot: staged.value,
      mutation: { idempotencyKey: "import:portable" },
    }),
  ).toMatchObject({
    ok: true,
    value: {
      snapshot: {
        draft: {
          id: draft.id,
          collections: [{ id: "collection:portable" }],
          sections: [{ id: "section:portable", title: "Destaques" }],
        },
      },
    },
  });
  expect(reader.list()).toMatchObject({
    ok: true,
    value: { received: [{ key: "draft:portable@1" }] },
  });
  writer.close();
  reader.close();
});

test("M13 S04.3 rejeita tamper, traversal, código, major, assinatura e symlink", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-package-"));
  const writer = service(root, "writer");
  const reader = service(root, "reader");
  const file = path.join(root, "portable.tslib");
  const exported = writer.export({ draftId: draft.id, revision: 1 }, file);
  if (!exported.ok) throw new Error(exported.error.message);
  expect(
    reader.stageSnapshot({ ...exported.value, integrity: "0".repeat(64) }),
  ).toMatchObject({
    ok: false,
    error: { code: "PACKAGE_INTEGRITY_FAILED" },
  });
  for (const mutate of [
    (value: typeof exported.value) => ({
      ...value,
      draft: { ...value.draft, banner: "../../secret" },
    }),
    (value: typeof exported.value) => ({
      ...value,
      draft: { ...value.draft, description: "<script>alert(1)</script>" },
    }),
    (value: typeof exported.value) => ({ ...value, schema: "2.0" }),
    (value: typeof exported.value) => ({
      ...value,
      signature: { key: "x", integrity: value.integrity, valid: true },
    }),
  ]) {
    const changed = mutate(exported.value);
    const candidate = { ...changed, integrity: digest(changed) };
    expect(reader.stageSnapshot(candidate).ok).toBe(false);
  }
  const link = path.join(root, "linked.tslib");
  fs.symlinkSync(file, link);
  expect(reader.stageFile(link)).toMatchObject({
    ok: false,
    error: { code: "PACKAGE_INVALID" },
  });
  expect(reader.list()).toMatchObject({
    ok: true,
    value: { received: [] },
  });
  writer.close();
  reader.close();
});
