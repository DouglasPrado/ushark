import type {
  PlaybackContent,
  PlaybackDesktopApi,
  PlaybackFailure,
  PlaybackProgress,
  PlaybackSessionSnapshot,
  PlaybackServiceResult,
  PlayerRuntime,
  PlayerScenario,
  StopPlaybackInput,
} from "@ushark/types/player";

function unwrap<T>(result: PlaybackServiceResult<T>): T {
  if (result.ok) return result.value as T;
  throw Object.assign(new Error(result.error.message), {
    code: result.error.code,
    retryable: result.error.retryable,
  });
}

export class DesktopPlayer implements PlayerRuntime {
  readonly runtime = "desktop" as const;
  private current?: PlaybackSessionSnapshot;
  private progressByContent = new Map<string, PlaybackProgress>();
  private listeners = new Set<
    (
      snapshot: PlaybackSessionSnapshot | undefined,
      error?: PlaybackFailure,
    ) => void
  >();
  private unsubscribe?: () => void;
  private activeRequestId?: string;

  constructor(private readonly api: PlaybackDesktopApi) {}

  private connect() {
    if (this.unsubscribe) return;
    this.unsubscribe = this.api.subscribe((event) => {
      if (event.session) {
        this.current = event.session;
        this.progressByContent.set(event.session.contentId, {
          position: event.session.positionSeconds,
          watched: event.type === "ended",
        });
      }
      for (const listener of this.listeners)
        listener(this.current, event.error);
    });
  }

  dispose() {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.listeners.clear();
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
    // The Core owns the real five-second journal and forced transition flushes.
  }

  async prepare(
    content: PlaybackContent,
    _scenario: PlayerScenario,
    signal: AbortSignal,
  ) {
    const requestId = `playback-request:${crypto.randomUUID()}`;
    this.activeRequestId = requestId;
    const abort = () => {
      void this.api.cancelPreparation({ requestId });
      if (this.current) void this.stop("user");
    };
    signal.addEventListener("abort", abort, { once: true });
    try {
      const progressResult = await this.api.readProgress({
        contentId: content.id,
      });
      if (progressResult.ok && progressResult.value)
        this.progressByContent.set(content.id, {
          position: progressResult.value.positionSeconds,
          watched: progressResult.value.watched,
        });
      const preparation = unwrap(
        await this.api.prepare({
          contentId: content.id,
          sourceId: content.sourceId,
          startPositionSeconds: content.position,
          requestId,
        }),
      );
      if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
      const started = unwrap<PlaybackSessionSnapshot>(
        await this.api.start({
          operationId: preparation.operationId,
          mutation: { idempotencyKey: `playback-start:${crypto.randomUUID()}` },
        }),
      );
      this.current = started;
      if (started.firstFrameAt) return;
      await new Promise<void>((resolve, reject) => {
        const timer = window.setTimeout(
          () =>
            done(
              new Error("O player não apresentou o primeiro frame a tempo."),
            ),
          15_000,
        );
        const done = (error?: Error) => {
          window.clearTimeout(timer);
          unsubscribe();
          signal.removeEventListener("abort", cancelled);
          if (error) reject(error);
          else resolve();
        };
        const cancelled = () =>
          done(new DOMException("Cancelado", "AbortError"));
        const unsubscribe = this.subscribe((snapshot, error) => {
          if (error)
            done(Object.assign(new Error(error.message), { code: error.code }));
          else if (
            snapshot?.sessionId === started.sessionId &&
            snapshot.firstFrameAt
          )
            done();
        });
        signal.addEventListener("abort", cancelled, { once: true });
      });
    } finally {
      signal.removeEventListener("abort", abort);
      if (this.activeRequestId === requestId) this.activeRequestId = undefined;
    }
  }

  private mutation() {
    if (!this.current) throw new Error("Não existe uma sessão ativa.");
    return {
      sessionId: this.current.sessionId,
      mutation: {
        idempotencyKey: `playback-command:${crypto.randomUUID()}`,
        expectedGeneration: this.current.generation,
      },
    };
  }

  private async update(
    result: Promise<PlaybackServiceResult<PlaybackSessionSnapshot | undefined>>,
  ) {
    const snapshot = unwrap(await result);
    if (!snapshot) return;
    this.current = snapshot;
    for (const listener of this.listeners) listener(this.snapshot());
  }

  setPaused(paused: boolean) {
    const command = this.mutation();
    return this.update(this.api.setPaused({ ...command, paused }));
  }

  seek(positionSeconds: number) {
    const command = this.mutation();
    return this.update(this.api.seek({ ...command, positionSeconds }));
  }

  setVolume(volumePercent: number) {
    const command = this.mutation();
    return this.update(this.api.setVolume({ ...command, volumePercent }));
  }

  setMuted(muted: boolean) {
    const command = this.mutation();
    return this.update(this.api.setMuted({ ...command, muted }));
  }

  selectAudio(trackId: string) {
    const command = this.mutation();
    return this.update(this.api.selectAudio({ ...command, trackId }));
  }

  selectSubtitle(trackId?: string) {
    const command = this.mutation();
    return this.update(this.api.selectSubtitle({ ...command, trackId }));
  }

  chooseExternalSubtitle() {
    const command = this.mutation();
    return this.update(this.api.chooseExternalSubtitle(command));
  }

  async stop(reason: StopPlaybackInput["reason"] = "user") {
    if (
      !this.current ||
      ["ended", "stopped", "error"].includes(this.current.state)
    )
      return;
    const command = this.mutation();
    const result = await this.api.stop({ ...command, reason });
    if (!result.ok) unwrap(result as never);
    if (result.ok) {
      this.progressByContent.set(result.value.contentId, {
        position: result.value.positionSeconds,
        watched: result.value.watched,
      });
    }
    this.current = undefined;
    for (const listener of this.listeners) listener(undefined);
  }
}
