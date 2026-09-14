import { expect, test } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
const {
  RecoveryService,
} = require("../packages/core/src/recovery-service.cjs");
test("M21 S04 backup SQLite consistente restaura e preserva original", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-rec-"));
  const dbPath = path.join(root, "ushark.db");
  let db = new DatabaseSync(dbPath);
  db.exec("CREATE TABLE state(value TEXT); INSERT INTO state VALUES('before')");
  db.close();
  const service = new RecoveryService({
    databasePath: dbPath,
    backupRoot: path.join(root, "backups"),
  });
  const backup = service.create("Good");
  db = new DatabaseSync(dbPath);
  db.exec("UPDATE state SET value='after'");
  db.close();
  await service.restore(backup.id);
  db = new DatabaseSync(dbPath);
  expect(db.prepare("SELECT value FROM state").get()?.value).toBe("before");
  db.close();
  expect(
    fs.readdirSync(root).some((name) => name.includes("pre-restore")),
  ).toBe(true);
  fs.rmSync(root, { recursive: true });
});
test("M21 S04 backup adulterado falha sem tocar original", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-rec-"));
  const dbPath = path.join(root, "ushark.db");
  const db = new DatabaseSync(dbPath);
  db.exec("CREATE TABLE state(value TEXT); INSERT INTO state VALUES('safe')");
  db.close();
  const service = new RecoveryService({
    databasePath: dbPath,
    backupRoot: path.join(root, "backups"),
  });
  const backup = service.create("Good");
  fs.appendFileSync(
    path.join(root, "backups", backup.id, "ushark.db"),
    "tamper",
  );
  expect(() => service.validate(backup.id)).toThrow("inválido");
  const live = new DatabaseSync(dbPath);
  expect(live.prepare("SELECT value FROM state").get()?.value).toBe("safe");
  live.close();
  fs.rmSync(root, { recursive: true });
});
