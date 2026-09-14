"use strict";
const fs = require("node:fs");
const { DatabaseSync } = require("node:sqlite");
const sensitive =
  /(token|authorization|cookie|magnet|path|secret|private|key)/i;
function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !sensitive.test(key))
        .map(([key, item]) => [key, redact(item)]),
    );
  if (typeof value === "string")
    return value.replace(
      /magnet:\?\S+|Bearer\s+\S+|(?:\/Users|[A-Z]:\\)[^\s"]+/gi,
      "[redacted]",
    );
  return value;
}
class DiagnosticsService {
  constructor({ databasePath, metrics, cleaners = {} }) {
    this.db = new DatabaseSync(databasePath);
    this.databasePath = databasePath;
    this.metrics = metrics;
    this.cleaners = cleaners;
    this.db.exec(
      `CREATE TABLE IF NOT EXISTS diagnostic_settings(id INTEGER PRIMARY KEY CHECK(id=1),event_limit INTEGER NOT NULL,days INTEGER NOT NULL); INSERT OR IGNORE INTO diagnostic_settings VALUES(1,200,7); CREATE TABLE IF NOT EXISTS diagnostic_logs(id INTEGER PRIMARY KEY AUTOINCREMENT,event TEXT NOT NULL,correlation TEXT NOT NULL,level TEXT NOT NULL,created_at INTEGER NOT NULL);`,
    );
  }
  collect() {
    const settings = this.db
      .prepare("SELECT event_limit,days FROM diagnostic_settings WHERE id=1")
      .get();
    const cutoff = Math.floor(Date.now() / 1000) - settings.days * 86400;
    this.db
      .prepare("DELETE FROM diagnostic_logs WHERE created_at<?")
      .run(cutoff);
    const logs = this.db
      .prepare(
        "SELECT event,correlation,level FROM diagnostic_logs ORDER BY id DESC LIMIT ?",
      )
      .all(settings.event_limit)
      .reverse();
    const sizes = [this.databasePath, `${this.databasePath}-wal`].map((p) => {
      try {
        return fs.statSync(p).size;
      } catch {
        return 0;
      }
    });
    const current = this.metrics();
    return redact({
      ...current,
      metrics: [
        ...current.metrics,
        { label: "DB", value: sizes[0], unit: "bytes" },
        { label: "WAL", value: sizes[1], unit: "bytes" },
      ],
      logs,
      retention: { limit: settings.event_limit, days: settings.days },
    });
  }
  export(snapshot) {
    return JSON.stringify(
      redact({
        format: "ushark-diagnostics-v1",
        createdAt: new Date().toISOString(),
        ...snapshot,
      }),
      null,
      2,
    );
  }
  async clear(category) {
    if (category === "logs") this.db.exec("DELETE FROM diagnostic_logs");
    else await this.cleaners[category]?.();
    return `${category} limpo; biblioteca e preferências preservadas.`;
  }
  retention(limit, days) {
    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 1000 ||
      !Number.isInteger(days) ||
      days < 1 ||
      days > 365
    )
      throw new Error("Retenção inválida.");
    this.db
      .prepare("UPDATE diagnostic_settings SET event_limit=?,days=? WHERE id=1")
      .run(limit, days);
  }
  burst() {
    const insert = this.db.prepare(
      "INSERT INTO diagnostic_logs(event,correlation,level,created_at) VALUES(?,?,?,unixepoch())",
    );
    for (let i = 0; i < 50; i++)
      insert.run("diagnostic_event", `local-${i}`, "info");
    const limit = this.db
      .prepare("SELECT event_limit FROM diagnostic_settings WHERE id=1")
      .get().event_limit;
    this.db
      .prepare(
        "DELETE FROM diagnostic_logs WHERE id NOT IN (SELECT id FROM diagnostic_logs ORDER BY id DESC LIMIT ?)",
      )
      .run(limit);
  }
  close() {
    this.db.close();
  }
}
module.exports = { DiagnosticsService, redact };
