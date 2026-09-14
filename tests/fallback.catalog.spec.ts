import { test, expect } from "@playwright/test";
import { MockFallbackPreview } from "@ushark/mocks/fallback";
import { MockSelectionPreview } from "@ushark/mocks/selection";
test("M19 ranking usa histórico com expiração, sem apagar override", async () => {
  const fallback = new MockFallbackPreview(async () => []),
    selection = new MockSelectionPreview();
  selection.historyPenalty = (id) => fallback.penalty(id);
  selection.setOverride("movie", "a");
  const sources = [
      { id: "a", name: "A", local: false },
      { id: "b", name: "B", local: false },
    ],
    health = sources.map((s) => ({
      id: s.id,
      state: "ready" as const,
      score: 80,
      confidence: "Fixture",
      reason: "teste",
      eligible: true,
    })),
    prefs = {
      strategy: "balanced",
      resolution: "1080p",
      autoSelect: true,
      preflight: true,
    };
  fallback.record("a", false);
  expect(selection.rank(sources, health, prefs)[0].id).toBe("b");
  expect(selection.override("movie")).toBe("a");
  expect(fallback.cooldown("a")).toBe(true);
  fallback.advance(65);
  expect(fallback.penalty("a")).toBe(0);
  expect(fallback.cooldown("a")).toBe(false);
  expect(selection.rank(sources, health, prefs)[0].id).toBe("a");
  const candidates = await fallback.alternatives(
    "movie",
    "a",
    "alternatives",
    new AbortController().signal,
  );
  await expect(
    fallback.prepare(
      candidates[1],
      "alternatives",
      new AbortController().signal,
    ),
  ).rejects.toThrow("Compatibilidade");
  const c = new AbortController();
  const pending = fallback.prepare(candidates[0], "alternatives", c.signal);
  c.abort();
  await expect(pending).rejects.toThrow("Cancelado");
});
