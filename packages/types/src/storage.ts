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
  runtime?: "mock" | "desktop";
  policy: StoragePolicy;
  refresh?(): Promise<void>;
  list(): StorageEntry[];
  eligible(entry: StorageEntry): boolean;
  estimate(): StorageEntry[];
  clean(ids: string[], signal: AbortSignal): Promise<number>;
  retain(id: string, keep: boolean, signal: AbortSignal): Promise<void>;
  repair(id: string, signal: AbortSignal): Promise<void>;
  apply(policy: StoragePolicy): void | Promise<void>;
  configure(scenario: StorageScenario): void;
  activate(id: string): void;
}

export const STORAGE_PROTOCOL_VERSION = 1 as const;
export const STORAGE_SCHEMA_VERSION = 1 as const;
export const STORAGE_LIMITS = {
  requestBytes: 64 * 1_024,
  entriesMaximum: 2_048,
  cleanupMaximum: 256,
} as const;
export type StorageErrorCode =
  | "STORAGE_BUSY"
  | "STORAGE_CONFLICT"
  | "STORAGE_DISK_FULL"
  | "STORAGE_INVALID"
  | "STORAGE_NOT_FOUND"
  | "STORAGE_PERMISSION_DENIED"
  | "STORAGE_PROTOCOL_UNSUPPORTED"
  | "STORAGE_UNAUTHORIZED"
  | "STORAGE_WRITE_FAILED";
export interface StorageFailure {
  code: StorageErrorCode;
  message: string;
  recoverable: boolean;
  retryable: boolean;
}
export type StorageResult<T> =
  { ok: true; value: T } | { ok: false; error: StorageFailure };
export interface StorageSnapshot {
  schemaVersion: typeof STORAGE_SCHEMA_VERSION;
  entries: StorageEntry[];
  policy: StoragePolicy;
  physical: {
    capacityBytes: number;
    availableBytes: number;
    usedManagedBytes: number;
    eligibleBytes: number;
  };
  revision: number;
  updatedAt: string;
}
export interface StorageDesktopApi {
  protocolVersion: typeof STORAGE_PROTOCOL_VERSION;
  read(): Promise<StorageResult<StorageSnapshot>>;
  clean(input: {
    ids: string[];
    expectedRevision: number;
    mutation: { idempotencyKey: string };
  }): Promise<
    StorageResult<{
      snapshot: StorageSnapshot;
      estimatedBytes: number;
      freedBytes: number;
    }>
  >;
  retain(input: {
    id: string;
    keep: boolean;
    expectedRevision: number;
    mutation: { idempotencyKey: string };
  }): Promise<StorageResult<StorageSnapshot>>;
  repair(input: {
    id: string;
    expectedRevision: number;
    mutation: { idempotencyKey: string };
  }): Promise<StorageResult<StorageSnapshot>>;
  applyPolicy(input: {
    policy: StoragePolicy;
    expectedRevision: number;
    mutation: { idempotencyKey: string };
  }): Promise<StorageResult<StorageSnapshot>>;
}
