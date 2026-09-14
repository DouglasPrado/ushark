"use strict";

const { EventEmitter } = require("node:events");
const fs = require("node:fs");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { randomUUID } = require("node:crypto");
const { clearTimeout, setTimeout } = require("node:timers");

const DEFAULT_COMMAND_TIMEOUT_MS = 2_000;
const DEFAULT_STARTUP_TIMEOUT_MS = 15_000;

function playbackError(code, message, retryable = false) {
  return Object.assign(new Error(message), {
    code,
    publicMessage: message,
    retryable,
  });
}

function finiteNumber(value, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizedTrack(track) {
  const kind = track?.type === "audio" ? "audio" : "subtitle";
  return {
    id: String(track?.id ?? ""),
    kind,
    language: typeof track?.lang === "string" ? track.lang : undefined,
    title: typeof track?.title === "string" ? track.title : undefined,
    codec: typeof track?.codec === "string" ? track.codec : undefined,
    channels:
      typeof track?.["demux-channel-count"] === "number"
        ? String(track["demux-channel-count"])
        : undefined,
    external: track?.external === true,
    selected: track?.selected === true,
    default: track?.default === true,
  };
}

class MpvAdapter extends EventEmitter {
  constructor(options = {}) {
    super();
    this.executable =
      options.executable ?? process.env.USHARK_MPV_PATH ?? "mpv";
    this.spawnProcess = options.spawnProcess ?? spawn;
    this.commandTimeoutMs =
      options.commandTimeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS;
    this.startupTimeoutMs =
      options.startupTimeoutMs ?? DEFAULT_STARTUP_TIMEOUT_MS;
    this.ipcRoot =
      options.ipcRoot ??
      path.join(
        process.platform === "win32" ? os.tmpdir() : "/tmp",
        `ushark-mpv-${typeof process.getuid === "function" ? process.getuid() : "user"}`,
      );
    this.extraArgs = Array.isArray(options.extraArgs)
      ? [...options.extraArgs]
      : [];
    this.prefixArgs = Array.isArray(options.prefixArgs)
      ? [...options.prefixArgs]
      : [];
    this.surface = options.surface ?? null;
    this.surfaceActive = false;
    this.unsubscribeSurface = null;
    this.child = null;
    this.socket = null;
    this.socketPath = null;
    this.buffer = "";
    this.requests = new Map();
    this.requestId = 0;
    this.commandQueue = Promise.resolve();
    this.loaded = false;
    this.firstFrame = false;
    this.expectedExit = false;
    this.state = {
      positionSeconds: 0,
      paused: false,
      audioTracks: [],
      subtitleTracks: [],
      hardwareDecode: "unknown",
    };
  }

  buildArguments({ fullscreen = false, hardwareDecode = true } = {}) {
    if (!this.socketPath)
      throw playbackError(
        "PLAYBACK_INVALID",
        "O IPC do player não foi criado.",
      );
    const geometry = this.surface?.geometry?.();
    return [
      ...this.prefixArgs,
      "--idle=yes",
      "--no-terminal",
      "--no-input-default-bindings",
      "--osd-level=0",
      "--keep-open=yes",
      "--force-window=yes",
      `--input-ipc-server=${this.socketPath}`,
      `--hwdec=${hardwareDecode ? "auto-safe" : "no"}`,
      fullscreen ? "--fullscreen=yes" : "--fullscreen=no",
      ...(typeof geometry === "string" && geometry.length > 0
        ? [`--geometry=${geometry}`]
        : []),
      ...this.extraArgs,
    ];
  }

  activateSurface() {
    if (this.surfaceActive) return;
    this.surfaceActive = true;
    try {
      this.surface?.activate?.();
    } catch {
      // Window coordination must not hide a playable media error.
    }
  }

  subscribeSurfaceGeometry() {
    if (typeof this.surface?.subscribeGeometry !== "function") return;
    this.unsubscribeSurface = this.surface.subscribeGeometry((geometry) => {
      if (typeof geometry !== "string" || geometry.length === 0) return;
      void this.enqueue(["set_property", "geometry", geometry]).catch(() => {});
    });
  }

  deactivateSurface() {
    this.unsubscribeSurface?.();
    this.unsubscribeSurface = null;
    if (!this.surfaceActive) return;
    this.surfaceActive = false;
    try {
      this.surface?.deactivate?.();
    } catch {
      // Process cleanup remains authoritative even if the window already closed.
    }
  }

  async start(options = {}) {
    if (this.child || this.socket)
      throw playbackError(
        "PLAYBACK_CONFLICT",
        "Já existe um processo de player nesta sessão.",
      );
    fs.mkdirSync(this.ipcRoot, { recursive: true, mode: 0o700 });
    if (process.platform !== "win32") fs.chmodSync(this.ipcRoot, 0o700);
    this.socketPath =
      process.platform === "win32"
        ? `\\\\.\\pipe\\ushark-mpv-${randomUUID()}`
        : path.join(this.ipcRoot, `${randomUUID()}.sock`);
    if (process.platform !== "win32")
      fs.rmSync(this.socketPath, { force: true });
    const args = this.buildArguments(options);
    this.expectedExit = false;
    this.activateSurface();
    try {
      this.child = this.spawnProcess(this.executable, args, {
        shell: false,
        windowsHide: true,
        stdio: ["ignore", "ignore", "pipe"],
      });
    } catch {
      this.cleanup();
      throw playbackError(
        "PLAYBACK_PLAYER_UNAVAILABLE",
        "O player local não está disponível.",
        true,
      );
    }
    this.child.once("error", () => {
      if (!this.expectedExit)
        this.emit("event", {
          type: "error",
          code: "PLAYBACK_PLAYER_UNAVAILABLE",
        });
    });
    this.child.once("exit", (code, signal) => {
      const expected = this.expectedExit;
      this.rejectRequests(
        playbackError(
          "PLAYBACK_PLAYER_CRASHED",
          "O player foi encerrado inesperadamente.",
          true,
        ),
      );
      this.socket?.destroy();
      this.socket = null;
      this.child = null;
      this.cleanup();
      this.emit("exit", { expected, code, signal });
      if (!expected)
        this.emit("event", {
          type: "error",
          code: "PLAYBACK_PLAYER_CRASHED",
        });
    });
    try {
      await this.connect();
      for (const [id, property] of [
        [1, "time-pos"],
        [2, "duration"],
        [3, "pause"],
        [4, "track-list"],
        [5, "video-codec"],
        [6, "audio-codec-name"],
        [7, "container-fps"],
        [8, "decoder-frame-drop-count"],
        [9, "hwdec-current"],
        [10, "volume"],
        [11, "mute"],
      ])
        await this.request(["observe_property", id, property]);
      this.subscribeSurfaceGeometry();
      this.emit("event", { type: "ready" });
      return { executable: path.basename(this.executable), arguments: args };
    } catch (error) {
      await this.stop().catch(() => {});
      if (error?.code) throw error;
      throw playbackError(
        "PLAYBACK_TIMEOUT",
        "O player não abriu o canal local a tempo.",
        true,
      );
    }
  }

  connect() {
    return new Promise((resolve, reject) => {
      const startedAt = Date.now();
      const attempt = () => {
        if (!this.child) {
          reject(
            playbackError(
              "PLAYBACK_PLAYER_UNAVAILABLE",
              "O processo do player não iniciou.",
              true,
            ),
          );
          return;
        }
        const socket = net.createConnection(this.socketPath);
        const retry = () => {
          socket.destroy();
          if (Date.now() - startedAt >= this.startupTimeoutMs) {
            reject(
              playbackError(
                "PLAYBACK_TIMEOUT",
                "O player não abriu o canal local a tempo.",
                true,
              ),
            );
            return;
          }
          setTimeout(attempt, 25);
        };
        socket.once("error", retry);
        socket.once("connect", () => {
          socket.off("error", retry);
          socket.on("error", (error) => this.emit("transport-error", error));
          socket.on("data", (chunk) => this.onData(chunk));
          socket.on("close", () => {
            if (!this.expectedExit)
              this.rejectRequests(
                playbackError(
                  "PLAYBACK_PLAYER_CRASHED",
                  "O canal local do player foi encerrado.",
                  true,
                ),
              );
          });
          this.socket = socket;
          resolve();
        });
      };
      attempt();
    });
  }

  onData(chunk) {
    this.buffer += chunk.toString("utf8");
    let newline;
    while ((newline = this.buffer.indexOf("\n")) >= 0) {
      const line = this.buffer.slice(0, newline);
      this.buffer = this.buffer.slice(newline + 1);
      if (!line.trim()) continue;
      let message;
      try {
        message = JSON.parse(line);
      } catch {
        continue;
      }
      if (Number.isInteger(message.request_id)) {
        const pending = this.requests.get(message.request_id);
        if (!pending) continue;
        clearTimeout(pending.timeout);
        this.requests.delete(message.request_id);
        if (message.error && message.error !== "success")
          pending.reject(
            playbackError(
              "PLAYBACK_MEDIA_OPEN_FAILED",
              "O player recusou o comando de mídia.",
              true,
            ),
          );
        else pending.resolve(message.data);
        continue;
      }
      this.onEvent(message);
    }
  }

  onEvent(message) {
    if (message.event === "file-loaded") {
      this.loaded = true;
      this.firstFrame = false;
      this.emit("event", { type: "file-loaded" });
      return;
    }
    if (
      this.loaded &&
      !this.firstFrame &&
      message.event === "playback-restart"
    ) {
      this.firstFrame = true;
      this.emit("event", { type: "first-frame" });
      return;
    }
    if (message.event === "end-file") {
      this.emit("event", { type: "end-file", reason: message.reason });
      return;
    }
    if (message.event !== "property-change") return;
    const name = message.name;
    if (name === "time-pos")
      this.state.positionSeconds = finiteNumber(message.data);
    else if (name === "duration")
      this.state.durationSeconds = Number.isFinite(message.data)
        ? message.data
        : undefined;
    else if (name === "pause") this.state.paused = message.data === true;
    else if (name === "track-list" && Array.isArray(message.data)) {
      const tracks = message.data
        .filter((track) => track?.type === "audio" || track?.type === "sub")
        .map(normalizedTrack);
      this.state.audioTracks = tracks.filter((track) => track.kind === "audio");
      this.state.subtitleTracks = tracks.filter(
        (track) => track.kind === "subtitle",
      );
    } else if (name === "video-codec" && typeof message.data === "string")
      this.state.videoCodec = message.data;
    else if (name === "audio-codec-name" && typeof message.data === "string")
      this.state.audioCodec = message.data;
    else if (name === "container-fps")
      this.state.framesPerSecond = Number.isFinite(message.data)
        ? message.data
        : undefined;
    else if (name === "decoder-frame-drop-count")
      this.state.droppedFrames = Number.isFinite(message.data)
        ? message.data
        : undefined;
    else if (name === "hwdec-current")
      this.state.hardwareDecode = message.data ? "active" : "inactive";
    else if (name === "volume")
      this.state.volumePercent = finiteNumber(message.data, 100);
    else if (name === "mute") this.state.muted = message.data === true;
    this.emit("event", { type: "property", name, state: this.snapshot() });
  }

  snapshot() {
    return structuredClone(this.state);
  }

  request(command) {
    if (!this.socket)
      return Promise.reject(
        playbackError(
          "PLAYBACK_PLAYER_UNAVAILABLE",
          "O canal local do player não está disponível.",
          true,
        ),
      );
    const requestId = ++this.requestId;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.requests.delete(requestId);
        reject(
          playbackError(
            "PLAYBACK_TIMEOUT",
            "O player não respondeu ao comando a tempo.",
            true,
          ),
        );
      }, this.commandTimeoutMs);
      this.requests.set(requestId, { resolve, reject, timeout });
      this.socket.write(
        `${JSON.stringify({ command, request_id: requestId })}\n`,
      );
    });
  }

  enqueue(command) {
    const run = this.commandQueue.then(() => this.request(command));
    this.commandQueue = run.catch(() => {});
    return run;
  }

  load(mediaPath, { startPositionSeconds = 0 } = {}) {
    if (typeof mediaPath !== "string" || !path.isAbsolute(mediaPath))
      return Promise.reject(
        playbackError("PLAYBACK_INVALID", "O caminho da mídia não é válido."),
      );
    this.loaded = false;
    this.firstFrame = false;
    return this.enqueue(
      startPositionSeconds > 0
        ? [
            "loadfile",
            mediaPath,
            "replace",
            -1,
            `start=${startPositionSeconds}`,
          ]
        : ["loadfile", mediaPath, "replace"],
    );
  }

  setPaused(paused) {
    const value = paused === true;
    return this.enqueue(["set_property", "pause", value]).then((result) => {
      this.state.paused = value;
      return result;
    });
  }

  seek(positionSeconds) {
    if (!Number.isFinite(positionSeconds) || positionSeconds < 0)
      return Promise.reject(
        playbackError(
          "PLAYBACK_INVALID",
          "A posição de reprodução é inválida.",
        ),
      );
    return this.enqueue(["seek", positionSeconds, "absolute+exact"]);
  }

  setVolume(volumePercent) {
    if (
      !Number.isFinite(volumePercent) ||
      volumePercent < 0 ||
      volumePercent > 100
    )
      return Promise.reject(
        playbackError("PLAYBACK_INVALID", "O volume deve estar entre 0 e 100."),
      );
    return this.enqueue(["set_property", "volume", volumePercent]).then(
      (result) => {
        this.state.volumePercent = volumePercent;
        return result;
      },
    );
  }

  setMuted(muted) {
    const value = muted === true;
    return this.enqueue(["set_property", "mute", value]).then((result) => {
      this.state.muted = value;
      return result;
    });
  }

  selectAudio(trackId) {
    return this.enqueue(["set_property", "aid", String(trackId)]);
  }

  selectSubtitle(trackId) {
    return this.enqueue([
      "set_property",
      "sid",
      trackId === undefined || trackId === null ? "no" : String(trackId),
    ]);
  }

  addExternalSubtitle(subtitlePath) {
    if (typeof subtitlePath !== "string" || !path.isAbsolute(subtitlePath))
      return Promise.reject(
        playbackError("PLAYBACK_INVALID", "O caminho da legenda não é válido."),
      );
    return this.enqueue(["sub-add", subtitlePath, "select"]);
  }

  rejectRequests(error) {
    for (const pending of this.requests.values()) {
      clearTimeout(pending.timeout);
      pending.reject(error);
    }
    this.requests.clear();
  }

  cleanup() {
    this.rejectRequests(
      playbackError("PLAYBACK_CANCELLED", "A sessão do player foi encerrada."),
    );
    this.socket?.destroy();
    this.socket = null;
    if (this.socketPath && process.platform !== "win32")
      fs.rmSync(this.socketPath, { force: true });
    this.socketPath = null;
    this.deactivateSurface();
  }

  async stop() {
    this.expectedExit = true;
    const child = this.child;
    if (!child) {
      this.cleanup();
      return;
    }
    try {
      if (this.socket) await this.request(["quit"]);
    } catch {
      // The process may have already closed its IPC channel; cleanup still owns it.
    }
    if (this.child) this.child.kill("SIGTERM");
    this.cleanup();
  }
}

module.exports = {
  DEFAULT_COMMAND_TIMEOUT_MS,
  DEFAULT_STARTUP_TIMEOUT_MS,
  MpvAdapter,
  normalizedTrack,
};
