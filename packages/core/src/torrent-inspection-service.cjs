"use strict";

const { randomUUID } = require("node:crypto");
const { EventEmitter } = require("node:events");
const { parseMagnet } = require("./torrent-input-store.cjs");

const PROTOCOL_VERSION = 1;

function success(value) {
  return { ok: true, value };
}

function failure(error) {
  return {
    ok: false,
    error: {
      code: error?.code ?? "TORRENT_DAEMON_UNAVAILABLE",
      message:
        error?.publicMessage ??
        error?.message ??
        "O runtime de torrent está indisponível.",
      recoverable: error?.retryable === true,
      retryable: error?.retryable === true,
    },
  };
}

class TorrentInspectionApplicationService extends EventEmitter {
  constructor({ daemon, inputStore, store, softTimeoutMs, hardTimeoutMs }) {
    super();
    if (!daemon || !inputStore || !store)
      throw new Error("torrent inspection dependencies are required");
    this.daemon = daemon;
    this.inputStore = inputStore;
    this.store = store;
    this.operations = new Map();
    this.snapshots = new Map();
    this.startIdempotency = new Map();
    this.starting = undefined;
    this.softTimeoutMs = softTimeoutMs;
    this.hardTimeoutMs = hardTimeoutMs;
    this.daemon.on("event", (event) => {
      const normalized = { ...event, protocolVersion: PROTOCOL_VERSION };
      this.snapshots.set(event.operationId, event.snapshot);
      this.emit("event", normalized);
    });
    this.daemon.on("exit", ({ expected }) => {
      if (expected) return;
      for (const [operationId, previous] of this.snapshots) {
        if (["completed", "cancelled"].includes(previous.state)) continue;
        const snapshot = {
          ...previous,
          sequence: previous.sequence + 1,
          state: "failed",
          progress: undefined,
          failure: {
            code: "TORRENT_DAEMON_UNAVAILABLE",
            message:
              "O runtime de torrent parou. A biblioteca continua acessível.",
            recoverable: true,
            retryable: true,
          },
          updatedAt: new Date().toISOString(),
        };
        this.snapshots.set(operationId, snapshot);
        this.emit("event", {
          protocolVersion: PROTOCOL_VERSION,
          eventId: randomUUID(),
          operationId,
          correlationId: snapshot.correlationId,
          sequence: snapshot.sequence,
          type: "runtime.unavailable",
          snapshot,
          timestamp: snapshot.updatedAt,
        });
      }
    });
  }

  async ensureStarted() {
    if (!this.starting) this.starting = this.daemon.start();
    try {
      return await this.starting;
    } catch (error) {
      this.starting = undefined;
      throw error;
    }
  }

  async capabilities() {
    try {
      const hello = await this.ensureStarted();
      return success({
        protocolVersion: PROTOCOL_VERSION,
        capabilities: hello.capabilities,
      });
    } catch (error) {
      return failure(error);
    }
  }

  async chooseTorrentFile(sourcePath) {
    try {
      return success(this.inputStore.select(sourcePath));
    } catch (error) {
      return failure(error);
    }
  }

  contextForInput(input) {
    if (input?.type === "magnet") {
      const parsed = parseMagnet(input.magnet);
      return {
        inputType: "magnet",
        inputLabel: parsed.inputLabel,
        privateInput: input.magnet,
        daemonPayload: { type: "magnet", magnet: input.magnet },
      };
    }
    if (input?.type === "torrent-file") {
      const selected = this.inputStore.resolve(input.selectionId);
      return {
        inputType: "torrent-file",
        inputLabel: selected.fileName,
        privateInput: selected.managedPath,
        managedTorrentPath: selected.managedPath,
        daemonPayload: { type: "torrent-file", path: selected.managedPath },
      };
    }
    const error = new Error("A entrada torrent não é válida.");
    error.code = "TORRENT_INPUT_INVALID";
    throw error;
  }

  async start(input) {
    try {
      const key = input?.mutation?.idempotencyKey;
      if (typeof key !== "string" || !key)
        throw new Error("Idempotência ausente.");
      const replay = this.startIdempotency.get(key);
      if (replay) return success(replay);
      await this.ensureStarted();
      const context = this.contextForInput(input.input);
      const operationId = `operation:${randomUUID()}`;
      const payload = {
        ...context.daemonPayload,
        operationId,
        correlationId: input.correlationId,
        inputLabel: context.inputLabel,
        softTimeoutMs: this.softTimeoutMs,
        hardTimeoutMs: this.hardTimeoutMs,
      };
      const snapshot = await this.daemon.inspect(payload);
      this.operations.set(operationId, context);
      this.snapshots.set(operationId, snapshot);
      this.startIdempotency.set(key, snapshot);
      return success(snapshot);
    } catch (error) {
      return failure(error);
    }
  }

  async cancel(input) {
    try {
      await this.ensureStarted();
      return success(await this.daemon.cancel(input.operationId));
    } catch (error) {
      return failure(error);
    }
  }

  async get(input) {
    try {
      await this.ensureStarted();
      const snapshot = await this.daemon.get(input.operationId);
      this.snapshots.set(input.operationId, snapshot);
      return success(snapshot);
    } catch (error) {
      const snapshot = this.snapshots.get(input.operationId);
      if (snapshot) return success(snapshot);
      return failure(error);
    }
  }

  async getFiles(input) {
    try {
      await this.ensureStarted();
      return success(
        await this.daemon.getFiles(
          input.operationId,
          input.cursor ?? 0,
          input.limit ?? 128,
        ),
      );
    } catch (error) {
      return failure(error);
    }
  }

  async listPending() {
    return this.store.listPending();
  }

  async savePending(input) {
    try {
      const context = this.operations.get(input.operationId);
      if (!context) {
        const error = new Error("A operação não está disponível para salvar.");
        error.code = "TORRENT_NOT_FOUND";
        throw error;
      }
      const snapshotResult = await this.get(input);
      if (!snapshotResult.ok) return snapshotResult;
      return this.store.savePending({
        operationId: input.operationId,
        inputType: context.inputType,
        inputLabel: context.inputLabel,
        privateInput: context.privateInput,
        snapshot: snapshotResult.value,
        mutation: input.mutation,
      });
    } catch (error) {
      return failure(error);
    }
  }

  async retry(input) {
    try {
      await this.ensureStarted();
      const pending = this.store.loadPendingForRetry(input);
      if (!pending.ok) return pending;
      const operationId = `operation:${randomUUID()}`;
      const context = {
        inputType: pending.value.inputType,
        inputLabel: pending.value.inputLabel,
        privateInput: pending.value.privateInput,
        managedTorrentPath:
          pending.value.inputType === "torrent-file"
            ? pending.value.privateInput
            : undefined,
        daemonPayload:
          pending.value.inputType === "torrent-file"
            ? { type: "torrent-file", path: pending.value.privateInput }
            : { type: "magnet", magnet: pending.value.privateInput },
      };
      const snapshot = await this.daemon.inspect({
        ...context.daemonPayload,
        operationId,
        correlationId: input.correlationId,
        inputLabel: context.inputLabel,
        softTimeoutMs: this.softTimeoutMs,
        hardTimeoutMs: this.hardTimeoutMs,
      });
      this.operations.set(operationId, context);
      this.snapshots.set(operationId, snapshot);
      return success(snapshot);
    } catch (error) {
      return failure(error);
    }
  }

  async removePending(input) {
    return this.store.removePending(input);
  }

  async allFiles(operationId, snapshot) {
    if (snapshot.filesComplete) return snapshot.files;
    const files = [];
    let cursor = 0;
    while (cursor !== undefined) {
      const page = await this.daemon.getFiles(operationId, cursor, 128);
      files.push(...page.files);
      cursor = page.nextCursor;
    }
    return files;
  }

  async confirm(input) {
    try {
      await this.ensureStarted();
      const snapshot = await this.daemon.get(input.operationId);
      if (snapshot.state !== "files-ready" || !snapshot.runtime) {
        const error = new Error(
          "A metadata ainda não está pronta para confirmar.",
        );
        error.code = "TORRENT_INPUT_INVALID";
        throw error;
      }
      const context = this.operations.get(input.operationId);
      if (!context) {
        const error = new Error(
          "A operação não está disponível para confirmar.",
        );
        error.code = "TORRENT_NOT_FOUND";
        throw error;
      }
      const files = await this.allFiles(input.operationId, snapshot);
      return this.store.confirmSource({
        operationId: input.operationId,
        contentId: input.contentId,
        infoHash: snapshot.runtime.infoHash,
        inputType: context.inputType,
        inputLabel: context.inputLabel,
        displayName: snapshot.displayName,
        files,
        selector: input.selector,
        managedTorrentPath: context.managedTorrentPath,
        mutation: input.mutation,
      });
    } catch (error) {
      return failure(error);
    }
  }

  async close() {
    await this.daemon.stop();
    this.store.close();
  }
}

module.exports = {
  PROTOCOL_VERSION,
  TorrentInspectionApplicationService,
};
