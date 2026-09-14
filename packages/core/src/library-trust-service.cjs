"use strict";
const { Buffer } = require("node:buffer");
const { DatabaseSync } = require("node:sqlite");
const {
  createHash,
  generateKeyPairSync,
  sign,
  verify,
  createPrivateKey,
  createPublicKey,
} = require("node:crypto");
const { canonical } = require("./library-package-service.cjs");
function signedPayload(snapshot) {
  return canonical({
    libraryId: snapshot.draft.id,
    author: snapshot.draft.author ?? "",
    schema: snapshot.schema,
    version: snapshot.version,
    integrity: snapshot.integrity,
  });
}
function publicKeyId(key) {
  return createHash("sha256").update(key).digest("hex").slice(0, 24);
}
class LibraryTrustService {
  constructor({ databasePath, secretStore, packageService }) {
    this.database = new DatabaseSync(databasePath);
    this.secretStore = secretStore;
    this.packageService = packageService;
    this.database.exec(
      `CREATE TABLE IF NOT EXISTS library_trust_pins(library_id TEXT PRIMARY KEY,key_id TEXT NOT NULL,public_key TEXT NOT NULL,accepted_at INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS library_trust_idempotency(idempotency_key TEXT PRIMARY KEY,operation TEXT NOT NULL,result_json TEXT NOT NULL);`,
    );
  }
  verify(snapshot) {
    const previous = this.database
      .prepare(
        "SELECT key_id,public_key FROM library_trust_pins WHERE library_id=?",
      )
      .get(snapshot.draft.id);
    if (!snapshot.signature)
      return {
        status: "unsigned",
        key: "",
        previous: previous?.key_id ?? "",
        message: "Não assinada. A identidade do autor não foi verificada.",
      };
    const signature = snapshot.signature;
    if (signature.integrity !== snapshot.integrity)
      return {
        status: "hash",
        key: "",
        previous: previous?.key_id ?? "",
        message: "Hash assinado diverge do pacote; importação bloqueada.",
      };
    const valid = (() => {
      try {
        return (
          signature.algorithm === "Ed25519" &&
          verify(
            null,
            Buffer.from(signedPayload(snapshot)),
            createPublicKey({
              key: Buffer.from(signature.key, "base64"),
              format: "der",
              type: "spki",
            }),
            Buffer.from(signature.value, "base64"),
          )
        );
      } catch {
        return false;
      }
    })();
    const key = publicKeyId(signature.key);
    if (!valid)
      return {
        status: "invalid",
        key,
        previous: previous?.key_id ?? "",
        message: "Assinatura Ed25519 inválida; importação bloqueada.",
      };
    if (previous && previous.public_key !== signature.key)
      return {
        status: "changed",
        key,
        previous: previous.key_id,
        message: "Identidade alterada. Confira a nova chave antes de aceitar.",
      };
    return {
      status: previous ? "known" : "first",
      key,
      previous: previous?.key_id ?? "",
      message: previous
        ? "Assinatura válida; identidade reconhecida neste perfil."
        : "Assinatura válida; confirme a primeira confiança nesta identidade.",
    };
  }
  accept({ libraryId, publicKey, idempotencyKey }) {
    const replay = this.database
      .prepare(
        "SELECT operation FROM library_trust_idempotency WHERE idempotency_key=?",
      )
      .get(idempotencyKey);
    if (replay) {
      if (replay.operation !== "accept")
        throw Object.assign(new Error("idempotency conflict"), {
          code: "TRUST_CONFLICT",
        });
      return;
    }
    const keyId = publicKeyId(publicKey);
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database
        .prepare(
          "INSERT INTO library_trust_pins VALUES(?,?,?,unixepoch()) ON CONFLICT(library_id) DO UPDATE SET key_id=excluded.key_id,public_key=excluded.public_key,accepted_at=excluded.accepted_at",
        )
        .run(libraryId, keyId, publicKey);
      this.database
        .prepare("INSERT INTO library_trust_idempotency VALUES(?,?,?)")
        .run(idempotencyKey, "accept", "null");
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }
  sign(snapshot) {
    let encoded = this.secretStore.read("library-author-ed25519");
    let privateKey, publicKey;
    if (!encoded) {
      const pair = generateKeyPairSync("ed25519");
      encoded = pair.privateKey.export({ format: "der", type: "pkcs8" });
      this.secretStore.write("library-author-ed25519", encoded);
      privateKey = pair.privateKey;
      publicKey = pair.publicKey;
    } else {
      privateKey = createPrivateKey({
        key: encoded,
        format: "der",
        type: "pkcs8",
      });
      publicKey = createPublicKey(privateKey);
    }
    const key = publicKey
      .export({ format: "der", type: "spki" })
      .toString("base64");
    const value = sign(
      null,
      Buffer.from(signedPayload(snapshot)),
      privateKey,
    ).toString("base64");
    const signed = {
      ...structuredClone(snapshot),
      signature: {
        algorithm: "Ed25519",
        key,
        integrity: snapshot.integrity,
        value,
      },
    };
    const persisted = this.packageService?.attachSignature(signed);
    if (persisted && !persisted.ok)
      throw Object.assign(new Error(persisted.error.message), {
        code: persisted.error.code,
      });
    return signed;
  }
  close() {
    this.database.close();
  }
}
module.exports = { LibraryTrustService, publicKeyId, signedPayload };
