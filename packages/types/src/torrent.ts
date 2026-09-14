export type InspectionScenario =
  | "normal"
  | "no-peers"
  | "timeout"
  | "daemon"
  | "offline"
  | "ambiguous"
  | "hostile"
  | "bencode";
export interface InspectedFile {
  id: string;
  name: string;
  size: string;
  kind: "video" | "sample" | "extra";
}
export interface Inspection {
  hash: string;
  name: string;
  files: InspectedFile[];
  input: string;
  /** Present only on the real asynchronous Core/torrentd path. */
  operationId?: string;
}
export interface TorrentPreview {
  inspect(
    input: string,
    scenario: InspectionScenario,
    signal: AbortSignal,
  ): Promise<Inspection>;
  pending(): string[];
  remember(input: string): void | Promise<void>;
  forget(input: string): void | Promise<void>;
  confirm(inspection: Inspection): void | Promise<void>;
  count(): number;
  /** Optional capabilities used by the real Electron adapter. */
  validateInput?(input: string): string;
  chooseTorrentFile?(): Promise<{ input: string; label: string } | null>;
  hydratePending?(): Promise<void>;
  describeInput?(input: string): string;
  confirmForContent?(
    contentId: string,
    inspection: Inspection,
    fileId: string,
  ): Promise<{ sourceId: string }>;
}

/** Wire and persisted-snapshot versions for the real M06 boundary. */
export const TORRENT_INSPECTION_PROTOCOL_VERSION = 1 as const;
export const TORRENT_INSPECTION_SCHEMA_VERSION = 1 as const;

/**
 * Security budgets are expressed in bytes/counts so adapters can enforce the
 * same policy before allocating or forwarding untrusted data.
 */
export const TORRENT_INSPECTION_LIMITS = {
  magnetUtf8Bytes: 4_096,
  torrentFileBytes: 10 * 1_024 * 1_024,
  bencodeDepth: 64,
  bencodeNodes: 200_000,
  files: 10_000,
  pathComponents: 64,
  pathComponentUtf8Bytes: 255,
  normalizedPathUtf8Bytes: 4_096,
  totalDeclaredBytes: 16 * 1_024 * 1_024 * 1_024 * 1_024,
  pieces: 4_000_000,
  rpcMessageBytes: 1 * 1_024 * 1_024,
  eventBatch: 128,
  displayNameUtf8Bytes: 512,
} as const;

export type TorrentInputKind = "magnet" | "torrent-file";

/** Magnets are untrusted and must be redacted from logs after parsing. */
export interface MagnetInspectionInput {
  type: "magnet";
  magnet: string;
}

/**
 * Opaque handle returned by Core's native picker. Renderer code never receives
 * or submits a local filesystem path.
 */
export interface TorrentFileInspectionInput {
  type: "torrent-file";
  selectionId: string;
}

export type TorrentInspectionInput =
  MagnetInspectionInput | TorrentFileInspectionInput;

export interface TorrentFileSelection {
  selectionId: string;
  fileName: string;
  sizeBytes: number;
}

export type TorrentInspectionState =
  | "created"
  | "resolving-metadata"
  | "files-ready"
  | "pending"
  | "completed"
  | "failed"
  | "cancelled";

export type TorrentFileKind = "video" | "sample" | "extra" | "other";

export interface TorrentFileInfo {
  id: string;
  index: number;
  /** Validated relative torrent path; never a host filesystem path. */
  path: string;
  name: string;
  extension: string;
  sizeBytes: number;
  offsetBytes: number;
  firstPiece?: number;
  lastPiece?: number;
  kind: TorrentFileKind;
  selectable: boolean;
}

export type ContentSourceSelector =
  | { type: "largest-video" }
  | { type: "filename"; fileId: string }
  | { type: "episode"; season: number; episode: number; fileId?: string }
  | { type: "manual"; fileId: string };

export interface TorrentRuntimeIdentity {
  /** Stable lowercase v1 SHA-1 info hash for deduplication in this milestone. */
  infoHash: string;
  /** Runtime identity is distinct from source and content identities. */
  torrentId: string;
}

export interface TorrentSourceIdentity extends TorrentRuntimeIdentity {
  sourceId: string;
  inputType: TorrentInputKind;
}

/**
 * The relation owns the selector. Two contents may share one source/runtime
 * while selecting different files from the same torrent.
 */
export interface TorrentContentSource {
  contentSourceId: string;
  contentId: string;
  sourceId: string;
  selector: ContentSourceSelector;
}

export interface TorrentInspectionProgress {
  phase: "validating" | "staging" | "metadata" | "classifying" | "persisting";
  usefulPeers?: number;
  discoveredPeers?: number;
  fileCount?: number;
  message?: string;
}

export interface TorrentInspectionSnapshot {
  schemaVersion: typeof TORRENT_INSPECTION_SCHEMA_VERSION;
  operationId: string;
  correlationId: string;
  sequence: number;
  state: TorrentInspectionState;
  inputType: TorrentInputKind;
  /** Safe label only. Full magnets and host paths are forbidden here. */
  inputLabel: string;
  runtime?: TorrentRuntimeIdentity;
  displayName?: string;
  totalFileCount: number;
  /** First bounded page only; use getFiles for additional entries. */
  files: TorrentFileInfo[];
  filesComplete: boolean;
  progress?: TorrentInspectionProgress;
  pendingId?: string;
  failure?: TorrentInspectionFailure;
  updatedAt: string;
}

export type TorrentInspectionErrorCode =
  | "TORRENT_CANCELLED"
  | "TORRENT_DAEMON_UNAVAILABLE"
  | "TORRENT_DISK_LIMIT"
  | "TORRENT_INPUT_EXPIRED"
  | "TORRENT_INPUT_INVALID"
  | "TORRENT_INPUT_TOO_LARGE"
  | "TORRENT_METADATA_TIMEOUT"
  | "TORRENT_NO_USEFUL_PEERS"
  | "TORRENT_NOT_FOUND"
  | "TORRENT_PATH_REJECTED"
  | "TORRENT_PROTOCOL_UNSUPPORTED"
  | "TORRENT_RPC_LIMIT"
  | "TORRENT_STORAGE_FAILED"
  | "TORRENT_UNAUTHORIZED";

export interface TorrentInspectionFailure {
  code: TorrentInspectionErrorCode;
  message: string;
  recoverable: boolean;
  retryable: boolean;
}

export type TorrentInspectionResult<T> =
  { ok: true; value: T } | { ok: false; error: TorrentInspectionFailure };

export interface TorrentInspectionMutation {
  idempotencyKey: string;
}

export interface StartTorrentInspectionInput {
  input: TorrentInspectionInput;
  correlationId: string;
  mutation: TorrentInspectionMutation;
}

export interface TorrentOperationInput {
  operationId: string;
}

export interface TorrentFilePageInput extends TorrentOperationInput {
  cursor?: number;
  /** Must be between 1 and TORRENT_INSPECTION_LIMITS.eventBatch. */
  limit?: number;
}

export interface TorrentFilePage {
  operationId: string;
  files: TorrentFileInfo[];
  nextCursor?: number;
  total: number;
}

export interface SavePendingTorrentInput extends TorrentOperationInput {
  mutation: TorrentInspectionMutation;
}

export interface RetryPendingTorrentInput {
  pendingId: string;
  correlationId: string;
  mutation: TorrentInspectionMutation;
}

export interface RemovePendingTorrentInput {
  pendingId: string;
  mutation: TorrentInspectionMutation;
}

export interface ConfirmTorrentSourceInput extends TorrentOperationInput {
  contentId: string;
  selector: ContentSourceSelector;
  mutation: TorrentInspectionMutation;
}

export type TorrentCancellationStatus =
  "cancelled" | "already-completed" | "not-cancellable" | "not-found";

export interface TorrentCancellationResult {
  operationId: string;
  status: TorrentCancellationStatus;
}

export interface TorrentPendingSnapshot {
  schemaVersion: typeof TORRENT_INSPECTION_SCHEMA_VERSION;
  pendingId: string;
  inputType: TorrentInputKind;
  inputLabel: string;
  operation: TorrentInspectionSnapshot;
}

export type TorrentInspectionEventType =
  | "inspection.started"
  | "inspection.metadata-waiting"
  | "inspection.progress"
  | "inspection.files-ready"
  | "inspection.pending"
  | "inspection.completed"
  | "inspection.cancelled"
  | "inspection.failed"
  | "runtime.unavailable";

export interface TorrentInspectionEvent {
  protocolVersion: typeof TORRENT_INSPECTION_PROTOCOL_VERSION;
  eventId: string;
  operationId: string;
  correlationId: string;
  sequence: number;
  type: TorrentInspectionEventType;
  /** Critical transitions carry the latest complete snapshot. */
  snapshot: TorrentInspectionSnapshot;
  timestamp: string;
}

export interface TorrentInspectionCapabilities {
  protocolVersion: typeof TORRENT_INSPECTION_PROTOCOL_VERSION;
  capabilities: readonly (
    | "magnet-metadata"
    | "torrent-file-metadata"
    | "pending-retry"
    | "operation-cancel"
    | "runtime-rebind"
  )[];
}

/** Core-facing application boundary. All inputs are validated at each hop. */
export interface TorrentInspectionService {
  capabilities(): Promise<
    TorrentInspectionResult<TorrentInspectionCapabilities>
  >;
  start(
    input: StartTorrentInspectionInput,
  ): Promise<TorrentInspectionResult<TorrentInspectionSnapshot>>;
  cancel(
    input: TorrentOperationInput,
  ): Promise<TorrentInspectionResult<TorrentCancellationResult>>;
  get(
    input: TorrentOperationInput,
  ): Promise<TorrentInspectionResult<TorrentInspectionSnapshot>>;
  getFiles(
    input: TorrentFilePageInput,
  ): Promise<TorrentInspectionResult<TorrentFilePage>>;
  listPending(): Promise<TorrentInspectionResult<TorrentPendingSnapshot[]>>;
  savePending(
    input: SavePendingTorrentInput,
  ): Promise<TorrentInspectionResult<TorrentPendingSnapshot>>;
  retry(
    input: RetryPendingTorrentInput,
  ): Promise<TorrentInspectionResult<TorrentInspectionSnapshot>>;
  removePending(
    input: RemovePendingTorrentInput,
  ): Promise<TorrentInspectionResult<{ pendingId: string; removed: boolean }>>;
  confirm(
    input: ConfirmTorrentSourceInput,
  ): Promise<TorrentInspectionResult<TorrentContentSource>>;
}

/** Minimal Electron preload surface; local paths and raw torrent bytes stay in Core. */
export interface TorrentInspectionDesktopApi extends TorrentInspectionService {
  protocolVersion: typeof TORRENT_INSPECTION_PROTOCOL_VERSION;
  chooseTorrentFile(): Promise<
    TorrentInspectionResult<TorrentFileSelection | null>
  >;
  subscribe(listener: (event: TorrentInspectionEvent) => void): () => void;
}
