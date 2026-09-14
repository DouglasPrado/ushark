"use strict";

const { Buffer } = require("node:buffer");
const { spawn } = require("node:child_process");
const { randomBytes, randomUUID } = require("node:crypto");
const { EventEmitter } = require("node:events");
const fs = require("node:fs");
const path = require("node:path");
const { clearTimeout, setTimeout } = require("node:timers");
const {
  assertExistingPathContained,
  parseMagnet,
} = require("./torrent-input-store.cjs");

const PROTOCOL = "ushark-torrentd/1";
const MAX_MESSAGE_BYTES = 1024 * 1024;
const ALLOWED_METHODS = new Set([
  "hello",
  "torrent.inspect",
  "operation.cancel",
  "operation.get",
  "operation.getFiles",
  "stream.describe",
  "stream.applySchedule",
  "stream.getDelivery",
  "stream.stop",
  "health.sample",
  "download.start",
  "download.status",
  "download.pause",
  "download.resume",
  "download.cancel",
  "download.setPriority",
  "download.configure",
  "download.removeData",
  "download.saveResume",
  "runtime.shutdown",
]);

class TorrentDaemonError extends Error {
  constructor(code, publicMessage, retryable = false, cause) {
    super(publicMessage, cause ? { cause } : undefined);
    this.name = "TorrentDaemonError";
    this.code = code;
    this.publicMessage = publicMessage;
    this.retryable = retryable;
  }
}

class TorrentDaemonClient extends EventEmitter {
  constructor(options) {
    super();
    if (
      !options ||
      typeof options.pythonExecutable !== "string" ||
      !path.isAbsolute(options.pythonExecutable) ||
      typeof options.daemonScript !== "string" ||
      !path.isAbsolute(options.daemonScript) ||
      typeof options.dataRoot !== "string" ||
      !path.isAbsolute(options.dataRoot) ||
      typeof options.importRoot !== "string" ||
      !path.isAbsolute(options.importRoot)
    )
      throw new TorrentDaemonError(
        "TORRENT_INPUT_INVALID",
        "A configuração do torrentd não é válida.",
      );
    this.options = { requestTimeoutMs: 5000, ...options };
    this.secret = randomBytes(32).toString("hex");
    this.pending = new Map();
    this.buffer = Buffer.alloc(0);
    this.started = false;
    this.stopping = false;
    this.child = undefined;
    this.lastError = "";
  }

  async start() {
    if (this.started) return this.hello;
    if (this.child)
      throw new TorrentDaemonError(
        "TORRENT_DAEMON_UNAVAILABLE",
        "O runtime de torrent ainda está iniciando.",
        true,
      );
    for (const candidate of [
      this.options.pythonExecutable,
      this.options.daemonScript,
    ]) {
      let available;
      try {
        available = fs.statSync(candidate).isFile();
      } catch {
        available = false;
      }
      if (!available)
        throw new TorrentDaemonError(
          "TORRENT_DAEMON_UNAVAILABLE",
          "O runtime de torrent não está instalado.",
          true,
        );
    }
    fs.mkdirSync(this.options.dataRoot, { recursive: true, mode: 0o700 });
    fs.mkdirSync(this.options.importRoot, { recursive: true, mode: 0o700 });
    const environment = {
      ...process.env,
      USHARK_TORRENTD_SECRET: this.secret,
      USHARK_TORRENTD_DATA_ROOT: this.options.dataRoot,
      USHARK_TORRENTD_IMPORT_ROOT: this.options.importRoot,
      ...(this.options.allowLoopbackTrackers === true
        ? { USHARK_TORRENTD_ALLOW_LOOPBACK_TRACKERS: "1" }
        : {}),
      ...(typeof this.options.testPeerEndpoint === "string" &&
      /^127\.0\.0\.1:[1-9][0-9]{0,4}$/.test(this.options.testPeerEndpoint)
        ? { USHARK_TORRENTD_TEST_PEER: this.options.testPeerEndpoint }
        : {}),
    };
    const arguments_ = this.options.pythonPath
      ? [
          "-I",
          "-c",
          "import runpy,sys;sys.path.insert(0,sys.argv[1]);runpy.run_path(sys.argv[2],run_name='__main__')",
          this.options.pythonPath,
          this.options.daemonScript,
        ]
      : ["-I", this.options.daemonScript];
    this.child = spawn(this.options.pythonExecutable, arguments_, {
      cwd: this.options.dataRoot,
      env: environment,
      shell: false,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });
    this.child.stdout.on("data", (chunk) => this.receive(chunk));
    this.child.stderr.on("data", (chunk) => {
      this.lastError = `${this.lastError}${chunk.toString("utf8")}`.slice(
        -4096,
      );
    });
    this.child.once("error", (error) => this.failAll(error));
    this.child.once("exit", (code, signal) => {
      const expected = this.stopping;
      this.child = undefined;
      this.started = false;
      if (!expected)
        this.failAll(
          new TorrentDaemonError(
            "TORRENT_DAEMON_UNAVAILABLE",
            `O runtime de torrent encerrou (${signal ?? code ?? "unknown"}).`,
            true,
          ),
        );
      this.emit("exit", { code, signal, expected });
    });
    this.hello = await this.request(
      "hello",
      {
        client: "core",
        clientVersion: "1",
        supportedProtocols: [PROTOCOL],
      },
      this.options.startupTimeoutMs ?? 10_000,
    );
    if (
      this.hello?.selectedProtocol !== PROTOCOL ||
      !Array.isArray(this.hello?.capabilities)
    )
      throw new TorrentDaemonError(
        "TORRENT_PROTOCOL_UNSUPPORTED",
        "O handshake do torrentd é incompatível.",
      );
    this.started = true;
    return this.hello;
  }

  receive(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    if (this.buffer.length > MAX_MESSAGE_BYTES * 2) {
      this.failAll(
        new TorrentDaemonError(
          "TORRENT_RPC_LIMIT",
          "O torrentd excedeu o limite de IPC.",
        ),
      );
      this.child?.kill();
      return;
    }
    while (true) {
      const newline = this.buffer.indexOf(0x0a);
      if (newline < 0) break;
      const line = this.buffer.subarray(0, newline);
      this.buffer = this.buffer.subarray(newline + 1);
      if (!line.length) continue;
      if (line.length > MAX_MESSAGE_BYTES) {
        this.failAll(
          new TorrentDaemonError(
            "TORRENT_RPC_LIMIT",
            "O torrentd excedeu o limite de IPC.",
          ),
        );
        this.child?.kill();
        return;
      }
      let message;
      try {
        message = JSON.parse(line.toString("utf8"));
      } catch (error) {
        this.failAll(
          new TorrentDaemonError(
            "TORRENT_DAEMON_UNAVAILABLE",
            "O torrentd enviou uma resposta inválida.",
            true,
            error,
          ),
        );
        this.child?.kill();
        return;
      }
      if (message?.protocolVersion !== PROTOCOL) continue;
      if (message.kind === "event") {
        this.emit("event", message);
        continue;
      }
      if (message.kind !== "response" || typeof message.requestId !== "string")
        continue;
      const pending = this.pending.get(message.requestId);
      if (!pending) continue;
      this.pending.delete(message.requestId);
      clearTimeout(pending.timeout);
      if (message.ok) pending.resolve(message.value);
      else
        pending.reject(
          new TorrentDaemonError(
            message.error?.code ?? "TORRENT_DAEMON_UNAVAILABLE",
            message.error?.message ?? "O runtime de torrent falhou.",
            message.error?.retryable === true,
          ),
        );
    }
  }

  failAll(error) {
    const normalized =
      error instanceof TorrentDaemonError
        ? error
        : new TorrentDaemonError(
            "TORRENT_DAEMON_UNAVAILABLE",
            "O runtime de torrent está indisponível.",
            true,
            error,
          );
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeout);
      pending.reject(normalized);
    }
    this.pending.clear();
  }

  request(method, payload, timeoutMs = this.options.requestTimeoutMs) {
    if (!ALLOWED_METHODS.has(method))
      return Promise.reject(
        new TorrentDaemonError(
          "TORRENT_UNAUTHORIZED",
          "Método torrent não permitido.",
        ),
      );
    if (!this.child?.stdin?.writable)
      return Promise.reject(
        new TorrentDaemonError(
          "TORRENT_DAEMON_UNAVAILABLE",
          "O runtime de torrent está indisponível.",
          true,
        ),
      );
    const requestId = randomUUID();
    const envelope = {
      protocolVersion: PROTOCOL,
      requestId,
      method,
      payload,
      secret: this.secret,
      timestamp: Date.now(),
    };
    const encoded = Buffer.from(`${JSON.stringify(envelope)}\n`);
    if (encoded.length > MAX_MESSAGE_BYTES)
      return Promise.reject(
        new TorrentDaemonError(
          "TORRENT_RPC_LIMIT",
          "A solicitação excede o limite de IPC.",
        ),
      );
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(requestId);
        reject(
          new TorrentDaemonError(
            "TORRENT_DAEMON_UNAVAILABLE",
            "O runtime de torrent não respondeu no tempo esperado.",
            true,
          ),
        );
      }, timeoutMs);
      this.pending.set(requestId, { resolve, reject, timeout });
      this.child.stdin.write(encoded, (error) => {
        if (!error) return;
        const pending = this.pending.get(requestId);
        if (!pending) return;
        clearTimeout(pending.timeout);
        this.pending.delete(requestId);
        reject(
          new TorrentDaemonError(
            "TORRENT_DAEMON_UNAVAILABLE",
            "Não foi possível enviar a solicitação ao torrentd.",
            true,
            error,
          ),
        );
      });
    });
  }

  inspect(payload) {
    if (!payload || typeof payload !== "object")
      return Promise.reject(
        new TorrentDaemonError(
          "TORRENT_INPUT_INVALID",
          "A inspeção torrent não é válida.",
        ),
      );
    const normalized = { ...payload };
    try {
      if (payload.type === "torrent-file")
        normalized.path = assertExistingPathContained(
          this.options.importRoot,
          payload.path,
        );
      else if (payload.type === "magnet") parseMagnet(payload.magnet);
      else
        throw new TorrentDaemonError(
          "TORRENT_INPUT_INVALID",
          "A entrada torrent não é suportada.",
        );
    } catch (error) {
      return Promise.reject(
        error instanceof TorrentDaemonError
          ? error
          : new TorrentDaemonError(
              error.code ?? "TORRENT_INPUT_INVALID",
              error.publicMessage ?? "A entrada torrent não é válida.",
              false,
              error,
            ),
      );
    }
    return this.request("torrent.inspect", normalized);
  }

  cancel(operationId) {
    return this.request("operation.cancel", { operationId });
  }

  get(operationId) {
    return this.request("operation.get", { operationId });
  }

  getFiles(operationId, cursor = 0, limit = 128) {
    return this.request("operation.getFiles", { operationId, cursor, limit });
  }

  describeStream(torrentId, fileId) {
    return this.request("stream.describe", { torrentId, fileId });
  }

  applyStreamSchedule(payload) {
    if (!payload || typeof payload !== "object")
      return Promise.reject(
        new TorrentDaemonError(
          "STREAM_INVALID",
          "O plano de streaming não é válido.",
        ),
      );
    return this.request("stream.applySchedule", payload);
  }

  async getStreamDelivery(streamSessionId) {
    const delivery = await this.request("stream.getDelivery", {
      streamSessionId,
    });
    if (delivery?.relativePath === null && delivery?.ready !== true) {
      const pendingDelivery = { ...delivery };
      delete pendingDelivery.relativePath;
      return pendingDelivery;
    }
    if (typeof delivery?.relativePath !== "string")
      throw new TorrentDaemonError(
        "STREAM_FILE_MISSING",
        "O delivery parcial não está disponível.",
      );
    const candidate = path.resolve(
      this.options.dataRoot,
      ...delivery.relativePath.split("/"),
    );
    let managedPath;
    try {
      managedPath = assertExistingPathContained(
        this.options.dataRoot,
        candidate,
      );
    } catch (error) {
      throw new TorrentDaemonError(
        "STREAM_FILE_MISSING",
        "O delivery parcial não é válido.",
        false,
        error,
      );
    }
    const publicDelivery = { ...delivery };
    delete publicDelivery.relativePath;
    return { ...publicDelivery, managedPath };
  }

  stopStream(streamSessionId, seekGeneration) {
    return this.request("stream.stop", { streamSessionId, seekGeneration });
  }

  healthSample(torrentId, fileId, window = {}) {
    return this.request("health.sample", { torrentId, fileId, ...window });
  }

  startDownload(payload) {
    return this.request("download.start", payload);
  }

  downloadStatus(downloadId) {
    return this.request("download.status", { downloadId });
  }

  downloadCommand(downloadId, action) {
    if (!["pause", "resume", "cancel"].includes(action))
      return Promise.reject(
        new TorrentDaemonError(
          "DOWNLOAD_INVALID",
          "O comando de download não é válido.",
        ),
      );
    return this.request(`download.${action}`, { downloadId });
  }

  setDownloadPriority(downloadId, priority) {
    return this.request("download.setPriority", { downloadId, priority });
  }

  configureDownloads(payload) {
    return this.request("download.configure", payload);
  }

  removeDownloadData(downloadId, confirmed) {
    return this.request("download.removeData", { downloadId, confirmed });
  }

  saveDownloadResume(downloadId) {
    return this.request("download.saveResume", { downloadId });
  }

  async stop() {
    if (!this.child) return;
    this.stopping = true;
    const child = this.child;
    try {
      await this.request("runtime.shutdown", {}, 1000);
    } catch {
      // The bounded kill below is the recovery path.
    }
    child.stdin.end();
    const exited = await new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 1500);
      child.once("exit", () => {
        clearTimeout(timeout);
        resolve(true);
      });
    });
    if (!exited) child.kill();
    this.stopping = false;
  }
}

module.exports = {
  ALLOWED_METHODS,
  MAX_MESSAGE_BYTES,
  PROTOCOL,
  TorrentDaemonClient,
  TorrentDaemonError,
};
