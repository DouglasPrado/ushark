import { expect, test } from "@playwright/test";
import { DesktopDiscoveryCatalog } from "../apps/desktop/src/renderer/catalog/discovery-catalog";
import {
  DISCOVERY_INDEX_SCHEMA_VERSION,
  DISCOVERY_PROTOCOL_VERSION,
  discoveryQuery,
  type DiscoveryContentSnapshot,
  type DiscoveryDesktopApi,
  type DiscoveryInvalidationEvent,
} from "@ushark/types/discovery";

function content(
  contentId: string,
  overrides: Partial<DiscoveryContentSnapshot> = {},
): DiscoveryContentSnapshot {
  return {
    contentId,
    type: "movie",
    title: `Título ${contentId}`,
    genres: ["Drama"],
    cast: [],
    favorite: true,
    progress: {
      positionSeconds: 120,
      durationSeconds: 7_200,
      watched: false,
    },
    addedAt: new Date().toISOString(),
    memberships: [
      { id: "library:test", kind: "local", name: "Local", available: true },
    ],
    collections: [],
    sources: [{ id: "source:test", quality: "4K", availability: "available" }],
    ...overrides,
  };
}

function fixture() {
  const searchInputs: unknown[] = [];
  const cancelInputs: unknown[] = [];
  let listener: ((event: DiscoveryInvalidationEvent) => void) | undefined;
  let unsubscribed = false;
  const api = {
    protocolVersion: DISCOVERY_PROTOCOL_VERSION,
    readHome: async () => ({
      ok: true as const,
      value: {
        schemaVersion: DISCOVERY_INDEX_SCHEMA_VERSION,
        libraryId: "library:test",
        revision: 3,
        offline: true,
        hero: content("movie:one"),
        sections: [
          {
            id: "movies",
            kind: "movies" as const,
            title: "Filmes",
            items: [content("movie:one"), content("movie:two")],
          },
        ],
        facets: { genres: ["Drama"], collections: [], libraries: [] },
      },
    }),
    search: async (input: {
      cursor?: { value: string };
      requestId: string;
    }) => {
      searchInputs.push(input);
      const second = input.cursor?.value === "page:2";
      return {
        ok: true as const,
        value: {
          schemaVersion: DISCOVERY_INDEX_SCHEMA_VERSION,
          libraryId: "library:test",
          revision: 3,
          requestId: input.requestId,
          query: "titulo",
          page: {
            items: [content(second ? "movie:two" : "movie:one")],
            nextCursor: second ? undefined : { value: "page:2" },
            total: 2,
          },
          facets: { genres: ["Drama"], collections: [], libraries: [] },
        },
      };
    },
    cancelRequest: async (input: unknown) => {
      cancelInputs.push(input);
      return {
        ok: true as const,
        value: { requestId: "test", cancelled: true },
      };
    },
    subscribe: (next: (event: DiscoveryInvalidationEvent) => void) => {
      listener = next;
      return () => {
        unsubscribed = true;
      };
    },
  } as unknown as DiscoveryDesktopApi;
  return {
    api,
    searchInputs,
    cancelInputs,
    emit: () =>
      listener?.({
        protocolVersion: DISCOVERY_PROTOCOL_VERSION,
        eventId: "event:test",
        revision: 4,
        reason: "catalog",
        contentIds: ["movie:one"],
        scopeIds: ["library:test"],
        occurredAt: new Date().toISOString(),
      }),
    wasUnsubscribed: () => unsubscribed,
  };
}

test("M04 adapter desktop converte Home real, remove duplicatas e pagina por cursor", async () => {
  const { api, searchInputs } = fixture();
  const catalog = new DesktopDiscoveryCatalog(api, () => "library:test");
  expect((await catalog.read()).map((item) => item.id)).toEqual([
    "movie:one",
    "movie:two",
  ]);
  const result = await catalog.search({
    ...discoveryQuery(),
    text: "titulo",
    favorite: true,
    page: 1,
  });
  expect(result.items[0]).toMatchObject({
    id: "movie:two",
    favorite: true,
    recent: true,
    position: 120,
    duration: 7_200,
    sources: [{ quality: "4K", fileAvailable: true }],
  });
  expect(searchInputs).toHaveLength(2);
  expect(searchInputs[0]).toMatchObject({
    libraryId: "library:test",
    query: "titulo",
    favorite: true,
    limit: 24,
  });
  expect(searchInputs[1]).toMatchObject({ cursor: { value: "page:2" } });
  catalog.dispose();
});

test("mantém torrent disponível como progressivo enquanto não há arquivo local", async () => {
  const { api } = fixture();
  api.readHome = async () => ({
    ok: true as const,
    value: {
      schemaVersion: DISCOVERY_INDEX_SCHEMA_VERSION,
      libraryId: "library:test",
      revision: 3,
      offline: false,
      hero: content("movie:torrent", {
        sources: [
          {
            id: "source:torrent:test",
            quality: "1080p",
            availability: "available",
            localFileAvailable: false,
          },
        ],
      }),
      sections: [],
      facets: { genres: [], collections: [], libraries: [] },
    },
  });
  const catalog = new DesktopDiscoveryCatalog(api, () => "library:test");

  await expect(catalog.read()).resolves.toMatchObject([
    {
      id: "movie:torrent",
      sources: [{ id: "source:torrent:test", fileAvailable: false }],
    },
  ]);
  catalog.dispose();
});

test("M04 adapter invalida cursores, notifica a UI e encerra inscrição", async () => {
  const { api, emit, searchInputs, wasUnsubscribed } = fixture();
  const catalog = new DesktopDiscoveryCatalog(api, () => "library:test");
  let invalidations = 0;
  const remove = catalog.subscribe(() => invalidations++);
  await catalog.search({ ...discoveryQuery(), page: 1 });
  emit();
  expect(invalidations).toBe(1);
  await catalog.search({ ...discoveryQuery(), page: 1 });
  expect(searchInputs).toHaveLength(4);
  remove();
  catalog.dispose();
  expect(wasUnsubscribed()).toBe(true);
});
