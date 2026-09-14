import { test, expect } from "@playwright/test";
import { MockDiscoveryCatalog } from "@ushark/mocks/discovery";
import {
  MockMetadataProvider,
  MockMovieCatalog,
  movieFixtures,
  sourceFixtures,
} from "@ushark/mocks/movies";
import { MockSeriesCatalog } from "@ushark/mocks/series";
import { discoveryQuery } from "@ushark/types/discovery";
test("M04 consome os mesmos IDs e estado pessoal dos catálogos M02/M03", async () => {
  const movies = new MockMovieCatalog(new MockMetadataProvider());
  const series = new MockSeriesCatalog();
  const catalog = new MockDiscoveryCatalog(movies, series, () => ({
    id: "personal",
    name: "Cinema local",
  }));
  expect(await catalog.read()).toEqual([]);
  const movie = await movies.save(
    { metadata: movieFixtures[0], source: sourceFixtures[0] },
    "personal",
  );
  await movies.favorite(movie.id);
  series.seed("no-source");
  const data = await catalog.read();
  expect(data.find((x) => x.id === movie.id)).toMatchObject({
    favorite: true,
    memberships: [{ id: "personal", name: "Cinema local" }],
  });
  expect(data.filter((x) => x.type === "series")).toHaveLength(1);
  expect(data.filter((x) => x.type === "episode")).toHaveLength(1);
  const result = await catalog.search({
    ...discoveryQuery(),
    text: "Cinema local",
    favorite: true,
  });
  expect(result.items.map((x) => x.id)).toEqual([movie.id]);
});
test("M04 cursor de prévia, origens homônimas e alteração de um único ID", async () => {
  const catalog = new MockDiscoveryCatalog(
    new MockMovieCatalog(new MockMetadataProvider()),
    new MockSeriesCatalog(),
    () => ({ id: "personal", name: "Cinema local" }),
  );
  catalog.configure("large");
  const first = await catalog.search(discoveryQuery());
  const second = await catalog.search({ ...discoveryQuery(), page: 1 });
  expect(first.total).toBe(10000);
  expect(first.items).toHaveLength(24);
  expect(new Set([...first.items, ...second.items].map((x) => x.id)).size).toBe(
    48,
  );
  expect(
    first.items[0].memberships
      .filter((x) => x.name === "Cinema em casa")
      .map((x) => x.id),
  ).toEqual(["shared-a", "shared-b"]);
  catalog.rename(first.items[0].id);
  expect(
    (
      await catalog.search({ ...discoveryQuery(), text: "uma nova história" })
    ).items.map((x) => x.id),
  ).toEqual([first.items[0].id]);
  catalog.remove(first.items[0].id);
  expect((await catalog.search(discoveryQuery())).total).toBe(9999);
});
