import { expect, test } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { DatabaseSync } from "node:sqlite";
import type { Configuration, ConfigurationSnapshot } from "@ushark/types";
import type {
  EpisodeRecordSnapshot,
  EpisodeSourceRelation,
  SeriesCatalogPage,
  SeriesCatalogResult,
  SeriesCatalogSnapshot,
  SeriesImportReviewSnapshot,
  SeriesRecordSnapshot,
} from "@ushark/types/series";
import type { MovieCatalogResult, MovieDraft } from "@ushark/types/movies";

interface HierarchyInput {
  libraryId: string;
  series: {
    id: string;
    metadata: {
      title: string;
      genres?: string[];
      cast?: string[];
      externalIds?: { tmdb?: string; imdb?: string };
    };
  };
  episodes: Array<{
    id: string;
    seasonNumber: number;
    episodeNumber: number;
    metadata?: { title?: string };
  }>;
  mutation: { idempotencyKey: string; expectedRevision?: number };
}

interface HierarchyResult {
  snapshot: SeriesCatalogSnapshot;
  series: SeriesRecordSnapshot;
}

interface SeriesStore {
  upsertHierarchy(input: HierarchyInput): SeriesCatalogResult<HierarchyResult>;
  readCatalog(input: {
    libraryId: string;
    cursor?: { value: string };
    limit?: number;
  }): SeriesCatalogResult<SeriesCatalogSnapshot>;
  readSeries(input: {
    libraryId: string;
    seriesId: string;
  }): SeriesCatalogResult<SeriesRecordSnapshot>;
  readEpisodes(input: {
    libraryId: string;
    seriesId: string;
    seasonNumber?: number;
    cursor?: { value: string };
    limit?: number;
  }): SeriesCatalogResult<SeriesCatalogPage<EpisodeRecordSnapshot>>;
  createReview(
    input: Record<string, unknown>,
  ): SeriesCatalogResult<SeriesImportReviewSnapshot>;
  readReview(
    input: Record<string, unknown>,
  ): SeriesCatalogResult<SeriesImportReviewSnapshot>;
  correctMapping(
    input: Record<string, unknown>,
  ): SeriesCatalogResult<SeriesImportReviewSnapshot>;
  persistEpisodeMappings(input: Record<string, unknown>): SeriesCatalogResult<{
    review: SeriesImportReviewSnapshot;
    relations: EpisodeSourceRelation[];
  }>;
  setEpisodeArtwork(
    input: Record<string, unknown>,
  ): SeriesCatalogResult<EpisodeRecordSnapshot>;
  close(): void;
}

interface TorrentStore {
  confirmSource(input: Record<string, unknown>): {
    ok: boolean;
    value?: { sourceId: string };
    error?: { message: string };
  };
  snapshot(): {
    ok: boolean;
    value?: {
      contentSources: Array<{
        contentId: string;
        sourceId: string;
        selector: { type: string; fileId?: string };
      }>;
    };
  };
  close(): void;
}

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
    }): MovieCatalogResult<unknown>;
    read(input: { libraryId: string }): MovieCatalogResult<unknown>;
    close(): void;
  };
};
const { TorrentInspectionStore } =
  require("@ushark/core/torrent-inspection-store") as {
    TorrentInspectionStore: new (databasePath: string) => TorrentStore;
  };
const { SeriesCatalogStore } = require("@ushark/core/series") as {
  SeriesCatalogStore: new (databasePath: string) => SeriesStore;
};

function value<T>(result: SeriesCatalogResult<T>): T {
  expect(result.ok, result.ok ? undefined : result.error.message).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-series-store-"));
  const databasePath = path.join(root, "state", "ushark.db");
  const configuration = new ConfigurationStore(
    databasePath,
    path.join(root, "managed"),
  );
  const base = configuration.read().configuration;
  const saved = configuration.save(
    {
      ...base,
      libraryPath: path.join(root, "library"),
      cachePath: path.join(root, "cache"),
    },
    { completeOnboarding: true },
  ).configuration;
  configuration.close();

  const movies = new MovieCatalogStore(databasePath);
  const movie = movies.save({
    libraryId: saved.libraryId,
    draft: {
      metadata: {
        id: "movie:local:preserved",
        title: "Filme preservado",
        genres: [],
        cast: [],
      },
    },
    mutation: { idempotencyKey: "series-migration-movie" },
  });
  expect(movie.ok).toBe(true);
  movies.close();

  // M06 is an explicit M03 dependency and owns the selector/source tables.
  new TorrentInspectionStore(databasePath).close();
  return {
    root,
    databasePath,
    libraryId: saved.libraryId,
    store: new SeriesCatalogStore(databasePath),
  };
}

function hierarchy(
  libraryId: string,
  id = "series:local:orbitas",
): HierarchyInput {
  return {
    libraryId,
    series: {
      id,
      metadata: {
        title: "Entre Órbitas",
        genres: ["Drama"],
        cast: [],
      },
    },
    episodes: [
      {
        id: `${id}:0:1`,
        seasonNumber: 0,
        episodeNumber: 1,
        metadata: { title: "Especial" },
      },
      ...Array.from({ length: 6 }, (_, index) => ({
        id: `${id}:1:${index + 1}`,
        seasonNumber: 1,
        episodeNumber: index + 1,
        metadata: { title: `Episódio ${index + 1}` },
      })),
    ],
    mutation: { idempotencyKey: `hierarchy-${id}` },
  };
}

test("M03 S04.1 migra M02 sem perder filmes e persiste a hierarquia no restart", () => {
  const { root, databasePath, libraryId, store } = fixture();
  try {
    const input = hierarchy(libraryId);
    const first = value(store.upsertHierarchy(input));
    const replay = value(store.upsertHierarchy(input));
    expect(replay).toEqual(first);
    expect(first.series).toMatchObject({
      id: "series:local:orbitas",
      episodeCount: 7,
      seasons: [
        { seasonNumber: 0, episodeCount: 1 },
        { seasonNumber: 1, episodeCount: 6 },
      ],
    });
    const artwork = value(
      store.setEpisodeArtwork({
        libraryId,
        episodeId: "series:local:orbitas:1:1",
        artwork: {
          src: `ushark-asset://${"a".repeat(64)}`,
          fileName: "episodio.gif",
          mimeType: "image/gif",
        },
        mutation: { idempotencyKey: "series-episode-artwork" },
      }),
    );
    expect(artwork.artwork?.fileName).toBe("episodio.gif");
    store.close();

    const reopened = new SeriesCatalogStore(databasePath);
    expect(
      value(
        reopened.readSeries({
          libraryId,
          seriesId: "series:local:orbitas",
        }),
      ),
    ).toEqual(first.series);
    const season = value(
      reopened.readEpisodes({
        libraryId,
        seriesId: "series:local:orbitas",
        seasonNumber: 1,
        limit: 3,
      }),
    );
    expect(season.items.map((episode) => episode.episodeNumber)).toEqual([
      1, 2, 3,
    ]);
    expect(season.nextCursor?.value).toBeTruthy();
    expect(season.items[0].artwork).toEqual({
      src: `ushark-asset://${"a".repeat(64)}`,
      fileName: "episodio.gif",
      mimeType: "image/gif",
    });
    expect(
      value(
        reopened.readEpisodes({
          libraryId,
          seriesId: "series:local:orbitas",
          seasonNumber: 1,
          cursor: season.nextCursor,
          limit: 3,
        }),
      ).items.map((episode) => episode.episodeNumber),
    ).toEqual([4, 5, 6]);
    reopened.close();

    const movies = new MovieCatalogStore(databasePath);
    const movieSnapshot = movies.read({ libraryId });
    expect(movieSnapshot.ok).toBe(true);
    expect(JSON.stringify(movieSnapshot)).toContain("movie:local:preserved");
    movies.close();

    const database = new DatabaseSync(databasePath);
    expect(database.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
    expect(
      database
        .prepare("SELECT type FROM contents ORDER BY type, id")
        .all()
        .map((row) => row.type),
    ).toEqual([
      "episode",
      "episode",
      "episode",
      "episode",
      "episode",
      "episode",
      "episode",
      "movie",
      "series",
    ]);
    database.close();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("M03 S04.1 rejeita colisão e mudança de identidade com rollback", () => {
  const { root, libraryId, store } = fixture();
  try {
    value(store.upsertHierarchy(hierarchy(libraryId)));
    const before = value(
      store.readSeries({ libraryId, seriesId: "series:local:orbitas" }),
    );
    const conflict = hierarchy(libraryId);
    conflict.series.metadata.title = "Não deve persistir";
    conflict.episodes = [
      {
        id: "series:local:orbitas:1:1",
        seasonNumber: 2,
        episodeNumber: 1,
      },
    ];
    conflict.mutation.idempotencyKey = "hierarchy-conflicting-identity";
    const failed = store.upsertHierarchy(conflict);
    expect(failed).toMatchObject({
      ok: false,
      error: { code: "SERIES_IDENTITY_CONFLICT" },
    });
    expect(value(store.readSeries({ libraryId, seriesId: before.id }))).toEqual(
      before,
    );

    const revision = value(store.readCatalog({ libraryId })).revision;
    const stale = hierarchy(libraryId, "series:local:stale");
    stale.mutation = {
      idempotencyKey: "hierarchy-stale-revision",
      expectedRevision: revision - 1,
    };
    expect(store.upsertHierarchy(stale)).toMatchObject({
      ok: false,
      error: { code: "SERIES_REVISION_CONFLICT", retryable: true },
    });
    store.close();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("M03 S04.1 pagina 50 mil episódios usando o índice de hierarquia", () => {
  const { root, databasePath, libraryId, store } = fixture();
  try {
    const large: HierarchyInput = {
      libraryId,
      series: {
        id: "series:local:large",
        metadata: { title: "Arquivo das Estrelas", genres: [], cast: [] },
      },
      episodes: Array.from({ length: 50_000 }, (_, index) => ({
        id: `episode:large:${index}`,
        seasonNumber: Math.floor(index / 1_000),
        episodeNumber: (index % 1_000) + 1,
      })),
      mutation: { idempotencyKey: "hierarchy-large-fifty-thousand" },
    };
    const writeStarted = performance.now();
    const saved = value(store.upsertHierarchy(large));
    const writeMs = performance.now() - writeStarted;
    expect(saved.series.episodeCount).toBe(50_000);

    const readStarted = performance.now();
    const first = value(
      store.readEpisodes({
        libraryId,
        seriesId: large.series.id,
        limit: 128,
      }),
    );
    const readMs = performance.now() - readStarted;
    expect(first.items).toHaveLength(128);
    expect(first.total).toBe(50_000);
    expect(first.nextCursor?.value).toBeTruthy();
    expect(writeMs).toBeLessThan(15_000);
    expect(readMs).toBeLessThan(1_000);

    const database = new DatabaseSync(databasePath);
    const plan = database
      .prepare(
        `EXPLAIN QUERY PLAN
         SELECT content_id FROM episodes
         WHERE series_content_id = ?
         ORDER BY season_number, episode_number, content_id LIMIT 128`,
      )
      .all(large.series.id)
      .map((row) => String(row.detail))
      .join(" ");
    expect(plan).toContain("idx_episodes_series_order");
    database.close();
    test.info().annotations.push({
      type: "benchmark",
      description: `50k insert=${writeMs.toFixed(1)}ms first-page=${readMs.toFixed(1)}ms`,
    });
    store.close();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

const reviewFiles = [
  {
    id: "file:0",
    path: "Show/Show.S01E01.mkv",
    name: "Show.S01E01.mkv",
    extension: "mkv",
    sizeBytes: 1_000_000,
    kind: "video",
    selectable: true,
  },
  {
    id: "file:1",
    path: "Show/Show.1x02.mkv",
    name: "Show.1x02.mkv",
    extension: "mkv",
    sizeBytes: 1_000_000,
    kind: "video",
    selectable: true,
  },
  {
    id: "file:2",
    path: "Show/Show.03.mkv",
    name: "Show.03.mkv",
    extension: "mkv",
    sizeBytes: 1_000_000,
    kind: "video",
    selectable: true,
  },
  {
    id: "file:3",
    path: "Show/Show.S01E01E02.mkv",
    name: "Show.S01E01E02.mkv",
    extension: "mkv",
    sizeBytes: 2_000_000,
    kind: "video",
    selectable: true,
  },
  {
    id: "file:4",
    path: "Show/Show.S01E01.pt-BR.srt",
    name: "Show.S01E01.pt-BR.srt",
    extension: "srt",
    sizeBytes: 10_000,
    kind: "other",
    selectable: false,
  },
  {
    id: "file:5",
    path: "Show/sample.S01E04.mkv",
    name: "sample.S01E04.mkv",
    extension: "mkv",
    sizeBytes: 1_000,
    kind: "sample",
    selectable: false,
  },
];

test("M03 S04.2 persiste correções e mantém multi-episódio revisável", () => {
  const { root, databasePath, libraryId, store } = fixture();
  try {
    value(store.upsertHierarchy(hierarchy(libraryId)));
    const review = value(
      store.createReview({
        libraryId,
        operationId: "operation:series-review",
        seriesId: "series:local:orbitas",
        title: "Entre Órbitas",
        files: reviewFiles,
        mutation: { idempotencyKey: "review-create-series-pack" },
      }),
    );
    expect(review).toMatchObject({
      state: "draft",
      mappedCount: 2,
      issueCount: 2,
    });
    expect(
      review.files.items.map((file) => ({
        id: file.fileId,
        state: file.mappingState,
      })),
    ).toEqual([
      { id: "file:0", state: "identified" },
      { id: "file:1", state: "identified" },
      { id: "file:2", state: "unidentified" },
      { id: "file:3", state: "multiple-episodes" },
      { id: "file:4", state: "skipped" },
      { id: "file:5", state: "skipped" },
    ]);
    expect(review.files.items[0].subtitleCandidates).toEqual(["file:4"]);

    const corrected = value(
      store.correctMapping({
        reviewId: review.reviewId,
        fileId: "file:2",
        action: {
          type: "assign",
          seasonNumber: 1,
          episodeNumber: 3,
          selectorType: "manual",
        },
        mutation: {
          idempotencyKey: "review-correct-file-three",
          expectedRevision: review.revision,
        },
      }),
    );
    const skipped = value(
      store.correctMapping({
        reviewId: review.reviewId,
        fileId: "file:3",
        action: { type: "skip" },
        mutation: {
          idempotencyKey: "review-skip-multi-episode",
          expectedRevision: corrected.revision,
        },
      }),
    );
    const withSubtitle = value(
      store.correctMapping({
        reviewId: review.reviewId,
        fileId: "file:0",
        action: {
          type: "assign",
          seasonNumber: 1,
          episodeNumber: 1,
          selectorType: "episode",
        },
        selectedSubtitleFileId: "file:4",
        mutation: {
          idempotencyKey: "review-select-subtitle",
          expectedRevision: skipped.revision,
        },
      }),
    );
    expect(withSubtitle).toMatchObject({
      state: "ready",
      mappedCount: 3,
      issueCount: 0,
    });
    expect(
      withSubtitle.files.items.find((file) => file.fileId === "file:0"),
    ).toMatchObject({
      mappingState: "manual",
      selectedSubtitleFileId: "file:4",
    });
    store.close();

    const reopened = new SeriesCatalogStore(databasePath);
    expect(value(reopened.readReview({ reviewId: review.reviewId }))).toEqual(
      withSubtitle,
    );
    reopened.close();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("M03 S04.2 mantém selectors independentes na mesma source e retry idempotente", () => {
  const { root, databasePath, libraryId, store } = fixture();
  try {
    value(store.upsertHierarchy(hierarchy(libraryId)));
    const cleanFiles = reviewFiles.filter((file) =>
      ["file:0", "file:1", "file:4"].includes(file.id),
    );
    let review = value(
      store.createReview({
        libraryId,
        operationId: "operation:clean-pack",
        seriesId: "series:local:orbitas",
        title: "Entre Órbitas",
        files: cleanFiles,
        mutation: { idempotencyKey: "review-create-clean-pack" },
      }),
    );
    expect(review.state).toBe("ready");
    review = value(
      store.correctMapping({
        reviewId: review.reviewId,
        fileId: "file:0",
        action: {
          type: "assign",
          seasonNumber: 1,
          episodeNumber: 1,
          selectorType: "episode",
        },
        selectedSubtitleFileId: "file:4",
        mutation: {
          idempotencyKey: "review-clean-select-subtitle",
          expectedRevision: review.revision,
        },
      }),
    );
    expect(review.state).toBe("ready");

    const torrent = new TorrentInspectionStore(databasePath);
    const confirmed = torrent.confirmSource({
      operationId: "operation:clean-pack",
      contentId: "series:local:orbitas:1:1",
      infoHash: "0123456789abcdef0123456789abcdef01234567",
      inputType: "torrent-file",
      inputLabel: "Show.torrent",
      displayName: "Show",
      files: cleanFiles,
      selector: {
        type: "episode",
        season: 1,
        episode: 1,
        fileId: "file:0",
      },
      mutation: { idempotencyKey: "torrent-confirm-clean-pack" },
    });
    expect(confirmed.ok, confirmed.error?.message).toBe(true);
    const sourceId = confirmed.value?.sourceId as string;
    torrent.close();

    const input = {
      reviewId: review.reviewId,
      sourceId,
      mutation: { idempotencyKey: "persist-clean-pack-selectors" },
    };
    const first = value(store.persistEpisodeMappings(input));
    const replay = value(store.persistEpisodeMappings(input));
    expect(replay).toEqual(first);
    expect(first.relations).toHaveLength(2);
    expect(
      first.relations.map((relation) => ({
        episodeId: relation.episodeId,
        fileId: relation.selector.fileId,
      })),
    ).toEqual([
      { episodeId: "series:local:orbitas:1:1", fileId: "file:0" },
      { episodeId: "series:local:orbitas:1:2", fileId: "file:1" },
    ]);

    const torrentSnapshot = new TorrentInspectionStore(databasePath);
    const contentSources = torrentSnapshot.snapshot().value?.contentSources;
    expect(contentSources).toHaveLength(2);
    expect(
      new Set(contentSources?.map((relation) => relation.sourceId)).size,
    ).toBe(1);
    torrentSnapshot.close();

    const database = new DatabaseSync(databasePath);
    expect(
      (
        database
          .prepare(
            `SELECT selected_subtitle_file_id FROM content_source_selectors
             WHERE content_id = ?`,
          )
          .get("series:local:orbitas:1:1") as {
          selected_subtitle_file_id: string | null;
        }
      ).selected_subtitle_file_id,
    ).toBe("file:4");
    const relationCount = database
      .prepare("SELECT COUNT(*) AS total FROM content_source_selectors")
      .get() as { total: number };
    expect(relationCount.total).toBe(2);
    database.close();

    const changed = value(
      store.createReview({
        libraryId,
        operationId: "operation:source-changed",
        seriesId: "series:local:orbitas",
        title: "Entre Órbitas",
        files: [reviewFiles[2]],
        mutation: { idempotencyKey: "review-create-source-changed" },
      }),
    );
    const corrected = value(
      store.correctMapping({
        reviewId: changed.reviewId,
        fileId: "file:2",
        action: {
          type: "assign",
          seasonNumber: 1,
          episodeNumber: 3,
          selectorType: "manual",
        },
        mutation: {
          idempotencyKey: "review-map-source-changed",
          expectedRevision: changed.revision,
        },
      }),
    );
    expect(corrected.state).toBe("ready");
    expect(
      store.persistEpisodeMappings({
        reviewId: changed.reviewId,
        sourceId,
        mutation: { idempotencyKey: "persist-source-changed" },
      }),
    ).toMatchObject({
      ok: false,
      error: { code: "SERIES_SOURCE_CHANGED", retryable: true },
    });
    store.close();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
