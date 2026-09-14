"use strict";

const { Buffer } = require("node:buffer");
const { createHash } = require("node:crypto");
const fs = require("node:fs");
const { parentPort, workerData } = require("node:worker_threads");

const SAMPLE_BYTES = 1024 * 1024;

function sample(handle, position, length) {
  const buffer = Buffer.allocUnsafe(length);
  const read = fs.readSync(handle, buffer, 0, length, position);
  return buffer.subarray(0, read);
}

function hydrate(filePath) {
  const flags = fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0);
  const handle = fs.openSync(filePath, flags);
  try {
    const before = fs.fstatSync(handle);
    if (!before.isFile()) throw new Error("FILE_NOT_REGULAR");
    const firstLength = Math.min(before.size, SAMPLE_BYTES);
    const first = sample(handle, 0, firstLength);
    const middlePosition = Math.max(
      0,
      Math.floor(before.size / 2) - Math.floor(SAMPLE_BYTES / 2),
    );
    const middle =
      middlePosition > 0
        ? sample(handle, middlePosition, SAMPLE_BYTES)
        : Buffer.alloc(0);
    const lastPosition = Math.max(0, before.size - SAMPLE_BYTES);
    const last =
      lastPosition > 0
        ? sample(handle, lastPosition, SAMPLE_BYTES)
        : Buffer.alloc(0);
    const after = fs.fstatSync(handle);
    if (before.size !== after.size || before.mtimeMs !== after.mtimeMs)
      throw new Error("FILE_UNSTABLE");
    const hash = createHash("sha256");
    hash.update(String(after.size));
    hash.update("\0");
    hash.update(String(after.mtimeMs));
    hash.update("\0");
    hash.update(first);
    hash.update(middle);
    hash.update(last);
    return {
      fingerprint: hash.digest("hex"),
      sizeBytes: after.size,
      modifiedAtMs: after.mtimeMs,
    };
  } finally {
    fs.closeSync(handle);
  }
}

try {
  parentPort.postMessage({ ok: true, value: hydrate(workerData.filePath) });
} catch (error) {
  parentPort.postMessage({
    ok: false,
    error: {
      code:
        error?.code === "ENOENT"
          ? "FILE_MISSING"
          : error?.message === "FILE_UNSTABLE"
            ? "FILE_UNSTABLE"
            : "FILE_UNREADABLE",
    },
  });
}
