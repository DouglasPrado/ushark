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
export interface ConfigurationService {
  read(): Promise<Configuration>;
  save(value: Configuration): Promise<void>;
  resetPlayback(): Promise<Configuration>;
}
