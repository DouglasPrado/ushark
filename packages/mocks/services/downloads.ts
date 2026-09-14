import type {
  DownloadItem,
  DownloadLimits,
  DownloadPreview,
  DownloadRequest,
} from "@ushark/types/downloads";
export class MockDownloadPreview implements DownloadPreview {
  capturePreview() {
    return structuredClone({ items: this.items, limits: this.limits });
  }
  restorePreview(value: ReturnType<MockDownloadPreview["capturePreview"]>) {
    const snapshot = structuredClone(value);
    this.items = snapshot.items;
    this.limits = snapshot.limits;
  }

  private items: DownloadItem[] = [];
  private scenario = "normal";
  limits = { download: 8, upload: 1, sessions: 4, concurrent: 2, probes: 1 };
  list() {
    return structuredClone(this.items);
  }
  enqueue(request: DownloadRequest, destination: string) {
    if (!["Biblioteca simulada", "Cache simulado"].includes(destination))
      throw new Error("Escolha um destino simulado.");
    const id = `${request.source.id}:${request.source.selector ?? "main"}`;
    const exists = this.items.find((x) => x.id === id);
    if (exists) {
      if (exists.state === "cancelled") exists.state = "queued";
      return;
    }
    this.items.push({
      ...structuredClone(request),
      id,
      destination,
      state: "queued",
      bytes: 0,
      total: (request.source.sizeGB ?? 1) * 1024 ** 3,
      speed: 0,
      peers: 0,
      priority: 1,
    });
  }
  command(
    id: string,
    action: "pause" | "resume" | "cancel" | "remove" | "complete",
  ) {
    const item = this.items.find((x) => x.id === id);
    if (!item) return;
    if (action === "remove") {
      this.items = this.items.filter((x) => x.id !== id);
      return;
    }
    if (action === "complete") {
      item.bytes = item.total;
      item.state = "complete";
      item.speed = 0;
      return;
    }
    if (action === "pause" && ["queued", "downloading"].includes(item.state))
      item.state = "paused";
    if (action === "cancel" && item.state !== "complete")
      item.state = "cancelled";
    if (action === "resume" && item.state !== "complete") {
      if (this.scenario !== "normal")
        throw new Error(
          "Condição de falha ainda ativa. Restaure o cenário normal antes de retomar.",
        );
      item.error = undefined;
      item.state = "queued";
    }
    item.speed = 0;
  }
  priority(id: string, value: number) {
    const item = this.items.find((x) => x.id === id);
    if (item) item.priority = Math.max(0, Math.min(2, value));
  }
  configure(value: "normal" | "offline" | "disk" | "resume" | "error") {
    this.scenario = value;
    if (value !== "normal")
      for (const item of this.items)
        if (["queued", "downloading"].includes(item.state)) {
          item.state = "error";
          item.speed = 0;
          item.error = {
            offline: "Offline: aguardando rede.",
            disk: "Sem espaço: escrita pausada.",
            resume: "Resume inválido: retome com revisão apenas deste item.",
            error: "Falha simulada de transferência.",
          }[value];
        }
  }
  tick(activePlayback: boolean) {
    if (this.scenario !== "normal") return;
    const eligible = this.items
      .filter((x) => ["queued", "downloading"].includes(x.state))
      .sort((a, b) => b.priority - a.priority);
    const limit = Math.min(this.limits.concurrent, this.limits.sessions);
    eligible.forEach((item, index) => {
      if (index >= limit) {
        item.state = "queued";
        item.speed = 0;
        return;
      }
      item.state = "downloading";
      item.speed =
        (this.limits.download * 1024 ** 2) /
        (Math.min(eligible.length, limit) || 1) /
        (activePlayback ? 4 : 1);
      item.peers = 4;
      item.bytes = Math.min(item.total, item.bytes + item.speed);
      if (item.bytes >= item.total) {
        item.state = "complete";
        item.speed = 0;
      }
    });
  }
  restart() {
    this.items = structuredClone(this.items).map((x) => ({
      ...x,
      state:
        x.state === "downloading" || x.state === "queued" ? "paused" : x.state,
      speed: 0,
    }));
  }
  setLimits(value: DownloadLimits) {
    if (
      Object.values(value).some((x) => !Number.isFinite(x) || x < 0) ||
      [value.sessions, value.concurrent, value.probes].some(
        (x) => !Number.isInteger(x),
      ) ||
      value.sessions < 1 ||
      value.concurrent < 1 ||
      value.concurrent > value.sessions
    )
      throw new Error(
        "Limites devem ser positivos; downloads simultâneos não podem exceder sessões.",
      );
    this.limits = { ...value };
  }
}
