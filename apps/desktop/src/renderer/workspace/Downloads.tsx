import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@ushark/ui";
import type {
  DownloadItem,
  DownloadPreview,
  DownloadRequest,
} from "@ushark/types/downloads";
import type { PlaybackContent } from "@ushark/types/player";
import { useNavigation } from "../app/navigation";
import "./workspace.css";
export function Downloads({
  service,
  request,
  onBack,
  onPlay,
  suspended = false,
}: {
  service: DownloadPreview;
  request: DownloadRequest | null;
  onBack: () => void;
  onPlay: (c: PlaybackContent) => void;
  suspended?: boolean;
}) {
  const [rows, setRows] = useState(service.list()),
    [destination, setDestination] = useState(""),
    [adding, setAdding] = useState(!!request),
    [detail, setDetail] = useState<DownloadItem | null>(null),
    [remove, setRemove] = useState<string | null>(null),
    [limits, setLimits] = useState(false),
    [draft, setDraft] = useState({ ...service.limits }),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [scenario, setScenario] = useState<
      "normal" | "offline" | "disk" | "resume" | "error"
    >("normal");
  const origin = useRef<HTMLElement | null>(null),
    backButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const timer = setInterval(() => setRows(service.list()), 300);
    return () => clearInterval(timer);
  }, [service]);
  useEffect(() => {
    backButton.current?.focus();
  }, []);
  function back() {
    if (adding) setAdding(false);
    else if (remove) setRemove(null);
    else if (detail) setDetail(null);
    else if (limits) setLimits(false);
    else onBack();
  }
  useNavigation(back, !suspended);
  function perform(action: () => void) {
    setError("");
    try {
      action();
      setRows(service.list());
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const modal = adding || !!remove || !!detail || limits;
  return (
    <main className="workspace-page">
      <header>
        <Button ref={backButton} variant="secondary" onClick={onBack}>
          Voltar à biblioteca
        </Button>
        <h1>Downloads</h1>
        <Button
          variant="secondary"
          onClick={() => {
            origin.current = document.activeElement as HTMLElement;
            setDraft({ ...service.limits });
            setLimits(true);
          }}
        >
          Limites
        </Button>
      </header>
      <p>
        Transferências simuladas em memória. Nada é baixado ou gravado no disco.
      </p>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {!rows.length ? (
        <section className="workspace-empty">
          <h2>Nenhum download na fila</h2>
          <p>
            Abra um conteúdo e escolha Baixar para simular uma transferência.
          </p>
          <Button onClick={onBack}>Explorar biblioteca</Button>
        </section>
      ) : (
        <section className="workspace-list">
          {rows.map((row) => (
            <article key={row.id}>
              <h2>
                <button
                  onClick={() => {
                    origin.current = document.activeElement as HTMLElement;
                    setDetail(row);
                  }}
                >
                  {row.content.title}
                </button>
              </h2>
              <p>
                {row.source.name} · {row.destination}
              </p>
              <progress
                aria-label={`Progresso ${row.content.title}`}
                value={row.bytes}
                max={row.total}
              />
              <p>
                {Math.round((row.bytes / row.total) * 100)}% ·{" "}
                {(row.bytes / 1024 ** 2).toFixed(1)} /{" "}
                {(row.total / 1024 ** 2).toFixed(1)} MB ·{" "}
                {(row.speed / 1024 ** 2).toFixed(1)} MB/s · {row.peers} peers
                (simulados)
              </p>
              <p>
                {
                  {
                    queued: "Na fila",
                    downloading: "Baixando",
                    paused: "Pausado",
                    complete: "Completo",
                    cancelled: "Cancelado · catálogo preservado",
                    error: "Transferência interrompida",
                  }[row.state]
                }
                {row.error ? ` · ${row.error}` : ""}
              </p>
              <div className="workspace-actions">
                <Button
                  variant="secondary"
                  disabled={!["queued", "downloading"].includes(row.state)}
                  onClick={() =>
                    perform(() => service.command(row.id, "pause"))
                  }
                >
                  Pausar
                </Button>
                <Button
                  variant="secondary"
                  disabled={
                    !["paused", "error", "cancelled"].includes(row.state)
                  }
                  onClick={() =>
                    perform(() => service.command(row.id, "resume"))
                  }
                >
                  Retomar
                </Button>
                <Button
                  variant="secondary"
                  disabled={
                    row.state === "cancelled" || row.state === "complete"
                  }
                  onClick={() =>
                    perform(() => service.command(row.id, "cancel"))
                  }
                >
                  Cancelar download
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    origin.current = document.activeElement as HTMLElement;
                    setRemove(row.id);
                  }}
                >
                  Apagar dados
                </Button>
                <label>
                  Prioridade de {row.content.title}
                  <select
                    value={row.priority}
                    onChange={(e) =>
                      perform(() =>
                        service.priority(row.id, Number(e.target.value)),
                      )
                    }
                  >
                    <option value="0">Baixa</option>
                    <option value="1">Normal</option>
                    <option value="2">Alta</option>
                  </select>
                </label>
              </div>
              <details>
                <summary>Fixture deste download</summary>
                <Button
                  variant="secondary"
                  onClick={() =>
                    perform(() => service.command(row.id, "complete"))
                  }
                >
                  Simular conclusão
                </Button>
              </details>
            </article>
          ))}
        </section>
      )}
      <details className="workspace-scenarios">
        <summary>Cenários de download</summary>
        <label>
          Estado das transferências
          <select
            value={scenario}
            onChange={(e) => {
              const s = e.target.value as typeof scenario;
              setScenario(s);
              perform(() => service.configure(s));
            }}
          >
            {Object.entries({
              normal: "Normal",
              offline: "Offline",
              disk: "Sem espaço",
              resume: "Resume inválido",
              error: "Falha",
            }).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <Button
          variant="secondary"
          onClick={() =>
            perform(() => {
              service.restart();
              setNotice(
                "Reinício simulado: snapshot em memória restaurado. Reload real descarta a sessão.",
              );
            })
          }
        >
          Simular reinício
        </Button>
        <p>
          Playback ativo recebe prioridade; fila de fundo reduz velocidade.
          Health e resume reais permanecem adiados.
        </p>
      </details>
      <Dialog.Root
        open={modal && !suspended}
        onOpenChange={(v) => {
          if (!v) back();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay" />
          <Dialog.Content
            className="modal"
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              (origin.current ?? backButton.current)?.focus();
            }}
          >
            <Dialog.Title>
              {adding
                ? "Baixar conteúdo"
                : remove
                  ? "Apagar dados simulados?"
                  : limits
                    ? "Limites de transferência"
                    : detail?.content.title}
            </Dialog.Title>
            <Dialog.Description>
              {adding
                ? "Escolha um destino sintético. Confirmar adiciona à fila desta sessão."
                : remove
                  ? "Esta ação remove somente dados simulados da fila; o catálogo permanece."
                  : limits
                    ? "Limites ilustrativos; nenhuma rede será configurada."
                    : "Detalhes do conteúdo associado ao download."}
            </Dialog.Description>
            {adding && request && (
              <>
                <h3>{request.content.title}</h3>
                <p>{request.source.name}</p>
                <label>
                  Destino
                  <select
                    aria-label="Destino"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  >
                    <option value="">Escolher…</option>
                    <option>Biblioteca simulada</option>
                    <option>Cache simulado</option>
                  </select>
                </label>
                <Button
                  onClick={() =>
                    perform(() => {
                      service.enqueue(request, destination);
                      setAdding(false);
                      setNotice("Download enfileirado nesta sessão.");
                    })
                  }
                >
                  Confirmar download
                </Button>
              </>
            )}
            {remove && (
              <Button
                onClick={() =>
                  perform(() => {
                    service.command(remove, "remove");
                    setRemove(null);
                    setNotice(
                      "Dados simulados removidos. Conteúdo preservado no catálogo.",
                    );
                  })
                }
              >
                Confirmar remoção dos dados
              </Button>
            )}
            {detail && (
              <>
                <p>Fonte: {detail.source.name}</p>
                <p>Destino: {detail.destination}</p>
                <Button
                  onClick={() =>
                    onPlay({
                      ...detail.content,
                      sourceId: detail.source.id,
                      sourceName: detail.source.name,
                      selector: detail.source.selector,
                      available: true,
                      progressive: detail.state !== "complete",
                    })
                  }
                >
                  Assistir conteúdo
                </Button>
              </>
            )}
            {limits && (
              <>
                <div className="workspace-fields">
                  {Object.entries({
                    download: "Download (MB/s)",
                    upload: "Upload (MB/s)",
                    sessions: "Sessões máximas",
                    concurrent: "Downloads simultâneos",
                    probes: "Probes simultâneos",
                  }).map(([key, label]) => (
                    <label key={key}>
                      {label}
                      <input
                        type="number"
                        min="0"
                        value={draft[key as keyof typeof draft]}
                        onChange={(e) =>
                          setDraft({ ...draft, [key]: Number(e.target.value) })
                        }
                      />
                    </label>
                  ))}
                </div>
                <Button
                  onClick={() =>
                    perform(() => {
                      service.setLimits(draft);
                      setLimits(false);
                      setNotice("Limites aplicados à simulação.");
                    })
                  }
                >
                  Aplicar limites
                </Button>
              </>
            )}
            {error && <p role="alert">{error}</p>}
            <Button variant="secondary" onClick={back}>
              Cancelar
            </Button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}
