export interface SourceCandidate {
  id: string;
  name: string;
  local: boolean;
  resolution?: number;
  sizeGB?: number;
  origin?: string;
  selector?: string;
}
export type SelectionScenario =
  | "normal"
  | "unknown"
  | "low-confidence"
  | "degraded"
  | "unavailable"
  | "error"
  | "offline"
  | "comparison";
export interface SourceHealth {
  id: string;
  state: "unknown" | "ready" | "degraded" | "unavailable";
  score?: number;
  confidence: string;
  throughput?: number;
  bitrate?: number;
  ratio?: number;
  startup?: string;
  startupSeconds?: number;
  reason: string;
  eligible: boolean;
}
export interface SelectionPreferences {
  strategy: string;
  resolution: string;
  autoSelect: boolean;
  preflight: boolean;
}
export interface SelectionPreview {
  isLocal?: (id: string) => boolean;
  getHealthSummary(source: SourceCandidate): SourceHealth;
  measure(
    sources: SourceCandidate[],
    scenario: SelectionScenario,
    signal: AbortSignal,
  ): Promise<SourceHealth[]>;
  rank(
    sources: SourceCandidate[],
    health: SourceHealth[],
    preferences: SelectionPreferences,
  ): SourceCandidate[];
  override(id: string): string | undefined;
  setOverride(id: string, sourceId?: string): void;
}
