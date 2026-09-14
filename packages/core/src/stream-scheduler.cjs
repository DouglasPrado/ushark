"use strict";

const {
  mapByteRangeToPieces,
  mapTimeToByte,
  planPartialProbe,
  StreamMappingError,
} = require("./stream-mapping.cjs");

const MiB = 1024 * 1024;
const SCHEDULER_LIMITS = Object.freeze({
  criticalIntervalMs: 250,
  healthyIntervalMs: 1_000,
  hotSeconds: 30,
  warmSeconds: 90,
  bufferMaximumSeconds: 300,
  defaultRamCacheBytes: 128 * MiB,
  minimumRamCacheBytes: 64 * MiB,
  maximumRamCacheBytes: 512 * MiB,
  streamOnlyDiskBytes: 512 * MiB,
  maximumPieceAssignments: 8_192,
});
const PRIORITIES = Object.freeze({
  backgroundStreamOnly: 0,
  backgroundKeep: 1,
  buffer: 3,
  warm: 5,
  hot: 7,
});

function fail(message) {
  throw new StreamMappingError("STREAM_INVALID", message);
}

function finite(value, name, minimum = 0) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum)
    fail(`${name} não é válido.`);
  return value;
}

function integer(value, name, minimum = 0) {
  if (!Number.isSafeInteger(value) || value < minimum)
    fail(`${name} não é válido.`);
  return value;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function cacheBudget(input) {
  const requestedRam =
    input.ramCacheBytes ?? SCHEDULER_LIMITS.defaultRamCacheBytes;
  integer(requestedRam, "ramCacheBytes", 1);
  const ramBytes = clamp(
    requestedRam,
    SCHEDULER_LIMITS.minimumRamCacheBytes,
    SCHEDULER_LIMITS.maximumRamCacheBytes,
  );
  const mode = input.mode;
  if (!new Set(["stream-only", "keep", "download"]).has(mode))
    fail("mode não é válido.");
  return {
    ramBytes,
    diskBytes:
      mode === "stream-only" ? SCHEDULER_LIMITS.streamOnlyDiskBytes : undefined,
    activeProtected: true,
    evictionAllowed: false,
  };
}

function calculateTargetSeconds(input, budget) {
  const bitrate = input.mediaBitrateBitsPerSecond;
  const throughput = input.throughputBitsPerSecond;
  let target = 30;
  if (
    typeof bitrate === "number" &&
    Number.isFinite(bitrate) &&
    bitrate > 0 &&
    typeof throughput === "number" &&
    Number.isFinite(throughput) &&
    throughput >= 0
  ) {
    const ratio = throughput / bitrate;
    if (ratio < 1) target = 120;
    else if (ratio < 1.5) target = 90;
    else if (ratio < 2) target = 60;
  }
  if (typeof bitrate === "number" && Number.isFinite(bitrate) && bitrate > 0) {
    const ramSeconds = (budget.ramBytes * 8) / bitrate;
    target = Math.min(target, Math.max(15, ramSeconds));
  }
  return clamp(target, 15, SCHEDULER_LIMITS.bufferMaximumSeconds);
}

function bufferZone(bufferedSeconds, targetSeconds) {
  if (bufferedSeconds < Math.min(15, targetSeconds / 2)) return "critical";
  if (bufferedSeconds < targetSeconds) return "low";
  if (bufferedSeconds < targetSeconds * 2) return "healthy";
  return "high";
}

function timeSpan(input, startSeconds, endSeconds, role, priority, deadlineMs) {
  if (endSeconds <= startSeconds) return undefined;
  const start = mapTimeToByte({ ...input, positionSeconds: startSeconds });
  const end = mapTimeToByte({ ...input, positionSeconds: endSeconds });
  const startByte = start.byteOffset;
  const endByteExclusive = Math.min(
    input.fileSizeBytes,
    Math.max(startByte + 1, end.byteOffset + 1),
  );
  return {
    role,
    priority,
    deadlineMs,
    startSeconds,
    endSeconds,
    ...mapByteRangeToPieces({ ...input, startByte, endByteExclusive }),
  };
}

function probeSpans(input) {
  const plan = planPartialProbe(input);
  return plan.ranges.map((range) => ({
    role: range.labels.join("+"),
    priority: range.labels.includes("head") ? PRIORITIES.hot : PRIORITIES.warm,
    deadlineMs: range.labels.includes("head") ? 0 : 2_000,
    startByte: range.startByte,
    endByteExclusive: range.endByteExclusive,
    ...range.pieceSpan,
  }));
}

function resolvePieceAssignments(
  spans,
  maximum = SCHEDULER_LIMITS.maximumPieceAssignments,
) {
  integer(maximum, "maximumPieceAssignments", 1);
  const ordered = [...spans].sort(
    (left, right) =>
      right.priority - left.priority || left.deadlineMs - right.deadlineMs,
  );
  const assignments = new Map();
  let truncated = false;
  for (const span of ordered) {
    for (let piece = span.firstPiece; piece <= span.lastPiece; piece += 1) {
      const current = assignments.get(piece);
      if (current) {
        if (span.priority > current.priority) current.priority = span.priority;
        current.deadlineMs = Math.min(current.deadlineMs, span.deadlineMs);
        if (!current.roles.includes(span.role)) current.roles.push(span.role);
        continue;
      }
      if (assignments.size >= maximum) {
        truncated = true;
        break;
      }
      assignments.set(piece, {
        piece,
        priority: span.priority,
        deadlineMs: span.deadlineMs,
        roles: [span.role],
      });
    }
  }
  return {
    assignments: [...assignments.values()].sort(
      (left, right) => left.piece - right.piece,
    ),
    truncated,
  };
}

function calculateStreamSchedule(input) {
  if (!input || typeof input !== "object") fail("O scheduler não é válido.");
  const durationSeconds = finite(
    input.durationSeconds,
    "durationSeconds",
    0.001,
  );
  const positionSeconds = clamp(
    finite(input.positionSeconds, "positionSeconds"),
    0,
    durationSeconds,
  );
  const seekGeneration = integer(input.seekGeneration, "seekGeneration");
  const bufferedSeconds = finite(input.bufferedSeconds ?? 0, "bufferedSeconds");
  const budget = cacheBudget(input);
  const targetSeconds = calculateTargetSeconds(input, budget);
  const zone = bufferZone(bufferedSeconds, targetSeconds);
  const geometry = {
    fileOffsetBytes: input.fileOffsetBytes,
    fileSizeBytes: input.fileSizeBytes,
    pieceLengthBytes: input.pieceLengthBytes,
    durationSeconds,
    index: input.index,
  };
  // mapTimeToByte validates all geometry before any schedule is produced.
  mapTimeToByte({ ...geometry, positionSeconds });
  const spans = [
    ...probeSpans({
      ...geometry,
      tailRequired: input.tailRequired === true,
      headLimitBytes: input.headLimitBytes,
      tailLimitBytes: input.tailLimitBytes,
    }),
    timeSpan(
      geometry,
      positionSeconds,
      Math.min(durationSeconds, positionSeconds + SCHEDULER_LIMITS.hotSeconds),
      "hot",
      PRIORITIES.hot,
      0,
    ),
    timeSpan(
      geometry,
      Math.min(durationSeconds, positionSeconds + SCHEDULER_LIMITS.hotSeconds),
      Math.min(durationSeconds, positionSeconds + SCHEDULER_LIMITS.warmSeconds),
      "warm",
      PRIORITIES.warm,
      1_000,
    ),
    timeSpan(
      geometry,
      Math.min(durationSeconds, positionSeconds + SCHEDULER_LIMITS.warmSeconds),
      Math.min(
        durationSeconds,
        positionSeconds +
          Math.max(targetSeconds, SCHEDULER_LIMITS.bufferMaximumSeconds),
      ),
      "buffer",
      PRIORITIES.buffer,
      5_000,
    ),
  ].filter(Boolean);
  const resolved = resolvePieceAssignments(
    spans,
    input.maximumPieceAssignments ?? SCHEDULER_LIMITS.maximumPieceAssignments,
  );
  return {
    seekGeneration,
    mode: input.mode,
    positionSeconds,
    targetSeconds,
    zone,
    intervalMs:
      zone === "critical"
        ? SCHEDULER_LIMITS.criticalIntervalMs
        : SCHEDULER_LIMITS.healthyIntervalMs,
    filePriorities: {
      selected: PRIORITIES.hot,
      other:
        input.mode === "stream-only"
          ? PRIORITIES.backgroundStreamOnly
          : PRIORITIES.backgroundKeep,
    },
    cache: budget,
    spans,
    assignments: resolved.assignments,
    truncated: resolved.truncated,
  };
}

module.exports = {
  PRIORITIES,
  SCHEDULER_LIMITS,
  bufferZone,
  calculateStreamSchedule,
  resolvePieceAssignments,
};
