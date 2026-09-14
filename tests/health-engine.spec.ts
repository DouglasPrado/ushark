import { expect, test } from "@playwright/test";
const {
  calculateHealthSnapshot,
  ratioScore,
} = require("@ushark/core/health-engine");

const candidate = {
  sourceId: "source:healthy",
  completedLocal: false,
  bitrateBitsPerSecond: 8_000_000,
};
const sample = (throughput: number, extra = {}) => ({
  sourceId: candidate.sourceId,
  observedAt: "2026-09-14T10:00:00.000Z",
  downloadThroughputBitsPerSecond: throughput,
  connectedPeers: 8,
  usefulPeers: 5,
  wantedPieceAvailabilityMinimum: 2,
  wantedPieceAvailabilityMedian: 5,
  wantedPiecesAvailableRatio: 1,
  ...extra,
});

test("health usa p25, ratio interpolado, pesos e confiança determinísticos", () => {
  const health = calculateHealthSnapshot({
    candidate,
    samples: [8, 16, 24, 32, 40, 48].map((value) => sample(value * 1_000_000)),
    now: "2026-09-14T10:01:00.000Z",
  });
  expect(health.sustainableThroughputBitsPerSecond).toBe(18_000_000);
  expect(health.streamingRatio).toBe(2.25);
  expect(health.breakdown.ratio).toBe(Math.round(ratioScore(2.25)));
  expect(health.confidence).toBeGreaterThanOrEqual(0.9);
  expect(health.state).toBe("ready");
  expect(health.score).toBeGreaterThanOrEqual(70);
});

test("fonte local completa dispensa rede e resulta em Health 100", () => {
  const health = calculateHealthSnapshot({
    candidate: { ...candidate, completedLocal: true },
    samples: [],
  });
  expect(health).toMatchObject({
    state: "ready",
    score: 100,
    confidence: 1,
    bars: 5,
  });
});

test("aplica caps críticos sem declarar indisponível cedo demais", () => {
  const early = calculateHealthSnapshot({
    candidate,
    samples: [sample(0, { connectedPeers: 0, usefulPeers: 0 })],
  });
  expect(early.state).toBe("measuring");
  const absent = calculateHealthSnapshot({
    candidate,
    samples: Array.from({ length: 3 }, () =>
      sample(0, { connectedPeers: 0, usefulPeers: 0 }),
    ),
  });
  expect(absent.state).toBe("unavailable");
  expect(absent.score).toBeLessThanOrEqual(20);
  const scarce = calculateHealthSnapshot({
    candidate,
    samples: Array.from({ length: 6 }, () =>
      sample(20_000_000, { wantedPieceAvailabilityMinimum: 0 }),
    ),
  });
  expect(scarce.score).toBeLessThanOrEqual(25);
  const stalled = calculateHealthSnapshot({
    candidate,
    samples: Array.from({ length: 6 }, () =>
      sample(20_000_000, { stalled: true }),
    ),
  });
  expect(stalled.score).toBeLessThanOrEqual(20);
});

test("EMA/histerese reduz flicker e stall crítico ignora smoothing", () => {
  const prior = { displayedScore: 88, label: "very-good" };
  const healthy = calculateHealthSnapshot({
    candidate,
    samples: Array.from({ length: 6 }, () => sample(24_000_000)),
    previous: prior,
  });
  expect(healthy.displayedScore).toBeLessThanOrEqual(89);
  const critical = calculateHealthSnapshot({
    candidate,
    samples: Array.from({ length: 6 }, () =>
      sample(40_000_000, { stalled: true }),
    ),
    previous: { displayedScore: 98, label: "excellent" },
  });
  expect(critical.displayedScore).toBeLessThanOrEqual(20);
});

test("bitrate por tamanho/duração reduz confiança e ausência não inventa razão", () => {
  const estimated = calculateHealthSnapshot({
    candidate: {
      sourceId: "source:estimated",
      completedLocal: false,
      sizeBytes: 3_600_000_000,
      durationSeconds: 3_600,
    },
    samples: [sample(16_000_000)],
  });
  expect(estimated.requiredBitrateBitsPerSecond).toBe(8_000_000);
  expect(estimated.reasonCodes).toContain("estimated-bitrate");
  const unknown = calculateHealthSnapshot({
    candidate: { sourceId: "source:unknown", completedLocal: false },
    samples: [sample(16_000_000)],
  });
  expect(unknown.requiredBitrateBitsPerSecond).toBeUndefined();
  expect(unknown.reasonCodes).toContain("unknown-bitrate");
});
