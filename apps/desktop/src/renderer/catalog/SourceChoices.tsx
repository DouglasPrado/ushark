import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Download, Play } from "lucide-react";
import { Button } from "@ushark/ui";
import { TorrentHealthBadge } from "./MediaSignals";
import type {
  SelectionPreview,
  SelectionPreferences,
  SourceCandidate,
  SourceHealth,
  SelectionScenario,
} from "@ushark/types/selection";
import { comparisonSources } from "@ushark/mocks/selection";
import "./selection.css";
export function SourceChoices({
  contentId,
  sources,
  service,
  preferences,
  onPlay,
  onDownload,
  label = "Assistir",
  suspended = false,
  consumerMode = false,
  backAction,
  extraAction,
  trailingActions,
}: {
  contentId: string;
  sources: SourceCandidate[];
  service: SelectionPreview;
  preferences: SelectionPreferences;
  onPlay: (source: SourceCandidate) => void;
  onDownload: (source: SourceCandidate) => void;
  label?: string;
  suspended?: boolean;
  consumerMode?: boolean;
  backAction?: ReactNode;
  extraAction?: ReactNode;
  trailingActions?: ReactNode;
}) {
  const [scenario, setScenario] = useState<SelectionScenario>("normal"),
    [health, setHealth] = useState<SourceHealth[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0),
    [override, setOverride] = useState(service.override(contentId));
  const [strategy, setStrategy] = useState(preferences.strategy),
    [resolution, setResolution] = useState(preferences.resolution);
  const [auto, setAuto] = useState(preferences.autoSelect);
  const sourceKey = JSON.stringify(
    sources.map((s) => ({
      ...s,
      local: s.local || service.isLocal?.(s.id) || false,
    })),
  );
  const candidates = useMemo(
    () =>
      scenario === "comparison"
        ? comparisonSources
        : (JSON.parse(sourceKey) as SourceCandidate[]),
    [sourceKey, scenario],
  );
  useEffect(() => {
    setOverride(service.override(contentId));
  }, [contentId, service]);
  useEffect(() => {
    if (suspended) return;
    const abort = new AbortController();
    setError("");
    setHealth([]);
    if (!preferences.preflight && revision === 0) return;
    setBusy(true);
    service
      .measure(candidates, scenario, abort.signal, {
        contentId,
        preferences: { ...preferences, strategy, resolution },
      })
      .then((h) => {
        if (!abort.signal.aborted) {
          setHealth(h);
          setOverride(service.override(contentId));
          setBusy(false);
        }
      })
      .catch((e: Error) => {
        if (!abort.signal.aborted) {
          setError(e.message);
          setBusy(false);
        }
      });
    return () => abort.abort();
  }, [
    candidates,
    service,
    scenario,
    revision,
    suspended,
    preferences.preflight,
    contentId,
    strategy,
    resolution,
  ]);
  const effectiveHealth =
    scenario === "offline"
      ? candidates.map((s) => ({
          id: s.id,
          state: "unavailable" as const,
          confidence: "Offline",
          reason: "Precisa de rede",
          eligible: s.local,
        }))
      : health;
  const ranked = service.rank(candidates, effectiveHealth, {
    ...preferences,
    strategy,
    resolution,
  });
  const choice =
    ranked.find((s) => s.id === override) ??
    (consumerMode || auto ? ranked[0] : undefined);
  async function choose(id?: string) {
    try {
      await service.setOverride(contentId, id);
      setOverride(id);
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível salvar a escolha.",
      );
    }
  }
  return (
    <section className="source-selection" aria-label="Escolha de fonte">
      <div className="selection-launch">
        {backAction}
        <Button
          data-detail-primary-action
          disabled={!choice}
          onClick={() => {
            if (choice) onPlay(choice);
          }}
        >
          <Play size={18} fill="currentColor" />
          {label}
        </Button>
        {extraAction}
        {!consumerMode && (
          <Button
            variant="secondary"
            disabled={!choice}
            onClick={() => {
              if (choice) onDownload(choice);
            }}
          >
            <Download size={18} />
            Baixar
          </Button>
        )}
        {trailingActions}
        <span role="status">
          {!candidates.length
            ? consumerMode
              ? "Indisponível para assistir."
              : "Nenhuma fonte disponível."
            : busy
              ? consumerMode
                ? "Preparando reprodução…"
                : "Medindo fontes… Play continua disponível."
              : error
                ? consumerMode
                  ? "Não foi possível preparar a reprodução."
                  : "Medição indisponível."
                : choice
                  ? consumerMode
                    ? "Pronto para assistir."
                    : `Escolhida: ${choice.name}`
                  : "Escolha uma fonte viável."}
        </span>
      </div>
      {!consumerMode && (
        <details>
          <summary>Comparar fontes e preferências</summary>
          <div className="selection-options">
            <label>
              Preferência de fonte
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
              >
                <option value="balanced">Equilíbrio</option>
                <option value="quality">Qualidade máxima</option>
                <option value="fast">Início rápido</option>
                <option value="smallest">Menor tamanho</option>
              </select>
            </label>
            <label>
              Resolução máxima
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
              >
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
                <option value="2160p">4K</option>
              </select>
            </label>
            <label>
              <input
                type="checkbox"
                checked={auto}
                onChange={(e) => setAuto(e.target.checked)}
              />
              Escolha automática
            </label>
          </div>
          {override && (
            <>
              <p>
                Escolha manual ativa
                {choice?.id !== override
                  ? " — indisponível com os limites atuais"
                  : ""}
                .
              </p>
              <Button variant="secondary" onClick={() => void choose()}>
                Retirar escolha manual
              </Button>
            </>
          )}
          {error && <p role="alert">{error}</p>}
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => {
              setScenario("normal");
              setRevision((x) => x + 1);
            }}
          >
            Medir novamente
          </Button>
          <div className="source-comparison">
            {candidates.map((s) => {
              const h = health.find((x) => x.id === s.id);
              return (
                <article key={s.id}>
                  <h4>{s.name}</h4>
                  <p>
                    {s.origin ?? "Origem atual"} ·{" "}
                    {s.resolution
                      ? `${s.resolution}p`
                      : "Resolução não informada"}{" "}
                    · {s.sizeGB ? `${s.sizeGB} GB` : "Tamanho não informado"}
                  </p>
                  <p className="source-health-summary">
                    {s.local ? (
                      "Arquivo local"
                    ) : (
                      <TorrentHealthBadge
                        health={busy ? undefined : h}
                        inline
                      />
                    )}
                    <span>Confiança: {h?.confidence ?? "Desconhecida"}</span>
                  </p>
                  {h?.score !== undefined && (
                    <>
                      <meter
                        aria-label={`Health ${s.name}`}
                        min="0"
                        max="100"
                        value={h.score}
                      />
                      <span>{h.score}/100</span>
                    </>
                  )}
                  <p>
                    {h?.reason ?? "Sem amostra; não significa indisponível."}
                  </p>
                  {h?.ratio !== undefined && (
                    <p>
                      Ratio {h.ratio.toFixed(2)} · {h.throughput} Mbps /{" "}
                      {h.bitrate} Mbps · início {h.startup}
                    </p>
                  )}
                  <Button
                    variant="secondary"
                    aria-pressed={override === s.id}
                    disabled={!ranked.some((x) => x.id === s.id)}
                    onClick={() => void choose(s.id)}
                  >
                    Escolher {s.name}
                  </Button>
                </article>
              );
            })}
          </div>
          <label>
            Condição das fontes
            <select
              value={scenario}
              onChange={(e) => {
                void choose();
                setScenario(e.target.value as SelectionScenario);
              }}
            >
              {Object.entries({
                normal: "Normal",
                unknown: "Desconhecido",
                "low-confidence": "Confiança baixa",
                degraded: "Instável",
                unavailable: "Indisponível",
                error: "Erro",
                offline: "Offline",
                comparison: "Comparar local, compacto e 4K",
              }).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </details>
      )}
    </section>
  );
}
