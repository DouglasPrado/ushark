import { expect, test } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const {
  DiagnosticsService,
  redact,
} = require("../packages/core/src/diagnostics-service.cjs");
test("M20 S04 coleta unknown separado de zero e exporta sanitizado", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-diag-"));
  const service = new DiagnosticsService({
    databasePath: path.join(root, "db"),
    metrics: () => ({
      session: "real",
      metrics: [
        { label: "zero", value: 0 },
        { label: "unknown", value: null },
      ],
      token: "secret",
      path: "/Users/private/file",
    }),
  });
  service.burst();
  const snapshot = service.collect();
  expect(
    snapshot.metrics.slice(0, 2).map((m: { value: unknown }) => m.value),
  ).toEqual([0, null]);
  const exported = service.export(snapshot);
  expect(exported).not.toContain("secret");
  expect(exported).not.toContain("/Users/private");
  service.close();
  fs.rmSync(root, { recursive: true });
});
test("M20 S04 retenção limita logs e limpeza é seletiva", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-diag-"));
  let health = 0;
  const service = new DiagnosticsService({
    databasePath: path.join(root, "db"),
    metrics: () => ({ session: "none", metrics: [] }),
    cleaners: {
      health: () => {
        health++;
      },
    },
  });
  service.retention(3, 1);
  service.burst();
  expect(service.collect().logs).toHaveLength(3);
  await service.clear("health");
  expect(health).toBe(1);
  expect(service.collect().logs).toHaveLength(3);
  await service.clear("logs");
  expect(service.collect().logs).toHaveLength(0);
  expect(redact({ authorization: "Bearer x", event: "ok" })).toEqual({
    event: "ok",
  });
  service.close();
  fs.rmSync(root, { recursive: true });
});
