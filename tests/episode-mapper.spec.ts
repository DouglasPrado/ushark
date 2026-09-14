import { expect, test } from "@playwright/test";

interface Suggestion {
  seasonNumber: number;
  episodeNumber: number;
  pattern: string;
}

interface MappedFile {
  mappingState: string;
}

const { inferEpisodeIdentity, mapEpisodeFiles } =
  require("@ushark/core/episode-mapper") as {
    inferEpisodeIdentity(filename: string): {
      pattern: string;
      suggestions: Suggestion[];
    };
    mapEpisodeFiles(files: Array<Record<string, unknown>>): MappedFile[];
  };

test("M03 S04.2 reconhece somente os três padrões aprovados e especiais", () => {
  expect(inferEpisodeIdentity("Show.S01E03.1080p.mkv")).toEqual({
    pattern: "sxxexx",
    suggestions: [{ seasonNumber: 1, episodeNumber: 3, pattern: "sxxexx" }],
  });
  expect(inferEpisodeIdentity("Show.1x03.mkv")).toEqual({
    pattern: "nxnn",
    suggestions: [{ seasonNumber: 1, episodeNumber: 3, pattern: "nxnn" }],
  });
  expect(inferEpisodeIdentity("Show Season 01 Episode 03.mkv")).toEqual({
    pattern: "season-episode",
    suggestions: [
      { seasonNumber: 1, episodeNumber: 3, pattern: "season-episode" },
    ],
  });
  expect(inferEpisodeIdentity("Show.S00E01.mkv").suggestions[0]).toMatchObject({
    seasonNumber: 0,
    episodeNumber: 1,
  });
  expect(inferEpisodeIdentity("XS01E01Y.mkv")).toEqual({
    pattern: "none",
    suggestions: [],
  });
});

test("M03 S04.2 mantém multi-episódio, ambiguidade e colisão revisáveis", () => {
  expect(inferEpisodeIdentity("Show.S01E01E02.mkv")).toMatchObject({
    pattern: "multiple-episodes",
    suggestions: [
      { seasonNumber: 1, episodeNumber: 1 },
      { seasonNumber: 1, episodeNumber: 2 },
    ],
  });
  expect(
    inferEpisodeIdentity("Show.S01E01.and.2x03.mkv").suggestions,
  ).toHaveLength(2);
  const files = ["A.S01E01.mkv", "B.1x01.mkv"].map((name, index) => ({
    id: `file:${index}`,
    path: `Pack/${name}`,
    name,
    extension: "mkv",
    sizeBytes: 1_000,
    kind: "video",
    selectable: true,
  }));
  expect(mapEpisodeFiles(files).map((file) => file.mappingState)).toEqual([
    "conflict",
    "conflict",
  ]);
});
