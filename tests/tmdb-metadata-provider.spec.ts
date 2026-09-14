import { expect, test } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { MovieMetadata } from "@ushark/types/movies";
import type { SeriesMetadata } from "@ushark/types/series";

const { ConfigurationStore } = require("@ushark/core/configuration") as {
  ConfigurationStore: new (
    databasePath: string,
    dataRoot: string,
  ) => {
    close(): void;
  };
};

interface ProviderStateResult {
  state: "available" | "offline" | "degraded" | "not-configured";
  results: MovieMetadata[];
}

const {
  MAX_RESPONSE_BYTES,
  SqliteMetadataCache,
  TmdbMetadataProvider,
}: {
  MAX_RESPONSE_BYTES: number;
  SqliteMetadataCache: new (databasePath: string) => {
    read(key: string): { value: unknown; fresh: boolean } | undefined;
    write(key: string, value: unknown, ttlSeconds: number): void;
    close(): void;
  };
  TmdbMetadataProvider: new (options: {
    accessToken?: string;
    cache?: {
      read(key: string): { value: unknown; fresh: boolean } | undefined;
      write(key: string, value: unknown, ttlSeconds: number): void;
    };
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
  }) => {
    providerState: ProviderStateResult["state"];
    searchWithState(
      title: string,
      year?: number,
      signal?: AbortSignal,
    ): Promise<ProviderStateResult>;
    refreshWithState(
      metadata: MovieMetadata,
      signal?: AbortSignal,
    ): Promise<{
      state: ProviderStateResult["state"];
      metadata: MovieMetadata;
    }>;
    searchSeriesWithState(
      title: string,
      startYear?: number,
      signal?: AbortSignal,
    ): Promise<{
      state: ProviderStateResult["state"];
      results: Array<SeriesMetadata & { contentId: string }>;
    }>;
    refreshSeriesHierarchyWithState(
      metadata: SeriesMetadata,
      seasonNumbers: number[],
      signal?: AbortSignal,
    ): Promise<{
      state: ProviderStateResult["state"];
      metadata: SeriesMetadata;
      episodes: Array<{
        providerId: string;
        seasonNumber: number;
        episodeNumber: number;
        metadata: Record<string, unknown>;
      }>;
    }>;
  };
} = require("@ushark/core/metadata");

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-tmdb-"));
  const databasePath = path.join(root, "state", "ushark.db");
  const configuration = new ConfigurationStore(
    databasePath,
    path.join(root, "managed"),
  );
  configuration.close();
  return {
    root,
    cache: new SqliteMetadataCache(databasePath),
  };
}

const searchPayload = {
  results: [
    {
      id: 157336,
      title: "Interestelar",
      original_title: "Interstellar",
      release_date: "2014-11-05",
      overview: "Uma equipe cruza o espaço em busca de um novo lar.",
      poster_path: "/poster.jpg",
      backdrop_path: "/backdrop.jpg",
    },
  ],
};

test("TMDB adapter valida, normaliza e reutiliza cache sem expor token", async () => {
  const { root, cache } = fixture();
  try {
    const calls: Array<{ url: string; authorization: string | null }> = [];
    const provider = new TmdbMetadataProvider({
      accessToken: "secret-token",
      cache,
      fetchImpl: (async (input, init) => {
        const headers = new Headers(init?.headers);
        calls.push({
          url: String(input),
          authorization: headers.get("authorization"),
        });
        return new Response(JSON.stringify(searchPayload), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }) as typeof fetch,
    });

    const first = await provider.searchWithState("Interestelar", 2014);
    const cached = await provider.searchWithState("Interestelar", 2014);
    expect(first).toMatchObject({
      state: "available",
      results: [
        {
          id: "movie:tmdb:157336",
          title: "Interestelar",
          originalTitle: "Interstellar",
          year: 2014,
          externalIds: { tmdb: "157336" },
        },
      ],
    });
    expect(first.results[0].poster).toBe(
      "https://image.tmdb.org/t/p/w500/poster.jpg",
    );
    expect(cached).toEqual(first);
    expect(calls).toEqual([
      {
        url: expect.stringContaining(
          "https://api.themoviedb.org/3/search/movie?",
        ),
        authorization: "Bearer secret-token",
      },
    ]);
    expect(JSON.stringify(first)).not.toContain("secret-token");
  } finally {
    cache.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("TMDB refresh preserva identidade e estado pertencente ao catálogo", async () => {
  const { root, cache } = fixture();
  try {
    const provider = new TmdbMetadataProvider({
      accessToken: "token",
      cache,
      fetchImpl: (async () =>
        new Response(
          JSON.stringify({
            ...searchPayload.results[0],
            runtime: 169,
            genres: [{ id: 12, name: "Aventura" }],
            external_ids: { imdb_id: "tt0816692" },
          }),
          { status: 200 },
        )) as typeof fetch,
    });
    const previous: MovieMetadata = {
      id: "movie:local:preserved",
      title: "Título local",
      genres: [],
      cast: ["Elenco preservado"],
      externalIds: { tmdb: "157336" },
    };
    const result = await provider.refreshWithState(previous);
    expect(result).toMatchObject({
      state: "available",
      metadata: {
        id: "movie:local:preserved",
        title: "Interestelar",
        duration: 169,
        genres: ["Aventura"],
        cast: ["Elenco preservado"],
        externalIds: { tmdb: "157336", imdb: "tt0816692" },
      },
    });
  } finally {
    cache.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("TMDB adapter usa cache expirado como fallback degradado", async () => {
  const { root, cache } = fixture();
  try {
    cache.write(
      "tmdb:search:interestelar:2014",
      [
        {
          id: "movie:tmdb:157336",
          title: "Interestelar em cache",
          genres: [],
          cast: [],
          externalIds: { tmdb: "157336" },
        },
      ],
      -1,
    );
    const provider = new TmdbMetadataProvider({
      accessToken: "token",
      cache,
      fetchImpl: (async () => {
        throw new TypeError("offline");
      }) as typeof fetch,
    });
    const result = await provider.searchWithState("Interestelar", 2014);
    expect(result).toMatchObject({
      state: "degraded",
      results: [{ title: "Interestelar em cache" }],
    });
  } finally {
    cache.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("TMDB adapter distingue credencial ausente, cancelamento e timeout", async () => {
  const missing = new TmdbMetadataProvider({});
  await expect(missing.searchWithState("Interestelar")).rejects.toMatchObject({
    code: "PROVIDER_NOT_CONFIGURED",
  });

  const waitingFetch = (async (_input, init) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () =>
        reject(new DOMException("aborted", "AbortError")),
      );
    })) as typeof fetch;
  const controller = new AbortController();
  const cancelled = new TmdbMetadataProvider({
    accessToken: "token",
    fetchImpl: waitingFetch,
    timeoutMs: 1000,
  });
  const cancellation = cancelled.searchWithState(
    "Interestelar",
    undefined,
    controller.signal,
  );
  controller.abort();
  await expect(cancellation).rejects.toMatchObject({
    code: "PROVIDER_CANCELLED",
  });

  const timed = new TmdbMetadataProvider({
    accessToken: "token",
    fetchImpl: waitingFetch,
    timeoutMs: 5,
  });
  await expect(timed.searchWithState("Interestelar")).rejects.toMatchObject({
    code: "PROVIDER_TIMEOUT",
    retryable: true,
  });
});

test("TMDB adapter rejeita payload inválido ou acima do limite", async () => {
  const malformed = new TmdbMetadataProvider({
    accessToken: "token",
    fetchImpl: (async () =>
      new Response("{invalid", { status: 200 })) as typeof fetch,
  });
  await expect(malformed.searchWithState("Interestelar")).rejects.toMatchObject(
    {
      code: "PROVIDER_FAILED",
    },
  );

  const oversized = new TmdbMetadataProvider({
    accessToken: "token",
    fetchImpl: (async () =>
      new Response("x".repeat(MAX_RESPONSE_BYTES + 1), {
        status: 200,
      })) as typeof fetch,
  });
  await expect(oversized.searchWithState("Interestelar")).rejects.toMatchObject(
    {
      code: "PROVIDER_FAILED",
      retryable: false,
    },
  );
});

test("M03 TMDB busca série e carrega metadata hierárquica com cache", async () => {
  const { root, cache } = fixture();
  try {
    const calls: string[] = [];
    const provider = new TmdbMetadataProvider({
      accessToken: "token",
      cache,
      fetchImpl: (async (input) => {
        const url = String(input);
        calls.push(url);
        if (url.includes("/search/tv?"))
          return new Response(
            JSON.stringify({
              results: [
                {
                  id: 1396,
                  name: "Breaking Bad",
                  original_name: "Breaking Bad",
                  first_air_date: "2008-01-20",
                  overview: "Um professor muda de vida.",
                  poster_path: "/breaking-poster.jpg",
                  backdrop_path: "/breaking-backdrop.jpg",
                },
              ],
            }),
            { status: 200 },
          );
        if (url.includes("/season/1"))
          return new Response(
            JSON.stringify({
              episodes: [
                {
                  id: 62085,
                  season_number: 1,
                  episode_number: 1,
                  name: "Pilot",
                  overview: "Primeiro episódio.",
                  runtime: 58,
                  air_date: "2008-01-20",
                  still_path: "/pilot.jpg",
                },
              ],
            }),
            { status: 200 },
          );
        return new Response(
          JSON.stringify({
            id: 1396,
            name: "Breaking Bad",
            original_name: "Breaking Bad",
            first_air_date: "2008-01-20",
            last_air_date: "2013-09-29",
            overview: "Um professor muda de vida.",
            status: "Ended",
            genres: [{ name: "Drama" }],
            external_ids: { imdb_id: "tt0903747" },
            poster_path: "/breaking-poster.jpg",
            backdrop_path: "/breaking-backdrop.jpg",
          }),
          { status: 200 },
        );
      }) as typeof fetch,
    });

    const search = await provider.searchSeriesWithState("Breaking Bad", 2008);
    expect(search).toMatchObject({
      state: "available",
      results: [
        {
          contentId: "series:tmdb:1396",
          title: "Breaking Bad",
          startYear: 2008,
          externalIds: { tmdb: "1396" },
        },
      ],
    });
    const refreshed = await provider.refreshSeriesHierarchyWithState(
      search.results[0],
      [1],
    );
    expect(refreshed).toMatchObject({
      state: "available",
      metadata: {
        title: "Breaking Bad",
        endYear: 2013,
        genres: ["Drama"],
        externalIds: { tmdb: "1396", imdb: "tt0903747" },
      },
      episodes: [
        {
          providerId: "62085",
          seasonNumber: 1,
          episodeNumber: 1,
          metadata: {
            title: "Pilot",
            runtimeSeconds: 3480,
            still: "https://image.tmdb.org/t/p/w500/pilot.jpg",
          },
        },
      ],
    });
    await provider.refreshSeriesHierarchyWithState(search.results[0], [1]);
    expect(calls.filter((url) => url.includes("/tv/1396"))).toHaveLength(2);
  } finally {
    cache.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("M03 TMDB usa metadata hierárquica expirada como fallback degradado", async () => {
  const { root, cache } = fixture();
  try {
    cache.write(
      "tmdb:series:details:1396",
      {
        id: 1396,
        name: "Breaking Bad em cache",
        first_air_date: "2008-01-20",
        genres: [],
      },
      -1,
    );
    cache.write(
      "tmdb:series:season:1396:1",
      {
        episodes: [
          {
            id: 62085,
            season_number: 1,
            episode_number: 1,
            name: "Pilot em cache",
          },
        ],
      },
      -1,
    );
    const provider = new TmdbMetadataProvider({
      accessToken: "token",
      cache,
      fetchImpl: (async () => {
        throw new TypeError("offline");
      }) as typeof fetch,
    });
    const result = await provider.refreshSeriesHierarchyWithState(
      {
        title: "Local",
        genres: [],
        cast: [],
        externalIds: { tmdb: "1396" },
      },
      [1],
    );
    expect(result).toMatchObject({
      state: "degraded",
      metadata: { title: "Breaking Bad em cache" },
      episodes: [{ metadata: { title: "Pilot em cache" } }],
    });
  } finally {
    cache.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});
