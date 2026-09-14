import { expect, test } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type {
  Configuration,
  ConfigurationSaveOptions,
  ConfigurationSnapshot,
} from "@ushark/types";

const {
  CONFIGURATION_KEY,
  ConfigurationStore,
  DEFAULT_PREFERENCES,
}: {
  CONFIGURATION_KEY: string;
  DEFAULT_PREFERENCES: Record<string, unknown>;
  ConfigurationStore: new (
    databasePath: string,
    dataRoot: string,
  ) => {
    read(): ConfigurationSnapshot;
    save(
      value: Configuration,
      options?: ConfigurationSaveOptions,
    ): ConfigurationSnapshot;
    resetPlayback(): ConfigurationSnapshot;
    close(): void;
  };
} = require("@ushark/core/configuration");

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ushark-config-"));
  const databasePath = path.join(root, "state", "ushark.db");
  const store = new ConfigurationStore(
    databasePath,
    path.join(root, "managed"),
  );
  return { root, databasePath, store };
}

test("salva configuração e biblioteca vazia e reabre com identidade estável", () => {
  const { root, databasePath, store } = fixture();
  try {
    const initial = store.read();
    const configuration = {
      ...initial.configuration,
      name: "Cinema local",
      libraryPath: path.join(root, "library"),
      cachePath: path.join(root, "cache"),
      cacheGB: 250,
      unexpected: "ignored",
      preferences: {
        ...initial.configuration.preferences,
        unexpected: "ignored",
      },
    };
    const saved = store.save(configuration, { completeOnboarding: true });
    expect(saved.completed).toBe(true);
    expect(saved.configuration).not.toHaveProperty("unexpected");
    expect(saved.configuration.preferences).not.toHaveProperty("unexpected");
    store.close();

    const reopened = new ConfigurationStore(
      databasePath,
      path.join(root, "managed"),
    );
    const persisted = reopened.read();
    expect(persisted).toMatchObject({
      schemaVersion: 1,
      completed: true,
      configuration: {
        libraryId: configuration.libraryId,
        name: "Cinema local",
        cacheGB: 250,
      },
    });
    const database = new DatabaseSync(databasePath, { readOnly: true });
    expect(database.prepare("PRAGMA journal_mode").get()).toMatchObject({
      journal_mode: "wal",
    });
    expect(
      database.prepare("SELECT id, name, root_path FROM local_libraries").get(),
    ).toMatchObject({
      id: configuration.libraryId,
      name: "Cinema local",
      root_path: configuration.libraryPath,
    });
    database.close();
    if (process.platform !== "win32")
      expect(fs.statSync(databasePath).mode & 0o777).toBe(0o600);
    reopened.close();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("falha de diretório preserva o snapshot anterior", () => {
  const { root, databasePath, store } = fixture();
  try {
    const base = store.read().configuration;
    const valid = {
      ...base,
      libraryPath: path.join(root, "library"),
      cachePath: path.join(root, "cache"),
    };
    store.save(valid, { completeOnboarding: true });
    const fileInsteadOfDirectory = path.join(root, "not-a-directory");
    fs.writeFileSync(fileInsteadOfDirectory, "fixture");
    expect(() =>
      store.save({ ...valid, cachePath: fileInsteadOfDirectory }),
    ).toThrow(/Escolha outro local/);
    expect(() =>
      store.save({
        ...valid,
        cachePath: path.join(valid.libraryPath, "cache"),
      }),
    ).toThrow(/sem sobreposição/);
    expect(() =>
      store.save({ ...valid, cachePath: path.parse(root).root }),
    ).toThrow(/sem sobreposição/);
    store.close();

    const reopened = new ConfigurationStore(
      databasePath,
      path.join(root, "managed"),
    );
    expect(reopened.read().configuration.cachePath).toBe(valid.cachePath);
    reopened.close();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("schema futuro falha fechado sem sobrescrever o snapshot", () => {
  const { root, databasePath, store } = fixture();
  try {
    const base = store.read().configuration;
    store.save({
      ...base,
      libraryPath: path.join(root, "library"),
      cachePath: path.join(root, "cache"),
    });
    store.close();
    const database = new DatabaseSync(databasePath);
    database.prepare("UPDATE settings SET value_json = ? WHERE key = ?").run(
      JSON.stringify({
        schemaVersion: 2,
        completed: true,
        configuration: base,
      }),
      CONFIGURATION_KEY,
    );
    database.close();
    const future = new ConfigurationStore(
      databasePath,
      path.join(root, "managed"),
    );
    expect(() => future.read()).toThrow(/não é compatível/);
    future.close();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("reset é seletivo e configuração inválida entra em recovery", () => {
  const { root, databasePath, store } = fixture();
  try {
    const base = store.read().configuration;
    const saved = store.save(
      {
        ...base,
        name: "Biblioteca preservada",
        libraryPath: path.join(root, "library"),
        cachePath: path.join(root, "cache"),
        cacheGB: 700,
        preferences: { ...base.preferences, strategy: "quality" },
      },
      { completeOnboarding: true },
    );
    const reset = store.resetPlayback();
    expect(reset).toMatchObject({
      completed: true,
      configuration: {
        libraryId: saved.configuration.libraryId,
        name: "Biblioteca preservada",
        cacheGB: 700,
        preferences: DEFAULT_PREFERENCES,
      },
    });
    store.close();

    const database = new DatabaseSync(databasePath);
    database
      .prepare("UPDATE settings SET value_json = ? WHERE key = ?")
      .run("{invalid", CONFIGURATION_KEY);
    database.close();
    const recovered = new ConfigurationStore(
      databasePath,
      path.join(root, "managed"),
    );
    expect(recovered.read()).toMatchObject({
      completed: false,
      recovery: { code: "CONFIG_INVALID" },
    });
    recovered.close();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
