import { expect, test } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

type StagedSubtitle = {
  subtitleId: string;
  sessionId: string;
  displayName: string;
  extension: string;
  managedPath: string;
};

const {
  EXTERNAL_SUBTITLE_MAXIMUM_BYTES,
  ExternalSubtitleStore,
  PlaybackTrackController,
}: {
  EXTERNAL_SUBTITLE_MAXIMUM_BYTES: number;
  ExternalSubtitleStore: new (rootPath: string) => {
    stage(input: { sessionId: string; candidatePath: string }): StagedSubtitle;
    cleanupSession(sessionId: string): void;
  };
  PlaybackTrackController: new (options: {
    adapter: object;
    subtitleStore: object;
  }) => {
    selectAudio(trackId: string): Promise<Record<string, unknown>>;
    selectSubtitle(trackId?: string): Promise<Record<string, unknown>>;
    addExternalSubtitle(input: {
      sessionId: string;
      candidatePath: string;
    }): Promise<{ subtitleId: string; displayName: string; extension: string }>;
    cleanup(sessionId: string): void;
  };
} = require("@ushark/core/playback-tracks");

test("M05 S04.3 copia legenda permitida para temp privado e limpa a sessão", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-subtitle-"));
  const source = path.join(root, "Legenda PT-BR.srt");
  fs.writeFileSync(source, "1\n00:00:00,000 --> 00:00:01,000\nOlá\n");
  const store = new ExternalSubtitleStore(path.join(root, "managed"));
  try {
    const staged = store.stage({
      sessionId: "playback:session:subtitle",
      candidatePath: source,
    });
    expect(staged).toMatchObject({
      subtitleId: expect.stringMatching(/^subtitle:local:/),
      displayName: "Legenda PT-BR.srt",
      extension: ".srt",
    });
    expect(staged.managedPath).not.toBe(source);
    expect(fs.readFileSync(staged.managedPath, "utf8")).toContain("Olá");
    if (process.platform !== "win32")
      expect(fs.statSync(staged.managedPath).mode & 0o777).toBe(0o600);
    store.cleanupSession("playback:session:subtitle");
    expect(fs.existsSync(staged.managedPath)).toBe(false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("M05 S04.3 rejeita URL, extensão, symlink e legenda acima de 20 MiB", () => {
  const root = fs.mkdtempSync(
    path.join(os.tmpdir(), "ushark-subtitle-invalid-"),
  );
  const store = new ExternalSubtitleStore(path.join(root, "managed"));
  const invalid = path.join(root, "script.js");
  fs.writeFileSync(invalid, "alert(1)");
  const valid = path.join(root, "valid.vtt");
  fs.writeFileSync(valid, "WEBVTT\n");
  const link = path.join(root, "linked.vtt");
  fs.symlinkSync(valid, link);
  const large = path.join(root, "large.ass");
  fs.closeSync(fs.openSync(large, "w"));
  fs.truncateSync(large, EXTERNAL_SUBTITLE_MAXIMUM_BYTES + 1);
  try {
    for (const candidatePath of [
      "https://example.invalid/subtitle.srt",
      invalid,
      link,
      large,
    ])
      expect(() =>
        store.stage({
          sessionId: "playback:session:invalid",
          candidatePath,
        }),
      ).toThrow(
        expect.objectContaining({
          code: "PLAYBACK_EXTERNAL_SUBTITLE_INVALID",
        }),
      );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("M05 S04.3 troca áudio/legenda no mesmo adapter e não expõe path externo", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-track-control-"));
  const source = path.join(root, "subtitle.ssa");
  fs.writeFileSync(source, "[Script Info]\nTitle: Teste\n");
  const calls: Array<{ operation: string; value?: string }> = [];
  const snapshot = {
    audioTracks: [{ id: "1", kind: "audio" }],
    subtitleTracks: [{ id: "2", kind: "subtitle" }],
  };
  const adapter = {
    snapshot: () => structuredClone(snapshot),
    selectAudio: async (value: string) =>
      calls.push({ operation: "audio", value }),
    selectSubtitle: async (value?: string) =>
      calls.push({ operation: "subtitle", value }),
    addExternalSubtitle: async (value: string) =>
      calls.push({ operation: "external", value }),
  };
  const subtitleStore = new ExternalSubtitleStore(path.join(root, "managed"));
  const controller = new PlaybackTrackController({ adapter, subtitleStore });
  try {
    await controller.selectAudio("1");
    await controller.selectSubtitle("2");
    await controller.selectSubtitle();
    const added = await controller.addExternalSubtitle({
      sessionId: "playback:session:tracks",
      candidatePath: source,
    });
    expect(added).toMatchObject({
      displayName: "subtitle.ssa",
      extension: ".ssa",
    });
    expect(added).not.toHaveProperty("managedPath");
    expect(calls.slice(0, 3)).toEqual([
      { operation: "audio", value: "1" },
      { operation: "subtitle", value: "2" },
      { operation: "subtitle", value: undefined },
    ]);
    expect(calls[3]).toMatchObject({ operation: "external" });
    expect(calls[3].value).not.toBe(source);
    await expect(controller.selectAudio("99")).rejects.toMatchObject({
      code: "PLAYBACK_NOT_FOUND",
    });
    controller.cleanup("playback:session:tracks");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
