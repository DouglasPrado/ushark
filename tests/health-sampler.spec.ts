import { expect, test } from "@playwright/test";

interface Sample {
  sourceId: string;
  observedAt: string;
  completedLocal: boolean;
  downloadThroughputBitsPerSecond: number;
  connectedPeers: number;
  usefulPeers: number;
  probeBytes: number;
}

const healthModule = require("@ushark/core/health-sampler") as {
  DETAILS_TTL_MS: number;
  MAX_CONCURRENT_PROBES: number;
  ProgressiveHealthSampler: new (
    adapter: { sample(input: Record<string, unknown>): Promise<Sample> },
    options?: { clock?: () => number },
  ) => {
    measure(
      input: Record<string, unknown>,
      signal: AbortSignal,
      update?: (sample: Sample) => void,
    ): Promise<Sample[]>;
    samples(sourceId: string): Sample[];
  };
};

const candidates = Array.from({ length: 7 }, (_, index) => ({
  sourceId: `source:${index}`,
  completedLocal: false,
}));

test("M08 S04.1 limita concorrência, preserva ordem e reutiliza TTL", async () => {
  let now = Date.UTC(2026, 8, 14);
  let active = 0;
  let maximum = 0;
  let calls = 0;
  const sampler = new healthModule.ProgressiveHealthSampler(
    {
      sample: async ({ candidate }: Record<string, unknown>) => {
        const value = candidate as { sourceId: string };
        calls += 1;
        active += 1;
        maximum = Math.max(maximum, active);
        await new Promise((resolve) => setTimeout(resolve, 5));
        active -= 1;
        return {
          sourceId: value.sourceId,
          observedAt: new Date(now).toISOString(),
          completedLocal: false,
          downloadThroughputBitsPerSecond: 8_000_000,
          connectedPeers: 2,
          usefulPeers: 1,
          probeBytes: 0,
        };
      },
    },
    { clock: () => now },
  );
  const input = { contentId: "content:test", candidates, context: "details" };
  const updates: string[] = [];
  const first = await sampler.measure(
    input,
    new AbortController().signal,
    (sample) => updates.push(sample.sourceId),
  );
  expect(maximum).toBe(healthModule.MAX_CONCURRENT_PROBES);
  expect(first.map((sample) => sample.sourceId)).toEqual(
    candidates.map((candidate) => candidate.sourceId),
  );
  expect(updates).toHaveLength(candidates.length);
  expect(calls).toBe(candidates.length);

  await sampler.measure(input, new AbortController().signal);
  expect(calls).toBe(candidates.length);
  now += healthModule.DETAILS_TTL_MS + 1;
  await sampler.measure(input, new AbortController().signal);
  expect(calls).toBe(candidates.length * 2);
  expect(sampler.samples("source:0")).toHaveLength(2);
});

test("M08 S04.1 cancelamento descarta resultado tardio", async () => {
  const control = new AbortController();
  const sampler = new healthModule.ProgressiveHealthSampler({
    sample: async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return {
        sourceId: "source:cancel",
        observedAt: new Date().toISOString(),
        completedLocal: false,
        downloadThroughputBitsPerSecond: 0,
        connectedPeers: 0,
        usefulPeers: 0,
        probeBytes: 0,
      };
    },
  });
  const result = sampler.measure(
    {
      contentId: "content:test",
      context: "details",
      candidates: [{ sourceId: "source:cancel", completedLocal: false }],
    },
    control.signal,
  );
  control.abort();
  await expect(result).rejects.toMatchObject({ code: "SELECTION_CANCELLED" });
  expect(sampler.samples("source:cancel")).toEqual([]);
});

test("M08 S04.1 fonte local completa não inicia probe de rede", async () => {
  let networkCalls = 0;
  const adapter = new healthModule.ProgressiveHealthSampler({
    sample: async ({ candidate }: Record<string, unknown>) => {
      const value = candidate as { sourceId: string; completedLocal: boolean };
      if (!value.completedLocal) networkCalls += 1;
      return {
        sourceId: value.sourceId,
        observedAt: new Date().toISOString(),
        completedLocal: value.completedLocal,
        downloadThroughputBitsPerSecond: 0,
        connectedPeers: 0,
        usefulPeers: 0,
        probeBytes: 0,
      };
    },
  });
  const [sample] = await adapter.measure(
    {
      contentId: "content:local",
      context: "details",
      candidates: [{ sourceId: "source:local", completedLocal: true }],
    },
    new AbortController().signal,
  );
  expect(sample.completedLocal).toBeTruthy();
  expect(sample.probeBytes).toBe(0);
  expect(networkCalls).toBe(0);
});
