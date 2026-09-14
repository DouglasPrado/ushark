import { useEffect, useRef, useState, type MutableRefObject } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@ushark/ui";
import type {
  FallbackPreview,
  FallbackCandidate,
  FallbackScenario,
} from "@ushark/types/fallback";
export function PlaybackFallback({
  contentId,
  current,
  service,
  automatic,
  onSwitch,
  cancelLayer,
  cancelSeek,
  onSeek,
}: {
  onSeek: () => void;
  contentId: string;
  current: string;
  service: FallbackPreview;
  automatic: boolean;
  onSwitch: (c: FallbackCandidate) => void;
  cancelLayer: MutableRefObject<(() => boolean) | null>;
  cancelSeek: MutableRefObject<(() => void) | null>;
}) {
  const [open, setOpen] = useState(false),
    [auto, setAuto] = useState(automatic),
    [scenario, setScenario] = useState<FallbackScenario>("catalog"),
    [candidates, setCandidates] = useState<FallbackCandidate[]>([]),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [revision, setRevision] = useState(0),
    [history, setHistory] = useState(service.history());
  const c = useRef<AbortController | null>(null),
    lock = useRef(false),
    trigger = useRef<HTMLButtonElement>(null),
    autoTried = useRef(false),
    callback = useRef(onSwitch);
  callback.current = onSwitch;
  function cancel() {
    c.current?.abort();
    lock.current = false;
    setBusy("");
    setNotice("Preparo cancelado; fonte atual preservada.");
  }
  function close() {
    cancel();
    setOpen(false);
    requestAnimationFrame(() => trigger.current?.focus());
  }
  useEffect(() => {
    cancelLayer.current = () => {
      if (open) {
        close();
        return true;
      }
      return false;
    };
    cancelSeek.current = () => {
      if (lock.current) cancel();
    };
    return () => {
      cancelLayer.current = null;
      cancelSeek.current = null;
    };
  });
  useEffect(() => () => c.current?.abort(), []);
  async function prepare(candidate: FallbackCandidate) {
    if (lock.current) return;
    lock.current = true;
    setBusy("Preparando alternativa antes da troca…");
    setError("");
    const abort = new AbortController();
    c.current = abort;
    try {
      await service.prepare(candidate, scenario, abort.signal);
      if (!abort.signal.aborted) {
        service.record(current, false);
        service.record(candidate.id, true);
        callback.current(candidate);
        setHistory(service.history());
        setNotice(
          "Fonte da sessão trocada. Posição e override original preservados.",
        );
      }
    } catch (e) {
      if (!abort.signal.aborted) {
        setError((e as Error).message);
        setHistory(service.history());
      }
    } finally {
      if (!abort.signal.aborted) {
        lock.current = false;
        setBusy("");
      }
    }
  }
  useEffect(() => {
    if (!open) return;
    const abort = new AbortController();
    c.current = abort;
    lock.current = true;
    setBusy("Avaliando alternativas…");
    setError("");
    setNotice("");
    setCandidates([]);
    autoTried.current = false;
    service
      .alternatives(contentId, current, scenario, abort.signal)
      .then((values) => {
        if (!abort.signal.aborted) {
          setCandidates(values);
          lock.current = false;
          setBusy("");
        }
      })
      .catch((e: Error) => {
        if (!abort.signal.aborted) {
          setError(e.message);
          setBusy("");
          lock.current = false;
        }
      });
    return () => abort.abort();
  }, [open, scenario, revision, contentId, service]);
  useEffect(() => {
    if (open && auto && !busy && !autoTried.current && candidates.length) {
      autoTried.current = true;
      const candidate = candidates.find(
        (v) => v.compatible && !service.cooldown(v.id),
      );
      if (candidate) void prepare(candidate);
    }
  }, [open, auto, busy, candidates]);
  return (
    <>
      <Button ref={trigger} variant="secondary" onClick={() => setOpen(true)}>
        Recuperar fonte
      </Button>
      <Dialog.Root
        open={open}
        onOpenChange={(v) => {
          if (!v) close();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay" />
          <Dialog.Content
            className="modal library-package-modal"
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              trigger.current?.focus();
            }}
          >
            <Dialog.Title>Fonte degradada · recuperação simulada</Dialog.Title>
            <Dialog.Description>
              Prepare uma alternativa antes de trocar. Compatibilidade e medidas
              são fixtures; nenhuma troca real de stream acontece.
            </Dialog.Description>
            <p>
              Fonte atual: {current || "não identificada"} · escolha original
              preservada fora desta sessão
            </p>
            <label>
              <input
                type="checkbox"
                checked={auto}
                disabled={!!busy}
                onChange={(e) => setAuto(e.target.checked)}
              />
              Permitir troca automática nesta sessão
            </label>
            <label>
              Cenário de recuperação
              <select
                disabled={!!busy}
                value={scenario}
                onChange={(e) =>
                  setScenario(e.target.value as FallbackScenario)
                }
              >
                <option value="catalog">Fontes do catálogo</option>
                <option value="alternatives">Alternativas sintéticas</option>
                <option value="none">Sem alternativa / sem peers</option>
                <option value="incompatible">Edição incompatível</option>
                <option value="failure">Falha no preparo</option>
                <option value="offline">Offline sem candidata local</option>
              </select>
            </label>
            {busy && <p role="status">{busy}</p>}
            {error && <p role="alert">{error}</p>}
            {notice && <p role="status">{notice}</p>}
            {!busy && !candidates.length && (
              <p>
                Sem alternativa elegível. Tente novamente ou retorne à seleção
                de fontes.
              </p>
            )}
            <div className="workspace-list">
              {candidates.map((candidate) => (
                <article key={candidate.id}>
                  <h3>{candidate.name}</h3>
                  <p>{candidate.reason}</p>
                  {service.cooldown(candidate.id) && (
                    <p>Cooldown temporário; nova troca bloqueada.</p>
                  )}
                  <Button
                    disabled={
                      !!busy ||
                      !candidate.compatible ||
                      service.cooldown(candidate.id) ||
                      candidate.id === current
                    }
                    onClick={() => void prepare(candidate)}
                  >
                    Preparar {candidate.name}
                  </Button>
                </article>
              ))}
            </div>
            <div className="workspace-actions">
              <Button
                variant="secondary"
                disabled={!!busy}
                onClick={() => setRevision((v) => v + 1)}
              >
                Avaliar novamente
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  if (busy) cancel();
                  else close();
                }}
              >
                {busy ? "Cancelar preparo" : "Voltar ao player"}
              </Button>
            </div>
            <Button variant="secondary" onClick={onSeek}>
              Simular seek concorrente +30s
            </Button>
            <details>
              <summary>Histórico agregado local (simulação)</summary>
              {!history.length ? (
                <p>Nenhuma amostra nesta sessão.</p>
              ) : (
                history.map((h) => (
                  <p key={h.sourceId}>
                    {h.sourceId}: {h.success} sucessos, {h.failures} falhas ·{" "}
                    {h.throughput} Mbps · startup {h.startup}s · buffering{" "}
                    {h.buffering}s · idade {h.age}s · peso {h.weight.toFixed(2)}{" "}
                    · {h.algorithm}
                  </p>
                ))
              )}
              <Button
                variant="secondary"
                onClick={() => {
                  service.advance(65);
                  setHistory(service.history());
                  setRevision((v) => v + 1);
                }}
              >
                Simular expiração do histórico e cooldown
              </Button>
            </details>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
