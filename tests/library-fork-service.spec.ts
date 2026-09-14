import { expect, test } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const {
  LibraryDraftApplicationService,
} = require("../packages/core/src/library-draft-service.cjs");
test("M17 S04 fork é atômico, idempotente, independente e editável", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-fork-"));
  const service = new LibraryDraftApplicationService(path.join(root, "db"));
  const snapshot = {
    version: 3,
    draft: {
      id: "origin",
      revision: 3,
      name: "Origin",
      description: "",
      author: "",
      avatar: "",
      logo: "",
      banner: "",
      accent: "#00296B",
      memberships: [
        { contentId: "movie:1", sourceIds: ["source:1"], titleOverride: "" },
      ],
      collections: [{ id: "old:c", name: "C", items: ["movie:1"] }],
      sections: [
        { id: "old:s", title: "S", type: "carousel", collectionId: "old:c" },
      ],
    },
    catalog: [
      {
        id: "movie:1",
        title: "Movie",
        synopsis: "",
        poster: "/movie-art/a.svg",
        sources: [
          { id: "source:1", name: "1080p", local: false, origin: "Origin" },
        ],
      },
    ],
  };
  const first = service.fork(snapshot, "Copy", true, "fork-op-1");
  const replay = service.fork(snapshot, "Copy", true, "fork-op-1");
  expect(first).toEqual(replay);
  expect(first.value.id).not.toBe("origin");
  expect(first.value.provenance).toEqual({ libraryId: "origin", version: 3 });
  expect(service.catalog().value[0].id).toBe("movie:1");
  const saved = service.save({
    draft: first.value,
    mutation: { idempotencyKey: "save-fork" },
  });
  expect(saved.ok).toBe(true);
  expect(snapshot.draft.name).toBe("Origin");
  service.close();
  fs.rmSync(root, { recursive: true });
});
