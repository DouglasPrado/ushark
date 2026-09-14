import type {
  StorageDesktopApi,
  StorageEntry,
  StoragePolicy,
  StoragePreview,
  StorageScenario,
  StorageSnapshot,
} from "@ushark/types/storage";

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

const initialPolicy: StoragePolicy = {
  limitGB: 40,
  folder: "Cache",
  autoCleanup: true,
  retainPartial: true,
  retainFavorites: true,
};

export class DesktopStoragePreview implements StoragePreview {
  readonly runtime = "desktop" as const;
  policy = { ...initialPolicy };
  private snapshot: StorageSnapshot | undefined;

  constructor(private readonly api: StorageDesktopApi) {
    void this.refresh();
  }

  capturePreview() {
    return structuredClone({ snapshot: this.snapshot, policy: this.policy });
  }

  restorePreview(value: ReturnType<DesktopStoragePreview["capturePreview"]>) {
    this.snapshot = structuredClone(value.snapshot);
    this.policy = structuredClone(value.policy);
  }

  private accept(snapshot: StorageSnapshot) {
    this.snapshot = snapshot;
    this.policy = { ...snapshot.policy };
  }

  async refresh() {
    this.accept(unwrap(await this.api.read()));
  }

  list() {
    return structuredClone(this.snapshot?.entries ?? []);
  }

  eligible(entry: StorageEntry) {
    return (
      !entry.active &&
      !entry.keep &&
      !(entry.favorite && this.policy.retainFavorites) &&
      !(entry.partial && this.policy.retainPartial)
    );
  }

  estimate() {
    return this.list()
      .filter((entry) => this.eligible(entry))
      .sort((left, right) => left.lastUsed - right.lastUsed);
  }

  private revision() {
    if (!this.snapshot)
      throw new Error("O armazenamento ainda está sendo carregado.");
    return this.snapshot.revision;
  }

  async clean(ids: string[], signal: AbortSignal) {
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    const value = unwrap(
      await this.api.clean({
        ids,
        expectedRevision: this.revision(),
        mutation: { idempotencyKey: `storage-clean:${crypto.randomUUID()}` },
      }),
    );
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    this.accept(value.snapshot);
    return value.freedBytes / 1024 ** 3;
  }

  async retain(id: string, keep: boolean, signal: AbortSignal) {
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    this.accept(
      unwrap(
        await this.api.retain({
          id,
          keep,
          expectedRevision: this.revision(),
          mutation: { idempotencyKey: `storage-retain:${crypto.randomUUID()}` },
        }),
      ),
    );
  }

  async repair(id: string, signal: AbortSignal) {
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    this.accept(
      unwrap(
        await this.api.repair({
          id,
          expectedRevision: this.revision(),
          mutation: { idempotencyKey: `storage-repair:${crypto.randomUUID()}` },
        }),
      ),
    );
  }

  async apply(policy: StoragePolicy) {
    this.accept(
      unwrap(
        await this.api.applyPolicy({
          policy,
          expectedRevision: this.revision(),
          mutation: { idempotencyKey: `storage-policy:${crypto.randomUUID()}` },
        }),
      ),
    );
  }

  configure(scenario: StorageScenario) {
    if (scenario !== "normal")
      throw new Error(
        "Cenários simulados não estão disponíveis no runtime real.",
      );
  }

  activate() {
    throw new Error("A proteção ativa é controlada pela reprodução real.");
  }
}
