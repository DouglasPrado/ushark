import { expect, test } from "@playwright/test";
import {
  MockMetadataProvider,
  MockMovieCatalog,
  imdbMovieFixtures,
  movieFixtures,
  sourceFixtures,
} from "@ushark/mocks/movies";
const library = "library:test";

test("seed padrão usa filmes reais identificados pelo IMDb", async () => {
  const provider = new MockMetadataProvider();
  const catalog = new MockMovieCatalog(provider);
  catalog.seedDefault(library);

  const movies = await catalog.list(library);
  expect(movies).toHaveLength(8);
  expect(movies.map((movie) => movie.metadata.title)).toEqual(
    imdbMovieFixtures.map((movie) => movie.title),
  );
  expect(
    movies.every(
      (movie) =>
        movie.id.startsWith("movie:local:") &&
        movie.metadata.externalIds?.imdb?.startsWith("tt") &&
        movie.metadata.poster ===
          `./movie-art/imdb/${movie.metadata.externalIds.imdb}-poster.jpg` &&
        movie.metadata.backdrop ===
          `./movie-art/imdb/${movie.metadata.externalIds.imdb}-backdrop.jpg`,
    ),
  ).toBe(true);
  await expect(provider.search("Interstellar", 2014)).resolves.toMatchObject([
    {
      title: "Interestelar",
      externalIds: { imdb: "tt0816692" },
      ratings: {
        imdb: {
          average: 8.7,
          votes: 2605028,
          snapshotDate: "2026-09-13",
        },
      },
    },
  ]);
});

test("merge explícito conserva relações, ambos os estados pessoais e overrides", async () => {
  const catalog = new MockMovieCatalog(new MockMetadataProvider());
  catalog.seed("conflict", library);
  const previous = catalog.find("movie:local:unidentified")!;
  const target = catalog.find(movieFixtures[0].id)!;
  await expect(
    catalog.save(
      { metadata: movieFixtures[0], editingId: previous.id },
      library,
    ),
  ).rejects.toThrow("Revise a união");
  expect(catalog.find(previous.id)).toEqual(previous);
  expect(catalog.find(target.id)).toEqual(target);
  const merged = await catalog.save(
    { metadata: movieFixtures[0], editingId: previous.id, confirmMerge: true },
    library,
  );
  expect(merged.id).toBe(target.id);
  expect(merged.sources.map((s) => s.id)).toEqual(
    expect.arrayContaining(
      [...previous.sources, ...target.sources].map((s) => s.id),
    ),
  );
  expect(merged.memberships.map((m) => m.libraryId)).toEqual(
    expect.arrayContaining([library, "library:other"]),
  );
  expect(merged.memberships.find((m) => m.libraryId === library)).toMatchObject(
    {
      titleOverride: "Horizonte · edição da coleção",
      preservedOverrides: ["Minha descoberta"],
    },
  );
  expect(
    merged.memberships.find((m) => m.libraryId === "library:other")
      ?.titleOverride,
  ).toBe("Viagem favorita");
  expect(merged.personal).toEqual({
    favorite: true,
    progress: 2400,
    history: ["canonical-history", "local-history"],
    preferences: ["audio:pt-BR", "audio:en"],
  });
  expect(catalog.find(previous.id)).toBeUndefined();
  const identityState = structuredClone(merged);
  await catalog.refresh(merged.id);
  const refreshed = catalog.find(merged.id)!;
  expect(refreshed.metadata.title).toBe("Horizonte Azul");
  expect(refreshed.metadata.synopsis).not.toBe(identityState.metadata.synopsis);
  expect({ ...refreshed, metadata: identityState.metadata }).toEqual(
    identityState,
  );
});

test("erro antes do merge não muda estado e snapshots não permitem mutação externa", async () => {
  const catalog = new MockMovieCatalog(new MockMetadataProvider());
  catalog.seed("conflict", library);
  const before = await catalog.list(library);
  catalog.scenario = "save-error";
  await expect(
    catalog.save(
      {
        metadata: movieFixtures[0],
        editingId: "movie:local:unidentified",
        confirmMerge: true,
      },
      library,
    ),
  ).rejects.toThrow("Não foi possível salvar");
  expect(await catalog.list(library)).toEqual(before);
  const external = catalog.find(movieFixtures[0].id)!;
  external.personal.favorite = true;
  external.sources.length = 0;
  expect(catalog.find(movieFixtures[0].id)).toEqual(before[0]);
});

test("duplicata concorrente e remoção de membership preservam Content e favorito", async () => {
  const catalog = new MockMovieCatalog(new MockMetadataProvider());
  await Promise.all([
    catalog.save(
      { metadata: movieFixtures[0], source: sourceFixtures[0] },
      library,
    ),
    catalog.save(
      { metadata: movieFixtures[0], source: sourceFixtures[0] },
      library,
    ),
  ]);
  expect(await catalog.list(library)).toHaveLength(1);
  await catalog.favorite(movieFixtures[0].id);
  const before = catalog.find(movieFixtures[0].id)!;
  await catalog.removeMembership(before.id, library);
  expect(await catalog.list(library)).toHaveLength(0);
  expect(catalog.find(before.id)?.sources).toEqual(before.sources);
  expect(catalog.find(before.id)?.personal).toEqual(before.personal);
  await catalog.save({ metadata: movieFixtures[0] }, library);
  expect(await catalog.list(library)).toHaveLength(1);
  expect(catalog.find(before.id)?.personal.favorite).toBe(true);
  await catalog.removeSource(before.id, sourceFixtures[0].id);
  expect(catalog.find(before.id)?.sources).toHaveLength(0);
  expect(await catalog.list(library)).toHaveLength(1);
});

test("arquivo apagado na simulação não reaparece ao remover e recolocar source", async () => {
  const catalog = new MockMovieCatalog(new MockMetadataProvider());
  await catalog.save(
    { metadata: movieFixtures[0], source: sourceFixtures[0] },
    library,
  );
  await catalog.deleteFile(movieFixtures[0].id, sourceFixtures[0].id);
  expect(catalog.find(movieFixtures[0].id)?.sources[0].fileAvailable).toBe(
    false,
  );
  await catalog.removeSource(movieFixtures[0].id, sourceFixtures[0].id);
  await catalog.addSource(movieFixtures[0].id, sourceFixtures[0]);
  expect(catalog.find(movieFixtures[0].id)?.sources[0].fileAvailable).toBe(
    false,
  );
});
