export type InspectionScenario =
  | "normal"
  | "no-peers"
  | "timeout"
  | "daemon"
  | "offline"
  | "ambiguous"
  | "hostile"
  | "bencode";
export interface InspectedFile {
  id: string;
  name: string;
  size: string;
  kind: "video" | "sample" | "extra";
}
export interface Inspection {
  hash: string;
  name: string;
  files: InspectedFile[];
  input: string;
}
export interface TorrentPreview {
  inspect(
    input: string,
    scenario: InspectionScenario,
    signal: AbortSignal,
  ): Promise<Inspection>;
  pending(): string[];
  remember(input: string): void;
  forget(input: string): void;
  confirm(inspection: Inspection): void;
  count(): number;
}
