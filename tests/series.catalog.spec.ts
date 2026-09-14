import { test, expect } from "@playwright/test";
import { MockSeriesCatalog, seriesDraft } from "@ushark/mocks/series";
test("M03 seed padrão mantém identidade IMDb e episódios mockados distintos", async () => {
  const catalog = new MockSeriesCatalog();
  catalog.seedDefault();
  const rows = await catalog.list();
  expect(rows).toHaveLength(8);
  expect(rows[0]).toMatchObject({
    id: "series:imdb:tt0903747",
    title: "Breaking Bad",
    externalIds: { imdb: "tt0903747" },
    ratings: { imdb: { average: 9.5, votes: 2674582 } },
  });
  expect(rows.every((row) => row.episodes.length === 6)).toBe(true);
  expect(
    rows[0].episodes.every(
      (episode) =>
        episode.links[0]?.resolution === "2160p" &&
        episode.links[0]?.fileAvailable,
    ),
  ).toBe(true);
  expect(
    rows.find((row) => row.title === "The Office")?.episodes[0].links[0]
      .resolution,
  ).toBe("1080p");
  expect(
    new Set(rows.flatMap((row) => row.episodes.map((episode) => episode.id)))
      .size,
  ).toBe(48);
});
test("M03 save concorrente idempotente e selectors independentes", async () => {
  const catalog = new MockSeriesCatalog();
  const pack = seriesDraft("multi");
  pack.files[0].subtitle = pack.files[0].subtitles[0];
  await Promise.all([catalog.save(pack), catalog.save(pack)]);
  let rows = await catalog.list();
  expect(rows).toHaveLength(1);
  expect(rows[0].episodes).toHaveLength(17);
  expect(new Set(rows[0].episodes.map((e) => e.id)).size).toBe(17);
  expect(rows[0].episodes.every((e) => e.links.length === 1)).toBe(true);
  const ids = rows[0].episodes.map((e) => e.id);
  await catalog.save(seriesDraft("single"));
  pack.files[1].episode = "20";
  pack.files[1].corrected = true;
  await catalog.save(pack);
  rows = await catalog.list();
  expect(
    rows[0].episodes.find((e) => e.season === 1 && e.number === 1)?.links,
  ).toHaveLength(1);
  expect(rows[0].episodes.find((e) => e.number === 20)?.links[0].selector).toBe(
    "manual",
  );
  expect(ids.every((id) => rows[0].episodes.some((e) => e.id === id))).toBe(
    true,
  );
  expect(
    rows[0].episodes.find((e) => e.season === 0)?.links[0].subtitle,
  ).toContain(".srt");
});
test("M03 rejeita colisão/duplo/inválido sem mutação e mantém snapshot de revisão", async () => {
  const catalog = new MockSeriesCatalog();
  await catalog.save(seriesDraft("season"));
  const before = await catalog.list();
  await expect(catalog.save(seriesDraft("ambiguous"))).rejects.toThrow(
    "pendências",
  );
  const pack = seriesDraft("single");
  pack.files[0].season = "-1";
  await expect(catalog.save(pack)).rejects.toThrow("pendências");
  expect(await catalog.list()).toEqual(before);
  const draft = catalog.reviewSource("source:season")!;
  draft.files[0].episode = "9";
  expect(catalog.reviewSource("source:season")!.files[0].episode).toBe("1");
});
