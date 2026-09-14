import { LibraryFork } from "./LibraryFork";
import type { LibraryForkPreview } from "@ushark/types/library-fork";
import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@ushark/ui";
import type {
  SubscriptionPreview,
  SyncScenario,
} from "@ushark/types/subscriptions";
import type { LibraryPackageSnapshot } from "@ushark/types/library-package";
import type { LibraryTrustPreview } from "@ushark/types/library-trust";
import type {
  SelectionPreview,
  SelectionPreferences,
} from "@ushark/types/selection";
import type { PlaybackContent } from "@ushark/types/player";
import type { DownloadRequest } from "@ushark/types/downloads";
import { LibraryPreview } from "./LibraryPreview";
import { LibraryTrust } from "./LibraryTrust";
import { SourceChoices } from "../catalog/SourceChoices";
import { useNavigation } from "../app/navigation";
export function Subscriptions({
  service,
  fork,
  onForked,
  trust,
  selection,
  preferences,
  onBack,
  onPlay,
  onDownload,
  progress,
  suspended = false,
}: {
  service: SubscriptionPreview;
  fork: LibraryForkPreview;
  onForked: (id: string) => void;
  trust: LibraryTrustPreview;
  selection: SelectionPreview;
  preferences: SelectionPreferences;
  onBack: () => void;
  onPlay: (v: PlaybackContent) => void;
  onDownload: (r: DownloadRequest) => void;
  progress: (id: string) => number;
  suspended?: boolean;
}) {
  const [forkActive, setForkActive] = useState(false);
  const [rows, setRows] = useState(service.list()),
    [reference, setReference] = useState(""),
    [opened, setOpened] = useState<string | null>(null),
    [detail, setDetail] = useState<string | null>(null),
    [review, setReview] = useState<{
      snapshot: LibraryPackageSnapshot;
      id?: string;
    } | null>(null),
    [confirm, setConfirm] = useState<"unsubscribe" | "rollback" | null>(null),
    [trusted, setTrusted] = useState(false),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [scenario, setScenario] = useState<SyncScenario>("normal");
  const c = useRef<AbortController | null>(null),
    lock = useRef(false),
    origin = useRef<HTMLElement | null>(null),
    first = useRef<HTMLButtonElement>(null),
    backoff = useRef(0);
  useEffect(() => {
    void Promise.resolve(service.refresh?.()).then(refresh);
    first.current?.focus();
    return () => c.current?.abort();
  }, []);
  const active = rows.find((s) => s.id === opened),
    item = active?.snapshot.catalog.find((c) => c.id === detail);
  const refresh = () => setRows(service.list());
  function cancel() {
    c.current?.abort();
    lock.current = false;
    setBusy("");
    setNotice("Operação cancelada; versão instalada preservada.");
  }
  function close() {
    setDetail(null);
    setReview(null);
    setConfirm(null);
    setError("");
    requestAnimationFrame(() => {
      if (origin.current?.isConnected) origin.current.focus();
      else first.current?.focus();
    });
  }
  function back() {
    if (busy) cancel();
    else if (detail || review || confirm) close();
    else if (opened) setOpened(null);
    else onBack();
  }
  useNavigation(back, !suspended && !forkActive);
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
      if (!abort.signal.aborted) {
        setError((e as Error).message);
        backoff.current = Date.now() + 10000;
      }
    } finally {
      if (!abort.signal.aborted) {
        lock.current = false;
        setBusy("");
      }
    }
  }
  function check(id: string) {
    origin.current = document.activeElement as HTMLElement;
    void run("Verificando atualização…", async (signal) => {
      const snapshot = await service.check(id, scenario, signal);
      if (!signal.aborted) {
        if (snapshot) setReview({ snapshot, id });
        else
          setNotice("Biblioteca já está na versão mais recente da simulação.");
      }
    });
  }
  useEffect(() => {
    if (suspended) return;
    const timer = setInterval(() => {
      if (
        forkActive ||
        lock.current ||
        review ||
        detail ||
        confirm ||
        Date.now() < backoff.current
      )
        return;
      const row = service.list().find((s) => s.auto && !s.paused);
      if (row) check(row.id);
    }, 8000);
    return () => clearInterval(timer);
  }, [service, scenario, suspended, review, detail, confirm, forkActive]);
  const view = active
    ? {
        ...active.snapshot.draft,
        memberships: active.snapshot.draft.memberships.filter(
          (m) => !active.hidden.includes(m.contentId),
        ),
        collections: active.snapshot.draft.collections.map((col) => ({
          ...col,
          items: col.items.filter((id) => !active.hidden.includes(id)),
        })),
      }
    : null;
  return (
    <main className="workspace-page">
      <header>
        <Button ref={first} variant="secondary" onClick={back}>
          {opened ? "Voltar às assinaturas" : "Voltar às bibliotecas"}
        </Button>
        <h1>Assinaturas</h1>
      </header>
      <p>
        Acompanhe curadorias nesta simulação em memória. Links externos não são
        acessados.
      </p>
      {notice && <p role="status">{notice}</p>}
      {error && !review && !detail && !confirm && <p role="alert">{error}</p>}
      {busy && !review && (
        <div role="status">
          {busy}
          <Button variant="secondary" onClick={cancel}>
            Cancelar sincronização
          </Button>
        </div>
      )}
      {active && view ? (
        <>
          <div className="workspace-actions">
            <LibraryFork
              snapshot={active.snapshot}
              service={fork}
              onActive={setForkActive}
              onCreated={onForked}
            />
            <Button
              disabled={!!busy}
              variant="secondary"
              onClick={() => check(active.id)}
            >
              Verificar atualização
            </Button>
            <Button
              disabled={!active.previous || !!busy}
              variant="secondary"
              onClick={() => {
                origin.current = document.activeElement as HTMLElement;
                setConfirm("rollback");
              }}
            >
              Reverter à versão anterior
            </Button>
            <Button
              disabled={!!busy}
              variant="secondary"
              onClick={() => {
                origin.current = document.activeElement as HTMLElement;
                setConfirm("unsubscribe");
              }}
            >
              Deixar de assinar
            </Button>
          </div>
          <p>
            Versão instalada: {active.snapshot.version} · snapshot local
            simulado
          </p>
          <label>
            <input
              type="checkbox"
              checked={active.auto}
              onChange={(e) => {
                service.configure(active.id, { auto: e.target.checked });
                refresh();
              }}
            />
            Verificar automaticamente (ciclo simulado)
          </label>
          <label>
            <input
              type="checkbox"
              checked={active.paused}
              onChange={(e) => {
                service.configure(active.id, { paused: e.target.checked });
                refresh();
              }}
            />
            Pausar verificações automáticas
          </label>
          <LibraryPreview
            draft={view}
            catalog={active.snapshot.catalog}
            progress={progress}
            onContent={(id) => {
              origin.current = document.activeElement as HTMLElement;
              setDetail(id);
            }}
          />
          {active.hidden.length > 0 && (
            <section>
              <h2>Itens ocultos nesta biblioteca</h2>
              {active.hidden.map((id) => (
                <Button
                  key={id}
                  variant="secondary"
                  onClick={() => {
                    service.hide(active.id, id);
                    refresh();
                  }}
                >
                  Restaurar{" "}
                  {active.snapshot.catalog.find((c) => c.id === id)?.title ??
                    "item removido da origem"}
                </Button>
              ))}
            </section>
          )}
        </>
      ) : (
        <>
          <section className="workspace-list">
            <article>
              <h2>Adicionar biblioteca</h2>
              <label>
                Link, código ou deep link
                <input
                  value={reference}
                  maxLength={2048}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="DEMO-CINEMA"
                />
              </label>
              <div className="workspace-actions">
                <Button
                  disabled={!!busy}
                  onClick={() => {
                    origin.current = document.activeElement as HTMLElement;
                    void run("Resolvendo biblioteca…", async (signal) => {
                      const snapshot = await service.resolve(
                        reference,
                        scenario,
                        signal,
                      );
                      if (!signal.aborted) setReview({ snapshot });
                    });
                  }}
                >
                  Revisar biblioteca
                </Button>
                <Button
                  disabled={!!busy}
                  variant="secondary"
                  onClick={() => setReference("DEMO-CINEMA")}
                >
                  Usar código de exemplo
                </Button>
              </div>
            </article>
            {rows.map((s) => (
              <article key={s.id}>
                <h2>{s.snapshot.draft.name}</h2>
                <p>
                  Instalada · versão {s.snapshot.version} ·{" "}
                  {s.paused
                    ? "Verificações pausadas"
                    : s.auto
                      ? "Verificação automática simulada"
                      : "Verificação manual"}
                </p>
                <Button
                  onClick={() => {
                    setOpened(s.id);
                    setError("");
                    setNotice("");
                  }}
                >
                  Abrir {s.snapshot.draft.name}
                </Button>
              </article>
            ))}
          </section>
          {!rows.length && <p>Nenhuma assinatura instalada.</p>}
        </>
      )}
      <details className="workspace-scenarios">
        <summary>Cenários de assinatura</summary>
        <label>
          Estado da sincronização
          <select
            disabled={!!busy}
            value={scenario}
            onChange={(e) => {
              setScenario(e.target.value as SyncScenario);
              setError("");
            }}
          >
            {Object.entries({
              normal: "Normal",
              update: "Nova versão",
              remove: "Autor remove conteúdo",
              "no-sources": "Autor remove fontes",
              offline: "Offline",
              error: "Erro remoto",
              "stage-crash": "Crash no staging",
              "verify-crash": "Crash na verificação",
              "commit-crash": "Crash na aplicação",
              hash: "Mesma versão com outro hash",
              downgrade: "Downgrade remoto",
            }).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </details>
      <Dialog.Root
        open={!!(review || detail || confirm) && !suspended}
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
              if (!suspended)
                (origin.current?.isConnected
                  ? origin.current
                  : first.current
                )?.focus();
            }}
          >
            <Dialog.Title>
              {confirm === "unsubscribe"
                ? "Deixar de assinar esta biblioteca?"
                : confirm === "rollback"
                  ? "Reverter versão instalada?"
                  : detail
                    ? (item?.title ?? "Conteúdo indisponível")
                    : review?.id
                      ? "Revisar atualização"
                      : "Revisar assinatura"}
            </Dialog.Title>
            <Dialog.Description>
              {confirm === "unsubscribe"
                ? "Remove somente esta origem. Histórico, favoritos, overrides, downloads e conteúdos salvos na pessoal são preservados."
                : confirm === "rollback"
                  ? "Restaura explicitamente o snapshot anterior em memória. Não altera sua informação pessoal."
                  : detail
                    ? (item?.synopsis ??
                      "Informações do conteúdo nesta origem.")
                    : "Revise curadoria, versão e identidade antes de confirmar."}
            </Dialog.Description>
            {review && (
              <>
                <p>
                  {review.snapshot.draft.name} · versão{" "}
                  {review.snapshot.version}
                </p>
                {review.id && (
                  <p>
                    Atual{" "}
                    {rows.find((s) => s.id === review.id)?.snapshot.version} →{" "}
                    {review.snapshot.version}. Conteúdos:{" "}
                    {
                      rows.find((s) => s.id === review.id)?.snapshot.draft
                        .memberships.length
                    }{" "}
                    → {review.snapshot.draft.memberships.length}. Dados pessoais
                    preservados.
                  </p>
                )}
                <fieldset disabled={!!busy} className="library-editor">
                  <LibraryTrust
                    snapshot={review.snapshot}
                    service={trust}
                    onAllowed={setTrusted}
                  />
                </fieldset>
                <LibraryPreview
                  draft={review.snapshot.draft}
                  catalog={review.snapshot.catalog}
                  progress={() => 0}
                  onContent={(id) =>
                    setNotice(
                      `Prévia: ${review.snapshot.catalog.find((c) => c.id === id)?.title ?? "Conteúdo ausente"}. Disponível após confirmar.`,
                    )
                  }
                />
              </>
            )}
            {item && active && (
              <>
                <p>
                  Origem: {active.snapshot.draft.name} · progresso pessoal:{" "}
                  {Math.floor(progress(item.id))}s
                </p>
                <div className="workspace-actions">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      service.toggleFavorite(item.id);
                      refresh();
                    }}
                  >
                    {service.favorite(item.id)
                      ? "Remover favorito"
                      : "Favoritar"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      service.savePersonal({
                        ...item,
                        sources: service.sources(item.id),
                      });
                      setNotice(
                        "Conteúdo salvo na biblioteca pessoal desta sessão.",
                      );
                    }}
                  >
                    Salvar na biblioteca pessoal
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      service.hide(active.id, item.id);
                      refresh();
                      close();
                    }}
                  >
                    Ocultar nesta biblioteca
                  </Button>
                </div>
                <SourceChoices
                  contentId={item.id}
                  sources={service
                    .sources(item.id)
                    .filter(
                      (s) =>
                        scenario !== "offline" ||
                        s.local ||
                        selection.isLocal?.(s.id),
                    )}
                  service={selection}
                  preferences={preferences}
                  suspended={suspended}
                  onPlay={(source) =>
                    onPlay({
                      id: item.id,
                      title: item.title,
                      sourceId: source.id,
                      sourceName: source.name,
                      selector: source.selector,
                      progressive: !source.local,
                      available: true,
                    })
                  }
                  onDownload={(source) =>
                    onDownload({
                      content: { id: item.id, title: item.title },
                      source,
                    })
                  }
                />
                {scenario === "offline" && (
                  <p>
                    Offline: somente fontes locais simuladas podem ser usadas.
                  </p>
                )}
              </>
            )}
            {notice && <p role="status">{notice}</p>}
            {error && <p role="alert">{error}</p>}
            {busy && <p role="status">{busy}</p>}
            <div className="workspace-actions">
              {review && (
                <Button
                  disabled={!!busy || !trusted}
                  onClick={() =>
                    void run(
                      review.id
                        ? "Preparando atualização…"
                        : "Instalando assinatura…",
                      async (signal) => {
                        if (review.id)
                          await service.apply(
                            review.id,
                            review.snapshot,
                            scenario,
                            signal,
                            setBusy,
                          );
                        else await service.install(review.snapshot, signal);
                        if (!signal.aborted) {
                          refresh();
                          setOpened(review.snapshot.draft.id);
                          close();
                          setNotice(
                            review.id
                              ? "Atualização aplicada. Estado pessoal preservado."
                              : "Assinatura instalada nesta sessão.",
                          );
                        }
                      },
                    )
                  }
                >
                  {review.id
                    ? "Aplicar atualização simulada"
                    : "Confirmar assinatura simulada"}
                </Button>
              )}
              {confirm && active && (
                <Button
                  onClick={() => {
                    if (confirm === "unsubscribe") {
                      service.unsubscribe(active.id);
                      setOpened(null);
                    } else service.rollback(active.id);
                    refresh();
                    close();
                    setNotice(
                      confirm === "unsubscribe"
                        ? "Assinatura removida; estado pessoal preservado."
                        : "Rollback explícito concluído na simulação.",
                    );
                  }}
                >
                  Confirmar{" "}
                  {confirm === "unsubscribe"
                    ? "remoção da assinatura"
                    : "rollback"}
                </Button>
              )}
              <Button variant="secondary" onClick={back}>
                {busy ? "Cancelar sincronização" : "Voltar sem alterar"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}
