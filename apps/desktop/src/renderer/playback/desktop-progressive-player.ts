import type {
  PlaybackContent,
  PlaybackFailure,
  PlaybackProgress,
  PlaybackSessionSnapshot,
  PlayerRuntime,
  PlayerScenario,
  StopPlaybackInput,
} from "@ushark/types/player";
import type {
  ProgressiveStreamDesktopApi,
  StreamFailure,
  StreamServiceResult,
  StreamSessionSnapshot,
} from "@ushark/types/stream";

function unwrap<T>(result: StreamServiceResult<T>): T {
  if (result.ok) return result.value;
  throw Object.assign(new Error(result.error.message), {
    code: result.error.code,
    retryable: result.error.retryable,
  });
}

function playbackFailure(error: StreamFailure): PlaybackFailure {
  return {
    code: "PLAYBACK_SOURCE_UNAVAILABLE",
    message: error.message,
    recoverable: error.recoverable,
    retryable: error.retryable,
  };
}

export class DesktopProgressivePlayer implements PlayerRuntime {
  readonly runtime = "desktop" as const;
  private stream?: StreamSessionSnapshot;
  private current?: PlaybackSessionSnapshot;
  private readonly latestBySession = new Map<string, StreamSessionSnapshot>();
  private paused = false;
  private volumePercent = 70;
  private muted = false;
  private progressByContent = new Map<string, PlaybackProgress>();
  private listeners = new Set<
    (
      snapshot: PlaybackSessionSnapshot | undefined,
      error?: PlaybackFailure,
    ) => void
  >();
  private unsubscribe?: () => void;
  private activeRequestId?: string;

  constructor(private readonly api: ProgressiveStreamDesktopApi) {}

  private connect() {
    if (this.unsubscribe) return;
    this.unsubscribe = this.api.subscribe((event) => {
      let appliesToCurrent = false;
      if (event.snapshot) {
        this.latestBySession.set(
          event.snapshot.streamSessionId,
          event.snapshot,
        );
      }
      if (
        event.snapshot &&
        (!this.stream ||
          event.snapshot.streamSessionId === this.stream.streamSessionId)
      ) {
        appliesToCurrent = true;
        this.stream = event.snapshot;
        this.current = this.toPlayback(event.snapshot);
        this.progressByContent.set(event.snapshot.contentId, {
          position: event.snapshot.positionSeconds,
          watched: event.type === "stream.completed",
        });
      }
      const error =
        event.error && appliesToCurrent
          ? playbackFailure(event.error)
          : undefined;
      if (!appliesToCurrent && !error) return;
      for (const listener of this.listeners) listener(this.snapshot(), error);
    });
  }

  dispose() {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.listeners.clear();
  }

  private toPlayback(value: StreamSessionSnapshot): PlaybackSessionSnapshot {
    const terminal = ["stopped", "cancelled", "failed"].includes(value.state);
    const buffering = ["preparing", "probing", "buffering", "stalled"].includes(
      value.state,
    );
    return {
      schemaVersion: 1,
      protocolVersion: 1,
      sessionId: value.streamSessionId,
      generation: value.seekGeneration,
      contentId: value.contentId,
      sourceId: value.sourceId,
      state: terminal
        ? value.state === "failed"
          ? "error"
          : "stopped"
        : buffering
          ? "buffering"
          : this.paused
            ? "paused"
            : "playing",
      positionSeconds: value.positionSeconds,
      durationSeconds: value.metadata?.durationSeconds,
      paused: this.paused,
      volumePercent: this.volumePercent,
      muted: this.muted,
      audioTracks: [],
      subtitleTracks: [],
      metrics: {
        bitrateBitsPerSecond: value.metadata?.bitrateBitsPerSecond,
        hardwareDecode: "unknown",
      },
      updatedAt: value.updatedAt,
    };
  }

  snapshot() {
    return this.current ? structuredClone(this.current) : undefined;
  }

  subscribe(
    listener: (
      snapshot: PlaybackSessionSnapshot | undefined,
      error?: PlaybackFailure,
    ) => void,
  ) {
    this.connect();
    this.listeners.add(listener);
    if (this.current) listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  progress(id: string) {
    return this.progressByContent.get(id);
  }

  save(id: string, position: number, watched = false) {
    void id;
    void position;
    void watched;
    // Persistence of progressive progress remains owned by the playback journal.
  }

  private waitForReady(
    streamSessionId: string,
    generation: number,
    signal?: AbortSignal,
  ) {
    if (
      this.stream?.streamSessionId === streamSessionId &&
      this.stream.seekGeneration === generation &&
      this.stream.state === "ready"
    )
      return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(
        () => done(new Error("O streaming não ficou pronto a tempo.")),
        60_000,
      );
      const done = (error?: Error) => {
        window.clearTimeout(timer);
        unsubscribe();
        signal?.removeEventListener("abort", cancelled);
        if (error) reject(error);
        else resolve();
      };
      const cancelled = () => done(new DOMException("Cancelado", "AbortError"));
      const unsubscribe = this.subscribe((snapshot, error) => {
        if (error)
          done(Object.assign(new Error(error.message), { code: error.code }));
        else if (
          snapshot?.sessionId === streamSessionId &&
          snapshot.generation === generation &&
          snapshot.state === "playing"
        )
          done();
      });
      signal?.addEventListener("abort", cancelled, { once: true });
    });
  }

  async prepare(
    content: PlaybackContent,
    _scenario: PlayerScenario,
    signal: AbortSignal,
  ) {
    const requestId = `stream-request:${crypto.randomUUID()}`;
    this.activeRequestId = requestId;
    const abort = () => void this.api.cancel({ requestId });
    signal.addEventListener("abort", abort, { once: true });
    try {
      const initial = unwrap(
        await this.api.prepare({
          requestId,
          contentId: content.id,
          sourceId: content.sourceId ?? content.id,
          fileId: content.selector,
          mode: "stream-only",
          startPositionSeconds: content.position ?? 0,
          durationSeconds: content.duration ?? 5_400,
        }),
      );
      const snapshot =
        this.latestBySession.get(initial.streamSessionId) ?? initial;
      this.latestBySession.set(snapshot.streamSessionId, snapshot);
      this.stream = snapshot;
      this.current = this.toPlayback(snapshot);
      for (const listener of this.listeners) listener(this.snapshot());
      if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
      await this.waitForReady(snapshot.streamSessionId, 0, signal);
    } finally {
      signal.removeEventListener("abort", abort);
      if (this.activeRequestId === requestId) this.activeRequestId = undefined;
    }
  }

  private command() {
    if (!this.stream)
      throw new Error("Não existe uma sessão de streaming ativa.");
    return {
      streamSessionId: this.stream.streamSessionId,
      mutation: {
        idempotencyKey: `stream-command:${crypto.randomUUID()}`,
        expectedSeekGeneration: this.stream.seekGeneration,
      },
    };
  }

  async seek(positionSeconds: number) {
    const command = this.command();
    const generation = this.stream!.seekGeneration + 1;
    const snapshot = unwrap(
      await this.api.seek({
        ...command,
        positionSeconds,
        seekGeneration: generation,
      }),
    );
    this.stream = snapshot;
    this.current = this.toPlayback(snapshot);
    await this.waitForReady(snapshot.streamSessionId, generation);
  }

  async setPaused(paused: boolean) {
    unwrap(await this.api.setPaused({ ...this.command(), paused }));
    this.paused = paused;
    if (this.stream) this.current = this.toPlayback(this.stream);
    for (const listener of this.listeners) listener(this.snapshot());
  }

  async setVolume(volumePercent: number) {
    unwrap(await this.api.setVolume({ ...this.command(), volumePercent }));
    this.volumePercent = volumePercent;
  }

  async setMuted(muted: boolean) {
    unwrap(await this.api.setMuted({ ...this.command(), muted }));
    this.muted = muted;
  }

  async selectAudio(trackId: string) {
    unwrap(await this.api.selectAudio({ ...this.command(), trackId }));
  }

  async selectSubtitle(trackId?: string) {
    unwrap(await this.api.selectSubtitle({ ...this.command(), trackId }));
  }

  async chooseExternalSubtitle() {
    throw new Error("Legenda externa ainda não está disponível no streaming.");
  }

  async stop(reason: StopPlaybackInput["reason"] = "user") {
    void reason;
    if (!this.stream) return;
    const stopped = unwrap(await this.api.stop(this.command()));
    this.progressByContent.set(stopped.contentId, {
      position: stopped.positionSeconds,
      watched: stopped.state === "completed",
    });
    this.stream = undefined;
    this.current = undefined;
    for (const listener of this.listeners) listener(undefined);
  }
}
