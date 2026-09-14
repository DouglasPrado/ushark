import type {
  DownloadDesktopApi,
  DownloadItem,
  DownloadLimits,
  DownloadPreview,
  DownloadRequest,
  DownloadSnapshot,
} from "@ushark/types/downloads";

function unwrap<T>(
  result:
    | { ok: true; value: T }
    | { ok: false; error: { message: string; code: string } },
): T {
  if (result.ok) return result.value;
  throw Object.assign(new Error(result.error.message), {
    code: result.error.code,
  });
}

export class DesktopDownloadPreview implements DownloadPreview {
  readonly runtime = "desktop" as const;
  private items: DownloadItem[] = [];
  limits: DownloadLimits = {
    download: 8,
    upload: 1,
    sessions: 4,
    concurrent: 2,
    probes: 1,
  };
  private unsubscribe: () => void;

  constructor(private readonly api: DownloadDesktopApi) {
    this.unsubscribe = api.subscribe((event) => {
      if (event.snapshot) this.upsert(event.snapshot);
      else if (event.type === "download.removed" && event.downloadId)
        this.items = this.items.filter((item) => item.id !== event.downloadId);
    });
    void this.hydrate();
  }
  dispose() {
    this.unsubscribe();
  }
  capturePreview() {
    return structuredClone({ items: this.items, limits: this.limits });
  }
  restorePreview(value: ReturnType<DesktopDownloadPreview["capturePreview"]>) {
    const snapshot = structuredClone(value);
    this.items = snapshot.items;
    this.limits = snapshot.limits;
  }
  private toItem(snapshot: DownloadSnapshot): DownloadItem {
    return {
      id: snapshot.id,
      content: { id: snapshot.contentId, title: snapshot.contentTitle },
      source: {
        id: snapshot.sourceId,
        name: snapshot.sourceName,
        local: snapshot.state === "complete",
        selector: snapshot.fileId,
      },
      destination: snapshot.destination === "library" ? "Biblioteca" : "Cache",
      state: snapshot.state,
      bytes: snapshot.bytesCompleted,
      total: snapshot.bytesTotal,
      speed: snapshot.downloadRateBytesPerSecond,
      peers: snapshot.connectedPeers,
      priority: snapshot.priority,
      error: snapshot.error?.message,
    };
  }
  private upsert(snapshot: DownloadSnapshot) {
    const item = this.toItem(snapshot);
    const index = this.items.findIndex((entry) => entry.id === item.id);
    if (index < 0) this.items.push(item);
    else this.items[index] = item;
  }
  private async hydrate() {
    const value = unwrap(await this.api.list());
    this.items = value.items.map((item) => this.toItem(item));
    this.limits = value.limits;
  }
  list() {
    return structuredClone(this.items);
  }
  async enqueue(request: DownloadRequest, destination: string) {
    const normalizedDestination = destination.toLowerCase();
    if (
      !normalizedDestination.includes("biblioteca") &&
      !normalizedDestination.includes("cache")
    )
      throw new Error("Escolha Cache ou Biblioteca como destino.");
    const snapshot = unwrap(
      await this.api.enqueue({
        contentId: request.content.id,
        contentTitle: request.content.title,
        sourceId: request.source.id,
        sourceName: request.source.name,
        fileId: request.source.selector,
        destination: normalizedDestination.includes("biblioteca")
          ? "library"
          : "cache",
        sizeBytes:
          request.source.sizeGB === undefined
            ? undefined
            : Math.round(request.source.sizeGB * 1024 ** 3),
        mutation: { idempotencyKey: `download-enqueue:${crypto.randomUUID()}` },
      }),
    );
    this.upsert(snapshot);
  }
  async command(
    id: string,
    action: "pause" | "resume" | "cancel" | "remove" | "complete",
  ) {
    if (action === "complete") return;
    if (action === "remove") {
      unwrap(
        await this.api.removeData({
          downloadId: id,
          confirmed: true,
          mutation: {
            idempotencyKey: `download-remove:${crypto.randomUUID()}`,
          },
        }),
      );
      this.items = this.items.filter((item) => item.id !== id);
      return;
    }
    const snapshot = unwrap(
      await this.api.command({
        downloadId: id,
        action,
        mutation: { idempotencyKey: `download-command:${crypto.randomUUID()}` },
      }),
    );
    this.upsert(snapshot);
  }
  async priority(id: string, priority: number) {
    const value = Math.max(0, Math.min(2, Math.round(priority))) as 0 | 1 | 2;
    this.upsert(
      unwrap(
        await this.api.setPriority({
          downloadId: id,
          priority: value,
          mutation: {
            idempotencyKey: `download-priority:${crypto.randomUUID()}`,
          },
        }),
      ),
    );
  }
  async tick(activePlayback: boolean) {
    const value = unwrap(
      await this.api.tick({ playbackActive: activePlayback }),
    );
    this.items = value.items.map((item) => this.toItem(item));
  }
  configure(value: "normal" | "offline" | "disk" | "resume" | "error") {
    if (value !== "normal")
      throw new Error(
        "Cenários simulados não estão disponíveis no runtime real.",
      );
  }
  async restart() {
    await this.hydrate();
  }
  async setLimits(limits: DownloadLimits) {
    this.limits = unwrap(
      await this.api.setLimits({
        limits,
        mutation: { idempotencyKey: `download-limits:${crypto.randomUUID()}` },
      }),
    );
  }
}
