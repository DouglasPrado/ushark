"use strict";

const { Buffer } = require("node:buffer");
const { randomUUID } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const EXTERNAL_SUBTITLE_MAXIMUM_BYTES = 20 * 1_024 * 1_024;
const EXTERNAL_SUBTITLE_EXTENSIONS = new Set([".srt", ".ass", ".ssa", ".vtt"]);

class PlaybackTrackError extends Error {
  constructor(code, publicMessage, retryable = false, cause) {
    super(publicMessage, cause ? { cause } : undefined);
    this.name = "PlaybackTrackError";
    this.code = code;
    this.publicMessage = publicMessage;
    this.retryable = retryable;
  }
}

function validateId(value, label) {
  if (
    typeof value !== "string" ||
    value.length < 3 ||
    value.length > 256 ||
    value.includes("\0") ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]+$/.test(value)
  )
    throw new PlaybackTrackError(
      "PLAYBACK_INVALID",
      `A identidade de ${label} não é válida.`,
    );
  return value;
}

function validateTrackId(value) {
  const normalized = String(value);
  if (
    !normalized ||
    normalized.length > 64 ||
    normalized.includes("\0") ||
    !/^[A-Za-z0-9._:-]+$/.test(normalized)
  )
    throw new PlaybackTrackError(
      "PLAYBACK_INVALID",
      "A identidade da faixa não é válida.",
    );
  return normalized;
}

class ExternalSubtitleStore {
  constructor(rootPath) {
    if (typeof rootPath !== "string" || !path.isAbsolute(rootPath))
      throw new PlaybackTrackError(
        "PLAYBACK_INVALID",
        "O diretório temporário de legendas não é válido.",
      );
    this.rootPath = path.resolve(rootPath);
    this.entries = new Map();
    fs.mkdirSync(this.rootPath, { recursive: true, mode: 0o700 });
    if (process.platform !== "win32") fs.chmodSync(this.rootPath, 0o700);
  }

  sessionRoot(sessionId) {
    validateId(sessionId, "sessão");
    const root = path.join(this.rootPath, sessionId.replaceAll(":", "_"));
    fs.mkdirSync(root, { recursive: true, mode: 0o700 });
    if (process.platform !== "win32") fs.chmodSync(root, 0o700);
    return root;
  }

  stage(input) {
    const sessionId = validateId(input?.sessionId, "sessão");
    const candidatePath = input?.candidatePath;
    if (
      typeof candidatePath !== "string" ||
      !path.isAbsolute(candidatePath) ||
      candidatePath.includes("\0")
    )
      throw new PlaybackTrackError(
        "PLAYBACK_EXTERNAL_SUBTITLE_INVALID",
        "Selecione um arquivo de legenda local válido.",
      );
    const extension = path.extname(candidatePath).toLowerCase();
    if (!EXTERNAL_SUBTITLE_EXTENSIONS.has(extension))
      throw new PlaybackTrackError(
        "PLAYBACK_EXTERNAL_SUBTITLE_INVALID",
        "A legenda deve usar SRT, ASS, SSA ou VTT.",
      );
    let handle;
    try {
      const before = fs.lstatSync(candidatePath);
      if (!before.isFile() || before.isSymbolicLink())
        throw new PlaybackTrackError(
          "PLAYBACK_EXTERNAL_SUBTITLE_INVALID",
          "A legenda selecionada não é um arquivo regular.",
        );
      if (before.size > EXTERNAL_SUBTITLE_MAXIMUM_BYTES)
        throw new PlaybackTrackError(
          "PLAYBACK_EXTERNAL_SUBTITLE_INVALID",
          "A legenda excede o limite local de 20 MiB.",
        );
      const flags = fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0);
      handle = fs.openSync(candidatePath, flags);
      const opened = fs.fstatSync(handle);
      if (
        !opened.isFile() ||
        opened.dev !== before.dev ||
        opened.ino !== before.ino ||
        opened.size !== before.size
      )
        throw new PlaybackTrackError(
          "PLAYBACK_EXTERNAL_SUBTITLE_INVALID",
          "A legenda mudou durante a seleção.",
          true,
        );
      const subtitleId = `subtitle:local:${randomUUID()}`;
      const managedPath = path.join(
        this.sessionRoot(sessionId),
        `${randomUUID()}${extension}`,
      );
      const output = fs.openSync(
        managedPath,
        fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_WRONLY,
        0o600,
      );
      try {
        const buffer = Buffer.allocUnsafe(64 * 1_024);
        let total = 0;
        let read;
        while (
          (read = fs.readSync(handle, buffer, 0, buffer.length, null)) > 0
        ) {
          total += read;
          if (total > EXTERNAL_SUBTITLE_MAXIMUM_BYTES)
            throw new PlaybackTrackError(
              "PLAYBACK_EXTERNAL_SUBTITLE_INVALID",
              "A legenda excede o limite local de 20 MiB.",
            );
          fs.writeSync(output, buffer, 0, read);
        }
      } catch (error) {
        fs.closeSync(output);
        fs.rmSync(managedPath, { force: true });
        throw error;
      }
      fs.closeSync(output);
      const entry = {
        subtitleId,
        sessionId,
        displayName: path.basename(candidatePath),
        extension,
        managedPath,
      };
      this.entries.set(subtitleId, entry);
      return { ...entry };
    } catch (error) {
      if (error instanceof PlaybackTrackError) throw error;
      throw new PlaybackTrackError(
        "PLAYBACK_EXTERNAL_SUBTITLE_INVALID",
        "Não foi possível validar a legenda local.",
        true,
        error,
      );
    } finally {
      if (handle !== undefined) fs.closeSync(handle);
    }
  }

  cleanupSession(sessionId) {
    validateId(sessionId, "sessão");
    const root = path.join(this.rootPath, sessionId.replaceAll(":", "_"));
    for (const [id, entry] of this.entries)
      if (entry.sessionId === sessionId) this.entries.delete(id);
    fs.rmSync(root, { recursive: true, force: true });
  }
}

class PlaybackTrackController {
  constructor({ adapter, subtitleStore }) {
    this.adapter = adapter;
    this.subtitleStore = subtitleStore;
  }

  track(kind, trackId) {
    const normalized = validateTrackId(trackId);
    const tracks =
      kind === "audio"
        ? this.adapter.snapshot().audioTracks
        : this.adapter.snapshot().subtitleTracks;
    if (!tracks.some((track) => track.id === normalized))
      throw new PlaybackTrackError(
        "PLAYBACK_NOT_FOUND",
        "A faixa selecionada não está disponível.",
      );
  }

  async selectAudio(trackId) {
    this.track("audio", trackId);
    await this.adapter.selectAudio(String(trackId));
    return this.adapter.snapshot();
  }

  async selectSubtitle(trackId) {
    if (trackId !== undefined) this.track("subtitle", trackId);
    await this.adapter.selectSubtitle(
      trackId === undefined ? undefined : String(trackId),
    );
    return this.adapter.snapshot();
  }

  async addExternalSubtitle(input) {
    const entry = this.subtitleStore.stage(input);
    try {
      await this.adapter.addExternalSubtitle(entry.managedPath);
      return {
        subtitleId: entry.subtitleId,
        displayName: entry.displayName,
        extension: entry.extension,
      };
    } catch (error) {
      this.subtitleStore.cleanupSession(input.sessionId);
      throw error;
    }
  }

  cleanup(sessionId) {
    this.subtitleStore.cleanupSession(sessionId);
  }
}

module.exports = {
  EXTERNAL_SUBTITLE_EXTENSIONS,
  EXTERNAL_SUBTITLE_MAXIMUM_BYTES,
  ExternalSubtitleStore,
  PlaybackTrackController,
  PlaybackTrackError,
};
