import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@ushark/ui";
import type {
  LibraryPreviewService,
  LibraryDraft,
  LibraryContent,
} from "@ushark/types/libraries";
import type {
  LibraryPublishPreview,
  PublishReview,
  PublishScenario,
  PublishedLibrary,
} from "@ushark/types/library-publish";
import { LibraryPreview } from "./LibraryPreview";
import { useNavigation } from "../app/navigation";
export function LibraryPublish({
  libraries,
  service,
  onBack,
}: {
  libraries: LibraryPreviewService;
  service: LibraryPublishPreview;
  onBack: () => void;
}) {
  const [detail, setDetail] = useState<string | null>(null);
  const [rows, setRows] = useState(service.list()),
    [auth, setAuth] = useState(service.authenticated),
    [selected, setSelected] = useState(""),
    [review, setReview] = useState<PublishReview | null>(null),
    [withdraw, setWithdraw] = useState<PublishedLibrary | null>(null),
    [busy, setBusy] = useState(""),
    [percent, setPercent] = useState(0),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [scenario, setScenario] = useState<PublishScenario>("normal");
  const c = useRef<AbortController | null>(null),
    lock = useRef(false),
    origin = useRef<HTMLElement | null>(null),
    first = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    void Promise.resolve(service.refresh?.()).then(() =>
      setRows(service.list()),
    );
    first.current?.focus();
    return () => c.current?.abort();
  }, []);
  function cancel() {
    c.current?.abort();
    lock.current = false;
    setBusy("");
    setNotice("Operação cancelada. Versões confirmadas preservadas.");
  }
  function back() {
    if (busy) cancel();
    else if (review || withdraw) {
      setReview(null);
      setWithdraw(null);
      setError("");
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
    setPercent(0);
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
  function prepare(draft: LibraryDraft, items?: LibraryContent[]) {
    origin.current = document.activeElement as HTMLElement;
    void run("Preparando diff…", async (s) => {
      const catalog = items ?? (await libraries.catalog());
      if (s.aborted) return;
      const result = await service.prepare(draft, catalog, s);
      if (!s.aborted) setReview(result);
    });
  }
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice("Texto demonstrativo copiado. O link não é público.");
    } catch {
      setError("Clipboard indisponível. Selecione e copie o texto do campo.");
    }
  }
  return (
    <main className="workspace-page">
      <header>
        <Button ref={first} variant="secondary" onClick={back}>
          Voltar às bibliotecas
        </Button>
        <h1>
          {service.runtime === "desktop"
            ? "Publicações"
            : "Publicações simuladas"}
        </h1>
      </header>
      <p>
        {service.runtime === "desktop"
          ? "Publicação explícita no Registry configurado; nenhuma versão é promovida sem confirmação."
          : "Ensaio de publicação em memória. Nenhum upload, conta ou Registry real. Links .invalid e códigos DEMO funcionam apenas nesta prévia."}
      </p>
      <p>Autorização de editor é separada de assinatura de autoria.</p>
      {error && !review && !withdraw && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {busy && !review && !withdraw && (
        <p role="status">
          {busy}
          <Button onClick={cancel}>Cancelar operação</Button>
        </p>
      )}
      <section className="workspace-list">
        <article>
          <h2>{auth ? "Editor simulado conectado" : "Entre para publicar"}</h2>
          <Button
            variant="secondary"
            disabled={!!busy}
            onClick={() => {
              service.authenticated = !auth;
              setAuth(!auth);
            }}
          >
            {auth ? "Sair da conta simulada" : "Entrar como editor simulado"}
          </Button>
          <label>
            Biblioteca para publicar
            <select
              disabled={!!busy}
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">Escolher rascunho…</option>
              {libraries.list().map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          {!libraries.list().length && (
            <p>Nenhum rascunho salvo. Crie uma curadoria no editor.</p>
          )}
          <Button
            disabled={!!busy || !auth}
            onClick={() => {
              const draft = libraries.list().find((d) => d.id === selected);
              if (draft) prepare(draft);
              else setError("Escolha um rascunho para revisar.");
            }}
          >
            Revisar publicação
          </Button>
        </article>
        {rows.map((row) => (
          <article key={row.snapshot.key}>
            <h2>
              {row.snapshot.draft.name} · v{row.snapshot.version}
            </h2>
            <p>
              {row.withdrawn
                ? "Retirada da resolução simulada"
                : "Publicada na simulação"}{" "}
              · snapshot imutável · não assinado
            </p>
            <label>
              Link de {row.snapshot.draft.name} v{row.snapshot.version}
              <input
                readOnly
                value={row.link}
                onFocus={(e) => e.target.select()}
              />
            </label>
            <label>
              Código de {row.snapshot.draft.name} v{row.snapshot.version}
              <input
                readOnly
                value={row.code}
                onFocus={(e) => e.target.select()}
              />
            </label>
            <div className="workspace-actions">
              <Button variant="secondary" onClick={() => void copy(row.link)}>
                Copiar link v{row.snapshot.version}
              </Button>
              <Button variant="secondary" onClick={() => void copy(row.code)}>
                Copiar código v{row.snapshot.version}
              </Button>
              <Button
                variant="secondary"
                disabled={!!busy || !auth}
                onClick={() =>
                  prepare(row.snapshot.draft, row.snapshot.catalog)
                }
              >
                Criar nova versão baseada em v{row.snapshot.version}
              </Button>
              <Button
                variant="secondary"
                disabled={row.withdrawn || !!busy || !auth}
                onClick={() => {
                  origin.current = document.activeElement as HTMLElement;
                  setWithdraw(row);
                }}
              >
                Retirar publicação v{row.snapshot.version}
              </Button>
            </div>
          </article>
        ))}
      </section>
      {service.runtime !== "desktop" && (
        <details className="workspace-scenarios">
          <summary>Cenários de publicação</summary>
          <label>
            Estado da publicação
            <select
              disabled={!!busy}
              value={scenario}
              onChange={(e) => setScenario(e.target.value as PublishScenario)}
            >
              {Object.entries({
                normal: "Normal",
                permission: "Sem permissão",
                quota: "Quota excedida",
                conflict: "Conflito de versão",
                partial: "Falha parcial",
                offline: "Offline",
              }).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </details>
      )}
      <Dialog.Root
        open={!!review || !!withdraw}
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
              (origin.current ?? first.current)?.focus();
            }}
          >
            <Dialog.Title>
              {withdraw
                ? "Retirar publicação simulada?"
                : "Revisar mudanças antes de publicar"}
            </Dialog.Title>
            <Dialog.Description>
              {withdraw
                ? "Snapshots já instalados continuam no perfil receptor. A resolução do link será desativada nesta simulação."
                : "O rascunho não sincroniza automaticamente. Confirme para criar uma nova versão simulada."}
            </Dialog.Description>
            {review && (
              <>
                <p>
                  Versão atual {review.expectedVersion} → nova versão{" "}
                  {review.snapshot.version}
                </p>
                <ul>
                  {review.changes.map((change) => (
                    <li key={change}>{change}</li>
                  ))}
                </ul>
                <LibraryPreview
                  draft={review.snapshot.draft}
                  catalog={review.snapshot.catalog}
                  progress={() => 0}
                  onContent={setDetail}
                />
              </>
            )}
            {detail && review && (
              <section>
                <h3>
                  {review.snapshot.catalog.find((c) => c.id === detail)?.title}
                </h3>
                <p>
                  {
                    review.snapshot.catalog.find((c) => c.id === detail)
                      ?.synopsis
                  }
                </p>
                <p>Somente informações da curadoria; mídia não será enviada.</p>
                <Button variant="secondary" onClick={() => setDetail(null)}>
                  Fechar detalhe da prévia
                </Button>
              </section>
            )}
            {notice && <p role="status">{notice}</p>}
            {error && <p role="alert">{error}</p>}
            {busy && (
              <div role="status">
                {busy}
                <progress
                  max={100}
                  value={percent}
                  aria-label="Progresso da publicação simulada"
                />
              </div>
            )}
            <div className="workspace-actions">
              <Button
                disabled={!!busy}
                onClick={() =>
                  void run(
                    withdraw
                      ? "Retirando simulação…"
                      : "Upload simulado em andamento…",
                    async (s) => {
                      if (withdraw)
                        await service.withdraw(
                          withdraw.snapshot.draft.id,
                          scenario,
                          s,
                        );
                      else if (review)
                        await service.publish(review, scenario, s, setPercent);
                      if (!s.aborted) {
                        setRows(service.list());
                        setReview(null);
                        setWithdraw(null);
                        setNotice(
                          withdraw
                            ? "Publicação retirada na simulação; instalações preservadas."
                            : "Versão publicada somente na simulação. Copie o link/código demonstrativo.",
                        );
                        requestAnimationFrame(() => origin.current?.focus());
                      }
                    },
                  )
                }
              >
                {withdraw
                  ? "Confirmar retirada simulada"
                  : "Confirmar publicação simulada"}
              </Button>
              {review && error.includes("Conflito") && (
                <Button
                  variant="secondary"
                  onClick={() =>
                    prepare(review.snapshot.draft, review.snapshot.catalog)
                  }
                >
                  Recarregar diff
                </Button>
              )}
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
