"use strict";
const { DatabaseSync } = require("node:sqlite");
class FallbackService {
  constructor({ databasePath, sources, prepare, now = () => Date.now() }) {
    this.db = new DatabaseSync(databasePath);
    this.sources = sources;
    this.prepareSource = prepare;
    this.now = now;
    this.offset = 0;
    this.contentBySource = new Map();
    this.db.exec(
      `CREATE TABLE IF NOT EXISTS fallback_history(source_id TEXT PRIMARY KEY,success INTEGER NOT NULL,failures INTEGER NOT NULL,throughput REAL NOT NULL DEFAULT 0,startup REAL NOT NULL DEFAULT 0,buffering REAL NOT NULL DEFAULT 0,observed_at INTEGER NOT NULL,cooldown_until INTEGER NOT NULL DEFAULT 0,algorithm TEXT NOT NULL);`,
    );
  }
  timestamp() {
    return this.now() + this.offset;
  }
  alternatives(contentId, current) {
    const values = this.sources(contentId);
    for (const source of values) this.contentBySource.set(source.id, contentId);
    return values
      .filter((s) => s.id !== current)
      .map((s) => ({
        ...s,
        compatible: true,
        reason:
          "Mesmo Content/episódio do catálogo; duração não diverge no metadata disponível.",
      }))
      .sort((a, b) => this.penalty(a.id) - this.penalty(b.id));
  }
  async prepare(candidate, contentId) {
    if (!candidate.compatible)
      throw new Error(
        "Compatibilidade não verificada. Fonte atual preservada.",
      );
    if (this.cooldown(candidate.id))
      throw new Error("Candidata em cooldown temporário.");
    if (this.prepareSource)
      await this.prepareSource(
        contentId || this.contentBySource.get(candidate.id),
        candidate,
      );
  }
  record(sourceId, success) {
    const row = this.db
      .prepare("SELECT * FROM fallback_history WHERE source_id=?")
      .get(sourceId);
    this.db
      .prepare(
        `INSERT INTO fallback_history VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(source_id) DO UPDATE SET success=excluded.success,failures=excluded.failures,observed_at=excluded.observed_at,cooldown_until=excluded.cooldown_until,algorithm=excluded.algorithm`,
      )
      .run(
        sourceId,
        Number(row?.success ?? 0) + Number(success),
        Number(row?.failures ?? 0) + Number(!success),
        Number(row?.throughput ?? 0),
        Number(row?.startup ?? 0),
        Number(row?.buffering ?? 0),
        this.timestamp(),
        this.timestamp() + 30_000,
        "fallback-v1",
      );
  }
  history() {
    const now = this.timestamp();
    return this.db
      .prepare("SELECT * FROM fallback_history WHERE observed_at>=?")
      .all(now - 30 * 86400_000)
      .map((r) => {
        const age = Math.max(0, (now - r.observed_at) / 1000);
        return {
          sourceId: r.source_id,
          success: r.success,
          failures: r.failures,
          throughput: r.throughput,
          startup: r.startup,
          buffering: r.buffering,
          age,
          weight: Math.max(0, 1 - age / (30 * 86400)),
          algorithm: r.algorithm,
        };
      });
  }
  penalty(id) {
    const row = this.history().find((r) => r.sourceId === id);
    return row
      ? Math.max(0, row.failures * 20 - row.success * 5) * row.weight
      : 0;
  }
  cooldown(id) {
    return (
      Number(
        this.db
          .prepare(
            "SELECT cooldown_until FROM fallback_history WHERE source_id=?",
          )
          .get(id)?.cooldown_until ?? 0,
      ) > this.timestamp()
    );
  }
  advance(seconds) {
    this.offset += seconds * 1000;
  }
  clear() {
    this.db.exec("DELETE FROM fallback_history");
  }
  close() {
    this.db.close();
  }
}
module.exports = { FallbackService };
