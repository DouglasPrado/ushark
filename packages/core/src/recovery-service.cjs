"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { createHash, randomUUID } = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");
const hash = (file) =>
  createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const safe = (value) => value.replace(/'/g, "''");
class RecoveryService {
  constructor({
    databasePath,
    backupRoot,
    extraFiles = [],
    beforeRestore = async () => {},
    restart = async (name) => `${name} reiniciado.`,
    shutdown = async () => {},
  }) {
    this.databasePath = databasePath;
    this.backupRoot = backupRoot;
    this.extraFiles = extraFiles;
    this.beforeRestore = beforeRestore;
    this.restartComponent = restart;
    this.shutdownAll = shutdown;
    this.attempts = new Map();
    fs.mkdirSync(backupRoot, { recursive: true });
  }
  list() {
    return fs
      .readdirSync(this.backupRoot, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .flatMap((e) => {
        try {
          return [
            JSON.parse(
              fs.readFileSync(
                path.join(this.backupRoot, e.name, "manifest.json"),
                "utf8",
              ),
            ).summary,
          ];
        } catch {
          return [];
        }
      })
      .sort((a, b) => a.created.localeCompare(b.created));
  }
  create(name) {
    const id = `backup-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const temporary = path.join(this.backupRoot, `.${id}.tmp`);
    const destination = path.join(this.backupRoot, id);
    fs.mkdirSync(temporary, { recursive: true });
    try {
      const dbCopy = path.join(temporary, "ushark.db");
      const db = new DatabaseSync(this.databasePath);
      try {
        db.exec(`VACUUM INTO '${safe(dbCopy)}'`);
      } finally {
        db.close();
      }
      const files = [{ name: "ushark.db", hash: hash(dbCopy) }];
      for (const source of this.extraFiles)
        if (fs.existsSync(source.path)) {
          const target = path.join(temporary, source.name);
          fs.copyFileSync(source.path, target);
          files.push({ name: source.name, hash: hash(target) });
        }
      const summary = {
        id,
        name: name.trim() || "Backup",
        created: new Date().toISOString(),
        parts: ["Banco consistente", ...files.slice(1).map((f) => f.name)],
      };
      fs.writeFileSync(
        path.join(temporary, "manifest.json"),
        JSON.stringify({ schema: 1, summary, files }, null, 2),
        { mode: 0o600 },
      );
      fs.renameSync(temporary, destination);
      return summary;
    } catch (e) {
      fs.rmSync(temporary, { recursive: true, force: true });
      throw e;
    }
  }
  validate(id) {
    const root = path.join(this.backupRoot, path.basename(id));
    const manifest = JSON.parse(
      fs.readFileSync(path.join(root, "manifest.json"), "utf8"),
    );
    if (
      manifest.schema !== 1 ||
      manifest.files.some((f) => hash(path.join(root, f.name)) !== f.hash)
    )
      throw new Error("Backup inválido ou incompatível; original preservado.");
    const db = new DatabaseSync(path.join(root, "ushark.db"));
    try {
      const row = db.prepare("PRAGMA integrity_check").get();
      if (Object.values(row)[0] !== "ok")
        throw new Error("Banco do backup inválido.");
    } finally {
      db.close();
    }
    return manifest.summary;
  }
  async restore(id, phase = () => {}) {
    const summary = this.validate(id);
    const root = path.join(this.backupRoot, path.basename(id));
    const stage = `${this.databasePath}.${randomUUID()}.restore`;
    const original = `${this.databasePath}.pre-restore-${Date.now()}`;
    phase("Preparando cópia validada…");
    fs.copyFileSync(path.join(root, "ushark.db"), stage);
    try {
      await this.beforeRestore();
      phase("Preservando original e aplicando…");
      fs.renameSync(this.databasePath, original);
      try {
        fs.renameSync(stage, this.databasePath);
        for (const extra of this.extraFiles) {
          const source = path.join(root, extra.name);
          if (fs.existsSync(source)) fs.copyFileSync(source, extra.path);
        }
      } catch (e) {
        fs.renameSync(original, this.databasePath);
        throw e;
      }
      return summary;
    } catch (e) {
      try {
        fs.unlinkSync(stage);
      } catch {
        /* already absent */
      }
      throw e;
    }
  }
  async restart(component) {
    const tries = this.attempts.get(component) ?? 0;
    if (tries >= 3)
      throw new Error(
        "Limite de 3 tentativas atingido; rearme explicitamente.",
      );
    this.attempts.set(component, tries + 1);
    const value = await Promise.race([
      this.restartComponent(component),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout de recuperação.")), 5000),
      ),
    ]);
    this.attempts.set(component, 0);
    return value;
  }
  rearm(component) {
    this.attempts.delete(component);
  }
  async shutdown() {
    await Promise.race([
      this.shutdownAll(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout de shutdown.")), 5000),
      ),
    ]);
  }
}
module.exports = { RecoveryService, hash };
