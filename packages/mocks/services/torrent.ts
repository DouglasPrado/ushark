import type {
  Inspection,
  InspectionScenario,
  TorrentPreview,
} from "@ushark/types/torrent";
export const previewMagnet =
  "magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567&dn=Horizonte.2024.1080p.H264";
export function validateTorrentInput(input: string): string {
  if (input === "fixture:filme.torrent" || input === "fixture:serie.torrent")
    return "";
  if (input.length > 4096)
    return "Entrada muito longa para esta prévia (máximo 4096 caracteres).";
  try {
    const url = new URL(input);
    if (
      url.protocol !== "magnet:" ||
      !url.searchParams
        .getAll("xt")
        .some((x) => /^urn:btih:([a-f0-9]{40}|[a-z2-7]{32})$/i.test(x))
    )
      return "Informe um magnet com infoHash BTIH válido.";
  } catch {
    return "Informe um magnet válido ou selecione o torrent sintético.";
  }
  return "";
}
export class MockTorrentPreview implements TorrentPreview {
  capturePreview() {
    return structuredClone({ waiting: this.waiting, sources: this.sources });
  }
  restorePreview(value: ReturnType<MockTorrentPreview["capturePreview"]>) {
    const snapshot = structuredClone(value);
    this.waiting = snapshot.waiting;
    this.sources = snapshot.sources;
  }

  private waiting = new Set<string>();
  private sources = new Map<string, Inspection>();
  pending() {
    return [...this.waiting];
  }
  remember(input: string) {
    if (validateTorrentInput(input))
      throw new Error(validateTorrentInput(input));
    this.waiting.add(input);
  }
  forget(input: string) {
    this.waiting.delete(input);
  }
  confirm(value: Inspection) {
    this.sources.set(value.hash, value);
    this.forget(value.input);
  }
  count() {
    return this.sources.size;
  }
  inspect(input: string, scenario: InspectionScenario, signal: AbortSignal) {
    return new Promise<Inspection>((resolve, reject) => {
      const invalid = validateTorrentInput(input);
      if (invalid) {
        reject(new Error(invalid));
        return;
      }
      const abort = () => {
        clearTimeout(timer);
        reject(new DOMException("Cancelado", "AbortError"));
      };
      const timer = setTimeout(() => {
        signal.removeEventListener("abort", abort);
        const errors: Partial<Record<InspectionScenario, string>> = {
          "no-peers":
            "Sem peers úteis. Você pode manter esta tentativa pendente.",
          timeout: "Tempo de resolução esgotado. Metadata ainda indisponível.",
          daemon:
            "Serviço de torrent simulado indisponível. A biblioteca continua acessível.",
          offline:
            "Offline: resolução de rede indisponível. Salve pendente para tentar depois.",
          hostile:
            "Arquivo rejeitado: caminho fora da pasta permitida (fixture simulada).",
          bencode: "Torrent rejeitado: bencode inválido (fixture simulada).",
        };
        if (errors[scenario]) {
          reject(new Error(errors[scenario]));
          return;
        }
        const series = input === "fixture:serie.torrent";
        const hash = input.startsWith("fixture:")
          ? series
            ? "2222222222222222222222222222222222222222"
            : "0123456789abcdef0123456789abcdef01234567"
          : new URL(input).searchParams.get("xt")!.slice(9).toLowerCase();
        const name = series
          ? "Entre Órbitas"
          : input.startsWith("fixture:")
            ? "Horizonte.2024.1080p.H264"
            : new URL(input).searchParams.get("dn") || "Título não informado";
        const files: Inspection["files"] = series
          ? [
              {
                id: "0",
                name: "Entre.Orbitas.S01E01.mkv",
                size: "1.2 GB",
                kind: "video",
              },
              {
                id: "1",
                name: "Entre.Orbitas.S01E02.mkv",
                size: "1.4 GB",
                kind: "video",
              },
            ]
          : [{ id: "0", name: `${name}.mkv`, size: "4.2 GB", kind: "video" }];
        if (scenario === "ambiguous")
          files.push({
            id: "alternative",
            name: "Versão.alternativa.mkv",
            size: "4.1 GB",
            kind: "video",
          });
        files.push(
          { id: "sample", name: "sample.mkv", size: "12 MB", kind: "sample" },
          { id: "extra", name: "Making-of.mp4", size: "230 MB", kind: "extra" },
        );
        resolve({ hash, name, files, input });
      }, 700);
      if (signal.aborted) abort();
      else signal.addEventListener("abort", abort, { once: true });
    });
  }
}
