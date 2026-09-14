"use strict";

const { randomUUID } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const SCHEMA_VERSION = 1;
const DATABASE_SCHEMA_VERSION = 10;
const CONFIGURATION_KEY = "configuration.v1";
const DEFAULT_PREFERENCES = Object.freeze({
  strategy: "balanced",
  resolution: "2160p",
  audio: "pt-BR",
  subtitle: "pt-BR",
  disconnect: "pause",
  autoSelect: true,
  autoSwitch: false,
  autoplay: false,
  preflight: true,
  nextPreflight: false,
});

class ConfigurationStoreError extends Error {
  constructor(code, publicMessage, cause) {
    super(publicMessage, cause ? { cause } : undefined);
    this.name = "ConfigurationStoreError";
    this.code = code;
    this.publicMessage = publicMessage;
  }
}

function createDefaultConfiguration(dataRoot) {
  return {
    libraryId: `library:local-${randomUUID()}`,
    name: "Minha biblioteca",
    libraryPath: path.join(dataRoot, "library"),
    cachePath: path.join(dataRoot, "cache"),
    cacheGB: 100,
    cleanup: true,
    retainPartial: true,
    preferences: { ...DEFAULT_PREFERENCES },
  };
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function validateChoice(value, choices, field) {
  if (typeof value !== "string" || !choices.has(value))
    throw new ConfigurationStoreError(
      "CONFIG_INVALID",
      `A preferência ${field} não é compatível com esta versão.`,
    );
}

function validateConfiguration(value) {
  if (!isPlainObject(value))
    throw new ConfigurationStoreError(
      "CONFIG_INVALID",
      "A configuração local não é válida.",
    );
  if (
    typeof value.libraryId !== "string" ||
    !/^library:[A-Za-z0-9._:-]{1,120}$/.test(value.libraryId)
  )
    throw new ConfigurationStoreError(
      "CONFIG_INVALID",
      "A identidade da biblioteca não é válida.",
    );
  if (
    typeof value.name !== "string" ||
    !value.name.trim() ||
    value.name.length > 80
  )
    throw new ConfigurationStoreError(
      "CONFIG_INVALID",
      "Dê um nome à biblioteca (até 80 caracteres).",
    );
  for (const [field, candidate] of [
    ["biblioteca", value.libraryPath],
    ["cache", value.cachePath],
  ]) {
    if (
      typeof candidate !== "string" ||
      !candidate.trim() ||
      candidate.length > 4096 ||
      candidate.includes("\0") ||
      !path.isAbsolute(candidate)
    )
      throw new ConfigurationStoreError(
        "CONFIG_INVALID",
        `Escolha uma pasta absoluta e válida para ${field}.`,
      );
  }
  const libraryPath = path.resolve(value.libraryPath);
  const cachePath = path.resolve(value.cachePath);
  const normalize = (candidate) =>
    process.platform === "win32" ? candidate.toLowerCase() : candidate;
  const overlaps = (parent, candidate) => {
    const relative = path.relative(parent, candidate);
    return (
      relative === "" ||
      (!relative.startsWith(`..${path.sep}`) &&
        relative !== ".." &&
        !path.isAbsolute(relative))
    );
  };
  if (
    path.parse(libraryPath).root === libraryPath ||
    path.parse(cachePath).root === cachePath ||
    overlaps(normalize(libraryPath), normalize(cachePath)) ||
    overlaps(normalize(cachePath), normalize(libraryPath))
  )
    throw new ConfigurationStoreError(
      "CONFIG_INVALID",
      "Escolha pastas separadas, sem sobreposição, para biblioteca e cache.",
    );
  if (
    !Number.isInteger(value.cacheGB) ||
    value.cacheGB < 1 ||
    value.cacheGB > 10000
  )
    throw new ConfigurationStoreError(
      "CONFIG_INVALID",
      "Use um limite inteiro entre 1 e 10.000 GB.",
    );
  if (
    typeof value.cleanup !== "boolean" ||
    typeof value.retainPartial !== "boolean"
  )
    throw new ConfigurationStoreError(
      "CONFIG_INVALID",
      "A política de armazenamento não é válida.",
    );
  if (!isPlainObject(value.preferences))
    throw new ConfigurationStoreError(
      "CONFIG_INVALID",
      "As preferências de reprodução não são válidas.",
    );
  validateChoice(
    value.preferences.strategy,
    new Set(["balanced", "quality", "fast", "smallest"]),
    "de seleção",
  );
  validateChoice(
    value.preferences.resolution,
    new Set(["720p", "1080p", "2160p"]),
    "de resolução",
  );
  validateChoice(value.preferences.audio, new Set(["pt-BR", "en"]), "de áudio");
  validateChoice(
    value.preferences.subtitle,
    new Set(["pt-BR", "en", "off"]),
    "de legenda",
  );
  validateChoice(
    value.preferences.disconnect,
    new Set(["pause", "continue"]),
    "de desconexão",
  );
  for (const field of [
    "autoSelect",
    "autoSwitch",
    "autoplay",
    "preflight",
    "nextPreflight",
  ])
    if (typeof value.preferences[field] !== "boolean")
      throw new ConfigurationStoreError(
        "CONFIG_INVALID",
        "As preferências de automação não são válidas.",
      );
  return {
    libraryId: value.libraryId,
    name: value.name.trim(),
    libraryPath,
    cachePath,
    cacheGB: value.cacheGB,
    cleanup: value.cleanup,
    retainPartial: value.retainPartial,
    preferences: {
      strategy: value.preferences.strategy,
      resolution: value.preferences.resolution,
      audio: value.preferences.audio,
      subtitle: value.preferences.subtitle,
      disconnect: value.preferences.disconnect,
      autoSelect: value.preferences.autoSelect,
      autoSwitch: value.preferences.autoSwitch,
      autoplay: value.preferences.autoplay,
      preflight: value.preferences.preflight,
      nextPreflight: value.preferences.nextPreflight,
    },
  };
}

function ensureWritableDirectory(directory) {
  try {
    fs.mkdirSync(directory, { recursive: true });
    const stat = fs.statSync(directory);
    if (!stat.isDirectory()) throw new Error("not a directory");
    fs.accessSync(directory, fs.constants.R_OK | fs.constants.W_OK);
    const probe = path.join(directory, `.ushark-write-${randomUUID()}`);
    const handle = fs.openSync(probe, "wx", 0o600);
    fs.closeSync(handle);
    fs.unlinkSync(probe);
  } catch (error) {
    throw new ConfigurationStoreError(
      "CONFIG_NOT_WRITABLE",
      "Não foi possível acessar a pasta. Escolha outro local.",
      error,
    );
  }
}

class ConfigurationStore {
  constructor(databasePath, dataRoot) {
    if (!path.isAbsolute(databasePath) || !path.isAbsolute(dataRoot))
      throw new ConfigurationStoreError(
        "CONFIG_INVALID",
        "Os diretórios internos da configuração não são válidos.",
      );
    this.databasePath = databasePath;
    this.defaultConfiguration = createDefaultConfiguration(dataRoot);
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath);
    if (process.platform !== "win32") fs.chmodSync(databasePath, 0o600);
    this.database.exec("PRAGMA journal_mode = WAL");
    this.database.exec("PRAGMA busy_timeout = 5000");
    this.database.exec("PRAGMA foreign_keys = ON");
    this.migrate();
    this.secureDatabaseFiles();
  }

  secureDatabaseFiles() {
    if (process.platform === "win32") return;
    for (const file of [
      this.databasePath,
      `${this.databasePath}-wal`,
      `${this.databasePath}-shm`,
    ])
      if (fs.existsSync(file)) fs.chmodSync(file, 0o600);
  }

  migrate() {
    this.database.exec(`
      BEGIN IMMEDIATE;
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS local_libraries (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        root_path TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      INSERT OR IGNORE INTO schema_migrations(version, name, applied_at)
      VALUES (1, 'm01_configuration', unixepoch());
      COMMIT;
    `);
    const current = this.database
      .prepare("SELECT MAX(version) AS version FROM schema_migrations")
      .get();
    if (Number(current?.version ?? 0) > DATABASE_SCHEMA_VERSION) {
      this.database.close();
      throw new ConfigurationStoreError(
        "CONFIG_PROTOCOL_UNSUPPORTED",
        "O banco local pertence a uma versão mais nova do Ushark.",
      );
    }
  }

  read() {
    const row = this.database
      .prepare("SELECT value_json FROM settings WHERE key = ?")
      .get(CONFIGURATION_KEY);
    if (!row)
      return {
        schemaVersion: SCHEMA_VERSION,
        completed: false,
        configuration: structuredClone(this.defaultConfiguration),
      };
    try {
      const snapshot = JSON.parse(row.value_json);
      if (
        !isPlainObject(snapshot) ||
        typeof snapshot.schemaVersion !== "number"
      )
        throw new ConfigurationStoreError(
          "CONFIG_INVALID",
          "A configuração local não informa uma versão válida.",
        );
      if (snapshot.schemaVersion !== SCHEMA_VERSION)
        throw new ConfigurationStoreError(
          "CONFIG_PROTOCOL_UNSUPPORTED",
          "A versão da configuração local não é compatível.",
        );
      if (typeof snapshot.completed !== "boolean")
        throw new ConfigurationStoreError(
          "CONFIG_INVALID",
          "O estado de conclusão do onboarding não é válido.",
        );
      return {
        schemaVersion: SCHEMA_VERSION,
        completed: snapshot.completed,
        configuration: validateConfiguration(snapshot.configuration),
      };
    } catch (error) {
      if (error?.code === "CONFIG_PROTOCOL_UNSUPPORTED") throw error;
      return {
        schemaVersion: SCHEMA_VERSION,
        completed: false,
        configuration: structuredClone(this.defaultConfiguration),
        recovery: {
          code: "CONFIG_INVALID",
          message:
            "A configuração anterior estava inválida. Revise os dados e salve novamente.",
        },
      };
    }
  }

  save(value, options = {}) {
    const configuration = validateConfiguration(value);
    const current = this.read();
    if (
      current.completed &&
      current.configuration.libraryId !== configuration.libraryId
    )
      throw new ConfigurationStoreError(
        "CONFIG_INVALID",
        "A identidade da biblioteca local não pode ser substituída.",
      );
    ensureWritableDirectory(configuration.libraryPath);
    ensureWritableDirectory(configuration.cachePath);
    const completed = current.completed || options.completeOnboarding === true;
    const snapshot = {
      schemaVersion: SCHEMA_VERSION,
      completed,
      configuration,
    };
    const now = Math.floor(Date.now() / 1000);
    try {
      this.database.exec("BEGIN IMMEDIATE");
      this.database
        .prepare(
          `INSERT INTO local_libraries(id, name, root_path, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             name = excluded.name,
             root_path = excluded.root_path,
             updated_at = excluded.updated_at`,
        )
        .run(
          configuration.libraryId,
          configuration.name,
          configuration.libraryPath,
          now,
          now,
        );
      this.database
        .prepare(
          `INSERT INTO settings(key, value_json, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET
             value_json = excluded.value_json,
             updated_at = excluded.updated_at`,
        )
        .run(CONFIGURATION_KEY, JSON.stringify(snapshot), now);
      this.database.exec("COMMIT");
      this.secureDatabaseFiles();
      return structuredClone(snapshot);
    } catch (error) {
      try {
        this.database.exec("ROLLBACK");
      } catch (rollbackError) {
        void rollbackError;
      }
      throw new ConfigurationStoreError(
        "CONFIG_STORAGE_FAILED",
        "Não foi possível salvar. A configuração anterior foi preservada.",
        error,
      );
    }
  }

  resetPlayback() {
    const snapshot = this.read();
    return this.save(
      {
        ...snapshot.configuration,
        preferences: { ...DEFAULT_PREFERENCES },
      },
      { completeOnboarding: snapshot.completed },
    );
  }

  close() {
    this.database.close();
  }
}

module.exports = {
  CONFIGURATION_KEY,
  DEFAULT_PREFERENCES,
  SCHEMA_VERSION,
  ConfigurationStore,
  ConfigurationStoreError,
  createDefaultConfiguration,
  validateConfiguration,
};
