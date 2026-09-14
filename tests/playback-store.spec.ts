import { expect, test } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { Configuration, ConfigurationSnapshot } from "@ushark/types";
import type {
  MovieCatalogCommandResult,
  MovieCatalogResult,
  MovieDraft,
} from "@ushark/types/movies";
import type {
  PlaybackProgressSnapshot,
  PlaybackServiceResult,
} from "@ushark/types/player";

const { ConfigurationStore } = require("@ushark/core/configuration") as {
  ConfigurationStore: new (
    databasePath: string,
    dataRoot: string,
  ) => {
    read(): ConfigurationSnapshot;
    save(
      value: Configuration,
      options?: { completeOnboarding?: boolean },
    ): ConfigurationSnapshot;
    close(): void;
  };
};
const { MovieCatalogStore } = require("@ushark/core/movies") as {
  MovieCatalogStore: new (databasePath: string) => {
    save(input: {
      libraryId: string;
      draft: MovieDraft;
      mutation: { idempotencyKey: string };
    }): MovieCatalogResult<MovieCatalogCommandResult>;
    close(): void;
  };
};
const { TorrentInspectionStore } =
  require("@ushark/core/torrent-inspection-store") as {
    TorrentInspectionStore: new (databasePath: string) => { close(): void };
  };
const { PlaybackProgressJournal, PlaybackStore } =
  require("@ushark/core/playback-store") as {
    PlaybackStore: new (databasePath: string) => {
      begin(
        input: Record<string, unknown>,
      ): PlaybackServiceResult<Record<string, unknown>>;
      markFirstFrame(
        input: Record<string, unknown>,
      ): PlaybackServiceResult<Record<string, unknown>>;
      persist(
        input: Record<string, unknown>,
      ): PlaybackServiceResult<PlaybackProgressSnapshot>;
      stop(
        input: Record<string, unknown>,
      ): PlaybackServiceResult<PlaybackProgressSnapshot>;
      readSession(
        input: Record<string, unknown>,
      ): PlaybackServiceResult<Record<string, unknown>>;
      readProgress(
        input: Record<string, unknown>,
      ): PlaybackServiceResult<PlaybackProgressSnapshot | undefined>;
      recoverInterrupted(): PlaybackServiceResult<{
        recoveredSessions: number;
      }>;
      close(): void;
    };
    PlaybackProgressJournal: new (
      store: object,
      options?: { intervalMs?: number; now?: () => number },
    ) => {
      record(input: Record<string, unknown>): PlaybackServiceResult<{
        persisted: boolean;
        progress?: PlaybackProgressSnapshot;
      }>;
      flush(input: Record<string, unknown>): PlaybackServiceResult<{
        persisted: boolean;
        progress?: PlaybackProgressSnapshot;
      }>;
    };
  };

function value<T>(result: PlaybackServiceResult<T>) {
  expect(result.ok, result.ok ? undefined : result.error.message).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-playback-store-"));
  const databasePath = path.join(root, "state", "ushark.db");
  const configuration = new ConfigurationStore(
    databasePath,
    path.join(root, "managed"),
  );
  const initial = configuration.read().configuration;
  const saved = configuration.save(
    {
      ...initial,
      libraryPath: path.join(root, "library"),
      cachePath: path.join(root, "cache"),
    },
    { completeOnboarding: true },
  ).configuration;
  configuration.close();
  const movies = new MovieCatalogStore(databasePath);
  const draft: MovieDraft = {
    metadata: {
      id: "movie:playback:test",
      title: "Playback persistente",
      duration: 2,
      genres: [],
      cast: [],
    },
    source: {
      id: "source:playback:test",
      name: "fixture.mp4",
      availability: "available",
      fileAvailable: true,
    },
  };
  expect(
    movies.save({
      libraryId: saved.libraryId,
      draft,
      mutation: { idempotencyKey: "playback-store-seed" },
    }).ok,
  ).toBe(true);
  movies.close();
  new TorrentInspectionStore(databasePath).close();
  return { root, databasePath };
}

test("M05 S04.2 persiste posição, saída e conclusão transacional no restart", () => {
  const { root, databasePath } = fixture();
  let store = new PlaybackStore(databasePath);
  try {
    const session = value(
      store.begin({
        sessionId: "playback:session:one",
        generation: 1,
        contentId: "movie:playback:test",
        sourceId: "source:playback:test",
        startPositionSeconds: 0,
      }),
    );
    expect(session).toMatchObject({ state: "launching", positionSeconds: 0 });
    expect(
      value(
        store.markFirstFrame({
          sessionId: "playback:session:one",
          generation: 1,
        }),
      ),
    ).toMatchObject({ state: "playing", firstFrameAt: expect.any(String) });
    const first = value(
      store.persist({
        sessionId: "playback:session:one",
        generation: 1,
        positionSeconds: 10.25,
        durationSeconds: 120,
        metrics: { videoCodec: "h264" },
        idempotencyKey: "playback-progress-one",
      }),
    );
    const replay = value(
      store.persist({
        sessionId: "playback:session:one",
        generation: 1,
        positionSeconds: 99,
        durationSeconds: 120,
        idempotencyKey: "playback-progress-one",
      }),
    );
    expect(replay).toEqual(first);
    store.close();
    store = new PlaybackStore(databasePath);
    expect(
      value(store.readProgress({ contentId: "movie:playback:test" })),
    ).toMatchObject({ positionSeconds: 10.25, watched: false, revision: 1 });
    const stopped = value(
      store.stop({
        sessionId: "playback:session:one",
        generation: 1,
        positionSeconds: 109,
        durationSeconds: 120,
        reason: "user",
        idempotencyKey: "playback-stop-one",
      }),
    );
    expect(stopped).toMatchObject({
      positionSeconds: 109,
      watched: true,
      completedAt: expect.any(String),
      revision: 2,
    });
    expect(
      value(
        store.stop({
          sessionId: "playback:session:one",
          generation: 1,
          positionSeconds: 0,
          durationSeconds: 120,
          reason: "user",
          idempotencyKey: "playback-stop-one",
        }),
      ),
    ).toEqual(stopped);
    const database = new DatabaseSync(databasePath);
    const state = database
      .prepare(
        "SELECT progress, history_json FROM user_content_state WHERE content_id = ?",
      )
      .get("movie:playback:test") as {
      progress: number;
      history_json: string;
    };
    expect(state.progress).toBe(109);
    expect(JSON.parse(state.history_json)).toMatchObject([
      {
        sessionId: "playback:session:one",
        watched: true,
        reason: "user",
      },
    ]);
    database.close();
  } finally {
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("M05 S04.2 rejeita geração antiga e recupera sessão interrompida", () => {
  const { root, databasePath } = fixture();
  let store = new PlaybackStore(databasePath);
  try {
    value(
      store.begin({
        sessionId: "playback:session:crash",
        generation: 4,
        contentId: "movie:playback:test",
        sourceId: "source:playback:test",
        startPositionSeconds: 30,
      }),
    );
    expect(
      store.persist({
        sessionId: "playback:session:crash",
        generation: 3,
        positionSeconds: 50,
        idempotencyKey: "playback-stale-generation",
      }),
    ).toMatchObject({
      ok: false,
      error: { code: "PLAYBACK_CONFLICT" },
    });
    store.close();
    store = new PlaybackStore(databasePath);
    expect(value(store.recoverInterrupted())).toEqual({ recoveredSessions: 1 });
    expect(
      value(store.readSession({ sessionId: "playback:session:crash" })),
    ).toMatchObject({
      state: "error",
      reason: "error",
      endedAt: expect.any(String),
    });
    expect(
      value(store.readProgress({ contentId: "movie:playback:test" })),
    ).toBeUndefined();
  } finally {
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("M05 S04.2 limita journal periódico e força persistência nas transições", () => {
  const { root, databasePath } = fixture();
  const store = new PlaybackStore(databasePath);
  let now = 10_000;
  const journal = new PlaybackProgressJournal(store, {
    intervalMs: 5_000,
    now: () => now,
  });
  try {
    value(
      store.begin({
        sessionId: "playback:session:journal",
        generation: 1,
        contentId: "movie:playback:test",
        sourceId: "source:playback:test",
        startPositionSeconds: 0,
      }),
    );
    expect(
      value(
        journal.record({
          sessionId: "playback:session:journal",
          generation: 1,
          positionSeconds: 1,
          durationSeconds: 120,
        }),
      ),
    ).toMatchObject({ persisted: true });
    now += 4_999;
    expect(
      value(
        journal.record({
          sessionId: "playback:session:journal",
          generation: 1,
          positionSeconds: 5,
          durationSeconds: 120,
        }),
      ),
    ).toEqual({ persisted: false });
    expect(
      value(store.readProgress({ contentId: "movie:playback:test" })),
    ).toMatchObject({ positionSeconds: 1, revision: 1 });
    expect(
      value(
        journal.flush({
          sessionId: "playback:session:journal",
          generation: 1,
          positionSeconds: 5,
          durationSeconds: 120,
        }),
      ),
    ).toMatchObject({
      persisted: true,
      progress: { positionSeconds: 5, revision: 2 },
    });
  } finally {
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});
