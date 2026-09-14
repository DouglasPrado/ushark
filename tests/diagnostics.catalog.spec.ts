import { test, expect } from "@playwright/test";
import {
  MockDiagnosticPreview,
  sanitizeDiagnosticLog,
} from "@ushark/mocks/diagnostics";
test("M20 sanitiza na entrada, limita logs e limpa somente categoria solicitada", async () => {
  const categories: string[] = [];
  const service = new MockDiagnosticPreview(
    () => ({ session: "Sem sessão", metrics: [] }),
    async (category) => {
      categories.push(category);
      return "OK";
    },
  );
  const row = sanitizeDiagnosticLog({
    event: "magnet:?private",
    correlation: "https://private.invalid/token",
    level: "warn",
    password: "SECRET",
    path: "/Users/private",
  });
  expect(JSON.stringify(row)).not.toMatch(/magnet|https|SECRET|Users/);
  service.retention(2, 7);
  service.burst();
  const snapshot = await service.collect(
    "current",
    new AbortController().signal,
  );
  expect(snapshot.logs).toHaveLength(2);
  await service.clear("logs", "current", new AbortController().signal);
  expect(categories).toEqual([]);
  const payload = await service.export(
    snapshot,
    false,
    new AbortController().signal,
  );
  expect(payload).not.toMatch(/SYNTHETIC_SECRET|magnet|Users/);
});
