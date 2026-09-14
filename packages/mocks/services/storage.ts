import type {
  StorageEntry,
  StoragePolicy,
  StoragePreview,
  StorageScenario,
} from "@ushark/types/storage";
const fixtures = (): StorageEntry[] => [
  {
    id: "old",
    name: "Viagem antiga",
    gb: 3,
    keep: false,
    active: false,
    favorite: false,
    partial: false,
    corrupt: false,
    lastUsed: 1,
    volume: "Cache SSD simulado",
  },
  {
    id: "partial",
    name: "Uma história pela metade",
    gb: 2,
    keep: false,
    active: false,
    favorite: false,
    partial: true,
    corrupt: false,
    lastUsed: 2,
    volume: "Cache SSD simulado",
  },
  {
    id: "keep",
    name: "Minha coleção guardada",
    gb: 5,
    keep: true,
    active: false,
    favorite: false,
    partial: false,
    corrupt: false,
    lastUsed: 3,
    volume: "Biblioteca simulada",
  },
  {
    id: "active",
    name: "Reprodução em andamento (fixture)",
    gb: 1,
    keep: false,
    active: true,
    favorite: false,
    partial: true,
    corrupt: false,
    lastUsed: 4,
    volume: "Cache SSD simulado",
  },
  {
    id: "favorite",
    name: "Meu favorito",
    gb: 4,
    keep: false,
    active: false,
    favorite: true,
    partial: false,
    corrupt: false,
    lastUsed: 5,
    volume: "Cache SSD simulado",
  },
];
function delay(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException("Cancelado", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, 500);
    if (signal.aborted) abort();
    else signal.addEventListener("abort", abort, { once: true });
  });
}
export class MockStoragePreview implements StoragePreview {
  readonly runtime = "mock" as const;
  capturePreview() {
    return structuredClone({
      rows: this.rows,
      overrides: this.overrides,
      policy: this.policy,
    });
  }
  restorePreview(value: ReturnType<MockStoragePreview["capturePreview"]>) {
    const snapshot = structuredClone(value);
    this.rows = snapshot.rows;
    this.overrides = snapshot.overrides;
    this.policy = snapshot.policy;
  }

  private rows = fixtures();
  private overrides = new Map<string, boolean>();
  private scenario: StorageScenario = "normal";
  policy = {
    limitGB: 40,
    folder: "Cache SSD simulado",
    autoCleanup: true,
    retainPartial: true,
    retainFavorites: true,
  };
  constructor(
    private external: () => StorageEntry[] = () => [],
    private removeExternal: (id: string) => void = () => {},
  ) {}
  list() {
    const items = [...this.rows, ...this.external()].map((x) => ({
      ...x,
      keep: this.overrides.get(x.id) ?? x.keep,
      volume: this.overrides.has(x.id)
        ? this.overrides.get(x.id)
          ? "Biblioteca simulada"
          : this.policy.folder
        : x.volume,
    }));
    return structuredClone(items);
  }
  eligible(e: StorageEntry) {
    return (
      !e.active &&
      !e.keep &&
      !(e.favorite && this.policy.retainFavorites) &&
      !(e.partial && this.policy.retainPartial)
    );
  }
  estimate() {
    return this.list()
      .filter((e) => this.eligible(e))
      .sort((a, b) => a.lastUsed - b.lastUsed);
  }
  async clean(ids: string[], signal: AbortSignal) {
    await delay(signal);
    if (this.scenario === "permission")
      throw new Error("Permissão negada. Nenhum dado foi removido.");
    let freed = 0;
    for (const e of this.list()) {
      if (ids.includes(e.id) && this.eligible(e)) {
        freed += e.gb;
        if (e.external) this.removeExternal(e.id);
        else this.rows = this.rows.filter((x) => x.id !== e.id);
      }
    }
    return freed;
  }
  async retain(id: string, keep: boolean, signal: AbortSignal) {
    await delay(signal);
    if (this.scenario === "permission" || this.scenario === "full")
      throw new Error("Movimentação simulada falhou; original preservado.");
    const row = this.list().find((x) => x.id === id);
    if (!row) return;
    if (row.active)
      throw new Error("Conteúdo ativo: tente alterar retenção após sair.");
    this.overrides.set(id, keep);
    const stored = this.rows.find((x) => x.id === id);
    if (stored)
      stored.volume = keep ? "Biblioteca simulada" : this.policy.folder;
  }
  async repair(id: string, signal: AbortSignal) {
    await delay(signal);
    if (this.scenario === "permission")
      throw new Error("Permissão negada ao reparar cache.");
    const row = this.rows.find((x) => x.id === id);
    if (row && !row.active) {
      row.corrupt = false;
      row.gb = 0;
    }
  }
  apply(value: StoragePolicy) {
    if (
      !Number.isFinite(value.limitGB) ||
      value.limitGB < 1 ||
      value.limitGB > 500
    )
      throw new Error("Limite deve estar entre 1 e 500 GB nesta prévia.");
    if (!["Cache SSD simulado", "Cache HDD simulado"].includes(value.folder))
      throw new Error("Escolha uma pasta sintética válida.");
    if (this.scenario === "permission")
      throw new Error("Permissão negada. Pasta anterior preservada.");
    this.policy = { ...value };
  }
  configure(value: StorageScenario) {
    this.scenario = value;
    this.rows = value === "empty" ? [] : fixtures();
    this.overrides.clear();
    if (value === "protected") this.rows.forEach((x) => (x.keep = true));
    if (value === "corrupt") this.rows[0].corrupt = true;
  }
  activate(id: string) {
    const row = this.rows.find((x) => x.id === id);
    if (row) row.active = true;
  }
}
