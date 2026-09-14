import type {
  Inspection,
  InspectionScenario,
  TorrentFileInfo,
  TorrentFileSelection,
  TorrentInspectionDesktopApi,
  TorrentInspectionEvent,
  TorrentInspectionFailure,
  TorrentInspectionResult,
  TorrentInspectionSnapshot,
  TorrentPendingSnapshot,
  TorrentPreview,
} from "@ushark/types/torrent";

const terminal = new Set(["files-ready", "failed", "cancelled"]);

function unwrap<T>(result: TorrentInspectionResult<T>): T {
  if (!result.ok)
    throw Object.assign(new Error(result.error.message), result.error);
  return result.value;
}

function sizeLabel(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function validateMagnet(value: string) {
  if (new TextEncoder().encode(value).length > 4096)
    return "O magnet excede o limite de 4.096 bytes.";
  try {
    const url = new URL(value);
    if (
      url.protocol !== "magnet:" ||
      url.searchParams.getAll("xt").length !== 1 ||
      !/^urn:btih:([a-f0-9]{40}|[a-z2-7]{32})$/i.test(
        url.searchParams.get("xt") ?? "",
      )
    )
      return "Informe um magnet com infoHash BTIH válido.";
  } catch {
    return "Informe um magnet válido ou selecione um arquivo .torrent.";
  }
  return "";
}

export class DesktopTorrentPreview implements TorrentPreview {
  private readonly selections = new Map<string, TorrentFileSelection>();
  private readonly pendingItems = new Map<string, TorrentPendingSnapshot>();
  private readonly operationByInput = new Map<string, string>();
  private readonly snapshots = new Map<string, TorrentInspectionSnapshot>();
  private readonly waiters = new Map<
    string,
    Set<{
      resolve: (snapshot: TorrentInspectionSnapshot) => void;
      reject: (error: Error) => void;
    }>
  >();
  private readonly confirmed = new Set<string>();
  private readonly unsubscribe: () => void;

  constructor(private readonly api: TorrentInspectionDesktopApi) {
    this.unsubscribe = api.subscribe((event) => this.receive(event));
  }

  dispose() {
    this.unsubscribe();
  }

  private receive(event: TorrentInspectionEvent) {
    this.snapshots.set(event.operationId, event.snapshot);
    if (!terminal.has(event.snapshot.state)) return;
    const waiters = this.waiters.get(event.operationId);
    if (!waiters) return;
    this.waiters.delete(event.operationId);
    for (const waiter of waiters) waiter.resolve(event.snapshot);
  }

  private waitForTerminal(operationId: string, signal: AbortSignal) {
    const current = this.snapshots.get(operationId);
    if (current && terminal.has(current.state)) return Promise.resolve(current);
    return new Promise<TorrentInspectionSnapshot>((resolve, reject) => {
      let settled = false;
      let pollTimer: ReturnType<typeof setTimeout> | undefined;
      const cleanup = () => {
        if (pollTimer) clearTimeout(pollTimer);
        signal.removeEventListener("abort", abort);
        const activeWaiters = this.waiters.get(operationId);
        activeWaiters?.delete(waiter);
        if (activeWaiters?.size === 0) this.waiters.delete(operationId);
      };
      const finish = (snapshot: TorrentInspectionSnapshot) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(snapshot);
      };
      const fail = (cause: Error) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(cause);
      };
      const waiter = { resolve: finish, reject: fail };
      const currentWaiters = this.waiters.get(operationId) ?? new Set();
      currentWaiters.add(waiter);
      this.waiters.set(operationId, currentWaiters);
      const abort = () => {
        void this.api.cancel({ operationId });
        fail(new DOMException("Cancelado", "AbortError"));
      };
      const poll = async () => {
        if (settled) return;
        try {
          const snapshot = unwrap(await this.api.get({ operationId }));
          if (settled) return;
          this.snapshots.set(operationId, snapshot);
          if (terminal.has(snapshot.state)) finish(snapshot);
          else pollTimer = setTimeout(() => void poll(), 250);
        } catch (cause) {
          fail(
            cause instanceof Error
              ? cause
              : new Error("Não foi possível consultar a inspeção torrent."),
          );
        }
      };
      if (signal.aborted) abort();
      else {
        signal.addEventListener("abort", abort, { once: true });
        pollTimer = setTimeout(() => void poll(), 250);
      }
    });
  }

  validateInput(input: string) {
    if (this.selections.has(input) || this.pendingItems.has(input)) return "";
    return validateMagnet(input);
  }

  describeInput(input: string) {
    return (
      this.selections.get(input)?.fileName ??
      this.pendingItems.get(input)?.inputLabel ??
      input
    );
  }

  async chooseTorrentFile() {
    const selected = unwrap(await this.api.chooseTorrentFile());
    if (!selected) return null;
    const input = `selection:${selected.selectionId}`;
    this.selections.set(input, selected);
    return { input, label: selected.fileName };
  }

  async hydratePending() {
    const values = unwrap(await this.api.listPending());
    this.pendingItems.clear();
    for (const value of values)
      this.pendingItems.set(`pending:${value.pendingId}`, value);
  }

  pending() {
    return [...this.pendingItems.keys()];
  }

  async inspect(
    input: string,
    _scenario: InspectionScenario,
    signal: AbortSignal,
  ) {
    let initial: TorrentInspectionSnapshot;
    const pending = this.pendingItems.get(input);
    if (pending) {
      initial = unwrap(
        await this.api.retry({
          pendingId: pending.pendingId,
          correlationId: globalThis.crypto.randomUUID(),
          mutation: { idempotencyKey: globalThis.crypto.randomUUID() },
        }),
      );
    } else {
      const selection = this.selections.get(input);
      initial = unwrap(
        await this.api.start({
          input: selection
            ? { type: "torrent-file", selectionId: selection.selectionId }
            : { type: "magnet", magnet: input },
          correlationId: globalThis.crypto.randomUUID(),
          mutation: { idempotencyKey: globalThis.crypto.randomUUID() },
        }),
      );
    }
    this.snapshots.set(initial.operationId, initial);
    this.operationByInput.set(input, initial.operationId);
    const snapshot = terminal.has(initial.state)
      ? initial
      : await this.waitForTerminal(initial.operationId, signal);
    if (snapshot.state !== "files-ready" || !snapshot.runtime) {
      const error: TorrentInspectionFailure = snapshot.failure ?? {
        code: "TORRENT_DAEMON_UNAVAILABLE",
        message: "O runtime de torrent não concluiu a inspeção.",
        recoverable: true,
        retryable: true,
      };
      throw Object.assign(new Error(error.message), error);
    }
    const files: TorrentFileInfo[] = [...snapshot.files];
    let cursor = snapshot.files.length;
    while (!snapshot.filesComplete && cursor < snapshot.totalFileCount) {
      const page = unwrap(
        await this.api.getFiles({
          operationId: snapshot.operationId,
          cursor,
          limit: 128,
        }),
      );
      files.push(...page.files);
      if (page.nextCursor === undefined) break;
      cursor = page.nextCursor;
    }
    return {
      hash: snapshot.runtime.infoHash,
      name: snapshot.displayName ?? snapshot.inputLabel,
      input,
      operationId: snapshot.operationId,
      files: files.map((file) => ({
        id: file.id,
        name: file.name,
        size: sizeLabel(file.sizeBytes),
        kind:
          file.kind === "video" ||
          file.kind === "sample" ||
          file.kind === "extra"
            ? file.kind
            : "extra",
      })),
    } satisfies Inspection;
  }

  async remember(input: string) {
    const operationId = this.operationByInput.get(input);
    if (!operationId) throw new Error("Resolva a entrada antes de salvá-la.");
    unwrap(
      await this.api.savePending({
        operationId,
        mutation: { idempotencyKey: globalThis.crypto.randomUUID() },
      }),
    );
    await this.hydratePending();
  }

  async forget(input: string) {
    const pending = this.pendingItems.get(input);
    if (!pending) return;
    unwrap(
      await this.api.removePending({
        pendingId: pending.pendingId,
        mutation: { idempotencyKey: globalThis.crypto.randomUUID() },
      }),
    );
    await this.hydratePending();
  }

  async confirmForContent(
    contentId: string,
    inspection: Inspection,
    fileId: string,
  ) {
    if (!inspection.operationId)
      throw new Error("A operação real não está disponível para confirmação.");
    const value = unwrap(
      await this.api.confirm({
        operationId: inspection.operationId,
        contentId,
        selector: { type: "manual", fileId },
        mutation: { idempotencyKey: globalThis.crypto.randomUUID() },
      }),
    );
    this.confirmed.add(value.sourceId);
    await this.hydratePending();
    return { sourceId: value.sourceId };
  }

  confirm(inspection: Inspection) {
    this.confirmed.add(inspection.hash);
  }

  count() {
    return this.confirmed.size;
  }
}
