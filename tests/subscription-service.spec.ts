import { expect, test } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const {
  SubscriptionService,
} = require("../packages/core/src/subscription-service.cjs");
const snap = (v: number, integrity = `${v}`.repeat(64)) => ({
  key: `library:one@${v}`,
  schema: "1.0",
  version: v,
  integrity,
  warnings: [],
  draft: {
    id: "library:one",
    name: "One",
    revision: v,
    memberships: [],
    collections: [],
    sections: [],
  },
  catalog: [],
});
test("M16 S04 aplica update atomicamente, preserva anterior e rollback", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-sub-"));
  let remote = snap(2);
  const service = new SubscriptionService({
    databasePath: path.join(root, "db"),
    registry: { resolve: async () => remote },
    verify: () => ({ status: "unsigned" }),
  });
  service.install(snap(1));
  const next = await service.check("library:one");
  service.apply("library:one", next);
  expect(service.list()[0].snapshot.version).toBe(2);
  service.rollback("library:one");
  expect(service.list()[0].snapshot.version).toBe(1);
  remote = snap(1, "x".repeat(64));
  await expect(service.check("library:one")).rejects.toThrow("hash divergente");
  service.close();
  fs.rmSync(root, { recursive: true });
});
test("M16 S04 falha de verify preserva versão instalada e unsubscribe não apaga pessoal", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-sub-"));
  const service = new SubscriptionService({
    databasePath: path.join(root, "db"),
    registry: {},
    verify: (s: { version: number }) => ({
      status: s.version === 2 ? "invalid" : "unsigned",
      message: "inválida",
    }),
  });
  service.install(snap(1));
  expect(() => service.apply("library:one", snap(2))).toThrow("inválida");
  expect(service.list()[0].snapshot.version).toBe(1);
  service.savePersonal({
    id: "content:one",
    title: "One",
    synopsis: "",
    poster: "",
    sources: [],
  });
  service.unsubscribe("library:one");
  expect(service.favorite("content:one")).toBe(false);
  service.close();
  fs.rmSync(root, { recursive: true });
});
