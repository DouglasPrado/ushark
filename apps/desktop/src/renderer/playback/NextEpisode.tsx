import { useEffect, useRef, useState, type RefObject } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@ushark/ui";
import type {
  NextEpisodePreview,
  NextResult,
} from "@ushark/types/next-episode";
import type { PlaybackContent } from "@ushark/types/player";
export function NextEpisode({
  content,
  position,
  duration,
  service,
  autoplay,
  preflight,
  onNext,
  onSimulateEnd,
  cancelLayer,
  consumerMode = false,
}: {
  content: PlaybackContent;
  position: number;
  duration: number;
  service: NextEpisodePreview;
  autoplay: boolean;
  preflight: boolean;
  onNext: (c: PlaybackContent) => void;
  onSimulateEnd: () => void;
  cancelLayer: RefObject<(() => boolean) | null>;
  consumerMode?: boolean;
}) {
  const [result, setResult] = useState<NextResult | null>(null),
    [sourceChoice, setSourceChoice] = useState<number | null>(null),
    [ready, setReady] = useState(false),
    [preparing, setPreparing] = useState(false),
    [error, setError] = useState(""),
    [cancelled, setCancelled] = useState(false),
    [seconds, setSeconds] = useState(5),
    [auto, setAuto] = useState(autoplay),
    [failure, setFailure] = useState(false),
    [revision, setRevision] = useState(0);
  const operation = useRef<AbortController | null>(null),
    started = useRef(false),
    claiming = useRef(false),
    origin = useRef<HTMLElement | null>(null);
  const desktop = service.runtime === "desktop";
  const ended = position >= duration,
    near = position >= Math.max(0, duration - 30);
  useEffect(() => {
    const abort = new AbortController();
    service
      .resolve(content.id, abort.signal)
      .then((r) => {
        if (!abort.signal.aborted) setResult(r);
      })
      .catch((e: Error) => {
        if (!abort.signal.aborted) setError(e.message);
      });
    return () => abort.abort();
  }, [content.id, service]);
  const needsChoice =
    !!result?.requiresSourceChoice && sourceChoice === null && !consumerMode;
  const selectedNext =
    consumerMode && result?.requiresSourceChoice
      ? result.choices?.[0]
      : sourceChoice === null
        ? result?.next
        : result?.choices?.[sourceChoice];
  useEffect(() => {
    if (
      needsChoice ||
      !result?.next ||
      !near ||
      cancelled ||
      (!preflight && !ended)
    )
      return;
    const abort = new AbortController();
    operation.current = abort;
    setPreparing(true);
    setReady(false);
    setError("");
    service
      .prepare(failure, abort.signal, selectedNext)
      .then(() => {
        if (!abort.signal.aborted) {
          setPreparing(false);
          setReady(true);
        }
      })
      .catch((e: Error) => {
        if (!abort.signal.aborted) {
          setPreparing(false);
          setError(e.message);
        }
      });
    return () => abort.abort();
  }, [
    result,
    near,
    preflight,
    ended,
    cancelled,
    service,
    failure,
    revision,
    needsChoice,
    sourceChoice,
  ]);
  const open = ended && !!result?.next && !cancelled && !started.current;
  function cancel() {
    operation.current?.abort();
    void service.cancel?.(new AbortController().signal);
    setCancelled(true);
    setPreparing(false);
  }
  async function start() {
    if (
      started.current ||
      claiming.current ||
      !selectedNext ||
      !ready ||
      needsChoice
    )
      return;
    claiming.current = true;
    try {
      const claimed = await service.claimStart?.(new AbortController().signal);
      if (claimed === false) return;
      started.current = true;
      operation.current?.abort();
      onNext(selectedNext);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      claiming.current = false;
    }
  }
  useEffect(() => {
    cancelLayer.current = () => {
      if (!open) return false;
      cancel();
      return true;
    };
    return () => {
      cancelLayer.current = null;
    };
  });
  useEffect(() => {
    if (!open || !auto || !ready || error) return;
    const timer = setTimeout(() => {
      if (seconds <= 1) void start();
      else setSeconds((n) => n - 1);
    }, 1000);
    return () => clearTimeout(timer);
  });
  useEffect(() => {
    if (open) origin.current = document.activeElement as HTMLElement;
  }, [open]);
  if (result?.kind === "not-episode") return null;
  return (
    <section className="next-episode">
      {!consumerMode && !desktop && (
        <details>
          <summary>Sequência de episódios</summary>
          <p>{result?.message ?? "Consultando sequência…"}</p>
          <label>
            <input
              type="checkbox"
              checked={auto}
              onChange={(e) => setAuto(e.target.checked)}
            />
            Reproduzir próximo automaticamente
          </label>
          <label>
            <input
              type="checkbox"
              checked={failure}
              onChange={(e) => setFailure(e.target.checked)}
            />
            Simular falha no preflight
          </label>
          <Button variant="secondary" onClick={onSimulateEnd}>
            Simular fim do episódio
          </Button>
          <p>
            Prévia: countdown de 5s; um próximo preparado, prioridade inferior
            ao atual. Nenhum download real.
          </p>
          {cancelled && (
            <p role="status">
              Próximo cancelado. Você continua no episódio atual.
            </p>
          )}
          {near && preparing && (
            <p role="status">Preparando próximo episódio…</p>
          )}
          {near && error && <p role="alert">{error}</p>}
          {ended && !result?.next && <p role="status">{result?.message}</p>}
          {cancelled && (
            <Button
              variant="secondary"
              onClick={() => {
                setCancelled(false);
                setSeconds(5);
                setRevision((v) => v + 1);
              }}
            >
              Reabrir próximo episódio
            </Button>
          )}
        </details>
      )}
      <Dialog.Root
        open={open}
        onOpenChange={(v) => {
          if (!v) cancel();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay" />
          <Dialog.Content
            className="modal"
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              origin.current?.focus();
            }}
          >
            <Dialog.Title>{result?.message}</Dialog.Title>
            <Dialog.Description>{result?.next?.title}</Dialog.Description>
            {result?.requiresSourceChoice && !consumerMode && (
              <label>
                Fonte do próximo episódio
                <select
                  value={sourceChoice ?? ""}
                  onChange={(e) => {
                    setReady(false);
                    setSeconds(5);
                    setSourceChoice(
                      e.target.value === "" ? null : Number(e.target.value),
                    );
                  }}
                >
                  <option value="">Escolha uma fonte</option>
                  {result.choices?.map((choice, index) => (
                    <option
                      key={`${choice.sourceId}:${choice.selector}`}
                      value={index}
                    >
                      {choice.sourceName}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {needsChoice && (
              <p>
                Seleção automática desligada. Escolha a fonte para continuar.
              </p>
            )}
            {preparing ? (
              <p role="status">Preparando próximo episódio…</p>
            ) : error ? (
              <>
                <p role="alert">{error}</p>
                <Button
                  onClick={() => {
                    setFailure(false);
                    setRevision((v) => v + 1);
                  }}
                >
                  Tentar preflight novamente
                </Button>
              </>
            ) : (
              <p role="status">
                {auto
                  ? `Próximo em ${seconds} segundos${consumerMode || desktop ? "" : " (simulado)"}`
                  : "Autoplay desligado. Inicie quando quiser."}
              </p>
            )}
            <Button
              disabled={!ready || !!error || needsChoice}
              onClick={() => void start()}
            >
              Tocar agora
            </Button>
            <Button variant="secondary" onClick={cancel}>
              Cancelar próximo
            </Button>
            {!consumerMode && (
              <label>
                <input
                  type="checkbox"
                  checked={auto}
                  onChange={(e) => setAuto(e.target.checked)}
                />
                Autoplay nesta sessão
              </label>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
