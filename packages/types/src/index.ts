export type Scenario =
  "normal" | "loading" | "offline" | "error" | "folder-error" | "degraded";
export interface Preferences {
  strategy: string;
  resolution: string;
  audio: string;
  subtitle: string;
  disconnect: string;
  autoSelect: boolean;
  autoSwitch: boolean;
  autoplay: boolean;
  preflight: boolean;
  nextPreflight: boolean;
}
export interface Configuration {
  libraryId: string;
  name: string;
  libraryPath: string;
  cachePath: string;
  cacheGB: number;
  cleanup: boolean;
  retainPartial: boolean;
  preferences: Preferences;
}

export const CONFIGURATION_SCHEMA_VERSION = 1 as const;
export const CONFIGURATION_PROTOCOL_VERSION = 1 as const;

export type ConfigurationDirectoryKind = "library" | "cache";

export type ConfigurationErrorCode =
  | "CONFIG_INVALID"
  | "CONFIG_NOT_WRITABLE"
  | "CONFIG_PROTOCOL_UNSUPPORTED"
  | "CONFIG_STORAGE_FAILED"
  | "CONFIG_UNAUTHORIZED";

export interface ConfigurationRecovery {
  code: "CONFIG_INVALID";
  message: string;
}

export interface ConfigurationSnapshot {
  schemaVersion: typeof CONFIGURATION_SCHEMA_VERSION;
  completed: boolean;
  configuration: Configuration;
  recovery?: ConfigurationRecovery;
}

export interface ConfigurationSaveOptions {
  completeOnboarding?: boolean;
}

export interface ConfigurationFailure {
  code: ConfigurationErrorCode;
  message: string;
}

export type ConfigurationResult<T> =
  { ok: true; value: T } | { ok: false; error: ConfigurationFailure };

export interface ConfigurationDesktopApi {
  protocolVersion: typeof CONFIGURATION_PROTOCOL_VERSION;
  read(): Promise<ConfigurationResult<ConfigurationSnapshot>>;
  save(
    value: Configuration,
    options?: ConfigurationSaveOptions,
  ): Promise<ConfigurationResult<ConfigurationSnapshot>>;
  resetPlayback(): Promise<ConfigurationResult<ConfigurationSnapshot>>;
  chooseDirectory(
    kind: ConfigurationDirectoryKind,
  ): Promise<ConfigurationResult<string | null>>;
}

export interface ConfigurationService {
  read(): Promise<ConfigurationSnapshot>;
  save(
    value: Configuration,
    options?: ConfigurationSaveOptions,
  ): Promise<ConfigurationSnapshot>;
  resetPlayback(): Promise<ConfigurationSnapshot>;
  chooseDirectory(kind: ConfigurationDirectoryKind): Promise<string | null>;
}
