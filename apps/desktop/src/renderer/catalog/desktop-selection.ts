import type {
  SelectionPreferences,
  SelectionPreview,
  SelectionScenario,
  SourceCandidate,
  SourceHealth,
  SourceSelectionDesktopApi,
  SourceSelectionSnapshot,
} from "@ushark/types/selection";

function unwrap<T>(
  result: Awaited<ReturnType<SourceSelectionDesktopApi["preflight"]>>,
): T {
  if (result.ok) return result.value as T;
  throw Object.assign(new Error(result.error.message), {
    code: result.error.code,
    retryable: result.error.retryable,
  });
}

function healthLabel(confidence: number) {
  if (confidence >= 0.8) return "Alta";
  if (confidence >= 0.6) return "Média";
  return "Baixa";
}

export class DesktopSelectionPreview implements SelectionPreview {
  private snapshots = new Map<string, SourceSelectionSnapshot>();
  private overrides = new Map<string, string>();
  private currentContentId?: string;

  constructor(private readonly api: SourceSelectionDesktopApi) {}

  capturePreview() {
    return { overrides: new Map(this.overrides) };
  }

  restorePreview(value: ReturnType<DesktopSelectionPreview["capturePreview"]>) {
    this.overrides = new Map(value.overrides);
  }

  isLocal = (id: string) => {
    void id;
    return false;
  };
  override(contentId: string) {
    return this.overrides.get(contentId);
  }

  async setOverride(contentId: string, sourceId?: string) {
    const result = await this.api.setOverride({
      contentId,
      ...(sourceId ? { sourceId } : {}),
      mutation: { idempotencyKey: `selection-override:${crypto.randomUUID()}` },
    });
    if (!result.ok) throw new Error(result.error.message);
    if (sourceId) this.overrides.set(contentId, sourceId);
    else this.overrides.delete(contentId);
  }

  getHealthSummary(source: SourceCandidate): SourceHealth {
    const health = [...this.snapshots.values()]
      .flatMap((snapshot) => snapshot.candidates)
      .find((candidate) => candidate.sourceId === source.id)?.health;
    if (!health)
      return {
        id: source.id,
        state: "unknown",
        confidence: "Desconhecida",
        reason: "Aguardando medição local.",
        eligible: true,
      };
    return this.toLegacy(source.id, health);
  }

  private toLegacy(
    id: string,
    health: NonNullable<
      SourceSelectionSnapshot["candidates"][number]["health"]
    >,
  ): SourceHealth {
    return {
      id,
      state:
        health.state === "ready"
          ? "ready"
          : health.state === "unavailable" || health.state === "error"
            ? "unavailable"
            : health.state === "degraded"
              ? "degraded"
              : "unknown",
      score: health.displayedScore ?? health.score,
      confidence: healthLabel(health.confidence),
      throughput:
        health.sustainableThroughputBitsPerSecond === undefined
          ? undefined
          : health.sustainableThroughputBitsPerSecond / 1_000_000,
      bitrate:
        health.requiredBitrateBitsPerSecond === undefined
          ? undefined
          : health.requiredBitrateBitsPerSecond / 1_000_000,
      ratio: health.streamingRatio,
      startupSeconds:
        health.startupEstimateMs === undefined
          ? undefined
          : health.startupEstimateMs / 1_000,
      startup:
        health.startupEstimateMs === undefined
          ? "Indeterminado"
          : health.startupEstimateMs < 8_000
            ? `~${Math.max(1, Math.round(health.startupEstimateMs / 1_000))} s`
            : "Pode demorar para iniciar",
      reason: health.reasonCodes.join(", ") || "Medição local atualizada.",
      eligible:
        !["unavailable", "error"].includes(health.state) &&
        (health.streamingRatio === undefined || health.streamingRatio >= 1),
    };
  }

  async measure(
    sources: SourceCandidate[],
    scenario: SelectionScenario,
    signal: AbortSignal,
    context?: { contentId: string; preferences: SelectionPreferences },
  ) {
    if (!context) return sources.map((source) => this.getHealthSummary(source));
    if (scenario !== "normal")
      return sources.map((source) => this.getHealthSummary(source));
    const requestId = `selection-request:${crypto.randomUUID()}`;
    this.currentContentId = context.contentId;
    const abort = () => void this.api.cancel({ requestId });
    signal.addEventListener("abort", abort, { once: true });
    try {
      const snapshot = unwrap<SourceSelectionSnapshot>(
        await this.api.preflight({
          requestId,
          contentId: context.contentId,
          context: "details",
          strategy: ["balanced", "quality", "fast", "smallest"].includes(
            context.preferences.strategy,
          )
            ? (context.preferences
                .strategy as SourceSelectionSnapshot["strategy"])
            : "balanced",
          resolutionLimit:
            context.preferences.resolution === "720p"
              ? "720p"
              : context.preferences.resolution === "1080p"
                ? "1080p"
                : "2160p",
          candidates: sources.map((source) => ({
            sourceId: source.id,
            name: source.name,
            origin: source.origin,
            fileId: source.selector,
            completedLocal: source.local || this.isLocal(source.id),
            resolutionHeight: source.resolution,
            sizeBytes:
              source.sizeGB === undefined
                ? undefined
                : Math.round(source.sizeGB * 1024 ** 3),
          })),
        }),
      );
      this.snapshots.set(context.contentId, snapshot);
      if (snapshot.overrideSourceId)
        this.overrides.set(context.contentId, snapshot.overrideSourceId);
      else this.overrides.delete(context.contentId);
      return sources.map((source) => {
        const health = snapshot.candidates.find(
          (candidate) => candidate.sourceId === source.id,
        )?.health;
        return health
          ? this.toLegacy(source.id, health)
          : this.getHealthSummary(source);
      });
    } finally {
      signal.removeEventListener("abort", abort);
    }
  }

  rank(
    sources: SourceCandidate[],
    health: SourceHealth[],
    preferences: SelectionPreferences,
  ) {
    const snapshot = this.currentContentId
      ? this.snapshots.get(this.currentContentId)
      : undefined;
    const order = new Map(
      snapshot?.ranked
        .filter((entry) => entry.eligible)
        .map((entry, index) => [entry.sourceId, index]) ?? [],
    );
    if (order.size)
      return sources
        .filter((source) => order.has(source.id))
        .sort((left, right) => order.get(left.id)! - order.get(right.id)!);
    const maximum =
      preferences.resolution === "720p"
        ? 720
        : preferences.resolution === "1080p"
          ? 1080
          : 2160;
    return sources
      .filter(
        (source) =>
          (source.resolution ?? 0) <= maximum &&
          health.find((entry) => entry.id === source.id)?.eligible !== false,
      )
      .sort(
        (left, right) =>
          Number(right.local) - Number(left.local) ||
          left.id.localeCompare(right.id),
      );
  }
}
