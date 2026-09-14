import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@ushark/ui";
import type {
  RecoveryPreview,
  RecoveryScenario,
  BackupSummary,
} from "@ushark/types/recovery";
import { useNavigation } from "../app/navigation";
export function Recovery({
  service,
  onBack,
  onHome,
  onDiagnostics,
}: {
  service: RecoveryPreview;
  onBack: () => void;
  onHome: () => void;
  onDiagnostics: () => void;
}) {
  const [rows, setRows] = useState(service.list()),
    [name, setName] = useState("Backup da sessão"),
    [review, setReview] = useState<BackupSummary | null>(null),
    [scenario, setScenario] = useState<RecoveryScenario>("normal"),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [startup, setStartup] = useState(false),
    [component, setComponent] = useState("UI"),
    [failure, setFailure] = useState(false),
    [shutdown, setShutdown] = useState(false);
  const c = useRef<AbortController | null>(null),
    lock = useRef(false),
    origin = useRef<HTMLElement | null>(null),
    first = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    first.current?.focus();
    return () => c.current?.abort();
  }, []);
  function cancel() {
    c.current?.abort();
    lock.current = false;
    setBusy("");
    setNotice("Operação cancelada; estado confirmado preservado.");
  }
  function back() {
    if (busy) cancel();
    else if (review || shutdown) {
      setReview(null);
      setShutdown(false);
      requestAnimationFrame(() => origin.current?.focus());
    } else onBack();
  }
  useNavigation(back);
  async function run(label: string, task: (s: AbortSignal) => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(label);
    setError("");
    setNotice("");
    const control = new AbortController();
    c.current = control;
    try {
      await task(control.signal);
    } catch (e) {
      if (!control.signal.aborted) setError((e as Error).message);
    } finally {
      if (!control.signal.aborted) {
        setBusy("");
        lock.current = false;
        setRows(service.list());
      }
    }
  }
  return (
    <main className="workspace-page">
      <header>
        <Button ref={first} variant="secondary" onClick={back}>
          Voltar às preferências
        </Button>
        <h1>Backup e recuperação</h1>
      </header>
      <p>
        Snapshots da sessão em memória. Não grava backup real; recarregar o
        aplicativo descarta estes dados.
      </p>
      {error && !review && !shutdown && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {busy && !review && !shutdown && (
        <p role="status">
          {busy}
          <Button variant="secondary" onClick={cancel}>
            Cancelar operação
          </Button>
        </p>
      )}
      {startup && (
        <section className="workspace-list">
          <article>
            <h2>Inicialização após falha simulada</h2>
            <p>
              Último estado confirmado disponível. Inspecione diagnóstico,
              recupere o componente ou restaure um snapshot.
            </p>
            <label>
              Componente afetado
              <select
                disabled={!!busy}
                value={component}
                onChange={(e) => setComponent(e.target.value)}
              >
                {[
                  "UI",
                  "Core",
                  "torrentd",
                  "MPV",
                  "resume",
                  "manifest",
                  "cache",
                ].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              <input
                type="checkbox"
                checked={failure}
                onChange={(e) => setFailure(e.target.checked)}
                disabled={!!busy}
              />
              Simular falha de recuperação/shutdown
            </label>
            <div className="workspace-actions">
              <Button
                disabled={!!busy}
                onClick={() =>
                  void run("Recuperando componente…", async (s) => {
                    const message = await service.restart(
                      component,
                      failure,
                      s,
                    );
                    if (!s.aborted) setNotice(message);
                  })
                }
              >
                Tentar recuperar componente
              </Button>
              <Button
                disabled={!!busy}
                variant="secondary"
                onClick={() => {
                  service.rearm(component);
                  setNotice("Supervisor rearmado explicitamente na simulação.");
                  setError("");
                }}
              >
                Rearmar supervisor simulado
              </Button>
              <Button variant="secondary" onClick={onDiagnostics}>
                Abrir diagnóstico
              </Button>
              <Button variant="secondary" onClick={onHome}>
                Continuar com estado confirmado
              </Button>
            </div>
          </article>
        </section>
      )}
      <section className="workspace-list">
        <article>
          <h2>Criar snapshot consistente</h2>
          <label>
            Nome do backup
            <input
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
              disabled={!!busy}
            />
          </label>
          <p>
            Inclui catálogo, configurações, curadorias, assinaturas, progresso e
            fila mockados. Não inclui mídia nem chave privada real; pins são
            demonstrativos.
          </p>
          <Button
            disabled={!!busy}
            onClick={() =>
              void run("Criando backup…", async (s) => {
                await service.create(name, scenario, s);
                if (!s.aborted)
                  setNotice("Backup consistente criado somente nesta sessão.");
              })
            }
          >
            Criar backup simulado
          </Button>
        </article>
        {rows.map((row) => (
          <article key={row.id}>
            <h2>{row.name}</h2>
            <p>
              {row.created} · {row.parts.join(" · ")}
            </p>
            <Button
              disabled={!!busy}
              variant="secondary"
              onClick={() => {
                origin.current = document.activeElement as HTMLElement;
                void run("Validando backup…", async (s) => {
                  const value = await service.validate(row.id, scenario, s);
                  if (!s.aborted) setReview(value);
                });
              }}
            >
              Revisar restauração de {row.name}
            </Button>
          </article>
        ))}
      </section>
      {!rows.length && <p>Nenhum backup criado nesta sessão.</p>}
      <div className="workspace-actions">
        <Button
          disabled={!!busy}
          variant="secondary"
          onClick={() => {
            setStartup(true);
            setNotice(
              "Falha de startup simulada; estado atual não foi apagado.",
            );
          }}
        >
          Simular inicialização após falha
        </Button>
        <Button
          disabled={!!busy}
          variant="secondary"
          onClick={() => {
            origin.current = document.activeElement as HTMLElement;
            setShutdown(true);
          }}
        >
          Simular encerramento global
        </Button>
        <Button variant="secondary" onClick={onHome}>
          Abrir biblioteca
        </Button>
      </div>
      <details className="workspace-scenarios">
        <summary>Cenários de recuperação</summary>
        <label>
          Estado do backup
          <select
            disabled={!!busy}
            value={scenario}
            onChange={(e) => setScenario(e.target.value as RecoveryScenario)}
          >
            {Object.entries({
              normal: "Normal",
              invalid: "Inválido",
              incompatible: "Incompatível",
              locked: "DB ocupado",
              full: "Sem espaço",
              migration: "Migração falhou",
              partial: "Falha parcial",
              offline: "Offline",
            }).map(([id, v]) => (
              <option key={id} value={id}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </details>
      <Dialog.Root
        open={!!review || shutdown}
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
              {shutdown
                ? "Encerrar simulação com snapshot?"
                : "Substituir estado desta sessão?"}
            </Dialog.Title>
            <Dialog.Description>
              {shutdown
                ? "Salva snapshot em memória e simula encerramento limitado. A janela e os processos reais continuam abertos."
                : "Restaura catálogo, configuração e estado pessoal do backup selecionado. Guarda snapshot de segurança antes da substituição. Não altera arquivos reais."}
            </Dialog.Description>
            {review && (
              <>
                <h3>{review.name}</h3>
                <ul>
                  {review.parts.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </>
            )}
            {error && <p role="alert">{error}</p>}
            {busy && <p role="status">{busy}</p>}
            <div className="workspace-actions">
              <Button
                disabled={!!busy}
                onClick={() =>
                  void run(
                    shutdown ? "Encerrando simulação…" : "Preparando restore…",
                    async (s) => {
                      if (shutdown) await service.shutdown(failure, s);
                      else if (review)
                        await service.restore(review.id, scenario, s, setBusy);
                      if (!s.aborted) {
                        setReview(null);
                        setShutdown(false);
                        setNotice(
                          shutdown
                            ? "Encerramento simulado concluído; snapshot preservado nesta sessão."
                            : "Estado restaurado na sessão. Abra a biblioteca para conferir e retomar.",
                        );
                      }
                    },
                  )
                }
              >
                {shutdown
                  ? "Confirmar shutdown simulado"
                  : "Confirmar restauração em memória"}
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
