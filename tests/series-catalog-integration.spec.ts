import { expect, test } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Configuration, ConfigurationSnapshot } from "@ushark/types";
import type {
  EpisodeRecordSnapshot,
  SeriesCatalogPage,
  SeriesCatalogResult,
  SeriesCatalogSnapshot,
  SeriesImportCommandResult,
  SeriesImportReviewSnapshot,
} from "@ushark/types/series";

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
  MovieCatalogStore: new (databasePath: string) => { close(): void };
};
const { TorrentInspectionStore } =
  require("@ushark/core/torrent-inspection-store") as {
    TorrentInspectionStore: new (databasePath: string) => {
      confirmSource(input: Record<string, unknown>): SeriesCatalogResult<{
        sourceId: string;
      }>;
      close(): void;
    };
  };
const { SeriesCatalogStore } = require("@ushark/core/series") as {
  SeriesCatalogStore: new (databasePath: string) => {
    readCatalog(
      input: Record<string, unknown>,
    ): SeriesCatalogResult<SeriesCatalogSnapshot>;
    readEpisodes(
      input: Record<string, unknown>,
    ): SeriesCatalogResult<SeriesCatalogPage<EpisodeRecordSnapshot>>;
    readSourceReview(
      input: Record<string, unknown>,
    ): SeriesCatalogResult<SeriesImportReviewSnapshot>;
    close(): void;
  };
};
const { SeriesCatalogApplicationService } =
  require("@ushark/core/series-service") as {
    SeriesCatalogApplicationService: new (
      dependencies: Record<string, unknown>,
    ) => {
      beginReview(
        input: Record<string, unknown>,
      ): Promise<SeriesCatalogResult<SeriesImportReviewSnapshot>>;
      correctMapping(
        input: Record<string, unknown>,
      ): Promise<SeriesCatalogResult<SeriesImportReviewSnapshot>>;
      confirmImport(
        input: Record<string, unknown>,
      ): Promise<SeriesCatalogResult<SeriesImportCommandResult>>;
      close(): void;
    };
  };

function value<T>(result: SeriesCatalogResult<T>): T {
  expect(result.ok, result.ok ? undefined : result.error.message).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

test("M03 S05 importa pack real, recupera falha parcial e reabre selectors offline", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-series-s05-"));
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
  new MovieCatalogStore(databasePath).close();
  const torrentStore = new TorrentInspectionStore(databasePath);
  const seriesStore = new SeriesCatalogStore(databasePath);
  const files = [
    {
      id: "file:episode-1",
      index: 0,
      path: "Pack/Show.S01E01.1080p.mkv",
      name: "Show.S01E01.1080p.mkv",
      extension: ".mkv",
      sizeBytes: 1_000_000,
      offsetBytes: 0,
      kind: "video",
      selectable: true,
    },
    {
      id: "file:episode-2",
      index: 1,
      path: "Pack/Show.1x02.mkv",
      name: "Show.1x02.mkv",
      extension: ".mkv",
      sizeBytes: 1_100_000,
      offsetBytes: 1_000_000,
      kind: "video",
      selectable: true,
    },
    {
      id: "file:special-1",
      index: 2,
      path: "Pack/Show.Season 0 Episode 1.mkv",
      name: "Show.Season 0 Episode 1.mkv",
      extension: ".mkv",
      sizeBytes: 900_000,
      offsetBytes: 2_100_000,
      kind: "video",
      selectable: true,
    },
    {
      id: "file:manual-3",
      index: 3,
      path: "Pack/Show.third.mkv",
      name: "Show.third.mkv",
      extension: ".mkv",
      sizeBytes: 1_200_000,
      offsetBytes: 3_000_000,
      kind: "video",
      selectable: true,
    },
    {
      id: "file:subtitle-1",
      index: 4,
      path: "Pack/Show.S01E01.1080p.pt-BR.srt",
      name: "Show.S01E01.1080p.pt-BR.srt",
      extension: ".srt",
      sizeBytes: 4_000,
      offsetBytes: 4_200_000,
      kind: "other",
      selectable: false,
    },
  ];
  const snapshot = {
    schemaVersion: 1,
    operationId: "operation:series-pack",
    correlationId: "correlation:series-pack",
    sequence: 3,
    state: "files-ready",
    inputType: "torrent-file",
    inputLabel: "Show Pack.torrent",
    runtime: {
      infoHash: "0123456789abcdef0123456789abcdef01234567",
      torrentId: "torrent:0123456789abcdef0123456789abcdef01234567",
    },
    displayName: "Show Pack",
    totalFileCount: files.length,
    files,
    filesComplete: true,
    updatedAt: new Date().toISOString(),
  };
  let failOnce = true;
  const torrent = {
    async get() {
      return { ok: true, value: snapshot };
    },
    async getFiles() {
      throw new Error("unexpected pagination");
    },
    async confirm(input: Record<string, unknown>) {
      if (failOnce) {
        failOnce = false;
        return {
          ok: false,
          error: {
            code: "TORRENT_STORAGE_FAILED",
            message: "Falha transitória simulada.",
            recoverable: true,
            retryable: true,
          },
        };
      }
      return torrentStore.confirmSource({
        ...input,
        infoHash: snapshot.runtime.infoHash,
        inputType: snapshot.inputType,
        inputLabel: snapshot.inputLabel,
        displayName: snapshot.displayName,
        files,
      });
    },
  };
  const service = new SeriesCatalogApplicationService({
    store: seriesStore,
    provider: { providerState: "not-configured" },
    assets: { cacheRemoteImage: async () => ({ uri: "unused" }) },
    torrent,
  });
  try {
    let review = value(
      await service.beginReview({
        libraryId: saved.libraryId,
        operationId: snapshot.operationId,
        title: "Show",
        fileIds: files.slice(0, 4).map((file) => file.id),
        mutation: { idempotencyKey: "series-s05-begin" },
      }),
    );
    expect(review).toMatchObject({ state: "draft", issueCount: 1 });
    expect(review.files.items[0].subtitleCandidates).toEqual([
      "file:subtitle-1",
    ]);
    review = value(
      await service.correctMapping({
        reviewId: review.reviewId,
        fileId: "file:manual-3",
        action: {
          type: "assign",
          seasonNumber: 1,
          episodeNumber: 3,
          selectorType: "manual",
        },
        mutation: {
          idempotencyKey: "series-s05-correct-manual",
          expectedRevision: review.revision,
        },
      }),
    );
    review = value(
      await service.correctMapping({
        reviewId: review.reviewId,
        fileId: "file:episode-1",
        action: {
          type: "assign",
          seasonNumber: 1,
          episodeNumber: 1,
          selectorType: "episode",
        },
        selectedSubtitleFileId: "file:subtitle-1",
        mutation: {
          idempotencyKey: "series-s05-select-subtitle",
          expectedRevision: review.revision,
        },
      }),
    );
    expect(review.state).toBe("ready");

    const failed = await service.confirmImport({
      reviewId: review.reviewId,
      title: "Show Persistido",
      mutation: { idempotencyKey: "series-s05-confirm-fails" },
    });
    expect(failed).toMatchObject({
      ok: false,
      error: { code: "SERIES_IMPORT_INCOMPLETE", retryable: true },
    });

    const confirmed = value(
      await service.confirmImport({
        reviewId: review.reviewId,
        title: "Show Persistido",
        mutation: { idempotencyKey: "series-s05-confirm-retry" },
      }),
    );
    expect(confirmed.series).toMatchObject({
      metadata: { title: "Show Persistido" },
      episodeCount: 4,
    });
    expect(confirmed.review).toMatchObject({ state: "confirmed" });
    const sourceId = confirmed.review.sourceId;
    expect(sourceId).toBeTruthy();
    const episodePage = value(
      seriesStore.readEpisodes({
        libraryId: saved.libraryId,
        seriesId: confirmed.series.id,
        limit: 10,
      }),
    );
    expect(
      episodePage.items.map((episode) => [
        episode.seasonNumber,
        episode.episodeNumber,
        episode.sources[0].selector.type,
      ]),
    ).toEqual([
      [0, 1, "episode"],
      [1, 1, "episode"],
      [1, 2, "episode"],
      [1, 3, "manual"],
    ]);
    expect(
      episodePage.items.find(
        (episode) => episode.episodeNumber === 1 && episode.seasonNumber === 1,
      )!.sources[0].selectedSubtitleFileId,
    ).toBe("file:subtitle-1");

    service.close();
    seriesStore.close();
    torrentStore.close();
    const reopened = new SeriesCatalogStore(databasePath);
    expect(
      value(reopened.readCatalog({ libraryId: saved.libraryId })).series.total,
    ).toBe(1);
    expect(value(reopened.readSourceReview({ sourceId })).state).toBe(
      "confirmed",
    );
    expect(
      value(
        reopened.readEpisodes({
          libraryId: saved.libraryId,
          seriesId: confirmed.series.id,
          limit: 10,
        }),
      ).items,
    ).toEqual(episodePage.items);
    reopened.close();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
