import { expect, test } from "@playwright/test";

interface Schedule {
  seekGeneration: number;
  targetSeconds: number;
  zone: "critical" | "low" | "healthy" | "high";
  intervalMs: number;
  filePriorities: { selected: number; other: number };
  cache: {
    ramBytes: number;
    diskBytes?: number;
    activeProtected: true;
    evictionAllowed: false;
  };
  spans: Array<{
    role: string;
    priority: number;
    firstPiece: number;
    lastPiece: number;
  }>;
  assignments: Array<{
    piece: number;
    priority: number;
    deadlineMs: number;
    roles: string[];
  }>;
  truncated: boolean;
}

const scheduler = require("@ushark/core/stream-scheduler") as {
  SCHEDULER_LIMITS: Record<string, number>;
  calculateStreamSchedule(input: Record<string, unknown>): Schedule;
};

const MiB = 1024 * 1024;
const base = {
  mode: "stream-only",
  fileOffsetBytes: 3 * MiB,
  fileSizeBytes: 800 * MiB,
  pieceLengthBytes: 4 * MiB,
  durationSeconds: 800,
  positionSeconds: 200,
  seekGeneration: 4,
  bufferedSeconds: 5,
  mediaBitrateBitsPerSecond: 8 * MiB,
  throughputBitsPerSecond: 16 * MiB,
  tailRequired: true,
};

test("M07 S04.2 cria HEAD/TAIL e janelas 7/5/3 com background zero", () => {
  const schedule = scheduler.calculateStreamSchedule(base);
  expect(schedule).toMatchObject({
    seekGeneration: 4,
    zone: "critical",
    intervalMs: 250,
    filePriorities: { selected: 7, other: 0 },
    cache: {
      ramBytes: 128 * MiB,
      diskBytes: 512 * MiB,
      activeProtected: true,
      evictionAllowed: false,
    },
  });
  expect(schedule.spans.map(({ role, priority }) => [role, priority])).toEqual([
    ["head", 7],
    ["tail", 5],
    ["hot", 7],
    ["warm", 5],
    ["buffer", 3],
  ]);
  expect(schedule.assignments.length).toBeGreaterThan(0);
});

test("M07 S04.2 mantém a maior prioridade quando probe e janela sobrepõem", () => {
  const schedule = scheduler.calculateStreamSchedule({
    ...base,
    positionSeconds: 0,
    tailRequired: false,
  });
  const overlapping = schedule.assignments.filter((entry) =>
    entry.roles.includes("head"),
  );
  expect(overlapping.length).toBeGreaterThan(0);
  expect(overlapping.every((entry) => entry.priority === 7)).toBeTruthy();
  expect(overlapping.some((entry) => entry.roles.includes("hot"))).toBeTruthy();
});

test("M07 S04.2 adapta target à razão de streaming e respeita RAM", () => {
  const slow = scheduler.calculateStreamSchedule({
    ...base,
    throughputBitsPerSecond: 4 * MiB,
    mediaBitrateBitsPerSecond: 8 * MiB,
    ramCacheBytes: 64 * MiB,
  });
  // 64 MiB cobrem 64 s para mídia de 8 Mib/s, limitando o target lento.
  expect(slow.targetSeconds).toBe(64);
  expect(slow.cache.ramBytes).toBe(64 * MiB);

  const largeRequest = scheduler.calculateStreamSchedule({
    ...base,
    ramCacheBytes: 2_000 * MiB,
  });
  expect(largeRequest.cache.ramBytes).toBe(512 * MiB);
});

test("M07 S04.2 Keep preserva background e nunca autoriza eviction do ativo", () => {
  const schedule = scheduler.calculateStreamSchedule({
    ...base,
    mode: "keep",
    bufferedSeconds: 61,
  });
  expect(schedule.filePriorities).toEqual({ selected: 7, other: 1 });
  expect(schedule.cache).toEqual({
    ramBytes: 128 * MiB,
    diskBytes: undefined,
    activeProtected: true,
    evictionAllowed: false,
  });
  expect(schedule.zone).toBe("high");
  expect(schedule.intervalMs).toBe(1_000);
});

test("M07 S04.2 limita cardinalidade sem descartar HOT em favor de background", () => {
  const schedule = scheduler.calculateStreamSchedule({
    ...base,
    pieceLengthBytes: 16 * 1_024,
    maximumPieceAssignments: 20,
  });
  expect(schedule.assignments).toHaveLength(20);
  expect(schedule.truncated).toBeTruthy();
  expect(
    schedule.assignments.every((entry) => entry.priority === 7),
  ).toBeTruthy();
});

test("M07 S04.2 rejeita geração, modo e buffer inválidos", () => {
  expect(() =>
    scheduler.calculateStreamSchedule({ ...base, seekGeneration: -1 }),
  ).toThrow(/seekGeneration/);
  expect(() =>
    scheduler.calculateStreamSchedule({ ...base, mode: "cache" }),
  ).toThrow(/mode/);
  expect(() =>
    scheduler.calculateStreamSchedule({ ...base, bufferedSeconds: Number.NaN }),
  ).toThrow(/bufferedSeconds/);
});
