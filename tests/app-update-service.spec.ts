import { expect, test } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash, generateKeyPairSync, sign } from "node:crypto";
const {
  AppUpdateService,
  metadata,
} = require("../packages/core/src/app-update-service.cjs");
const {
  canonical,
} = require("../packages/core/src/library-package-service.cjs");
function fixture(bytes = Buffer.from("signed installer")) {
  const pair = generateKeyPairSync("ed25519");
  const candidate: {
    version: string;
    checksum: string;
    channel: "Canary";
    platform: string;
    notes: string[];
    signature: string;
    sbom: string;
    provenance: string;
    url: string;
    size: number;
  } = {
    version: "1.2.3",
    checksum: createHash("sha256").update(bytes).digest("hex"),
    channel: "Canary",
    platform: "win32-x64",
    notes: ["tested"],
    signature: "",
    sbom: "sbom.spdx.json",
    provenance: "provenance.json",
    url: "https://updates.test/a",
    size: bytes.length,
  };
  candidate.signature = sign(
    null,
    Buffer.from(canonical(metadata(candidate))),
    pair.privateKey,
  ).toString("base64");
  return {
    bytes,
    candidate,
    publicKey: pair.publicKey
      .export({ format: "der", type: "spki" })
      .toString("base64"),
  };
}
test("M22 S04 metadata assinado e checksum preparam exatamente o candidato", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-up-"));
  const f = fixture();
  let backup = 0;
  const fetchImpl = async (url: string) =>
    url.includes("/v1/update")
      ? { ok: true, status: 200, json: async () => f.candidate }
      : { ok: true, status: 200, arrayBuffer: async () => f.bytes };
  const service = new AppUpdateService({
    currentVersion: "1.0.0",
    platform: "win32-x64",
    endpoint: "https://updates.test",
    publicKey: f.publicKey,
    stageRoot: root,
    fetchImpl,
    backup: async () => {
      backup++;
    },
  });
  const candidate = await service.check("Canary");
  expect(candidate.version).toBe("1.2.3");
  expect(await service.apply(candidate)).toEqual({ staged: true });
  expect(backup).toBe(1);
  expect(
    JSON.parse(fs.readFileSync(path.join(root, "pending-update.json"), "utf8"))
      .checksum,
  ).toBe(f.candidate.checksum);
  fs.rmSync(root, { recursive: true });
});
test("M22 S04 assinatura/hash inválido bloqueiam staging", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-up-"));
  const f = fixture();
  const service = new AppUpdateService({
    currentVersion: "1.0.0",
    platform: "win32-x64",
    endpoint: "https://updates.test",
    publicKey: f.publicKey,
    stageRoot: root,
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      arrayBuffer: async () => Buffer.from("tamper"),
    }),
  });
  await expect(service.apply(f.candidate)).rejects.toThrow(/Tamanho|Checksum/);
  expect(fs.existsSync(path.join(root, "pending-update.json"))).toBe(false);
  f.candidate.signature = "bad";
  expect(() => service.verifyMetadata(f.candidate)).toThrow("Assinatura");
  fs.rmSync(root, { recursive: true });
});
