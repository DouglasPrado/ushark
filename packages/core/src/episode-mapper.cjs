"use strict";

const path = require("node:path").posix;

const SUBTITLE_EXTENSIONS = new Set(["srt", "ass", "ssa", "vtt"]);

function coordinate(seasonNumber, episodeNumber, pattern) {
  return { seasonNumber, episodeNumber, pattern };
}

function validCoordinate(seasonNumber, episodeNumber) {
  return (
    Number.isInteger(seasonNumber) &&
    seasonNumber >= 0 &&
    seasonNumber <= 999 &&
    Number.isInteger(episodeNumber) &&
    episodeNumber >= 1 &&
    episodeNumber <= 9_999
  );
}

function inferEpisodeIdentity(filename) {
  if (typeof filename !== "string" || !filename || filename.includes("\0"))
    return { pattern: "none", suggestions: [] };
  const stem = path.basename(filename);
  const suggestions = [];
  let multipleEpisodes = false;

  const sxxexx =
    /(?:^|[^a-z0-9])s(\d{1,3})((?:[ ._-]*e\d{1,4})+)(?=$|[^a-z0-9])/gi;
  for (const match of stem.matchAll(sxxexx)) {
    const seasonNumber = Number(match[1]);
    const episodes = [...match[2].matchAll(/e(\d{1,4})/gi)].map((entry) =>
      Number(entry[1]),
    );
    if (episodes.length > 1) multipleEpisodes = true;
    for (const episodeNumber of episodes)
      if (validCoordinate(seasonNumber, episodeNumber))
        suggestions.push(coordinate(seasonNumber, episodeNumber, "sxxexx"));
  }

  const nxnn = /(?:^|[^a-z0-9])(\d{1,3})x(\d{1,4})(?=$|[^a-z0-9])/gi;
  for (const match of stem.matchAll(nxnn)) {
    const seasonNumber = Number(match[1]);
    const episodeNumber = Number(match[2]);
    if (validCoordinate(seasonNumber, episodeNumber))
      suggestions.push(coordinate(seasonNumber, episodeNumber, "nxnn"));
  }

  const seasonEpisode =
    /(?:^|[^a-z0-9])season[ ._-]*(\d{1,3})[ ._-]*episode[ ._-]*(\d{1,4})(?=$|[^a-z0-9])/gi;
  for (const match of stem.matchAll(seasonEpisode)) {
    const seasonNumber = Number(match[1]);
    const episodeNumber = Number(match[2]);
    if (validCoordinate(seasonNumber, episodeNumber))
      suggestions.push(
        coordinate(seasonNumber, episodeNumber, "season-episode"),
      );
  }

  const unique = [];
  const seen = new Set();
  for (const suggestion of suggestions) {
    const key = `${suggestion.seasonNumber}:${suggestion.episodeNumber}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(suggestion);
  }
  if (multipleEpisodes)
    return { pattern: "multiple-episodes", suggestions: unique };
  if (!unique.length) return { pattern: "none", suggestions: [] };
  if (unique.length > 1)
    return { pattern: unique[0].pattern, suggestions: unique };
  return { pattern: unique[0].pattern, suggestions: unique };
}

function isSubtitle(file) {
  const extension = String(file.extension ?? "")
    .replace(/^\./, "")
    .toLowerCase();
  return SUBTITLE_EXTENSIONS.has(extension);
}

function subtitleCandidates(video, files, inference) {
  const videoDirectory = path.dirname(video.path);
  const videoStem = path
    .basename(video.path, path.extname(video.path))
    .toLowerCase();
  const coordinateKey = inference.suggestions[0]
    ? `${inference.suggestions[0].seasonNumber}:${inference.suggestions[0].episodeNumber}`
    : undefined;
  return files
    .filter((candidate) => {
      if (
        !isSubtitle(candidate) ||
        path.dirname(candidate.path) !== videoDirectory
      )
        return false;
      const subtitleStem = path
        .basename(candidate.path, path.extname(candidate.path))
        .toLowerCase();
      if (
        subtitleStem === videoStem ||
        subtitleStem.startsWith(`${videoStem}.`) ||
        subtitleStem.startsWith(`${videoStem}-`) ||
        subtitleStem.startsWith(`${videoStem}_`)
      )
        return true;
      if (!coordinateKey) return false;
      const subtitleInference = inferEpisodeIdentity(candidate.name);
      return subtitleInference.suggestions.some(
        (entry) =>
          `${entry.seasonNumber}:${entry.episodeNumber}` === coordinateKey,
      );
    })
    .map((candidate) => candidate.id)
    .sort();
}

function mapEpisodeFiles(files) {
  if (!Array.isArray(files)) throw new TypeError("files must be an array");
  const mapped = files.map((file) => {
    const eligible = file.kind === "video" && file.selectable === true;
    const inference = eligible
      ? inferEpisodeIdentity(file.name)
      : { pattern: "none", suggestions: [] };
    const one =
      inference.suggestions.length === 1 ? inference.suggestions[0] : undefined;
    const mappingState = !eligible
      ? "skipped"
      : inference.pattern === "multiple-episodes"
        ? "multiple-episodes"
        : inference.suggestions.length === 0
          ? "unidentified"
          : inference.suggestions.length > 1
            ? "ambiguous"
            : "identified";
    return {
      fileId: file.id,
      path: file.path,
      name: file.name,
      sizeBytes: file.sizeBytes,
      baseMappingState: mappingState,
      inferencePattern: inference.pattern,
      suggestions: inference.suggestions,
      seasonNumber:
        mappingState === "identified" ? one?.seasonNumber : undefined,
      episodeNumber:
        mappingState === "identified" ? one?.episodeNumber : undefined,
      selectorType: mappingState === "identified" ? "episode" : undefined,
      subtitleCandidates: eligible
        ? subtitleCandidates(file, files, inference)
        : [],
      selectedSubtitleFileId: undefined,
    };
  });

  const coordinateCounts = new Map();
  for (const file of mapped) {
    if (file.baseMappingState !== "identified") continue;
    const key = `${file.seasonNumber}:${file.episodeNumber}`;
    coordinateCounts.set(key, (coordinateCounts.get(key) ?? 0) + 1);
  }
  return mapped.map((file) => ({
    ...file,
    mappingState:
      file.baseMappingState === "identified" &&
      coordinateCounts.get(`${file.seasonNumber}:${file.episodeNumber}`) > 1
        ? "conflict"
        : file.baseMappingState,
  }));
}

module.exports = {
  SUBTITLE_EXTENSIONS,
  inferEpisodeIdentity,
  mapEpisodeFiles,
};
