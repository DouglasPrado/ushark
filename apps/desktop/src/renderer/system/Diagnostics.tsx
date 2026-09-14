import "./diagnostics.css";
import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@ushark/ui";
import type {
  DiagnosticPreview,
  DiagnosticSnapshot,
  DiagnosticCategory,
  DiagnosticScenario,
} from "@ushark/types/diagnostics";
import { useNavigation } from "../app/navigation";
export function Diagnostics({
  service,
  onBack,
}: {
  service: DiagnosticPreview;
  onBack: () => void;
}) {
  const [snapshot, setSnapshot] = useState<DiagnosticSnapshot | null>(null),
    [scenario, setScenario] = useState<DiagnosticScenario>("current"),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [review, setReview] = useState(""),
    [exported, setExported] = useState(""),
    [category, setCategory] = useState<DiagnosticCategory | null>(null),
    [limit, setLimit] = useState("20"),
    [days, setDays] = useState("7");
  const c = useRef<AbortController | null>(null),
    lock = useRef(false),
    origin = useRef<HTMLElement | null>(null),
    first = useRef<HTMLButtonElement>(null);
  function cancel() {
    c.current?.abort();
    lock.current = false;
    setBusy("");
    setNotice("Operação cancelada; dados confirmados preservados.");
  }
  function back() {
    if (busy) cancel();
    else if (review || category) {
      setReview("");
      setCategory(null);
      requestAnimationFrame(() => origin.current?.focus());
    } else onBack();
  }
  useNavigation(back);
  async function run(
    label: string,
    task: (signal: AbortSignal) => Promise<void>,
  ) {
    if (lock.current) return;
    lock.current = true;
    setBusy(label);
    setError("");
    setNotice("");
    const abort = new AbortController();
    c.current = abort;
    try {
      await task(abort.signal);
    } catch (e) {
      if (!abort.signal.aborted) setError((e as Error).message);
    } finally {
      if (!abort.signal.aborted) {
        lock.current = false;
        setBusy("");
      }
    }
  }
  function collect() {
    void run("Coletando diagnóstico…", async (s) => {
      const value = await service.collect(scenario, s);
      if (!s.aborted) {
        setSnapshot(value);
        setLimit(String(value.retention.limit));
        setDays(String(value.retention.days));
      }
    });
  }
  useEffect(() => {
    first.current?.focus();
    collect();
    return () => {
      c.current?.abort();
      lock.current = false;
    };
  }, []);
  return (
    <main className="workspace-page">
      <header>
        <Button ref={first} variant="secondary" onClick={back}>
          Voltar à experiência
        </Button>
        <h1>Diagnóstico</h1>
        <Button disabled={!!busy} onClick={collect}>
          Atualizar diagnóstico
        </Button>
      </header>
      <p>
        Painel opcional de simulações em memória. Nenhuma telemetria é enviada.
        Desconhecido não significa zero.
      </p>
      {busy && !category && !review && (
        <p role="status">
          {busy}
          <Button variant="secondary" onClick={cancel}>
            Cancelar operação
          </Button>
        </p>
      )}
      {error && !category && !review && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {snapshot && (
        <>
          <p>{snapshot.session}</p>
          <section className="diagnostic-grid">
            {snapshot.metrics.map((metric) => (
              <article key={metric.label}>
                <h2>{metric.label}</h2>
                <p>
                  {metric.value === null
                    ? "Desconhecido / indisponível"
                    : `${metric.value} ${metric.unit ?? ""}`}
                </p>
              </article>
            ))}
          </section>
          <section className="workspace-list">
            <article>
              <h2>Logs estruturados redigidos</h2>
              <p>
                {snapshot.logs.length} eventos · limite{" "}
                {snapshot.retention.limit} · retenção proposta{" "}
                {snapshot.retention.days} dias
              </p>
              <pre className="package-payload">
                {JSON.stringify(snapshot.logs, null, 2)}
              </pre>
              <div className="workspace-fields">
                <label>
                  Limite de eventos
                  <input
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                  />
                </label>
                <label>
                  Dias de retenção
                  <input
                    type="number"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                  />
                </label>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  try {
                    service.retention(Number(limit), Number(days));
                    collect();
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Aplicar retenção simulada
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  service.burst();
                  collect();
                }}
              >
                Simular rajada de eventos
              </Button>
            </article>
          </section>
          <Button
            disabled={!!busy}
            onClick={() => {
              origin.current = document.activeElement as HTMLElement;
              void run("Preparando prévia sanitizada…", async (s) => {
                const payload = await service.export(
                  snapshot,
                  scenario === "error",
                  s,
                );
                if (!s.aborted) setReview(payload);
              });
            }}
          >
            Revisar exportação sanitizada
          </Button>
        </>
      )}
      <section className="workspace-list">
        <article>
          <h2>Limpeza seletiva</h2>
          <p>
            Cada categoria tem confirmação própria. Dados ativos e conteúdo da
            biblioteca são preservados conforme a política.
          </p>
          <div className="workspace-actions">
            {Object.entries({
              logs: "Logs",
              health: "Health",
              playback: "Histórico de reprodução",
              cache: "Cache elegível",
            }).map(([id, name]) => (
              <Button
                disabled={!!busy}
                variant="secondary"
                key={id}
                onClick={() => {
                  origin.current = document.activeElement as HTMLElement;
                  setCategory(id as DiagnosticCategory);
                }}
              >
                Limpar {name}
              </Button>
            ))}
          </div>
        </article>
      </section>
      {exported && (
        <details>
          <summary>Pacote de diagnóstico gerado na sessão</summary>
          <pre className="package-payload">{exported}</pre>
        </details>
      )}
      <details className="workspace-scenarios">
        <summary>Cenários de diagnóstico</summary>
        <label>
          Estado do diagnóstico
          <select
            disabled={!!busy}
            value={scenario}
            onChange={(e) => setScenario(e.target.value as DiagnosticScenario)}
          >
            {Object.entries({
              current: "Estado atual mockado",
              sample: "Métricas sintéticas",
              unknown: "Métricas desconhecidas",
              zero: "Zero medido na fixture",
              offline: "Offline",
              error: "Falha",
              partial: "Limpeza parcial",
            }).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </details>
      <Dialog.Root
        open={!!review || !!category}
        onOpenChange={(v) => {
          if (!v) back();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay" />
          <Dialog.Content
            className="modal library-package-modal"
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              origin.current?.focus();
            }}
          >
            <Dialog.Title>
              {category
                ? `Confirmar limpeza: ${category}`
                : "Revisar diagnóstico sanitizado"}
            </Dialog.Title>
            <Dialog.Description>
              {category
                ? "Apenas esta categoria será alterada na simulação. Favoritos e curadoria não serão removidos."
                : "Inspecione o conteúdo antes de gerar o pacote nesta sessão. Não envia nem grava arquivo real."}
            </Dialog.Description>
            {review && <pre className="package-payload">{review}</pre>}
            {error && <p role="alert">{error}</p>}
            {busy && <p role="status">{busy}</p>}
            <div className="workspace-actions">
              <Button
                disabled={!!busy}
                onClick={() =>
                  void run(
                    category
                      ? "Limpando categoria…"
                      : "Exportando diagnóstico…",
                    async (s) => {
                      if (category) {
                        const message = await service.clear(
                          category,
                          scenario,
                          s,
                        );
                        const value = await service.collect(
                          scenario === "error" ? "current" : scenario,
                          s,
                        );
                        if (!s.aborted) {
                          setSnapshot(value);
                          setCategory(null);
                          setNotice(message);
                        }
                      } else if (snapshot) {
                        const value = await service.export(
                          snapshot,
                          scenario === "error",
                          s,
                        );
                        if (!s.aborted) {
                          setExported(value);
                          setReview("");
                          setNotice(
                            "Pacote sanitizado gerado em memória. Nenhum arquivo gravado ou enviado.",
                          );
                        }
                      }
                    },
                  )
                }
              >
                {category
                  ? "Confirmar limpeza seletiva"
                  : "Gerar pacote simulado"}
              </Button>
              <Button variant="secondary" onClick={back}>
                {busy ? "Cancelar operação" : "Voltar sem confirmar"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}
