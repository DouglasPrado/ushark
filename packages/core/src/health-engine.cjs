"use strict";

const SCHEMA_VERSION = 1;
const ALGORITHM_VERSION = 1;

const clamp = (value, minimum = 0, maximum = 100) =>
  Math.min(maximum, Math.max(minimum, value));

function percentile(values, fraction) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * fraction;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function interpolate(value, points) {
  if (value <= points[0][0]) return points[0][1];
  for (let index = 1; index < points.length; index += 1) {
    const [rightX, rightY] = points[index];
    const [leftX, leftY] = points[index - 1];
    if (value <= rightX) {
      const progress = (value - leftX) / (rightX - leftX);
      return leftY + (rightY - leftY) * progress;
    }
  }
  return points.at(-1)[1];
}

function ratioScore(ratio) {
  if (!Number.isFinite(ratio)) return 20;
  return interpolate(ratio, [
    [0, 0],
    [0.99, 10],
    [1, 30],
    [1.2, 45],
    [1.5, 65],
    [2, 80],
    [3, 90],
    [4, 100],
  ]);
}

function peerScore(usefulPeers, throughput, requiredBitrate) {
  let value =
    usefulPeers <= 0
      ? 0
      : usefulPeers === 1
        ? 35
        : usefulPeers <= 3
          ? 60
          : usefulPeers <= 7
            ? 80
            : 100;
  if (throughput > 0 && requiredBitrate > 0)
    value = Math.max(value, clamp((throughput / requiredBitrate) * 45));
  return clamp(value);
}

function availabilityScore(sample) {
  const minimum = sample.wantedPieceAvailabilityMinimum;
  const median = sample.wantedPieceAvailabilityMedian;
  const available = sample.wantedPiecesAvailableRatio;
  if (![minimum, median, available].some(Number.isFinite)) return 20;
  if (minimum === 0 || available === 0) return 0;
  const minimumScore =
    minimum >= 4 ? 100 : minimum === 3 ? 85 : minimum === 2 ? 65 : 35;
  const medianScore = clamp((median ?? minimum ?? 0) * 20);
  const ratioValue = clamp((available ?? 0) * 100);
  return minimumScore * 0.5 + medianScore * 0.2 + ratioValue * 0.3;
}

function stabilityScore(samples) {
  const throughputs = samples
    .map((sample) => sample.downloadThroughputBitsPerSecond)
    .filter(Number.isFinite);
  if (throughputs.length < 2) return 45;
  const mean =
    throughputs.reduce((sum, value) => sum + value, 0) / throughputs.length;
  if (mean <= 0) return 0;
  const variance =
    throughputs.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    throughputs.length;
  const cv = Math.sqrt(variance) / mean;
  const base = interpolate(cv, [
    [0, 100],
    [0.15, 90],
    [0.3, 70],
    [0.6, 35],
    [1, 5],
  ]);
  const zeroRate =
    throughputs.filter((value) => value <= 0).length / throughputs.length;
  const stallRate =
    samples.filter((sample) => sample.stalled === true).length / samples.length;
  return clamp(base - zeroRate * 50 - stallRate * 70);
}

function startupScore(milliseconds) {
  if (!Number.isFinite(milliseconds)) return 20;
  return interpolate(milliseconds, [
    [0, 100],
    [1_000, 100],
    [2_000, 90],
    [4_000, 75],
    [8_000, 55],
    [15_000, 30],
    [30_000, 10],
  ]);
}

function visual(score) {
  if (score >= 90) return { bars: 5, label: "excellent" };
  if (score >= 75) return { bars: 4, label: "very-good" };
  if (score >= 55) return { bars: 3, label: "good" };
  if (score >= 30) return { bars: 2, label: "unstable" };
  return { bars: 1, label: "poor" };
}

function calculateRequiredBitrate(candidate) {
  if (
    Number.isFinite(candidate.bitrateBitsPerSecond) &&
    candidate.bitrateBitsPerSecond > 0
  )
    return { bitrate: candidate.bitrateBitsPerSecond, detected: true };
  if (
    Number.isFinite(candidate.sizeBytes) &&
    candidate.sizeBytes > 0 &&
    Number.isFinite(candidate.durationSeconds) &&
    candidate.durationSeconds > 0
  )
    return {
      bitrate: (candidate.sizeBytes * 8) / candidate.durationSeconds,
      detected: false,
    };
  return { bitrate: undefined, detected: false };
}

function confidenceFor(samples, latest, bitrateKnown, stability) {
  if (!samples.length) return 0;
  const sampleFactor = clamp(samples.length / 6, 0, 1);
  const peerFactor = clamp((latest.usefulPeers ?? 0) / 4, 0, 1);
  const availabilityKnown = Number.isFinite(latest.wantedPiecesAvailableRatio)
    ? 1
    : 0;
  const bitrateFactor = bitrateKnown ? 1 : 0;
  return clamp(
    sampleFactor * 0.4 +
      peerFactor * 0.15 +
      availabilityKnown * 0.2 +
      bitrateFactor * 0.15 +
      (stability / 100) * 0.1,
    0,
    1,
  );
}

function calculateHealthSnapshot(input) {
  const candidate = input?.candidate;
  if (!candidate || typeof candidate.sourceId !== "string")
    throw new TypeError("A source para Health não é válida.");
  const now =
    input.now instanceof Date ? input.now : new Date(input.now ?? Date.now());
  const staleAt = new Date(now.getTime() + Math.max(1, input.ttlMs ?? 15_000));
  const samples = Array.isArray(input.samples)
    ? input.samples.filter(Boolean).slice(-120)
    : [];
  const latest = samples.at(-1) ?? {};
  if (candidate.completedLocal === true || latest.completedLocal === true) {
    return {
      schemaVersion: SCHEMA_VERSION,
      sourceId: candidate.sourceId,
      state: "ready",
      score: 100,
      displayedScore: 100,
      bars: 5,
      label: "excellent",
      confidence: 1,
      connectedPeers: 0,
      usefulPeers: 0,
      measuredAt: now.toISOString(),
      staleAt: staleAt.toISOString(),
      algorithmVersion: ALGORITHM_VERSION,
      reasonCodes: ["completed-local"],
      breakdown: { local: 100 },
    };
  }
  if (latest.error) {
    return {
      schemaVersion: SCHEMA_VERSION,
      sourceId: candidate.sourceId,
      state: "error",
      confidence: 0,
      connectedPeers: latest.connectedPeers ?? 0,
      usefulPeers: latest.usefulPeers ?? 0,
      measuredAt: now.toISOString(),
      staleAt: staleAt.toISOString(),
      algorithmVersion: ALGORITHM_VERSION,
      reasonCodes: [latest.error.code ?? "probe-error"],
      breakdown: {},
    };
  }
  const { bitrate: requiredBitrate, detected } =
    calculateRequiredBitrate(candidate);
  const throughputValues = samples
    .map((sample) => Number(sample.downloadThroughputBitsPerSecond ?? 0))
    .filter(Number.isFinite);
  const sustainable = percentile(throughputValues, 0.25);
  const ratio = requiredBitrate ? sustainable / requiredBitrate : undefined;
  const bufferBytes = requiredBitrate ? (requiredBitrate / 8) * 5 : undefined;
  const startupEstimate =
    sustainable > 0 && bufferBytes
      ? Math.round((bufferBytes / (sustainable / 8)) * 1_000 + 500)
      : undefined;
  const availability = availabilityScore(latest);
  const stability = stabilityScore(samples);
  const peer = peerScore(
    latest.usefulPeers ?? 0,
    sustainable,
    requiredBitrate ?? 0,
  );
  const ratioValue = ratioScore(ratio);
  const startup = startupScore(startupEstimate);
  const swarm = clamp(((latest.connectedPeers ?? 0) / 10) * 100);
  let raw =
    ratioValue * 0.35 +
    availability * 0.25 +
    peer * 0.15 +
    startup * 0.1 +
    stability * 0.1 +
    swarm * 0.05;
  const reasons = [];
  const discoveryEstablished = samples.length >= 3;
  if ((latest.usefulPeers ?? 0) === 0 && discoveryEstablished) {
    raw = Math.min(raw, 20);
    reasons.push("no-useful-peers");
  }
  if (latest.wantedPieceAvailabilityMinimum === 0) {
    raw = Math.min(raw, 25);
    reasons.push("missing-wanted-piece");
  }
  if (Number.isFinite(ratio) && ratio < 1) {
    raw = Math.min(raw, 35);
    reasons.push("insufficient-ratio");
  }
  if (latest.stalled === true) {
    raw = Math.min(raw, 20);
    reasons.push("active-stall");
  }
  raw = Math.round(clamp(raw));
  const confidence = Number(
    confidenceFor(
      samples,
      latest,
      requiredBitrate !== undefined,
      stability,
    ).toFixed(2),
  );
  const critical = reasons.some((reason) =>
    ["missing-wanted-piece", "active-stall"].includes(reason),
  );
  const previousDisplayed = input.previous?.displayedScore;
  let displayed =
    Number.isFinite(previousDisplayed) && !critical
      ? Math.round(previousDisplayed * 0.65 + raw * 0.35)
      : raw;
  const previousLabel = input.previous?.label;
  if (previousLabel === "very-good" && raw >= 90 && raw < 92)
    displayed = Math.min(displayed, 89);
  if (previousLabel === "excellent" && raw >= 86)
    displayed = Math.max(displayed, 90);
  const absent =
    discoveryEstablished &&
    (latest.connectedPeers ?? 0) === 0 &&
    (latest.usefulPeers ?? 0) === 0;
  const state = absent
    ? "unavailable"
    : confidence < 0.6
      ? "measuring"
      : raw < 55
        ? "degraded"
        : "ready";
  if (!detected && requiredBitrate) reasons.push("estimated-bitrate");
  if (!requiredBitrate) reasons.push("unknown-bitrate");
  if (confidence < 0.6) reasons.push("low-confidence");
  const presentation = visual(displayed);
  return {
    schemaVersion: SCHEMA_VERSION,
    sourceId: candidate.sourceId,
    state,
    score: raw,
    displayedScore: displayed,
    ...presentation,
    confidence,
    ...(ratio === undefined
      ? {}
      : { streamingRatio: Number(ratio.toFixed(3)) }),
    ...(startupEstimate === undefined
      ? {}
      : { startupEstimateMs: startupEstimate }),
    sustainableThroughputBitsPerSecond: Math.round(sustainable),
    ...(requiredBitrate === undefined
      ? {}
      : { requiredBitrateBitsPerSecond: Math.round(requiredBitrate) }),
    connectedPeers: latest.connectedPeers ?? 0,
    usefulPeers: latest.usefulPeers ?? 0,
    ...(Number.isFinite(latest.wantedPiecesAvailableRatio)
      ? { wantedPieceAvailability: latest.wantedPiecesAvailableRatio }
      : {}),
    stabilityScore: Math.round(stability),
    swarmHealthScore: Math.round(swarm),
    measuredAt: now.toISOString(),
    staleAt: staleAt.toISOString(),
    algorithmVersion: ALGORITHM_VERSION,
    reasonCodes: reasons,
    breakdown: {
      ratio: Math.round(ratioValue),
      availability: Math.round(availability),
      peers: Math.round(peer),
      startup: Math.round(startup),
      stability: Math.round(stability),
      swarm: Math.round(swarm),
    },
  };
}

module.exports = {
  ALGORITHM_VERSION,
  calculateHealthSnapshot,
  calculateRequiredBitrate,
  percentile,
  ratioScore,
};
