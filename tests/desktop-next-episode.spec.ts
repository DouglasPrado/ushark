import { expect, test } from "@playwright/test";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { DesktopNextEpisodePreview } from "../apps/desktop/src/renderer/playback/desktop-next-episode";
import type { NextEpisodeDesktopApi } from "@ushark/types/next-episode";

const snapshot = (state: "resolved" | "ready" | "cancelled" | "started") => ({
  schemaVersion: 1 as const,
  sessionId: "next:one",
  generation: 1,
  currentEpisodeId: "episode:one",
  state,
  countdownSeconds: 5 as const,
  kind: "next" as const,
  message: "Próximo episódio",
  next: {
    id: "episode:two",
    title: "Series · S1E2",
    duration: 1200,
    sourceId: "source:pack",
    sourceName: "pack.torrent",
    selector: "file:2",
    available: true,
    progressive: true,
  },
  updatedAt: new Date().toISOString(),
});

test("M11 S05 adapter prepara, cancela e faz claim real", async () => {
  const calls: any[] = [];
  const api = {
    protocolVersion: 1 as const,
    resolve: async () => ({ ok: true as const, value: snapshot("resolved") }),
    prepare: async (input: any) => {
      calls.push(["prepare", input]);
      return { ok: true as const, value: snapshot("ready") };
    },
    cancel: async (input: any) => {
      calls.push(["cancel", input]);
      return { ok: true as const, value: snapshot("cancelled") };
    },
    claimStart: async (input: any) => {
      calls.push(["start", input]);
      return { ok: true as const, value: snapshot("started") };
    },
  } satisfies NextEpisodeDesktopApi;
  const service = new DesktopNextEpisodePreview(api);
  const signal = new AbortController().signal;
  const resolved = await service.resolve("episode:one", signal);
  await service.prepare(false, signal, resolved.next);
  expect(calls[0][1]).toMatchObject({
    sessionId: "next:one",
    sourceId: "source:pack",
    fileId: "file:2",
  });
  await expect(service.claimStart(signal)).resolves.toBe(true);
  const second = new DesktopNextEpisodePreview(api);
  await second.resolve("episode:one", signal);
  await second.cancel(signal);
  expect(calls.at(-1)[0]).toBe("cancel");
});
