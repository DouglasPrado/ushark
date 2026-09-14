import { expect, test } from "@playwright/test";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { DesktopSelectionPreview } from "../apps/desktop/src/renderer/catalog/desktop-selection";
import type {
  SourceSelectionDesktopApi,
  SourceSelectionSnapshot,
} from "@ushark/types/selection";

const health = {
  schemaVersion: 1 as const,
  sourceId: "source:remote",
  state: "ready" as const,
  score: 82,
  displayedScore: 80,
  bars: 4 as const,
  label: "very-good" as const,
  confidence: 0.9,
  streamingRatio: 2,
  startupEstimateMs: 2_000,
  sustainableThroughputBitsPerSecond: 16_000_000,
  requiredBitrateBitsPerSecond: 8_000_000,
  connectedPeers: 6,
  usefulPeers: 4,
  measuredAt: new Date().toISOString(),
  staleAt: new Date().toISOString(),
  algorithmVersion: 1 as const,
  reasonCodes: ["healthy"],
  breakdown: {},
};

function snapshot(): SourceSelectionSnapshot {
  return {
    schemaVersion: 1,
    protocolVersion: 1,
    requestId: "request:one",
    contentId: "movie:one",
    state: "ready",
    strategy: "balanced",
    resolutionLimit: "1080p",
    candidates: [
      {
        sourceId: "source:remote",
        name: "Remote",
        completedLocal: false,
        resolutionHeight: 1080,
        health,
      },
      {
        sourceId: "source:local",
        name: "Local",
        completedLocal: true,
        resolutionHeight: 1080,
        health: { ...health, sourceId: "source:local", score: 100 },
      },
    ],
    ranked: [
      {
        sourceId: "source:local",
        rank: 1,
        score: 100,
        eligible: true,
        reasonCodes: ["completed-local"],
      },
      {
        sourceId: "source:remote",
        rank: 2,
        score: 80,
        eligible: true,
        reasonCodes: [],
      },
    ],
    selectedSourceId: "source:local",
    overrideSourceId: "source:remote",
    decisionId: "decision:one",
    reasonCodes: ["ranked-selection"],
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

test("M08 S05 adapter converte Health real, ranking e override sem alterar UX", async () => {
  const calls: any[] = [];
  const api = {
    protocolVersion: 1 as const,
    preflight: async (input: any) => {
      calls.push(input);
      return { ok: true as const, value: snapshot() };
    },
    cancel: async () => ({
      ok: true as const,
      value: { requestId: "request:one", cancelled: true },
    }),
    setOverride: async (input: any) => ({ ok: true as const, value: input }),
    readOverride: async (input: any) => ({ ok: true as const, value: input }),
    subscribe: () => () => {},
  } satisfies SourceSelectionDesktopApi;
  const service = new DesktopSelectionPreview(api);
  const sources = [
    {
      id: "source:remote",
      name: "Remote",
      local: false,
      resolution: 1080,
      sizeGB: 4,
    },
    { id: "source:local", name: "Local", local: true, resolution: 1080 },
  ];
  const measured = await service.measure(
    sources,
    "normal",
    new AbortController().signal,
    {
      contentId: "movie:one",
      preferences: {
        strategy: "balanced",
        resolution: "1080p",
        autoSelect: true,
        preflight: true,
      },
    },
  );
  expect(measured[0]).toMatchObject({
    id: "source:remote",
    score: 80,
    ratio: 2,
    throughput: 16,
    bitrate: 8,
    eligible: true,
  });
  expect(service.override("movie:one")).toBe("source:remote");
  expect(
    service
      .rank(sources, measured, {
        strategy: "balanced",
        resolution: "1080p",
        autoSelect: true,
        preflight: true,
      })
      .map((source) => source.id),
  ).toEqual(["source:local", "source:remote"]);
  expect(calls[0]).toMatchObject({ contentId: "movie:one" });
  expect(calls[0].candidates[0]).toMatchObject({
    sourceId: "source:remote",
    completedLocal: false,
    sizeBytes: 4 * 1024 ** 3,
  });
});
