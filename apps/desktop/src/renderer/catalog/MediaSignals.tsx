import type { SourceHealth } from "@ushark/types/selection";
import "./media-signals.css";

const qualityScore = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("8k") || normalized.includes("4320")) return 4320;
  if (normalized.includes("4k") || normalized.includes("2160")) return 2160;
  if (normalized.includes("full hd")) return 1080;
  const pixels = normalized.match(/(\d{3,4})p/)?.[1];
  return pixels ? Number(pixels) : 0;
};

export const formatQuality = (value?: string) => {
  if (!value?.trim() || value === "Qualidade não informada") return undefined;
  const normalized = value.trim();
  if (/^(2160p|uhd)$/i.test(normalized)) return "4K";
  if (/^4320p$/i.test(normalized)) return "8K";
  return normalized;
};

export const bestQuality = (values: Array<string | undefined>) => {
  const best = values
    .filter((value): value is string => !!formatQuality(value))
    .sort((a, b) => qualityScore(b) - qualityScore(a))[0];
  return formatQuality(best);
};

export const healthPresentation = (health?: SourceHealth) => {
  if (!health)
    return { bars: 0, label: "Medindo...", tone: "measuring" } as const;
  if (health.state === "unknown")
    return { bars: 0, label: "Desconhecido", tone: "measuring" } as const;
  if (health.state === "unavailable")
    return { bars: 0, label: "Indisponível", tone: "unavailable" } as const;
  const score = health.score ?? 0;
  if (score >= 90)
    return { bars: 5, label: "Excelente", tone: "excellent" } as const;
  if (score >= 75)
    return { bars: 4, label: "Muito bom", tone: "very-good" } as const;
  if (score >= 55) return { bars: 3, label: "Bom", tone: "good" } as const;
  if (score >= 30)
    return { bars: 2, label: "Instável", tone: "unstable" } as const;
  return { bars: 1, label: "Ruim", tone: "poor" } as const;
};

export const averageTorrentHealth = (
  values: SourceHealth[],
  id = "torrent-health-average",
): SourceHealth | undefined => {
  const health = Array.from(
    new Map(values.map((value) => [value.id, value])).values(),
  );
  if (!health.length) return undefined;
  const measured = health.filter(
    (value): value is SourceHealth & { score: number } =>
      typeof value.score === "number",
  );
  if (!measured.length) {
    const unavailable = health.every((value) => value.state === "unavailable");
    return {
      id,
      state: unavailable ? "unavailable" : "unknown",
      confidence: "Média sem amostra",
      reason: `Nenhuma das ${health.length} fontes tem medição disponível.`,
      eligible: health.some((value) => value.eligible),
    };
  }
  const score = Math.round(
    measured.reduce((sum, value) => sum + value.score, 0) / measured.length,
  );
  return {
    id,
    state: score < 55 ? "degraded" : "ready",
    score,
    confidence: `Média de ${measured.length} fonte(s)`,
    reason: `Torrent Health médio calculado sobre ${measured.length} sourceId(s) único(s).`,
    eligible: score >= 30,
  };
};

export function TorrentHealthBadge({
  health,
  inline = false,
  id,
  prefix,
}: {
  health?: SourceHealth;
  inline?: boolean;
  id?: string;
  prefix?: string;
}) {
  const presentation = healthPresentation(health);
  const visibleLabel = prefix
    ? `${prefix} · ${presentation.label}`
    : presentation.label;
  return (
    <span
      id={id}
      className={`torrent-health-badge torrent-health-${presentation.tone}${inline ? " torrent-health-inline" : ""}`}
      aria-label={`Torrent Health${prefix ? ` (${prefix.toLowerCase()})` : ""}: ${presentation.bars} de 5 barras, ${presentation.label}`}
    >
      <span className="torrent-health-bars" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((bar) => (
          <i
            className={bar <= presentation.bars ? "is-active" : undefined}
            key={bar}
          />
        ))}
      </span>
      <span>{visibleLabel}</span>
    </span>
  );
}
