import { expect, test } from "@playwright/test";
/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";

const { ConfigurationStore } = require("@ushark/core/configuration");
const { MovieCatalogStore } = require("@ushark/core/movies");
const {
  SourceSelectionApplicationService,
  SourceSelectionStore,
  rankSources,
} = require("@ushark/core/source-selection");

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-selection-"));
  const databasePath = path.join(root, "state", "ushark.db");
  const configuration = new ConfigurationStore(
    databasePath,
    path.join(root, "managed"),
  );
  const base = configuration.read().configuration;
  const saved = configuration.save(
    {
      ...base,
      libraryPath: path.join(root, "library"),
      cachePath: path.join(root, "cache"),
    },
    { completeOnboarding: true },
  ).configuration;
  configuration.close();
  const movies = new MovieCatalogStore(databasePath);
  for (const [index, sourceId] of [
    "source:local",
    "source:small",
    "source:4k",
  ].entries()) {
    movies.save({
      libraryId: saved.libraryId,
      draft: {
        metadata: {
          id: "movie:selection:test",
          title: "Selection",
          duration: 120,
          genres: [],
          cast: [],
        },
        source: {
          id: sourceId,
          name: `${sourceId}.mp4`,
          availability: "available",
          fileAvailable: index === 0,
        },
      },
      mutation: { idempotencyKey: `selection-seed:${index}` },
    });
  }
  movies.close();
  return { root, databasePath };
}

const health = (sourceId: string, score: number, ratio = 2) => ({
  schemaVersion: 1,
  sourceId,
  state: "ready",
  score,
  displayedScore: score,
  bars: 4,
  label: "very-good",
  confidence: 0.9,
  streamingRatio: ratio,
  startupEstimateMs: 2_000,
  sustainableThroughputBitsPerSecond: 16_000_000,
  requiredBitrateBitsPerSecond: 8_000_000,
  connectedPeers: 6,
  usefulPeers: 4,
  measuredAt: new Date().toISOString(),
  staleAt: new Date(Date.now() + 15_000).toISOString(),
  algorithmVersion: 1,
  reasonCodes: [],
  breakdown: {},
});

test("M08 S04.3 ranking filtra 4K inviável, preserva local e menor somente entre viáveis", () => {
  const candidates = [
    {
      sourceId: "source:local",
      completedLocal: true,
      resolutionHeight: 1080,
      sizeBytes: 4 * 1024 ** 3,
    },
    {
      sourceId: "source:small",
      completedLocal: false,
      resolutionHeight: 720,
      sizeBytes: 1024 ** 3,
      health: health("source:small", 75),
    },
    {
      sourceId: "source:4k",
      completedLocal: false,
      resolutionHeight: 2160,
      sizeBytes: 50 * 1024 ** 3,
      health: { ...health("source:4k", 95, 0.5), state: "degraded" },
    },
  ];
  expect(
    rankSources(candidates, {
      strategy: "quality",
      resolutionLimit: "2160p",
    })[0].sourceId,
  ).toBe("source:local");
  const smallest = rankSources(candidates.slice(1), {
    strategy: "smallest",
    resolutionLimit: "2160p",
  });
  expect(smallest[0]).toMatchObject({
    sourceId: "source:small",
    eligible: true,
  });
  expect(smallest.at(-1)).toMatchObject({
    sourceId: "source:4k",
    eligible: false,
  });
  expect(
    rankSources(candidates, {
      strategy: "balanced",
      resolutionLimit: "2160p",
      overrideSourceId: "source:small",
    })[0].sourceId,
  ).toBe("source:small");
});

test("ranking de 64 sources fica abaixo de 10ms sem probe", () => {
  const candidates = Array.from({ length: 64 }, (_, index) => ({
    sourceId: `source:${String(index).padStart(2, "0")}`,
    completedLocal: false,
    resolutionHeight: 1080,
    sizeBytes: (index + 1) * 1024 ** 3,
    health: health(`source:${index}`, 80),
  }));
  const started = performance.now();
  const ranked = rankSources(candidates, {
    strategy: "balanced",
    resolutionLimit: "1080p",
  });
  expect(performance.now() - started).toBeLessThan(10);
  expect(ranked).toHaveLength(64);
});

test("override é idempotente, só aceita vínculo e sobrevive ao restart", () => {
  const { databasePath } = fixture();
  let store = new SourceSelectionStore(databasePath);
  const first = store.setOverride({
    contentId: "movie:selection:test",
    sourceId: "source:small",
    mutation: { idempotencyKey: "override:one" },
  });
  expect(
    store.setOverride({
      contentId: "movie:selection:test",
      sourceId: "source:local",
      mutation: { idempotencyKey: "override:one" },
    }),
  ).toEqual(first);
  expect(() =>
    store.setOverride({
      contentId: "movie:selection:test",
      sourceId: "source:foreign",
      mutation: { idempotencyKey: "override:foreign" },
    }),
  ).toThrow(/não pertence/);
  store.close();
  store = new SourceSelectionStore(databasePath);
  expect(store.readOverride("movie:selection:test")).toBe("source:small");
  store.close();
});

test("preflight persiste Health, seleciona uma source e publica estado versionado", async () => {
  const { databasePath } = fixture();
  const store = new SourceSelectionStore(databasePath);
  const histories = new Map<string, any[]>();
  const sampler = {
    async measure(
      input: any,
      _signal: AbortSignal,
      onUpdate: (sample: any) => void,
    ) {
      return input.candidates.map((candidate: any) => {
        const value = {
          sourceId: candidate.sourceId,
          observedAt: new Date().toISOString(),
          completedLocal: candidate.completedLocal,
          downloadThroughputBitsPerSecond: 24_000_000,
          connectedPeers: 8,
          usefulPeers: 5,
          wantedPieceAvailabilityMinimum: 2,
          wantedPieceAvailabilityMedian: 4,
          wantedPiecesAvailableRatio: 1,
        };
        histories.set(candidate.sourceId, [
          value,
          value,
          value,
          value,
          value,
          value,
        ]);
        onUpdate(value);
        return value;
      });
    },
    samples(sourceId: string) {
      return histories.get(sourceId) ?? [];
    },
  };
  const service = new SourceSelectionApplicationService({ sampler, store });
  const events: any[] = [];
  service.subscribe((event: any) => events.push(event));
  const result = await service.preflight({
    requestId: "request:selection:one",
    contentId: "movie:selection:test",
    strategy: "balanced",
    resolutionLimit: "1080p",
    context: "details",
    candidates: [
      {
        sourceId: "source:local",
        name: "Local",
        completedLocal: true,
        resolutionHeight: 1080,
      },
      {
        sourceId: "source:small",
        name: "Small",
        completedLocal: false,
        resolutionHeight: 720,
        bitrateBitsPerSecond: 8_000_000,
      },
    ],
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  expect(result.value).toMatchObject({
    state: "ready",
    selectedSourceId: "source:local",
    protocolVersion: 1,
  });
  expect(store.readHealth("source:small")).toMatchObject({
    sourceId: "source:small",
    state: "ready",
  });
  expect(events.map((event) => event.type)).toEqual(
    expect.arrayContaining(["selection.measuring", "selection.ready"]),
  );
  store.close();
});

test("deadline/cancelamento não produz decisão tardia", async () => {
  const { databasePath } = fixture();
  const store = new SourceSelectionStore(databasePath);
  const sampler = {
    measure(_input: any, signal: AbortSignal) {
      return new Promise((_resolve, reject) =>
        signal.addEventListener(
          "abort",
          () =>
            reject(
              Object.assign(new Error("cancelled"), {
                name: "HealthSamplerError",
                code: "SELECTION_CANCELLED",
                publicMessage: "Cancelado.",
              }),
            ),
          { once: true },
        ),
      );
    },
    samples() {
      return [];
    },
  };
  const service = new SourceSelectionApplicationService({
    sampler,
    store,
    deadlineMs: 10,
  });
  const promise = service.preflight({
    requestId: "request:deadline:one",
    contentId: "movie:selection:test",
    strategy: "balanced",
    resolutionLimit: "1080p",
    context: "details",
    candidates: [
      { sourceId: "source:local", name: "Local", completedLocal: true },
    ],
  });
  const result = await promise;
  expect(result).toMatchObject({
    ok: false,
    error: { code: "SELECTION_TIMEOUT", retryable: true },
  });
  store.close();
});
