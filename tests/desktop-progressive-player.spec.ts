import { expect, test } from "@playwright/test";
import { DesktopProgressivePlayer } from "../apps/desktop/src/renderer/playback/desktop-progressive-player";
import type {
  ProgressiveStreamDesktopApi,
  StreamEvent,
  StreamSessionSnapshot,
} from "@ushark/types/stream";

function snapshot(
  state: StreamSessionSnapshot["state"],
): StreamSessionSnapshot {
  return {
    schemaVersion: 1,
    protocolVersion: 1,
    streamSessionId: "stream-session:race",
    contentId: "movie:tmdb:857",
    sourceId: "source:torrent:race",
    fileId: "file:3",
    mode: "stream-only",
    state,
    seekGeneration: 0,
    positionSeconds: 0,
    metadata: {
      durationSeconds: 10_200,
      sizeBytes: 1_024,
      mappingConfidence: "estimated",
    },
    buffer: {
      seconds: state === "ready" ? 12 : 0,
      bytes: state === "ready" ? 1_024 : 0,
      targetSeconds: 12,
      zone: state === "ready" ? "healthy" : "critical",
      hotWindowReady: state === "ready",
      warmWindowReady: false,
    },
    delivery: { kind: "partial-file", ready: state === "ready" },
    protected: true,
    startedAt: "2026-09-14T14:00:00.000Z",
    updatedAt:
      state === "ready"
        ? "2026-09-14T14:00:01.000Z"
        : "2026-09-14T14:00:00.000Z",
  };
}

test("M07 preserva ready recebido antes da resposta inicial de prepare", async () => {
  let receive: ((event: StreamEvent) => void) | undefined;
  const api = {
    protocolVersion: 1,
    subscribe(listener: (event: StreamEvent) => void) {
      receive = listener;
      return () => undefined;
    },
    async prepare() {
      receive?.({
        protocolVersion: 1,
        eventId: "stream-event:ready",
        type: "stream.ready",
        sequence: 2,
        occurredAt: "2026-09-14T14:00:01.000Z",
        snapshot: snapshot("ready"),
      });
      return { ok: true as const, value: snapshot("buffering") };
    },
  } as unknown as ProgressiveStreamDesktopApi;
  const player = new DesktopProgressivePlayer(api);
  const observed: string[] = [];
  player.subscribe((value) => {
    if (value) observed.push(value.state);
  });

  await player.prepare(
    {
      id: "movie:tmdb:857",
      title: "Filme",
      available: true,
      progressive: true,
      sourceId: "source:torrent:race",
      selector: "file:3",
      duration: 10_200,
    },
    "normal",
    new AbortController().signal,
  );

  expect(player.snapshot()?.state).toBe("playing");
  expect(observed.at(-1)).toBe("playing");
  player.dispose();
});

test("M07 reconecta eventos após o ciclo de cleanup do React StrictMode", async () => {
  let receive: ((event: StreamEvent) => void) | undefined;
  let subscriptions = 0;
  let unsubscriptions = 0;
  const api = {
    protocolVersion: 1,
    subscribe(listener: (event: StreamEvent) => void) {
      subscriptions += 1;
      receive = listener;
      return () => {
        unsubscriptions += 1;
        if (receive === listener) receive = undefined;
      };
    },
    async prepare() {
      receive?.({
        protocolVersion: 1,
        eventId: "stream-event:strict-ready",
        type: "stream.ready",
        sequence: 2,
        occurredAt: "2026-09-14T14:00:01.000Z",
        snapshot: snapshot("ready"),
      });
      return { ok: true as const, value: snapshot("buffering") };
    },
  } as unknown as ProgressiveStreamDesktopApi;
  const player = new DesktopProgressivePlayer(api);

  const firstCleanup = player.subscribe(() => undefined);
  player.dispose();
  firstCleanup();

  const observed: string[] = [];
  const failures: string[] = [];
  player.subscribe((value, error) => {
    if (value) observed.push(value.state);
    if (error) failures.push(error.message);
  });
  receive?.({
    protocolVersion: 1,
    eventId: "stream-event:cancelled-strict-pass",
    type: "stream.failed",
    sequence: 1,
    occurredAt: "2026-09-14T14:00:00.000Z",
    error: {
      code: "STREAM_CANCELLED",
      message: "A preparação foi cancelada.",
      recoverable: false,
      retryable: false,
    },
  });
  await player.prepare(
    {
      id: "movie:tmdb:857",
      title: "Filme",
      available: true,
      progressive: true,
      sourceId: "source:torrent:race",
      selector: "file:3",
      duration: 10_200,
    },
    "normal",
    new AbortController().signal,
  );

  expect(subscriptions).toBe(2);
  expect(unsubscriptions).toBe(1);
  expect(failures).toEqual([]);
  expect(player.snapshot()?.state).toBe("playing");
  expect(observed.at(-1)).toBe("playing");
  player.dispose();
});
