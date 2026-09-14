import { expect, test } from "@playwright/test";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { Configuration } from "@ushark/types";
import type { MovieDraft } from "@ushark/types/movies";
import type {
  PlaybackEvent,
  PlaybackPreparationSnapshot,
  PlaybackServiceResult,
  PlaybackSessionSnapshot,
} from "@ushark/types/player";

const { ConfigurationStore } = require("@ushark/core/configuration");
const { MovieCatalogStore } = require("@ushark/core/movies");
const {
  TorrentInspectionStore,
} = require("@ushark/core/torrent-inspection-store");
const { PlaybackStore } = require("@ushark/core/playback-store");
const { ExternalSubtitleStore } = require("@ushark/core/playback-tracks");
const { MpvAdapter } = require("@ushark/core/mpv-adapter");
const {
  LocalPlaybackSourceResolver,
  PlaybackApplicationService,
} = require("@ushark/core/playback-service");

function value<T>(result: PlaybackServiceResult<T>) {
  expect(result.ok, result.ok ? undefined : result.error.message).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

function fixture() {
  const root = fs.mkdtempSync("/tmp/ushark-playback-service-");
  const databasePath = path.join(root, "state", "ushark.db");
  const libraryPath = path.join(root, "library");
  const cachePath = path.join(root, "cache");
  const configuration = new ConfigurationStore(
    databasePath,
    path.join(root, "managed"),
  );
  const initial = configuration.read().configuration as Configuration;
  const saved = configuration.save(
    { ...initial, libraryPath, cachePath },
    { completeOnboarding: true },
  ).configuration as Configuration;
  configuration.close();
  const mediaPath = path.join(libraryPath, "functional.mp4");
  fs.writeFileSync(mediaPath, "fixture");
  const movies = new MovieCatalogStore(databasePath, {
    managedLibraryRoot: libraryPath,
  });
  const draft: MovieDraft = {
    metadata: {
      id: "movie:playback:functional",
      title: "Playback funcional",
      duration: 120,
      genres: [],
      cast: [],
    },
    source: {
      id: "source:playback:functional",
      name: "functional.mp4",
      availability: "available",
      fileAvailable: true,
    },
  };
  expect(
    movies.save({
      libraryId: saved.libraryId,
      draft,
      mutation: { idempotencyKey: "playback-functional-seed" },
    }).ok,
  ).toBe(true);
  movies.registerManagedFile("source:playback:functional", mediaPath);
  movies.close();
  new TorrentInspectionStore(databasePath).close();
  const store = new PlaybackStore(databasePath);
  const resolver = new LocalPlaybackSourceResolver(databasePath, libraryPath);
  const subtitleStore = new ExternalSubtitleStore(
    path.join(cachePath, "subtitles"),
  );
  const service = new PlaybackApplicationService({
    store,
    resolver,
    subtitleStore,
    adapterFactory: () =>
      new MpvAdapter({
        executable: process.execPath,
        spawnProcess: (executable: string, args: string[], options: object) =>
          spawn(executable, args, {
            ...options,
            stdio: ["ignore", "ignore", "inherit"],
          }),
        prefixArgs: [path.resolve("tests/fixtures/fake-mpv.cjs")],
        ipcRoot: path.join(root, "ipc"),
        commandTimeoutMs: 1_000,
        startupTimeoutMs: 2_000,
      }),
  });
  return { root, service, mediaPath };
}

test("M05 S05 resolve source gerenciada, controla sessão e persiste saída", async () => {
  const { root, service } = fixture();
  const events: PlaybackEvent[] = [];
  const unsubscribe = service.subscribe((event: PlaybackEvent) =>
    events.push(event),
  );
  try {
    const prepared = value<PlaybackPreparationSnapshot>(
      await service.prepare({
        contentId: "movie:playback:functional",
        sourceId: "source:playback:functional",
        requestId: "request:playback:functional",
      }),
    );
    expect(prepared).not.toHaveProperty("mediaPath");
    const started = value<PlaybackSessionSnapshot>(
      await service.start({
        operationId: prepared.operationId,
        mutation: { idempotencyKey: "playback-start:functional" },
      }),
    );
    await expect
      .poll(() => events.some((event) => event.type === "first-frame"))
      .toBe(true);
    await expect(
      service.setPaused({
        sessionId: started.sessionId,
        paused: true,
        mutation: {
          idempotencyKey: "playback-pause:functional",
          expectedGeneration: started.generation,
        },
      }),
    ).resolves.toMatchObject({ ok: true });
    await expect(
      service.seek({
        sessionId: started.sessionId,
        positionSeconds: 45,
        mutation: {
          idempotencyKey: "playback-seek:functional",
          expectedGeneration: started.generation,
        },
      }),
    ).resolves.toMatchObject({ ok: true });
    await expect
      .poll(async () => {
        const result = await service.readSession({
          sessionId: started.sessionId,
        });
        return result.ok ? result.value.positionSeconds : -1;
      })
      .toBe(45);
    await expect(
      service.setVolume({
        sessionId: started.sessionId,
        volumePercent: 62,
        mutation: {
          idempotencyKey: "playback-volume:functional",
          expectedGeneration: started.generation,
        },
      }),
    ).resolves.toMatchObject({ ok: true, value: { volumePercent: 62 } });
    await expect(
      service.setMuted({
        sessionId: started.sessionId,
        muted: true,
        mutation: {
          idempotencyKey: "playback-mute:functional",
          expectedGeneration: started.generation,
        },
      }),
    ).resolves.toMatchObject({ ok: true, value: { muted: true } });
    await expect(
      service.selectAudio({
        sessionId: started.sessionId,
        trackId: "1",
        mutation: {
          idempotencyKey: "playback-audio:functional",
          expectedGeneration: started.generation,
        },
      }),
    ).resolves.toMatchObject({ ok: true });
    await expect(
      service.selectSubtitle({
        sessionId: started.sessionId,
        trackId: "2",
        mutation: {
          idempotencyKey: "playback-subtitle:functional",
          expectedGeneration: started.generation,
        },
      }),
    ).resolves.toMatchObject({ ok: true });
    const subtitlePath = path.join(root, "external.srt");
    fs.writeFileSync(subtitlePath, "1\n00:00:00,000 --> 00:00:01,000\nTeste\n");
    await expect(
      service.addExternalSubtitle({
        sessionId: started.sessionId,
        candidatePath: subtitlePath,
        mutation: {
          idempotencyKey: "playback-external-subtitle:functional",
          expectedGeneration: started.generation,
        },
      }),
    ).resolves.toMatchObject({ ok: true });
    const stopped = value(
      await service.stop({
        sessionId: started.sessionId,
        reason: "user",
        mutation: {
          idempotencyKey: "playback-stop:functional",
          expectedGeneration: started.generation,
        },
      }),
    );
    expect(stopped).toMatchObject({ positionSeconds: 45, watched: false });
    expect(
      value(
        await service.stop({
          sessionId: started.sessionId,
          reason: "user",
          mutation: {
            idempotencyKey: "playback-stop:functional",
            expectedGeneration: started.generation,
          },
        }),
      ),
    ).toEqual(stopped);
    expect(
      value(
        await service.readProgress({ contentId: "movie:playback:functional" }),
      ),
    ).toMatchObject({
      positionSeconds: 45,
      watched: false,
    });
  } finally {
    unsubscribe();
    await service.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("M05 S05 falha fechado para source sem arquivo e caminho fora da biblioteca", async () => {
  const { root, service } = fixture();
  try {
    await service.close();
    const databasePath = path.join(root, "state", "ushark.db");
    const libraryPath = path.join(root, "library");
    const resolver = new LocalPlaybackSourceResolver(databasePath, libraryPath);
    fs.rmSync(path.join(libraryPath, "functional.mp4"));
    expect(() =>
      resolver.resolve({
        contentId: "movie:playback:functional",
        sourceId: "source:playback:functional",
      }),
    ).toThrow(/não está disponível/);
    resolver.close();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
