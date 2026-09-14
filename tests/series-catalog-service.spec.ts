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
  SeriesMetadata,
  SeriesRecordSnapshot,
} from "@ushark/types/series";

interface Store {
  upsertHierarchy(input: Record<string, unknown>): SeriesCatalogResult<{
    snapshot: SeriesCatalogSnapshot;
    series: SeriesRecordSnapshot;
  }>;
  readCatalog(
    input: Record<string, unknown>,
  ): SeriesCatalogResult<SeriesCatalogSnapshot>;
  readSeries(
    input: Record<string, unknown>,
  ): SeriesCatalogResult<SeriesRecordSnapshot>;
  readEpisodes(
    input: Record<string, unknown>,
  ): SeriesCatalogResult<SeriesCatalogPage<EpisodeRecordSnapshot>>;
  close(): void;
}

interface Service {
  readCatalog(
    input: Record<string, unknown>,
  ): Promise<SeriesCatalogResult<SeriesCatalogSnapshot>>;
  refreshMetadata(
    input: Record<string, unknown>,
  ): Promise<SeriesCatalogResult<SeriesRecordSnapshot>>;
  searchMetadata(
    input: Record<string, unknown>,
  ): Promise<SeriesCatalogResult<Record<string, unknown>>>;
  cancelMetadataRequest(
    input: Record<string, unknown>,
  ): Promise<SeriesCatalogResult<{ requestId: string; cancelled: boolean }>>;
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
  MovieCatalogStore: new (databasePath: string) => { close(): void };
};
const { TorrentInspectionStore } =
  require("@ushark/core/torrent-inspection-store") as {
    TorrentInspectionStore: new (databasePath: string) => { close(): void };
  };
const { SeriesCatalogStore } = require("@ushark/core/series") as {
  SeriesCatalogStore: new (databasePath: string) => Store;
};
const { SeriesCatalogApplicationService } =
  require("@ushark/core/series-service") as {
    SeriesCatalogApplicationService: new (dependencies: {
      store: Store;
      provider: Record<string, unknown>;
      assets: Record<string, unknown>;
    }) => Service;
  };

function value<T>(result: SeriesCatalogResult<T>): T {
  expect(result.ok, result.ok ? undefined : result.error.message).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-series-service-"));
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
  new TorrentInspectionStore(databasePath).close();
  const store = new SeriesCatalogStore(databasePath);
  value(
    store.upsertHierarchy({
      libraryId: saved.libraryId,
      series: {
        id: "series:local:breaking-bad",
        metadata: {
          title: "Título local",
          genres: [],
          cast: ["Elenco local"],
          externalIds: { tmdb: "1396" },
        },
      },
      episodes: [
        {
          id: "episode:local:breaking-bad:1:1",
          seasonNumber: 1,
          episodeNumber: 1,
          metadata: { title: "Piloto local" },
        },
      ],
      mutation: { idempotencyKey: "series-service-seed" },
    }),
  );
  return { root, store, libraryId: saved.libraryId };
}

test("M03 S04.3 atualiza série/episódio sem trocar identidades e localiza imagens", async () => {
  const { root, store, libraryId } = fixture();
  try {
    const localized: string[] = [];
    const provider = {
      providerState: "available",
      async refreshSeriesHierarchyWithState(
        _metadata: SeriesMetadata,
        seasons: number[],
      ) {
        expect(seasons).toEqual([1]);
        return {
          state: "available",
          metadata: {
            title: "Breaking Bad",
            genres: ["Drama"],
            cast: ["Elenco local"],
            poster: "https://image.tmdb.org/t/p/w500/poster.jpg",
            backdrop: "https://image.tmdb.org/t/p/w1280/backdrop.jpg",
            externalIds: { tmdb: "1396", imdb: "tt0903747" },
          },
          episodes: [
            {
              providerId: "62085",
              seasonNumber: 1,
              episodeNumber: 1,
              metadata: {
                title: "Pilot",
                still: "https://image.tmdb.org/t/p/w500/pilot.jpg",
                externalIds: { tmdb: "62085" },
              },
            },
            {
              providerId: "62086",
              seasonNumber: 1,
              episodeNumber: 2,
              metadata: {
                title: "Cat's in the Bag...",
                externalIds: { tmdb: "62086" },
              },
            },
          ],
        };
      },
    };
    const assets = {
      async cacheRemoteImage(url: string) {
        localized.push(url);
        return { uri: `ushark-asset://sha256/${path.basename(url)}` };
      },
    };
    const service = new SeriesCatalogApplicationService({
      store,
      provider,
      assets,
    });
    const revision = value(store.readCatalog({ libraryId })).revision;
    const refreshed = value(
      await service.refreshMetadata({
        libraryId,
        seriesId: "series:local:breaking-bad",
        requestId: "series-refresh-breaking-bad",
        mutation: {
          idempotencyKey: "series-refresh-breaking-bad",
          expectedRevision: revision,
        },
      }),
    );
    expect(refreshed).toMatchObject({
      id: "series:local:breaking-bad",
      metadata: {
        title: "Breaking Bad",
        poster: "ushark-asset://sha256/poster.jpg",
        backdrop: "ushark-asset://sha256/backdrop.jpg",
        externalIds: { tmdb: "1396", imdb: "tt0903747" },
      },
      episodeCount: 2,
    });
    const episodes = value(
      store.readEpisodes({
        libraryId,
        seriesId: refreshed.id,
        limit: 10,
      }),
    );
    expect(episodes.items).toMatchObject([
      {
        id: "episode:local:breaking-bad:1:1",
        metadata: {
          title: "Pilot",
          still: "ushark-asset://sha256/pilot.jpg",
          externalIds: { tmdb: "62085" },
        },
      },
      {
        id: "episode:tmdb:62086",
        metadata: { title: "Cat's in the Bag..." },
      },
    ]);
    expect(localized).toHaveLength(3);
    expect(value(await service.readCatalog({ libraryId })).providerState).toBe(
      "available",
    );
    service.close();
    store.close();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("M03 S04.3 falha de provider preserva catálogo e cancelamento é explícito", async () => {
  const { root, store, libraryId } = fixture();
  try {
    const before = value(
      store.readSeries({
        libraryId,
        seriesId: "series:local:breaking-bad",
      }),
    );
    const provider = {
      providerState: "offline",
      refreshSeriesHierarchyWithState: async () => {
        throw Object.assign(new Error("offline"), {
          code: "PROVIDER_OFFLINE",
          publicMessage: "O provider está offline.",
          retryable: true,
        });
      },
      searchSeriesWithState(
        _query: string,
        _year: number | undefined,
        signal: AbortSignal,
      ) {
        return new Promise((_resolve, reject) => {
          signal.addEventListener(
            "abort",
            () =>
              reject(
                Object.assign(new Error("cancelled"), {
                  code: "PROVIDER_CANCELLED",
                  publicMessage: "A busca foi cancelada.",
                  retryable: false,
                }),
              ),
            { once: true },
          );
        });
      },
    };
    const service = new SeriesCatalogApplicationService({
      store,
      provider,
      assets: { cacheRemoteImage: async () => ({ uri: "unused" }) },
    });
    const refresh = await service.refreshMetadata({
      libraryId,
      seriesId: before.id,
      requestId: "series-refresh-offline",
      mutation: { idempotencyKey: "series-refresh-offline" },
    });
    expect(refresh).toMatchObject({
      ok: false,
      error: { code: "SERIES_PROVIDER_OFFLINE", retryable: true },
    });
    expect(value(store.readSeries({ libraryId, seriesId: before.id }))).toEqual(
      before,
    );

    const pending = service.searchMetadata({
      query: "Breaking Bad",
      requestId: "series-search-cancelled",
    });
    expect(
      value(
        await service.cancelMetadataRequest({
          requestId: "series-search-cancelled",
        }),
      ),
    ).toEqual({ requestId: "series-search-cancelled", cancelled: true });
    expect(await pending).toMatchObject({
      ok: false,
      error: { code: "SERIES_PROVIDER_CANCELLED" },
    });
    service.close();
    store.close();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
