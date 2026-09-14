"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { Buffer } = require("node:buffer");
const { createHash, createPublicKey, verify } = require("node:crypto");
const { canonical } = require("./library-package-service.cjs");
function metadata(candidate) {
  const value = { ...candidate };
  delete value.signature;
  return value;
}
class AppUpdateService {
  constructor({
    currentVersion,
    platform,
    endpoint,
    publicKey,
    stageRoot,
    fetchImpl = globalThis.fetch,
    backup,
  }) {
    this.currentVersion = currentVersion;
    this.platform = platform;
    this.endpoint = endpoint?.replace(/\/$/, "");
    this.publicKey = publicKey;
    this.stageRoot = stageRoot;
    this.fetch = fetchImpl;
    this.backup = backup;
    fs.mkdirSync(stageRoot, { recursive: true });
  }
  state() {
    return { version: this.currentVersion, installed: true };
  }
  verifyMetadata(candidate) {
    if (
      !candidate ||
      candidate.platform !== this.platform ||
      !candidate.version ||
      !candidate.checksum ||
      !candidate.signature ||
      !candidate.url
    )
      throw new Error("Candidato incompatível ou incompleto.");
    if (!this.publicKey)
      throw new Error("Chave pública de update não configurada.");
    const key = createPublicKey({
      key: Buffer.from(this.publicKey, "base64"),
      format: "der",
      type: "spki",
    });
    if (
      !verify(
        null,
        Buffer.from(canonical(metadata(candidate))),
        key,
        Buffer.from(candidate.signature, "base64"),
      )
    )
      throw new Error("Assinatura de metadados inválida.");
    return candidate;
  }
  async check(channel) {
    if (!this.endpoint) throw new Error("Feed de atualização não configurado.");
    const url = `${this.endpoint}/v1/update?channel=${encodeURIComponent(channel)}&platform=${encodeURIComponent(this.platform)}&current=${encodeURIComponent(this.currentVersion)}`;
    const response = await this.fetch(url, {
      signal: globalThis.AbortSignal.timeout(15_000),
    });
    if (response.status === 204) return null;
    if (!response.ok) throw new Error(`Feed respondeu ${response.status}.`);
    return this.verifyMetadata(await response.json());
  }
  async apply(candidate) {
    this.verifyMetadata(candidate);
    await this.backup?.();
    const response = await this.fetch(candidate.url, {
      signal: globalThis.AbortSignal.timeout(120_000),
    });
    if (!response.ok) throw new Error(`Download respondeu ${response.status}.`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (
      bytes.length > 300 * 1024 * 1024 ||
      (candidate.size && bytes.length !== candidate.size)
    )
      throw new Error("Tamanho do candidato divergente.");
    const checksum = createHash("sha256").update(bytes).digest("hex");
    if (checksum !== candidate.checksum)
      throw new Error("Checksum do candidato divergente.");
    const artifact = path.join(
      this.stageRoot,
      `ushark-${candidate.version}-${this.platform}.update`,
    );
    const temp = `${artifact}.tmp`;
    fs.writeFileSync(temp, bytes, { flag: "wx", mode: 0o600 });
    fs.renameSync(temp, artifact);
    fs.writeFileSync(
      path.join(this.stageRoot, "pending-update.json"),
      JSON.stringify(
        {
          version: candidate.version,
          platform: candidate.platform,
          checksum,
          artifact,
        },
        null,
        2,
      ),
      { mode: 0o600 },
    );
    return { staged: true };
  }
}
module.exports = { AppUpdateService, metadata };
