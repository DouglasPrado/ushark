import { expect, test } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const {
  LibraryTrustService,
} = require("../packages/core/src/library-trust-service.cjs");
const snapshot = () => ({
  key: "library:one@1",
  schema: "1.0",
  version: 1,
  integrity: "a".repeat(64),
  warnings: [],
  catalog: [],
  draft: {
    id: "library:one",
    name: "One",
    author: "Author",
    revision: 1,
    memberships: [],
    collections: [],
    sections: [],
  },
});
function memorySecret() {
  let value: Buffer | undefined;
  return {
    read: () => value,
    write: (_name: string, next: Buffer) => {
      value = Buffer.from(next);
    },
    inspect: () => value,
  };
}
test("M14 S04.1 Ed25519 detecta alteração de payload", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-trust-"));
  const secret = memorySecret();
  const service = new LibraryTrustService({
    databasePath: path.join(root, "db.sqlite"),
    secretStore: secret,
  });
  const signed = service.sign(snapshot());
  expect(service.verify(signed).status).toBe("first");
  expect(service.verify({ ...signed, integrity: "b".repeat(64) }).status).toBe(
    "hash",
  );
  expect(
    JSON.stringify(fs.readFileSync(path.join(root, "db.sqlite"))),
  ).not.toContain(secret.inspect()?.toString("base64"));
  service.close();
  fs.rmSync(root, { recursive: true });
});
test("M14 S04.2 TOFU persiste e bloqueia troca silenciosa", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-trust-"));
  const db = path.join(root, "db.sqlite");
  const first = new LibraryTrustService({
    databasePath: db,
    secretStore: memorySecret(),
  });
  const signedA = first.sign(snapshot());
  first.accept({
    libraryId: signedA.draft.id,
    publicKey: signedA.signature.key,
    idempotencyKey: "accept:a",
  });
  first.close();
  const known = new LibraryTrustService({
    databasePath: db,
    secretStore: memorySecret(),
  });
  expect(known.verify(signedA).status).toBe("known");
  const signedB = known.sign(snapshot());
  expect(known.verify(signedB).status).toBe("changed");
  known.close();
  fs.rmSync(root, { recursive: true });
});
test("M14 S04.3 assinatura persiste pelo boundary do pacote", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-trust-"));
  let attached: unknown;
  const service = new LibraryTrustService({
    databasePath: path.join(root, "db.sqlite"),
    secretStore: memorySecret(),
    packageService: {
      attachSignature: (value: unknown) => {
        attached = value;
        return { ok: true, value };
      },
    },
  });
  const signed = service.sign(snapshot());
  expect(attached).toEqual(signed);
  expect(signed.signature.algorithm).toBe("Ed25519");
  service.close();
  fs.rmSync(root, { recursive: true });
});
