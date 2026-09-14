"use strict";
const { DatabaseSync } = require("node:sqlite");
class SubscriptionService {
  constructor({ databasePath, registry, verify }) {
    this.db = new DatabaseSync(databasePath);
    this.registry = registry;
    this.verify = verify;
    this.db.exec(
      `CREATE TABLE IF NOT EXISTS library_subscriptions(id TEXT PRIMARY KEY,current_json TEXT NOT NULL,previous_json TEXT,auto INTEGER NOT NULL DEFAULT 0,paused INTEGER NOT NULL DEFAULT 0,hidden_json TEXT NOT NULL DEFAULT '[]'); CREATE TABLE IF NOT EXISTS subscription_personal(content_id TEXT PRIMARY KEY,content_json TEXT NOT NULL,favorite INTEGER NOT NULL DEFAULT 0);`,
    );
  }
  list() {
    return this.db
      .prepare("SELECT * FROM library_subscriptions ORDER BY id")
      .all()
      .map((r) => ({
        id: r.id,
        snapshot: JSON.parse(r.current_json),
        ...(r.previous_json ? { previous: JSON.parse(r.previous_json) } : {}),
        auto: !!r.auto,
        paused: !!r.paused,
        hidden: JSON.parse(r.hidden_json),
      }));
  }
  async resolve(reference) {
    const value = await this.registry.resolve(reference);
    return value.snapshot ?? value;
  }
  install(snapshot) {
    const trust = this.verify(snapshot);
    if (["invalid", "hash", "changed"].includes(trust.status))
      throw new Error(trust.message);
    this.db
      .prepare(
        "INSERT INTO library_subscriptions VALUES(?,?,NULL,0,0,'[]') ON CONFLICT(id) DO NOTHING",
      )
      .run(snapshot.draft.id, JSON.stringify(snapshot));
  }
  async check(id) {
    const row = this.list().find((s) => s.id === id);
    if (!row || row.paused) return null;
    const next = await this.resolve(`${id}@latest`);
    if (
      next.version < row.snapshot.version ||
      (next.version === row.snapshot.version &&
        next.integrity !== row.snapshot.integrity)
    )
      throw new Error("Downgrade ou versão com hash divergente bloqueado.");
    return next.version === row.snapshot.version ? null : next;
  }
  apply(id, snapshot) {
    const row = this.list().find((s) => s.id === id);
    if (!row) throw new Error("Subscription não encontrada.");
    const trust = this.verify(snapshot);
    if (["invalid", "hash", "changed"].includes(trust.status))
      throw new Error(trust.message);
    if (snapshot.version <= row.snapshot.version)
      throw new Error("Versão não é avanço válido.");
    this.db.exec("BEGIN IMMEDIATE");
    try {
      this.db
        .prepare(
          "UPDATE library_subscriptions SET previous_json=current_json,current_json=? WHERE id=?",
        )
        .run(JSON.stringify(snapshot), id);
      this.db.exec("COMMIT");
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
  rollback(id) {
    const row = this.db
      .prepare(
        "SELECT current_json,previous_json FROM library_subscriptions WHERE id=?",
      )
      .get(id);
    if (!row?.previous_json) return;
    this.db
      .prepare(
        "UPDATE library_subscriptions SET current_json=?,previous_json=? WHERE id=?",
      )
      .run(row.previous_json, row.current_json, id);
  }
  unsubscribe(id) {
    this.db.prepare("DELETE FROM library_subscriptions WHERE id=?").run(id);
  }
  configure(id, patch) {
    const row = this.list().find((s) => s.id === id);
    if (!row) return;
    this.db
      .prepare("UPDATE library_subscriptions SET auto=?,paused=? WHERE id=?")
      .run(
        (patch.auto ?? row.auto) ? 1 : 0,
        (patch.paused ?? row.paused) ? 1 : 0,
        id,
      );
  }
  hide(id, contentId) {
    const row = this.list().find((s) => s.id === id);
    if (!row) return;
    const hidden = [...new Set([...row.hidden, contentId])];
    this.db
      .prepare("UPDATE library_subscriptions SET hidden_json=? WHERE id=?")
      .run(JSON.stringify(hidden), id);
  }
  savePersonal(content) {
    this.db
      .prepare(
        "INSERT INTO subscription_personal VALUES(?,?,0) ON CONFLICT(content_id) DO UPDATE SET content_json=excluded.content_json",
      )
      .run(content.id, JSON.stringify(content));
  }
  favorite(id) {
    return !!this.db
      .prepare("SELECT favorite FROM subscription_personal WHERE content_id=?")
      .get(id)?.favorite;
  }
  toggleFavorite(id) {
    this.db
      .prepare(
        "UPDATE subscription_personal SET favorite=1-favorite WHERE content_id=?",
      )
      .run(id);
  }
  discoveryItems() {
    return this.list().flatMap((s) =>
      s.snapshot.catalog
        .filter((c) => !s.hidden.includes(c.id))
        .map((c) => ({
          ...c,
          memberships: [{ id: s.id, name: s.snapshot.draft.name }],
          favorite: this.favorite(c.id),
        })),
    );
  }
  sources(id) {
    for (const s of this.list()) {
      const item = s.snapshot.catalog.find((c) => c.id === id);
      if (item) return item.sources;
    }
    return [];
  }
  close() {
    this.db.close();
  }
}
module.exports = { SubscriptionService };
