"use strict";
/* global AbortController, clearTimeout */

const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { EventEmitter } = require("node:events");
const { DatabaseSync } = require("node:sqlite");
const { calculateHealthSnapshot } = require("./health-engine.cjs");

const PROTOCOL_VERSION = 1;
const SCHEMA_VERSION = 1;
const MAX_CANDIDATES = 64;
const SELECTION_DEADLINE_MS = 2_000;
const RESOLUTION_LIMITS = { "720p": 720, "1080p": 1080, "2160p": 2160 };
const WEIGHTS = {
  balanced: {
    health: 0.5,
    quality: 0.3,
    startup: 0.1,
    cache: 0.05,
    author: 0.05,
  },
  quality: {
    health: 0.35,
    quality: 0.5,
    startup: 0.05,
    cache: 0.05,
    author: 0.05,
  },
  fast: { health: 0.35, quality: 0.1, startup: 0.35, cache: 0.2, author: 0 },
};

class SourceSelectionError extends Error {
  constructor(code, publicMessage, retryable = false, cause) {
    super(publicMessage, cause ? { cause } : undefined);
    this.name = "SourceSelectionError";
    this.code = code;
    this.publicMessage = publicMessage;
    this.retryable = retryable;
  }
}

function validId(value, label) {
  if (
    typeof value !== "string" ||
    value.length < 3 ||
    value.length > 256 ||
    value.includes("\0") ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]+$/.test(value)
  )
    throw new SourceSelectionError(
      "SELECTION_INVALID",
      `A identidade de ${label} não é válida.`,
    );
  return value;
}

function failure(error) {
  const known =
    error instanceof SourceSelectionError ||
    error?.name === "HealthSamplerError";
  return {
    ok: false,
    error: {
      code: known ? error.code : "SELECTION_STORAGE_FAILED",
      message: known
        ? error.publicMessage
        : "A seleção de source falhou e o estado anterior foi preservado.",
      recoverable: known ? error.retryable === true : true,
      retryable: known ? error.retryable === true : true,
    },
  };
}

function qualityScore(height) {
  if (!Number.isFinite(height)) return 35;
  if (height >= 2160) return 100;
  if (height >= 1440) return 85;
  if (height >= 1080) return 75;
  if (height >= 720) return 55;
  return 30;
}

function startupScore(milliseconds) {
  if (!Number.isFinite(milliseconds)) return 20;
  if (milliseconds < 1_000) return 100;
  if (milliseconds < 2_000) return 90;
  if (milliseconds < 4_000) return 75;
  if (milliseconds < 8_000) return 55;
  if (milliseconds < 15_000) return 30;
  return 10;
}

function isEligible(candidate, resolutionLimit) {
  if (
    candidate.blacklisted === true ||
    candidate.hardwareDecodeSupported === false
  )
    return false;
  if (
    Number.isFinite(candidate.resolutionHeight) &&
    candidate.resolutionHeight > RESOLUTION_LIMITS[resolutionLimit]
  )
    return false;
  if (candidate.completedLocal) return true;
  const health = candidate.health;
  if (health?.state === "unavailable" || health?.state === "error")
    return false;
  if (Number.isFinite(health?.streamingRatio) && health.streamingRatio < 1)
    return false;
  return true;
}

function rankSources(candidates, options) {
  if (!Array.isArray(candidates) || candidates.length > MAX_CANDIDATES)
    throw new SourceSelectionError(
      "SELECTION_INVALID",
      "As sources para seleção não são válidas.",
    );
  const strategy = options?.strategy;
  const resolutionLimit = options?.resolutionLimit;
  if (
    !["balanced", "quality", "fast", "smallest"].includes(strategy) ||
    !RESOLUTION_LIMITS[resolutionLimit]
  )
    throw new SourceSelectionError(
      "SELECTION_INVALID",
      "As preferências de seleção não são válidas.",
    );
  const overrideSourceId = options.overrideSourceId;
  return candidates
    .map((candidate) => {
      const eligible = isEligible(candidate, resolutionLimit);
      const reasons = [];
      if (!eligible) reasons.push("ineligible");
      if (candidate.completedLocal) reasons.push("completed-local");
      if (candidate.sourceId === overrideSourceId)
        reasons.push("user-override");
      const health = candidate.completedLocal
        ? 100
        : (candidate.health?.score ?? 25);
      const quality = qualityScore(candidate.resolutionHeight);
      const startup = candidate.completedLocal
        ? 100
        : startupScore(candidate.health?.startupEstimateMs);
      const cache = candidate.completedLocal ? 100 : 0;
      const author = candidate.preferredByAuthor ? 100 : 0;
      let score;
      if (strategy === "smallest") {
        const gib = Number.isFinite(candidate.sizeBytes)
          ? candidate.sizeBytes / 1024 ** 3
          : 10_000;
        score = Math.max(0, 100 - Math.min(99, gib));
      } else {
        const weights = WEIGHTS[strategy];
        score =
          health * weights.health +
          quality * weights.quality +
          startup * weights.startup +
          cache * weights.cache +
          author * weights.author;
      }
      if (eligible && candidate.completedLocal) score += 10_000;
      if (eligible && candidate.sourceId === overrideSourceId) score += 20_000;
      return {
        sourceId: candidate.sourceId,
        score,
        eligible,
        reasonCodes: reasons,
      };
    })
    .sort(
      (left, right) =>
        Number(right.eligible) - Number(left.eligible) ||
        right.score - left.score ||
        left.sourceId.localeCompare(right.sourceId),
    )
    .map((entry, index) => ({
      ...entry,
      score: Math.round(entry.score % 10_000),
      rank: index + 1,
    }));
}

class SourceSelectionStore {
  constructor(databasePath) {
    if (typeof databasePath !== "string" || !path.isAbsolute(databasePath))
      throw new SourceSelectionError(
        "SELECTION_INVALID",
        "O banco local de seleção não é válido.",
      );
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    this.databasePath = databasePath;
    this.database = new DatabaseSync(databasePath);
    this.database.exec("PRAGMA journal_mode = WAL");
    this.database.exec("PRAGMA busy_timeout = 5000");
    this.database.exec("PRAGMA foreign_keys = ON");
    this.migrate();
    this.secure();
  }

  secure() {
    if (process.platform === "win32") return;
    for (const file of [
      this.databasePath,
      `${this.databasePath}-wal`,
      `${this.databasePath}-shm`,
    ])
      if (fs.existsSync(file)) fs.chmodSync(file, 0o600);
  }

  migrate() {
    const base = this.database
      .prepare(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name='contents'",
      )
      .get();
    if (!base)
      throw new SourceSelectionError(
        "SELECTION_STORAGE_FAILED",
        "Conclua o catálogo local antes de selecionar sources.",
      );
    this.database.exec(`
      BEGIN IMMEDIATE;
      CREATE TABLE IF NOT EXISTS health_snapshots (
        source_id TEXT PRIMARY KEY, snapshot_json TEXT NOT NULL, score REAL, confidence REAL NOT NULL,
        state TEXT NOT NULL, measured_at INTEGER NOT NULL, algorithm_version INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS health_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT, source_id TEXT NOT NULL, measured_at INTEGER NOT NULL,
        startup_ms INTEGER, sustainable_throughput_bps INTEGER, average_ratio REAL, useful_peers INTEGER,
        stalls INTEGER NOT NULL DEFAULT 0, score REAL, confidence REAL NOT NULL, algorithm_version INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_health_history_source_time ON health_history(source_id, measured_at DESC);
      CREATE TABLE IF NOT EXISTS user_source_overrides (
        content_id TEXT PRIMARY KEY REFERENCES contents(id) ON DELETE CASCADE,
        source_id TEXT NOT NULL, updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS source_selection_decisions (
        decision_id TEXT PRIMARY KEY, request_id TEXT NOT NULL UNIQUE, content_id TEXT NOT NULL,
        selected_source_id TEXT, snapshot_json TEXT NOT NULL, decided_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS source_selection_idempotency (
        idempotency_key TEXT PRIMARY KEY, operation TEXT NOT NULL, result_json TEXT NOT NULL, created_at INTEGER NOT NULL
      );
      COMMIT;
    `);
  }

  belongs(contentId, sourceId) {
    validId(contentId, "conteúdo");
    validId(sourceId, "source");
    const tables = this.database
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('content_sources','content_source_selectors')",
      )
      .all()
      .map((row) => row.name);
    const clauses = [];
    const values = [];
    if (tables.includes("content_sources")) {
      clauses.push(
        "SELECT 1 AS linked FROM content_sources WHERE content_id=? AND source_id=?",
      );
      values.push(contentId, sourceId);
    }
    if (tables.includes("content_source_selectors")) {
      clauses.push(
        "SELECT 1 AS linked FROM content_source_selectors WHERE content_id=? AND source_id=?",
      );
      values.push(contentId, sourceId);
    }
    return (
      clauses.length > 0 &&
      Boolean(
        this.database
          .prepare(`${clauses.join(" UNION ALL ")} LIMIT 1`)
          .get(...values),
      )
    );
  }

  assertCandidates(contentId, candidates) {
    const content = this.database
      .prepare("SELECT 1 FROM contents WHERE id=?")
      .get(validId(contentId, "conteúdo"));
    if (!content)
      throw new SourceSelectionError(
        "SELECTION_NOT_FOUND",
        "O conteúdo não foi encontrado.",
      );
    for (const candidate of candidates)
      if (!this.belongs(contentId, candidate.sourceId))
        throw new SourceSelectionError(
          "SELECTION_UNAUTHORIZED",
          "Uma source não pertence a este conteúdo.",
        );
  }

  saveHealth(snapshot) {
    this.database
      .prepare(
        `INSERT INTO health_snapshots(source_id,snapshot_json,score,confidence,state,measured_at,algorithm_version)
      VALUES(?,?,?,?,?,unixepoch(),?) ON CONFLICT(source_id) DO UPDATE SET snapshot_json=excluded.snapshot_json,score=excluded.score,confidence=excluded.confidence,state=excluded.state,measured_at=excluded.measured_at,algorithm_version=excluded.algorithm_version`,
      )
      .run(
        snapshot.sourceId,
        JSON.stringify(snapshot),
        snapshot.score ?? null,
        snapshot.confidence,
        snapshot.state,
        snapshot.algorithmVersion,
      );
    this.database
      .prepare(
        `INSERT INTO health_history(source_id,measured_at,startup_ms,sustainable_throughput_bps,average_ratio,useful_peers,stalls,score,confidence,algorithm_version)
      VALUES(?,unixepoch(),?,?,?,?,?,?,?,?)`,
      )
      .run(
        snapshot.sourceId,
        snapshot.startupEstimateMs ?? null,
        snapshot.sustainableThroughputBitsPerSecond ?? null,
        snapshot.streamingRatio ?? null,
        snapshot.usefulPeers,
        snapshot.reasonCodes.includes("active-stall") ? 1 : 0,
        snapshot.score ?? null,
        snapshot.confidence,
        snapshot.algorithmVersion,
      );
    this.database
      .prepare(
        "DELETE FROM health_history WHERE source_id=? AND id NOT IN (SELECT id FROM health_history WHERE source_id=? ORDER BY measured_at DESC,id DESC LIMIT 120)",
      )
      .run(snapshot.sourceId, snapshot.sourceId);
  }

  readHealth(sourceId) {
    const row = this.database
      .prepare("SELECT snapshot_json FROM health_snapshots WHERE source_id=?")
      .get(validId(sourceId, "source"));
    return row ? JSON.parse(row.snapshot_json) : undefined;
  }

  readOverride(contentId) {
    const row = this.database
      .prepare("SELECT source_id FROM user_source_overrides WHERE content_id=?")
      .get(validId(contentId, "conteúdo"));
    return row?.source_id;
  }

  setOverride(input) {
    const contentId = validId(input?.contentId, "conteúdo");
    const sourceId =
      input?.sourceId === undefined
        ? undefined
        : validId(input.sourceId, "source");
    const key = validId(input?.mutation?.idempotencyKey, "idempotência");
    const existing = this.database
      .prepare(
        "SELECT operation,result_json FROM source_selection_idempotency WHERE idempotency_key=?",
      )
      .get(key);
    if (existing) {
      if (existing.operation !== "set-override")
        throw new SourceSelectionError(
          "SELECTION_CONFLICT",
          "A chave de idempotência já foi usada em outra operação.",
        );
      return JSON.parse(existing.result_json);
    }
    if (sourceId && !this.belongs(contentId, sourceId))
      throw new SourceSelectionError(
        "SELECTION_UNAUTHORIZED",
        "A source escolhida não pertence a este conteúdo.",
      );
    const result = { contentId, ...(sourceId ? { sourceId } : {}) };
    this.database.exec("BEGIN IMMEDIATE");
    try {
      if (sourceId)
        this.database
          .prepare(
            "INSERT INTO user_source_overrides(content_id,source_id,updated_at) VALUES(?,?,unixepoch()) ON CONFLICT(content_id) DO UPDATE SET source_id=excluded.source_id,updated_at=excluded.updated_at",
          )
          .run(contentId, sourceId);
      else
        this.database
          .prepare("DELETE FROM user_source_overrides WHERE content_id=?")
          .run(contentId);
      this.database
        .prepare(
          "INSERT INTO source_selection_idempotency(idempotency_key,operation,result_json,created_at) VALUES(?,?,?,unixepoch())",
        )
        .run(key, "set-override", JSON.stringify(result));
      this.database.exec("COMMIT");
      return result;
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  saveDecision(snapshot) {
    this.database
      .prepare(
        "INSERT INTO source_selection_decisions(decision_id,request_id,content_id,selected_source_id,snapshot_json,decided_at) VALUES(?,?,?,?,?,unixepoch())",
      )
      .run(
        snapshot.decisionId,
        snapshot.requestId,
        snapshot.contentId,
        snapshot.selectedSourceId ?? null,
        JSON.stringify(snapshot),
      );
  }

  close() {
    this.database.close();
  }
}

class SourceSelectionApplicationService extends EventEmitter {
  constructor({
    sampler,
    store,
    clock = () => Date.now(),
    deadlineMs = SELECTION_DEADLINE_MS,
  }) {
    super();
    this.sampler = sampler;
    this.store = store;
    this.clock = clock;
    this.deadlineMs = deadlineMs;
    this.active = new Map();
    this.sequences = new Map();
    this.lastPublished = new Map();
  }
  subscribe(listener) {
    this.on("selection-event", listener);
    return () => this.off("selection-event", listener);
  }
  publish(type, requestId, snapshot, error, force = false) {
    const now = this.clock();
    const last = this.lastPublished.get(requestId) ?? 0;
    if (!force && now - last < 250) return;
    this.lastPublished.set(requestId, now);
    const sequence = (this.sequences.get(requestId) ?? 0) + 1;
    this.sequences.set(requestId, sequence);
    this.emit("selection-event", {
      protocolVersion: PROTOCOL_VERSION,
      eventId: `selection-event:${randomUUID()}`,
      type,
      sequence,
      occurredAt: new Date(now).toISOString(),
      ...(snapshot ? { snapshot } : {}),
      ...(error ? { error } : {}),
    });
  }
  snapshotBase(input, state) {
    const now = new Date(this.clock()).toISOString();
    return {
      schemaVersion: SCHEMA_VERSION,
      protocolVersion: PROTOCOL_VERSION,
      requestId: input.requestId,
      contentId: input.contentId,
      state,
      strategy: input.strategy,
      resolutionLimit: input.resolutionLimit,
      candidates: structuredClone(input.candidates),
      ranked: [],
      reasonCodes: [],
      startedAt: now,
      updatedAt: now,
    };
  }
  async preflight(input) {
    try {
      validId(input?.requestId, "requisição");
      validId(input?.contentId, "conteúdo");
      if (
        !Array.isArray(input.candidates) ||
        input.candidates.length === 0 ||
        input.candidates.length > MAX_CANDIDATES
      )
        throw new SourceSelectionError(
          "SELECTION_INVALID",
          "As sources para seleção não são válidas.",
        );
      for (const candidate of input.candidates)
        validId(candidate.sourceId, "source");
      this.store.assertCandidates(input.contentId, input.candidates);
      if (this.active.has(input.requestId))
        throw new SourceSelectionError(
          "SELECTION_CONFLICT",
          "A requisição já está em execução.",
        );
      const controller = new AbortController();
      this.active.set(input.requestId, controller);
      let snapshot = this.snapshotBase(input, "measuring");
      this.publish(
        "selection.measuring",
        input.requestId,
        snapshot,
        undefined,
        true,
      );
      const timeout = setTimeout(
        () => controller.abort("deadline"),
        this.deadlineMs,
      );
      try {
        let samples;
        try {
          samples = await this.sampler.measure(
            input,
            controller.signal,
            (sample) => {
              const candidate = input.candidates.find(
                (entry) => entry.sourceId === sample.sourceId,
              );
              if (!candidate || controller.signal.aborted) return;
              const previous = this.store.readHealth(candidate.sourceId);
              const health = calculateHealthSnapshot({
                candidate,
                samples: this.sampler.samples(candidate.sourceId),
                previous,
                now: this.clock(),
                ttlMs: input.context === "details" ? 15_000 : 90_000,
              });
              candidate.health = health;
              this.store.saveHealth(health);
              snapshot = {
                ...snapshot,
                candidates: structuredClone(input.candidates),
                updatedAt: new Date(this.clock()).toISOString(),
              };
              this.publish("selection.updated", input.requestId, snapshot);
            },
          );
        } catch (error) {
          if (controller.signal.aborted)
            throw new SourceSelectionError(
              controller.signal.reason === "deadline"
                ? "SELECTION_TIMEOUT"
                : "SELECTION_CANCELLED",
              controller.signal.reason === "deadline"
                ? "A seleção excedeu o tempo limite."
                : "A seleção foi cancelada.",
              controller.signal.reason === "deadline",
            );
          throw error;
        }
        if (controller.signal.aborted)
          throw new SourceSelectionError(
            controller.signal.reason === "deadline"
              ? "SELECTION_TIMEOUT"
              : "SELECTION_CANCELLED",
            controller.signal.reason === "deadline"
              ? "A seleção excedeu o tempo limite."
              : "A seleção foi cancelada.",
            controller.signal.reason === "deadline",
          );
        input.candidates.forEach((candidate, index) => {
          const previous =
            candidate.health ?? this.store.readHealth(candidate.sourceId);
          candidate.health = calculateHealthSnapshot({
            candidate,
            samples: this.sampler.samples(candidate.sourceId).length
              ? this.sampler.samples(candidate.sourceId)
              : [samples[index]],
            previous,
            now: this.clock(),
            ttlMs: input.context === "details" ? 15_000 : 90_000,
          });
          this.store.saveHealth(candidate.health);
        });
        const overrideSourceId = this.store.readOverride(input.contentId);
        const ranked = rankSources(input.candidates, {
          strategy: input.strategy,
          resolutionLimit: input.resolutionLimit,
          overrideSourceId,
        });
        const selectedSourceId = ranked.find(
          (entry) => entry.eligible,
        )?.sourceId;
        snapshot = {
          ...snapshot,
          state: "ready",
          candidates: structuredClone(input.candidates),
          ranked,
          ...(selectedSourceId ? { selectedSourceId } : {}),
          ...(overrideSourceId ? { overrideSourceId } : {}),
          decisionId: `decision:${randomUUID()}`,
          reasonCodes: selectedSourceId
            ? ["ranked-selection"]
            : ["no-viable-source"],
          updatedAt: new Date(this.clock()).toISOString(),
        };
        this.store.saveDecision(snapshot);
        this.publish(
          "selection.ready",
          input.requestId,
          snapshot,
          undefined,
          true,
        );
        return { ok: true, value: snapshot };
      } finally {
        clearTimeout(timeout);
        this.active.delete(input.requestId);
      }
    } catch (error) {
      return failure(error);
    }
  }
  cancel(input) {
    try {
      const requestId = validId(input?.requestId, "requisição");
      const active = this.active.get(requestId);
      if (active) active.abort("cancelled");
      return { ok: true, value: { requestId, cancelled: Boolean(active) } };
    } catch (error) {
      return failure(error);
    }
  }
  setOverride(input) {
    try {
      return { ok: true, value: this.store.setOverride(input) };
    } catch (error) {
      return failure(error);
    }
  }
  readOverride(input) {
    try {
      const contentId = validId(input?.contentId, "conteúdo");
      const sourceId = this.store.readOverride(contentId);
      return {
        ok: true,
        value: { contentId, ...(sourceId ? { sourceId } : {}) },
      };
    } catch (error) {
      return failure(error);
    }
  }
}

module.exports = {
  MAX_CANDIDATES,
  PROTOCOL_VERSION,
  SCHEMA_VERSION,
  SELECTION_DEADLINE_MS,
  SourceSelectionApplicationService,
  SourceSelectionError,
  SourceSelectionStore,
  failure,
  isEligible,
  rankSources,
};
