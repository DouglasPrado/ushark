"use strict";

const { spawn } = require("node:child_process");
const { Buffer } = require("node:buffer");
const fs = require("node:fs");
const path = require("node:path");
const { clearTimeout, setTimeout } = require("node:timers");

const DEFAULT_HEAD_BYTES = 16 * 1024 * 1024;
const DEFAULT_TAIL_BYTES = 8 * 1024 * 1024;
const DEFAULT_PROBE_TIMEOUT_MS = 5_000;
const MAX_PROBE_OUTPUT_BYTES = 256 * 1024;
const MAX_PROBE_PIECES = 4_096;

class StreamMappingError extends Error {
  constructor(code, publicMessage) {
    super(publicMessage);
    this.name = "StreamMappingError";
    this.code = code;
    this.publicMessage = publicMessage;
    this.retryable = false;
  }
}

function invalid(message) {
  throw new StreamMappingError("STREAM_INVALID", message);
}

function safeInteger(value, name, { minimum = 0, positive = false } = {}) {
  if (
    !Number.isSafeInteger(value) ||
    value < minimum ||
    (positive && value === 0)
  )
    invalid(`${name} não é um inteiro seguro válido.`);
  return value;
}

function finiteNumber(value, name, { minimum = 0, positive = false } = {}) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < minimum ||
    (positive && value === 0)
  )
    invalid(`${name} não é um número válido.`);
  return value;
}

function normalizeFileGeometry(input) {
  if (!input || typeof input !== "object") invalid("O arquivo não é válido.");
  const fileOffsetBytes = safeInteger(input.fileOffsetBytes, "fileOffsetBytes");
  const fileSizeBytes = safeInteger(input.fileSizeBytes, "fileSizeBytes", {
    positive: true,
  });
  const pieceLengthBytes = safeInteger(
    input.pieceLengthBytes,
    "pieceLengthBytes",
    {
      positive: true,
    },
  );
  if (fileOffsetBytes + fileSizeBytes > Number.MAX_SAFE_INTEGER)
    invalid("A geometria do arquivo excede o limite seguro.");
  return { fileOffsetBytes, fileSizeBytes, pieceLengthBytes };
}

function mapByteRangeToPieces(input) {
  const geometry = normalizeFileGeometry(input);
  const startByte = safeInteger(input.startByte, "startByte");
  const endByteExclusive = safeInteger(
    input.endByteExclusive,
    "endByteExclusive",
    {
      positive: true,
    },
  );
  if (
    startByte >= endByteExclusive ||
    endByteExclusive > geometry.fileSizeBytes
  )
    invalid("O intervalo de bytes está fora do arquivo.");
  const absoluteStartByte = geometry.fileOffsetBytes + startByte;
  const absoluteEndByteExclusive = geometry.fileOffsetBytes + endByteExclusive;
  const firstPiece = Math.floor(absoluteStartByte / geometry.pieceLengthBytes);
  const lastPiece = Math.floor(
    (absoluteEndByteExclusive - 1) / geometry.pieceLengthBytes,
  );
  return {
    startByte,
    endByteExclusive,
    absoluteStartByte,
    absoluteEndByteExclusive,
    firstPiece,
    lastPiece,
    pieceCount: lastPiece - firstPiece + 1,
    sharesLeadingPiece:
      absoluteStartByte % geometry.pieceLengthBytes !== 0 ||
      (startByte === 0 &&
        geometry.fileOffsetBytes % geometry.pieceLengthBytes !== 0),
    sharesTrailingPiece:
      absoluteEndByteExclusive % geometry.pieceLengthBytes !== 0,
  };
}

function normalizeIndex(index, durationSeconds, fileSizeBytes) {
  if (index === undefined) return [];
  if (!Array.isArray(index) || index.length < 2)
    invalid("O índice temporal precisa de ao menos dois pontos.");
  const normalized = index.map((point) => {
    if (!point || typeof point !== "object")
      invalid("O índice temporal é inválido.");
    return {
      timeSeconds: finiteNumber(point.timeSeconds, "timeSeconds"),
      byteOffset: safeInteger(point.byteOffset, "byteOffset"),
    };
  });
  for (
    let indexPosition = 0;
    indexPosition < normalized.length;
    indexPosition += 1
  ) {
    const current = normalized[indexPosition];
    if (
      current.timeSeconds > durationSeconds ||
      current.byteOffset >= fileSizeBytes ||
      (indexPosition > 0 &&
        (current.timeSeconds <= normalized[indexPosition - 1].timeSeconds ||
          current.byteOffset < normalized[indexPosition - 1].byteOffset))
    )
      invalid("O índice temporal está fora de ordem ou fora do arquivo.");
  }
  return normalized;
}

function indexedByte(positionSeconds, index) {
  if (positionSeconds <= index[0].timeSeconds) return index[0].byteOffset;
  for (let position = 1; position < index.length; position += 1) {
    const right = index[position];
    if (positionSeconds > right.timeSeconds) continue;
    const left = index[position - 1];
    const ratio =
      (positionSeconds - left.timeSeconds) /
      (right.timeSeconds - left.timeSeconds);
    return Math.floor(
      left.byteOffset + ratio * (right.byteOffset - left.byteOffset),
    );
  }
  return index[index.length - 1].byteOffset;
}

function mapTimeToByte(input) {
  const geometry = normalizeFileGeometry(input);
  const durationSeconds = finiteNumber(
    input.durationSeconds,
    "durationSeconds",
    {
      positive: true,
    },
  );
  const positionSeconds = finiteNumber(
    input.positionSeconds,
    "positionSeconds",
  );
  const clampedPositionSeconds = Math.min(positionSeconds, durationSeconds);
  const index = normalizeIndex(
    input.index,
    durationSeconds,
    geometry.fileSizeBytes,
  );
  const estimated = Math.floor(
    (clampedPositionSeconds / durationSeconds) * geometry.fileSizeBytes,
  );
  const byteOffset = Math.min(
    geometry.fileSizeBytes - 1,
    Math.max(
      0,
      index.length ? indexedByte(clampedPositionSeconds, index) : estimated,
    ),
  );
  const piece = mapByteRangeToPieces({
    ...geometry,
    startByte: byteOffset,
    endByteExclusive: byteOffset + 1,
  });
  return {
    positionSeconds: clampedPositionSeconds,
    byteOffset,
    absoluteByteOffset: piece.absoluteStartByte,
    pieceIndex: piece.firstPiece,
    confidence: index.length ? "indexed" : "estimated",
  };
}

function mergeRanges(ranges) {
  const ordered = [...ranges].sort(
    (left, right) => left.startByte - right.startByte,
  );
  const merged = [];
  for (const range of ordered) {
    const previous = merged.at(-1);
    if (previous && range.startByte <= previous.endByteExclusive) {
      previous.endByteExclusive = Math.max(
        previous.endByteExclusive,
        range.endByteExclusive,
      );
      previous.labels.push(...range.labels);
      continue;
    }
    merged.push({ ...range, labels: [...range.labels] });
  }
  return merged;
}

function planPartialProbe(input) {
  const geometry = normalizeFileGeometry(input);
  const headLimitBytes = safeInteger(
    input.headLimitBytes ?? DEFAULT_HEAD_BYTES,
    "headLimitBytes",
    { positive: true },
  );
  const tailLimitBytes = safeInteger(
    input.tailLimitBytes ?? DEFAULT_TAIL_BYTES,
    "tailLimitBytes",
    { positive: true },
  );
  if (typeof input.tailRequired !== "boolean")
    invalid("tailRequired precisa ser booleano.");
  const requested = [
    {
      startByte: 0,
      endByteExclusive: Math.min(geometry.fileSizeBytes, headLimitBytes),
      labels: ["head"],
    },
  ];
  if (input.tailRequired)
    requested.push({
      startByte: Math.max(0, geometry.fileSizeBytes - tailLimitBytes),
      endByteExclusive: geometry.fileSizeBytes,
      labels: ["tail"],
    });
  const ranges = mergeRanges(requested).map((range) => ({
    ...range,
    pieceSpan: mapByteRangeToPieces({ ...geometry, ...range }),
  }));
  return {
    strategy: input.tailRequired ? "head-tail" : "head",
    completeFileRequired: false,
    requestedBytes: ranges.reduce(
      (total, range) => total + range.endByteExclusive - range.startByte,
      0,
    ),
    ranges,
  };
}

function probeReadiness(plan, completedPieces) {
  if (!plan || !Array.isArray(plan.ranges) || !Array.isArray(completedPieces))
    invalid("O estado do probe é inválido.");
  const completed = new Set(
    completedPieces.map((piece) => safeInteger(piece, "completedPiece")),
  );
  let requiredPieceCount = 0;
  let completedPieceCount = 0;
  let firstMissingPiece;
  const visited = new Set();
  for (const range of plan.ranges) {
    const { firstPiece, lastPiece } = range.pieceSpan ?? {};
    safeInteger(firstPiece, "firstPiece");
    safeInteger(lastPiece, "lastPiece");
    if (lastPiece < firstPiece) invalid("O intervalo de pieces é inválido.");
    if (
      lastPiece - firstPiece + 1 > MAX_PROBE_PIECES ||
      visited.size + lastPiece - firstPiece + 1 > MAX_PROBE_PIECES
    )
      invalid("O probe excede o limite de pieces.");
    for (let piece = firstPiece; piece <= lastPiece; piece += 1) {
      if (visited.has(piece)) continue;
      visited.add(piece);
      requiredPieceCount += 1;
      if (completed.has(piece)) completedPieceCount += 1;
      else if (firstMissingPiece === undefined) firstMissingPiece = piece;
    }
  }
  return {
    ready: completedPieceCount === requiredPieceCount,
    requiredPieceCount,
    completedPieceCount,
    missingPieceCount: requiredPieceCount - completedPieceCount,
    firstMissingPiece,
  };
}

function assertProbePath(mediaRoot, candidate) {
  if (typeof mediaRoot !== "string" || !path.isAbsolute(mediaRoot))
    invalid("mediaRoot não é absoluto.");
  if (typeof candidate !== "string" || !path.isAbsolute(candidate))
    invalid("O path de mídia não é absoluto.");
  const absoluteRoot = path.resolve(mediaRoot);
  const realRoot = fs.realpathSync(absoluteRoot);
  const absoluteCandidate = path.resolve(candidate);
  const relative = path.relative(absoluteRoot, absoluteCandidate);
  if (
    !relative ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  )
    throw new StreamMappingError(
      "STREAM_FILE_MISSING",
      "O arquivo parcial está fora do storage gerenciado.",
    );
  let current = absoluteRoot;
  for (const component of relative.split(path.sep)) {
    current = path.join(current, component);
    let stat;
    try {
      stat = fs.lstatSync(current);
    } catch {
      throw new StreamMappingError(
        "STREAM_FILE_MISSING",
        "O arquivo parcial não está disponível.",
      );
    }
    if (stat.isSymbolicLink())
      throw new StreamMappingError(
        "STREAM_FILE_MISSING",
        "Symlink não é permitido no storage de streaming.",
      );
  }
  const realCandidate = fs.realpathSync(absoluteCandidate);
  const realRelative = path.relative(realRoot, realCandidate);
  if (
    !realRelative ||
    realRelative === ".." ||
    realRelative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(realRelative) ||
    !fs.statSync(realCandidate).isFile()
  )
    throw new StreamMappingError(
      "STREAM_FILE_MISSING",
      "O arquivo parcial não está disponível.",
    );
  return realCandidate;
}

function normalizeProbeMetadata(value, expectedSizeBytes) {
  const format = value?.format;
  const streams = Array.isArray(value?.streams) ? value.streams : [];
  const video = streams.find((stream) => stream?.codec_type === "video");
  const audio = streams.find((stream) => stream?.codec_type === "audio");
  const durationSeconds = Number(format?.duration ?? video?.duration);
  const bitrateBitsPerSecond = Number(format?.bit_rate);
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0)
    throw new StreamMappingError(
      "STREAM_METADATA_INCOMPLETE",
      "O probe parcial ainda não encontrou a duração da mídia.",
    );
  return {
    durationSeconds,
    sizeBytes: expectedSizeBytes,
    bitrateBitsPerSecond:
      Number.isFinite(bitrateBitsPerSecond) && bitrateBitsPerSecond > 0
        ? bitrateBitsPerSecond
        : Math.round((expectedSizeBytes * 8) / durationSeconds),
    container:
      typeof format?.format_name === "string"
        ? format.format_name.split(",")[0]
        : undefined,
    videoCodec:
      typeof video?.codec_name === "string" ? video.codec_name : undefined,
    audioCodec:
      typeof audio?.codec_name === "string" ? audio.codec_name : undefined,
    width: Number.isSafeInteger(video?.width) ? video.width : undefined,
    height: Number.isSafeInteger(video?.height) ? video.height : undefined,
    mappingConfidence: "estimated",
  };
}

class PartialMediaProbe {
  constructor(options) {
    if (
      !options ||
      typeof options.executable !== "string" ||
      !path.isAbsolute(options.executable)
    )
      invalid("O executável de probe não é válido.");
    this.executable = options.executable;
    this.mediaRoot = options.mediaRoot;
    this.spawnProcess = options.spawnProcess ?? spawn;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS;
    this.maximumOutputBytes =
      options.maximumOutputBytes ?? MAX_PROBE_OUTPUT_BYTES;
    safeInteger(this.timeoutMs, "timeoutMs", { positive: true });
    safeInteger(this.maximumOutputBytes, "maximumOutputBytes", {
      positive: true,
    });
  }

  probe(input) {
    const expectedSizeBytes = safeInteger(
      input?.expectedSizeBytes,
      "expectedSizeBytes",
      { positive: true },
    );
    const readiness = probeReadiness(input?.plan, input?.completedPieces);
    if (!readiness.ready)
      return Promise.reject(
        new StreamMappingError(
          "STREAM_METADATA_INCOMPLETE",
          "Os pieces necessários ao probe parcial ainda não estão disponíveis.",
        ),
      );
    let mediaPath;
    try {
      mediaPath = assertProbePath(this.mediaRoot, input.path);
    } catch (error) {
      return Promise.reject(error);
    }
    const arguments_ = [
      "-v",
      "error",
      "-probesize",
      String(Math.min(expectedSizeBytes, DEFAULT_HEAD_BYTES)),
      "-analyzeduration",
      "1000000",
      "-show_entries",
      "format=duration,bit_rate,format_name:stream=codec_type,codec_name,width,height,duration",
      "-of",
      "json",
      mediaPath,
    ];
    return new Promise((resolve, reject) => {
      let settled = false;
      let output = Buffer.alloc(0);
      let child;
      const finish = (error, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        if (error) reject(error);
        else resolve(value);
      };
      try {
        child = this.spawnProcess(this.executable, arguments_, {
          shell: false,
          windowsHide: true,
          stdio: ["ignore", "pipe", "ignore"],
        });
      } catch {
        reject(
          new StreamMappingError(
            "STREAM_DAEMON_UNAVAILABLE",
            "O media probe não está disponível.",
          ),
        );
        return;
      }
      const timeout = setTimeout(() => {
        child.kill();
        finish(
          new StreamMappingError(
            "STREAM_TIMEOUT",
            "O media probe excedeu o tempo limite.",
          ),
        );
      }, this.timeoutMs);
      child.once("error", () =>
        finish(
          new StreamMappingError(
            "STREAM_DAEMON_UNAVAILABLE",
            "O media probe não está disponível.",
          ),
        ),
      );
      child.stdout.on("data", (chunk) => {
        output = Buffer.concat([output, chunk]);
        if (output.length <= this.maximumOutputBytes) return;
        child.kill();
        finish(
          new StreamMappingError(
            "STREAM_METADATA_INCOMPLETE",
            "A resposta do media probe excedeu o limite.",
          ),
        );
      });
      child.once("exit", (code) => {
        if (settled) return;
        if (code !== 0)
          return finish(
            new StreamMappingError(
              "STREAM_METADATA_INCOMPLETE",
              "O probe parcial ainda não encontrou metadata reproduzível.",
            ),
          );
        try {
          finish(
            undefined,
            normalizeProbeMetadata(
              JSON.parse(output.toString("utf8")),
              expectedSizeBytes,
            ),
          );
        } catch (error) {
          finish(
            error instanceof StreamMappingError
              ? error
              : new StreamMappingError(
                  "STREAM_METADATA_INCOMPLETE",
                  "O media probe retornou metadata inválida.",
                ),
          );
        }
      });
    });
  }
}

module.exports = {
  DEFAULT_HEAD_BYTES,
  DEFAULT_PROBE_TIMEOUT_MS,
  DEFAULT_TAIL_BYTES,
  MAX_PROBE_OUTPUT_BYTES,
  MAX_PROBE_PIECES,
  PartialMediaProbe,
  StreamMappingError,
  mapByteRangeToPieces,
  mapTimeToByte,
  planPartialProbe,
  probeReadiness,
};
