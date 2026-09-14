import { expect, test } from "@playwright/test";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

interface PieceSpan {
  firstPiece: number;
  lastPiece: number;
  pieceCount: number;
  absoluteStartByte: number;
  absoluteEndByteExclusive: number;
  sharesLeadingPiece: boolean;
  sharesTrailingPiece: boolean;
}

interface ProbePlan {
  strategy: "head" | "head-tail";
  completeFileRequired: false;
  requestedBytes: number;
  ranges: Array<{
    startByte: number;
    endByteExclusive: number;
    labels: string[];
    pieceSpan: PieceSpan;
  }>;
}

const mapping = require("@ushark/core/stream-mapping") as {
  DEFAULT_HEAD_BYTES: number;
  DEFAULT_TAIL_BYTES: number;
  PartialMediaProbe: new (options: {
    executable: string;
    mediaRoot: string;
  }) => {
    probe(input: Record<string, unknown>): Promise<{
      durationSeconds: number;
      sizeBytes: number;
      bitrateBitsPerSecond: number;
      container?: string;
      videoCodec?: string;
      audioCodec?: string;
      width?: number;
      height?: number;
      mappingConfidence: "estimated";
    }>;
  };
  mapByteRangeToPieces(input: Record<string, unknown>): PieceSpan;
  mapTimeToByte(input: Record<string, unknown>): {
    positionSeconds: number;
    byteOffset: number;
    absoluteByteOffset: number;
    pieceIndex: number;
    confidence: "indexed" | "estimated";
  };
  planPartialProbe(input: Record<string, unknown>): ProbePlan;
  probeReadiness(
    plan: ProbePlan,
    completedPieces: number[],
  ): {
    ready: boolean;
    requiredPieceCount: number;
    completedPieceCount: number;
    missingPieceCount: number;
    firstMissingPiece?: number;
  };
};

const MiB = 1024 * 1024;

function executable(candidates: string[]) {
  return candidates.find((candidate) => fs.existsSync(candidate));
}

test("M07 S04.1 mapeia byte para piece considerando offset e fronteiras compartilhadas", () => {
  const result = mapping.mapByteRangeToPieces({
    fileOffsetBytes: 3 * MiB,
    fileSizeBytes: 20 * MiB,
    pieceLengthBytes: 4 * MiB,
    startByte: 0,
    endByteExclusive: 6 * MiB,
  });

  expect(result).toEqual({
    startByte: 0,
    endByteExclusive: 6 * MiB,
    absoluteStartByte: 3 * MiB,
    absoluteEndByteExclusive: 9 * MiB,
    firstPiece: 0,
    lastPiece: 2,
    pieceCount: 3,
    sharesLeadingPiece: true,
    sharesTrailingPiece: true,
  });
});

test("M07 S04.1 estima tempo para byte e limita duração ao último byte", () => {
  const middle = mapping.mapTimeToByte({
    fileOffsetBytes: 2 * MiB,
    fileSizeBytes: 100 * MiB,
    pieceLengthBytes: 4 * MiB,
    durationSeconds: 100,
    positionSeconds: 50,
  });
  expect(middle).toMatchObject({
    positionSeconds: 50,
    byteOffset: 50 * MiB,
    absoluteByteOffset: 52 * MiB,
    pieceIndex: 13,
    confidence: "estimated",
  });

  expect(
    mapping.mapTimeToByte({
      fileOffsetBytes: 0,
      fileSizeBytes: 100,
      pieceLengthBytes: 16,
      durationSeconds: 10,
      positionSeconds: 50,
    }),
  ).toMatchObject({ positionSeconds: 10, byteOffset: 99, pieceIndex: 6 });
});

test("M07 S04.1 prefere índice temporal e interpola VBR", () => {
  const result = mapping.mapTimeToByte({
    fileOffsetBytes: 10,
    fileSizeBytes: 1_000,
    pieceLengthBytes: 100,
    durationSeconds: 100,
    positionSeconds: 50,
    index: [
      { timeSeconds: 0, byteOffset: 0 },
      { timeSeconds: 40, byteOffset: 100 },
      { timeSeconds: 60, byteOffset: 700 },
      { timeSeconds: 100, byteOffset: 999 },
    ],
  });
  expect(result).toEqual({
    positionSeconds: 50,
    byteOffset: 400,
    absoluteByteOffset: 410,
    pieceIndex: 4,
    confidence: "indexed",
  });
});

test("M07 S04.1 planeja HEAD/TAIL limitados sem exigir o arquivo inteiro", () => {
  const result = mapping.planPartialProbe({
    fileOffsetBytes: 3 * MiB,
    fileSizeBytes: 100 * MiB,
    pieceLengthBytes: 4 * MiB,
    tailRequired: true,
  });

  expect(result).toMatchObject({
    strategy: "head-tail",
    completeFileRequired: false,
    requestedBytes: mapping.DEFAULT_HEAD_BYTES + mapping.DEFAULT_TAIL_BYTES,
    ranges: [
      { startByte: 0, endByteExclusive: 16 * MiB, labels: ["head"] },
      {
        startByte: 92 * MiB,
        endByteExclusive: 100 * MiB,
        labels: ["tail"],
      },
    ],
  });
  expect(result.ranges[0].pieceSpan).toMatchObject({
    firstPiece: 0,
    lastPiece: 4,
  });
  expect(result.ranges[1].pieceSpan).toMatchObject({
    firstPiece: 23,
    lastPiece: 25,
  });
});

test("M07 S04.1 funde HEAD/TAIL sobrepostos em arquivo pequeno", () => {
  const result = mapping.planPartialProbe({
    fileOffsetBytes: 0,
    fileSizeBytes: 20 * MiB,
    pieceLengthBytes: 1 * MiB,
    tailRequired: true,
  });
  expect(result.ranges).toHaveLength(1);
  expect(result.ranges[0]).toMatchObject({
    startByte: 0,
    endByteExclusive: 20 * MiB,
    labels: ["head", "tail"],
  });
  expect(result.requestedBytes).toBe(20 * MiB);
});

test("M07 S04.1 readiness conta cada piece uma vez e aponta a primeira lacuna", () => {
  const plan = mapping.planPartialProbe({
    fileOffsetBytes: 0,
    fileSizeBytes: 32 * MiB,
    pieceLengthBytes: 4 * MiB,
    tailRequired: true,
  });
  expect(mapping.probeReadiness(plan, [0, 1, 2, 3, 7])).toEqual({
    ready: false,
    requiredPieceCount: 6,
    completedPieceCount: 5,
    missingPieceCount: 1,
    firstMissingPiece: 6,
  });
  expect(mapping.probeReadiness(plan, [0, 1, 2, 3, 4, 5, 6, 7])).toMatchObject({
    ready: true,
    missingPieceCount: 0,
  });
});

test("M07 S04.1 rejeita geometrias e índices inseguros", () => {
  expect(() =>
    mapping.mapByteRangeToPieces({
      fileOffsetBytes: 0,
      fileSizeBytes: 10,
      pieceLengthBytes: 4,
      startByte: 9,
      endByteExclusive: 11,
    }),
  ).toThrow(/fora do arquivo/);
  expect(() =>
    mapping.mapTimeToByte({
      fileOffsetBytes: 0,
      fileSizeBytes: 10,
      pieceLengthBytes: 4,
      durationSeconds: 10,
      positionSeconds: 5,
      index: [
        { timeSeconds: 0, byteOffset: 0 },
        { timeSeconds: 4, byteOffset: 8 },
        { timeSeconds: 3, byteOffset: 9 },
      ],
    }),
  ).toThrow(/fora de ordem/);
  const excessive = mapping.planPartialProbe({
    fileOffsetBytes: 0,
    fileSizeBytes: 10_000,
    pieceLengthBytes: 1,
    headLimitBytes: 10_000,
    tailRequired: false,
  });
  expect(() => mapping.probeReadiness(excessive, [])).toThrow(
    /limite de pieces/,
  );
});

const ffmpeg = executable([
  process.env.USHARK_FFMPEG_PATH ?? "",
  "/opt/homebrew/bin/ffmpeg",
  "/usr/local/bin/ffmpeg",
  "/usr/bin/ffmpeg",
]);
const ffprobe = executable([
  process.env.USHARK_FFPROBE_PATH ?? "",
  "/opt/homebrew/bin/ffprobe",
  "/usr/local/bin/ffprobe",
  "/usr/bin/ffprobe",
]);

test("M07 S04.1 executa ffprobe real após os pieces parciais requeridos", async () => {
  test.skip(!ffmpeg || !ffprobe, "Requer ffmpeg/ffprobe local verificado.");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-stream-probe-"));
  const media = path.join(root, "synthetic.mp4");
  try {
    const generated = spawnSync(
      ffmpeg!,
      [
        "-v",
        "error",
        "-f",
        "lavfi",
        "-i",
        "color=c=black:s=320x180:d=1",
        "-f",
        "lavfi",
        "-i",
        "sine=frequency=440:duration=1",
        "-c:v",
        "mpeg4",
        "-c:a",
        "aac",
        "-movflags",
        "+faststart",
        "-shortest",
        media,
      ],
      { encoding: "utf8" },
    );
    expect(generated.status, generated.stderr).toBe(0);
    const size = fs.statSync(media).size;
    const plan = mapping.planPartialProbe({
      fileOffsetBytes: 7_000,
      fileSizeBytes: size,
      pieceLengthBytes: 4_096,
      headLimitBytes: Math.min(size, 64 * 1_024),
      tailRequired: false,
    });
    const pieces = Array.from(
      {
        length:
          plan.ranges[0].pieceSpan.lastPiece -
          plan.ranges[0].pieceSpan.firstPiece +
          1,
      },
      (_, index) => plan.ranges[0].pieceSpan.firstPiece + index,
    );
    const probe = new mapping.PartialMediaProbe({
      executable: ffprobe!,
      mediaRoot: root,
    });

    await expect(
      probe.probe({
        path: media,
        expectedSizeBytes: size,
        plan,
        completedPieces: pieces.slice(1),
      }),
    ).rejects.toMatchObject({ code: "STREAM_METADATA_INCOMPLETE" });

    const metadata = await probe.probe({
      path: media,
      expectedSizeBytes: size,
      plan,
      completedPieces: pieces,
    });
    expect(metadata).toMatchObject({
      sizeBytes: size,
      container: "mov",
      videoCodec: "mpeg4",
      audioCodec: "aac",
      width: 320,
      height: 180,
      mappingConfidence: "estimated",
    });
    expect(metadata.durationSeconds).toBeGreaterThanOrEqual(1);
    expect(metadata.bitrateBitsPerSecond).toBeGreaterThan(0);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
