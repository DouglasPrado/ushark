/** Frontend preview boundary; no runtime or persistence contract. */
export interface PlaybackContent {
  progressive?: boolean;
  sourceId?: string;
  sourceName?: string;
  selector?: string;
  id: string;
  title: string;
  position?: number;
  duration?: number;
  available?: boolean;
}
export type PlayerScenario =
  | "normal"
  | "missing"
  | "removed"
  | "codec"
  | "crash"
  | "no-subtitles"
  | "offline";
export interface PlaybackProgress {
  position: number;
  watched: boolean;
}
export interface PlayerPreview {
  progress(id: string): PlaybackProgress | undefined;
  save(id: string, position: number, watched?: boolean): void;
  prepare(
    content: PlaybackContent,
    scenario: PlayerScenario,
    signal: AbortSignal,
  ): Promise<void>;
}
