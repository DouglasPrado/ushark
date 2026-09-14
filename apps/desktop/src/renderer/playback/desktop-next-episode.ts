import type {
  NextEpisodeDesktopApi,
  NextEpisodePreview,
  NextEpisodeSessionSnapshot,
  NextResult,
} from "@ushark/types/next-episode";
import type { PlaybackContent } from "@ushark/types/player";

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

export class DesktopNextEpisodePreview implements NextEpisodePreview {
  readonly runtime = "desktop" as const;
  private active?: NextEpisodeSessionSnapshot;

  constructor(private readonly api: NextEpisodeDesktopApi) {}

  async resolve(id: string, signal: AbortSignal): Promise<NextResult> {
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    const value = unwrap(await this.api.resolve({ contentId: id }));
    if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    this.active = value;
    return value;
  }

  async prepare(fail: boolean, signal: AbortSignal, next?: PlaybackContent) {
    void fail;
    const active = this.active;
    if (!active || !next?.sourceId)
      throw new Error("O próximo episódio ainda não foi resolvido.");
    const abort = () => void this.cancel(new AbortController().signal);
    signal.addEventListener("abort", abort, { once: true });
    try {
      this.active = unwrap(
        await this.api.prepare({
          sessionId: active.sessionId,
          generation: active.generation,
          sourceId: next.sourceId,
          fileId: next.selector,
          mutation: { idempotencyKey: `next-prepare:${crypto.randomUUID()}` },
        }),
      );
      if (this.active.next) Object.assign(next, this.active.next);
      if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
    } finally {
      signal.removeEventListener("abort", abort);
    }
  }

  async cancel(signal: AbortSignal) {
    const active = this.active;
    if (!active || signal.aborted) return;
    this.active = unwrap(
      await this.api.cancel({
        sessionId: active.sessionId,
        generation: active.generation,
        mutation: { idempotencyKey: `next-cancel:${crypto.randomUUID()}` },
      }),
    );
  }

  async claimStart(signal: AbortSignal) {
    const active = this.active;
    if (!active || signal.aborted) return false;
    this.active = unwrap(
      await this.api.claimStart({
        sessionId: active.sessionId,
        generation: active.generation,
        mutation: { idempotencyKey: `next-start:${crypto.randomUUID()}` },
      }),
    );
    return this.active.state === "started";
  }
}
