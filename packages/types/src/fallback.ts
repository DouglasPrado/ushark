import type { SourceCandidate } from "./selection";
export interface FallbackCandidate extends SourceCandidate {
  compatible: boolean;
  reason: string;
}
export type FallbackScenario =
  "catalog" | "alternatives" | "none" | "incompatible" | "failure" | "offline";
export interface HealthHistory {
  sourceId: string;
  success: number;
  failures: number;
  throughput: number;
  startup: number;
  buffering: number;
  age: number;
  weight: number;
  algorithm: string;
}
export interface FallbackPreview {
  alternatives(
    contentId: string,
    current: string,
    scenario: FallbackScenario,
    signal: AbortSignal,
  ): Promise<FallbackCandidate[]>;
  prepare(
    candidate: FallbackCandidate,
    scenario: FallbackScenario,
    signal: AbortSignal,
  ): Promise<void>;
  record(sourceId: string, success: boolean): void;
  history(): HealthHistory[];
  penalty(sourceId: string): number;
  cooldown(sourceId: string): boolean;
  advance(seconds: number): void;
}
