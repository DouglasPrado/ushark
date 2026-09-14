import { expect, test } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const {
  RegistryPublisherService,
} = require("../packages/core/src/registry-publisher-service.cjs");
const draft = {
  id: "library:one",
  name: "One",
  author: "A",
  revision: 1,
  memberships: [],
  collections: [],
  sections: [],
};
test("M15 S04 stage precede commit, versiona imutável e retira sem apagar", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-pub-"));
  const calls: string[] = [];
  let version = 0;
  const registry = {
    stage: async () => {
      calls.push("stage");
    },
    commit: async (snapshot: { version: number }, expected: number) => {
      calls.push("commit");
      if (expected !== version) throw new Error("Conflito");
      version = snapshot.version;
      return {
        link: `https://registry.test/${version}`,
        code: `ONE-${version}`,
      };
    },
    withdraw: async () => {
      calls.push("withdraw");
    },
  };
  const service = new RegistryPublisherService({
    databasePath: path.join(root, "db"),
    registry,
  });
  const review = service.prepare(draft, []);
  const row = await service.publish(review, "op:1");
  expect(calls).toEqual(["stage", "commit"]);
  expect(row.snapshot.version).toBe(1);
  await service.withdraw(draft.id, "op:2");
  expect(service.list()[0].withdrawn).toBe(true);
  expect(service.list()[0].snapshot).toEqual(row.snapshot);
  service.close();
  fs.rmSync(root, { recursive: true });
});
test("M15 S04 conflito remoto não ativa versão parcial", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-pub-"));
  const service = new RegistryPublisherService({
    databasePath: path.join(root, "db"),
    registry: {
      stage: async () => {},
      commit: async () => {
        throw new Error("Conflito de versão");
      },
    },
  });
  await expect(
    service.publish(service.prepare(draft, []), "op:x"),
  ).rejects.toThrow("Conflito");
  expect(service.list()).toEqual([]);
  service.close();
  fs.rmSync(root, { recursive: true });
});
