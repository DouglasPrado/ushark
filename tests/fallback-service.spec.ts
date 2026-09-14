import { expect, test } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const {
  FallbackService,
} = require("../packages/core/src/fallback-service.cjs");
test("M19 S04 reranking, preparo e cooldown persistem localmente", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-fb-"));
  let prepared = "";
  const service = new FallbackService({
    databasePath: path.join(root, "db"),
    now: () => 1000,
    sources: () => [
      { id: "a", name: "A", local: true },
      { id: "b", name: "B", local: true },
    ],
    prepare: async (content: string, candidate: { id: string }) => {
      prepared = `${content}:${candidate.id}`;
    },
  });
  const alternatives = service.alternatives("movie:1", "a");
  await service.prepare(alternatives[0], "");
  expect(prepared).toBe("movie:1:b");
  service.record("b", false);
  expect(service.cooldown("b")).toBe(true);
  service.advance(31);
  expect(service.cooldown("b")).toBe(false);
  expect(service.history()[0].algorithm).toBe("fallback-v1");
  service.close();
  fs.rmSync(root, { recursive: true });
});
test("M19 S04 candidato incompatível nunca prepara", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-fb-"));
  let called = false;
  const service = new FallbackService({
    databasePath: path.join(root, "db"),
    sources: () => [],
    prepare: async () => {
      called = true;
    },
  });
  await expect(service.prepare({ id: "x", compatible: false })).rejects.toThrow(
    "Compatibilidade",
  );
  expect(called).toBe(false);
  service.close();
  fs.rmSync(root, { recursive: true });
});
