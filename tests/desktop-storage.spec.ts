import { expect, test } from "@playwright/test";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { DesktopStoragePreview } from "../apps/desktop/src/renderer/storage/desktop-storage";
import type { StorageDesktopApi, StorageSnapshot } from "@ushark/types/storage";

const snapshot = (revision: number, keep = false): StorageSnapshot => ({
  schemaVersion: 1,
  entries: [
    {
      id: "old",
      name: "Old",
      gb: 1,
      keep,
      active: false,
      favorite: false,
      partial: false,
      corrupt: false,
      lastUsed: 1,
      volume: keep ? "Biblioteca" : "Cache",
    },
  ],
  policy: {
    limitGB: 40,
    folder: "Cache",
    autoCleanup: true,
    retainPartial: true,
    retainFavorites: true,
  },
  physical: {
    capacityBytes: 100,
    availableBytes: 50,
    usedManagedBytes: keep ? 0 : 10,
    eligibleBytes: keep ? 0 : 10,
  },
  revision,
  updatedAt: new Date().toISOString(),
});

test("M10 S05 adapter usa revision e converte bytes liberados", async () => {
  const calls: any[] = [];
  const api = {
    protocolVersion: 1 as const,
    read: async () => ({ ok: true as const, value: snapshot(2) }),
    clean: async (input: any) => {
      calls.push(["clean", input]);
      return {
        ok: true as const,
        value: {
          snapshot: { ...snapshot(3), entries: [] },
          estimatedBytes: 1024 ** 3,
          freedBytes: 1024 ** 3,
        },
      };
    },
    retain: async (input: any) => {
      calls.push(["retain", input]);
      return { ok: true as const, value: snapshot(3, true) };
    },
    repair: async () => ({ ok: true as const, value: snapshot(3) }),
    applyPolicy: async (input: any) => {
      calls.push(["policy", input]);
      return {
        ok: true as const,
        value: { ...snapshot(3), policy: input.policy },
      };
    },
  } satisfies StorageDesktopApi;
  const service = new DesktopStoragePreview(api);
  await expect.poll(() => service.list()[0]?.id).toBe("old");
  const signal = new AbortController().signal;
  await service.retain("old", true, signal);
  expect(calls[0][1]).toMatchObject({ id: "old", expectedRevision: 2 });
  await service.apply({ ...service.policy, limitGB: 20 });
  expect(calls[1][1]).toMatchObject({ expectedRevision: 3 });
  const fresh = new DesktopStoragePreview(api);
  await fresh.refresh();
  await expect(fresh.clean(["old"], signal)).resolves.toBe(1);
  expect(fresh.list()).toEqual([]);
});
