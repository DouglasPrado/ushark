import { test, expect } from "@playwright/test";
import { MockNextEpisodePreview } from "@ushark/mocks/next-episode";
import { MockSelectionPreview } from "@ushark/mocks/selection";
import type { SeriesCatalog, Episode } from "@ushark/types/series";
const episode = (season: number, number: number, links = true): Episode => ({
  id: `${season}:${number}`,
  season,
  number,
  links: links
    ? [
        {
          sourceId: "pack",
          sourceName: "Pack",
          fileId: `file-${season}-${number}`,
          filename: "episode.mkv",
          selector: "episode",
          subtitle: "",
        },
      ]
    : [],
});
test("M11 lacuna, especial, temporada e source ausente não escolhem conteúdo errado", async () => {
  let episodes = [episode(1, 1), episode(1, 3)];
  const catalog = {
    list: async () => [{ id: "series", title: "Série", episodes }],
  } as SeriesCatalog;
  const service = new MockNextEpisodePreview(
    catalog,
    new MockSelectionPreview(),
    () => ({
      strategy: "balanced",
      resolution: "2160p",
      autoSelect: true,
      preflight: true,
    }),
  );
  const signal = new AbortController().signal;
  expect((await service.resolve("1:1", signal)).kind).toBe("missing");
  episodes = [episode(1, 1), episode(2, 1)];
  const next = await service.resolve("1:1", signal);
  expect(next.kind).toBe("season-end");
  expect(next.next?.selector).toBe("file-2-1");
  episodes = [episode(0, 1), episode(1, 1)];
  expect((await service.resolve("0:1", signal)).kind).toBe("series-end");
  episodes = [episode(1, 1), episode(1, 2, false)];
  expect((await service.resolve("1:1", signal)).kind).toBe("missing");
});
