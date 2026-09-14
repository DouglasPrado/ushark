export interface StorageEntry {
  id: string;
  name: string;
  gb: number;
  keep: boolean;
  active: boolean;
  favorite: boolean;
  partial: boolean;
  corrupt: boolean;
  lastUsed: number;
  volume: string;
  external?: boolean;
}
export interface StoragePolicy {
  limitGB: number;
  folder: string;
  autoCleanup: boolean;
  retainPartial: boolean;
  retainFavorites: boolean;
}
export type StorageScenario =
  | "normal"
  | "empty"
  | "protected"
  | "full"
  | "corrupt"
  | "permission"
  | "offline";
export interface StoragePreview {
  policy: StoragePolicy;
  list(): StorageEntry[];
  eligible(entry: StorageEntry): boolean;
  estimate(): StorageEntry[];
  clean(ids: string[], signal: AbortSignal): Promise<number>;
  retain(id: string, keep: boolean, signal: AbortSignal): Promise<void>;
  repair(id: string, signal: AbortSignal): Promise<void>;
  apply(policy: StoragePolicy): void;
  configure(scenario: StorageScenario): void;
  activate(id: string): void;
}
