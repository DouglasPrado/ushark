"use strict";
const { DatabaseSync } = require("node:sqlite");
const { canonical, digest } = require("./library-package-service.cjs");
class HttpRegistryClient {
  constructor({ endpoint, token, fetchImpl = globalThis.fetch }) {
    this.endpoint = endpoint?.replace(/\/$/, "");
    this.token = token;
    this.fetch = fetchImpl;
  }
  async request(path, body) {
    if (!this.endpoint || !this.token)
      throw Object.assign(
        new Error("Registry não configurado ou editor não autenticado."),
        { code: "PUBLISH_AUTH_REQUIRED" },
      );
    const response = await this.fetch(`${this.endpoint}${path}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      signal: globalThis.AbortSignal.timeout(15_000),
    });
    const value = await response.json().catch(() => ({}));
    if (!response.ok)
      throw Object.assign(
        new Error(value.message ?? `Registry respondeu ${response.status}.`),
        {
          code:
            response.status === 409
              ? "PUBLISH_CONFLICT"
              : "PUBLISH_REMOTE_FAILED",
        },
      );
    return value;
  }
  stage(snapshot, key) {
    return this.request("/v1/stage", { snapshot, idempotencyKey: key });
  }
  commit(snapshot, expectedVersion, key) {
    return this.request("/v1/publish", {
      snapshot,
      expectedVersion,
      idempotencyKey: key,
    });
  }
  withdraw(libraryId, key) {
    return this.request("/v1/withdraw", { libraryId, idempotencyKey: key });
  }
  resolve(reference) {
    return this.request("/v1/resolve", { reference });
  }
}
class RegistryPublisherService {
  constructor({ databasePath, registry }) {
    this.db = new DatabaseSync(databasePath);
    this.registry = registry;
    this.db.exec(
      `CREATE TABLE IF NOT EXISTS registry_publications(package_key TEXT PRIMARY KEY,library_id TEXT NOT NULL,version INTEGER NOT NULL,snapshot_json TEXT NOT NULL,link TEXT NOT NULL,code TEXT NOT NULL,withdrawn INTEGER NOT NULL DEFAULT 0);`,
    );
  }
  list() {
    return this.db
      .prepare(
        "SELECT snapshot_json,link,code,withdrawn FROM registry_publications ORDER BY library_id,version",
      )
      .all()
      .map((r) => ({
        snapshot: JSON.parse(r.snapshot_json),
        link: r.link,
        code: r.code,
        withdrawn: !!r.withdrawn,
      }));
  }
  prepare(draft, catalog) {
    const previous = this.db
      .prepare(
        "SELECT version,snapshot_json FROM registry_publications WHERE library_id=? ORDER BY version DESC LIMIT 1",
      )
      .get(draft.id);
    const expectedVersion = Number(previous?.version ?? 0);
    const selected = catalog
      .filter((item) => draft.memberships.some((m) => m.contentId === item.id))
      .map((item) => ({
        ...item,
        sources: item.sources
          .filter((s) =>
            draft.memberships
              .find((m) => m.contentId === item.id)
              ?.sourceIds.includes(s.id),
          )
          .map((s) => ({ ...s, local: false })),
      }));
    const base = {
      key: `${draft.id}@${expectedVersion + 1}`,
      schema: "1.0",
      version: expectedVersion + 1,
      draft: structuredClone(draft),
      catalog: selected,
      warnings: [],
    };
    const snapshot = { ...base, integrity: digest(base) };
    const changes =
      previous &&
      canonical(JSON.parse(previous.snapshot_json).draft) === canonical(draft)
        ? ["Sem mudanças na curadoria; nova versão explícita."]
        : previous
          ? ["Curadoria alterada desde a versão anterior."]
          : ["Primeira versão da biblioteca"];
    return { snapshot, expectedVersion, changes };
  }
  async publish(review, idempotencyKey) {
    await this.registry.stage(review.snapshot, `${idempotencyKey}:stage`);
    const remote = await this.registry.commit(
      review.snapshot,
      review.expectedVersion,
      `${idempotencyKey}:commit`,
    );
    const row = {
      snapshot: review.snapshot,
      link: remote.link,
      code: remote.code,
      withdrawn: false,
    };
    this.db
      .prepare("INSERT INTO registry_publications VALUES(?,?,?,?,?,?,0)")
      .run(
        review.snapshot.key,
        review.snapshot.draft.id,
        review.snapshot.version,
        JSON.stringify(review.snapshot),
        row.link,
        row.code,
      );
    return row;
  }
  async withdraw(libraryId, idempotencyKey) {
    await this.registry.withdraw(libraryId, idempotencyKey);
    this.db
      .prepare(
        "UPDATE registry_publications SET withdrawn=1 WHERE library_id=?",
      )
      .run(libraryId);
  }
  close() {
    this.db.close();
  }
}
module.exports = { HttpRegistryClient, RegistryPublisherService };
