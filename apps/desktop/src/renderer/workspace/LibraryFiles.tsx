import { LibraryTrust } from "./LibraryTrust";
import type { LibraryTrustPreview } from "@ushark/types/library-trust";
import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@ushark/ui";
import type { LibraryPreviewService } from "@ushark/types/libraries";
import type {
  LibraryPackagePreview,
  LibraryPackageSnapshot,
  PackageScenario,
} from "@ushark/types/library-package";
import { LibraryPreview } from "./LibraryPreview";
import { useNavigation } from "../app/navigation";
export function LibraryFiles({
  libraries,
  trust,
  service,
  onBack,
}: {
  libraries: LibraryPreviewService;
  trust: LibraryTrustPreview;
  service: LibraryPackagePreview;
  onBack: () => void;
}) {
  const [trusted, setTrusted] = useState(false),
    [storageUnavailable, setStorageUnavailable] = useState(false);
  const [exports, setExports] = useState(service.exports()),
    [received, setReceived] = useState(service.received()),
    [selected, setSelected] = useState(""),
    [review, setReview] = useState<LibraryPackageSnapshot | null>(null),
    [opened, setOpened] = useState<LibraryPackageSnapshot | null>(null),
    [detail, setDetail] = useState<string | null>(null),
    [stage, setStage] = useState(false),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [scenario, setScenario] = useState<PackageScenario>("normal");
  const controller = useRef<AbortController | null>(null),
    lock = useRef(false),
    origin = useRef<HTMLElement | null>(null),
    first = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    first.current?.focus();
    return () => controller.current?.abort();
  }, []);
  function cancel() {
    controller.current?.abort();
    lock.current = false;
    setBusy("");
    setNotice("Operação cancelada; dados confirmados preservados.");
  }
  function back() {
    if (busy) cancel();
    else if (detail) setDetail(null);
    else if (review) {
      setReview(null);
      setStage(false);
      requestAnimationFrame(() => origin.current?.focus());
    } else if (opened) setOpened(null);
    else onBack();
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
    const c = new AbortController();
    controller.current = c;
    try {
      await task(c.signal);
    } catch (e) {
      if (!c.signal.aborted) setError((e as Error).message);
    } finally {
      if (!c.signal.aborted) {
        lock.current = false;
        setBusy("");
      }
    }
  }
  function inspect(value: LibraryPackageSnapshot) {
    origin.current = document.activeElement as HTMLElement;
    void run("Validando pacote…", async (signal) => {
      const next = await service.stage(value, scenario, signal);
      if (!signal.aborted) {
        setReview(next);
        setStage(true);
      }
    });
  }
  const saved = libraries.list();
  const active = opened ?? review;
  return (
    <main className="workspace-page">
      <header>
        <Button ref={first} variant="secondary" onClick={back}>
          {opened ? "Voltar aos arquivos" : "Voltar às bibliotecas"}
        </Button>
        <h1>Arquivos de biblioteca</h1>
      </header>
      <p>
        Transferência simulada entre perfis em memória. Nenhum arquivo .tslib é
        lido ou gravado.
      </p>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {scenario === "offline" && (
        <p>Offline: pacotes locais simulados continuam acessíveis.</p>
      )}
      {busy && (
        <div role="status">
          {busy}
          <Button variant="secondary" onClick={cancel}>
            Cancelar operação
          </Button>
        </div>
      )}
      {opened ? (
        <>
          <p>Perfil receptor · sem mídia ou progresso pessoal do autor</p>
          <LibraryPreview
            draft={opened.draft}
            catalog={opened.catalog}
            progress={() => 0}
            onContent={(id) => setDetail(id)}
          />
        </>
      ) : (
        <>
          <section className="workspace-list">
            <article>
              <h2>Preparar exportação</h2>
              <label>
                Rascunho salvo
                <select
                  disabled={!!busy}
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  <option value="">Escolher biblioteca…</option>
                  {saved.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>
              {!saved.length && (
                <p>Crie e salve uma curadoria no editor para exportá-la.</p>
              )}
              <Button
                disabled={!!busy}
                onClick={() => {
                  const draft = saved.find((d) => d.id === selected);
                  if (!draft) {
                    setError("Escolha um rascunho salvo.");
                    return;
                  }
                  origin.current = document.activeElement as HTMLElement;
                  void run("Preparando snapshot…", async (signal) => {
                    const catalog = await libraries.catalog();
                    if (signal.aborted) return;
                    const value = await service.export(draft, catalog, signal);
                    if (!signal.aborted) {
                      setExports(service.exports());
                      setReview(value);
                      setStage(false);
                    }
                  });
                }}
              >
                Preparar pacote simulado
              </Button>
            </article>
            <article>
              <h2>Importar pacote</h2>
              <Button
                disabled={!!busy}
                variant="secondary"
                onClick={() => inspect(service.fixture())}
              >
                Escolher .tslib sintético
              </Button>
              {exports.map((p) => (
                <div key={p.key}>
                  <p>
                    {p.draft.name} · versão {p.version}
                  </p>
                  <Button
                    disabled={!!busy}
                    variant="secondary"
                    onClick={() => inspect(p)}
                  >
                    Importar {p.draft.name} v{p.version}
                  </Button>
                </div>
              ))}
            </article>
            <article>
              <h2>Perfil receptor</h2>
              {!received.length ? (
                <p>Nenhuma biblioteca importada.</p>
              ) : (
                received.map((p) => (
                  <div key={p.key}>
                    <p>
                      {p.draft.name} · versão {p.version}
                    </p>
                    <Button onClick={() => setOpened(p)}>
                      Abrir {p.draft.name} offline
                    </Button>
                  </div>
                ))
              )}
            </article>
          </section>
        </>
      )}
      <details className="workspace-scenarios">
        <summary>Cenários de arquivo</summary>
        <label>
          Estado do pacote
          <select
            disabled={!!busy || !!review}
            value={scenario}
            onChange={(e) => {
              setScenario(e.target.value as PackageScenario);
              setError("");
            }}
          >
            {Object.entries({
              normal: "Válido",
              minor: "Minor compatível",
              major: "Major incompatível",
              invalid: "Manifest inválido",
              asset: "Asset ausente",
              signature: "Assinatura não suportada",
              traversal: "Traversal",
              absolute: "Caminho absoluto",
              symlink: "Symlink",
              bomb: "ZIP bomb",
              code: "Código executável",
              limits: "Limites excedidos",
              protocol: "Protocolo proibido",
              conflict: "Conflito de versão",
              "commit-error": "Falha ao importar",
              offline: "Offline",
            }).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </details>
      <Dialog.Root
        open={!!review || !!detail}
        onOpenChange={(open) => {
          if (!open) back();
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
              {detail
                ? active?.catalog.find((c) => c.id === detail)?.title
                : stage
                  ? "Revisar importação"
                  : "Revisar exportação simulada"}
            </Dialog.Title>
            <Dialog.Description>
              {detail
                ? "Mídia não acompanha o pacote. Fontes declarativas não iniciam download automaticamente."
                : "Revise o snapshot antes de confirmar. Identificador de integridade demonstrativo, sem verificação criptográfica."}
            </Dialog.Description>
            {detail ? (
              <Button variant="secondary" onClick={() => setDetail(null)}>
                Voltar à biblioteca
              </Button>
            ) : (
              review && (
                <>
                  <p>
                    {review.draft.name} · autor{" "}
                    {review.draft.author || "não informado"} ·{" "}
                    {review.draft.memberships.length} conteúdos · versão{" "}
                    {review.version} · schema {review.schema}
                  </p>
                  <p>Integridade demonstrativa: {review.integrity}</p>
                  <p>
                    Inclui curadoria, fontes selecionadas e referências às artes
                    sintéticas. Exclui vídeo, progresso, favoritos, preferências
                    e caminhos pessoais.
                  </p>
                  {review.warnings.map((w) => (
                    <p role="status" key={w}>
                      {w}
                    </p>
                  ))}
                  {stage && (
                    <fieldset disabled={!!busy} className="library-editor">
                      <LibraryTrust
                        snapshot={review}
                        service={trust}
                        onAllowed={setTrusted}
                      />
                    </fieldset>
                  )}
                  {stage && (
                    <LibraryPreview
                      draft={review.draft}
                      catalog={review.catalog}
                      progress={() => 0}
                      onContent={setDetail}
                    />
                  )}
                  {!stage && (
                    <section className="trust-panel">
                      <h3>Assinar pacote próprio</h3>
                      <p>
                        {review.signature
                          ? "Assinatura demonstrativa anexada; sem criptografia real."
                          : "Pacote não assinado."}
                      </p>
                      <label>
                        <input
                          type="checkbox"
                          checked={storageUnavailable}
                          onChange={(e) =>
                            setStorageUnavailable(e.target.checked)
                          }
                        />
                        Simular armazenamento seguro indisponível
                      </label>
                      <Button
                        disabled={!!busy}
                        variant="secondary"
                        onClick={() =>
                          void run("Assinando simulação…", async (signal) => {
                            const value = await trust.sign(
                              review,
                              storageUnavailable,
                              signal,
                            );
                            if (!signal.aborted) {
                              service.attachSignature(value);
                              setReview(value);
                              setExports(service.exports());
                            }
                          })
                        }
                      >
                        Assinar simulação
                      </Button>
                    </section>
                  )}
                  <details>
                    <summary>Inspecionar snapshot declarativo</summary>
                    <pre className="package-payload">
                      {JSON.stringify(review, null, 2)}
                    </pre>
                  </details>
                  {error && <p role="alert">{error}</p>}
                  {busy && <p role="status">{busy}</p>}
                  <div className="workspace-actions">
                    {stage ? (
                      <Button
                        disabled={!!busy || !trusted}
                        onClick={() =>
                          void run(
                            "Importando no perfil receptor…",
                            async (signal) => {
                              const message = await service.commit(
                                review,
                                scenario,
                                signal,
                              );
                              if (!signal.aborted) {
                                setReceived(service.received());
                                setNotice(message);
                                setReview(null);
                                setStage(false);
                                requestAnimationFrame(() =>
                                  origin.current?.focus(),
                                );
                              }
                            },
                          )
                        }
                      >
                        Confirmar importação simulada
                      </Button>
                    ) : (
                      <Button
                        disabled={!!busy}
                        onClick={() => {
                          setReview(null);
                          setNotice(
                            "Pacote disponível na lista desta sessão. Nenhum arquivo gravado.",
                          );
                        }}
                      >
                        Concluir exportação simulada
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      onClick={() => {
                        if (busy) cancel();
                        else back();
                      }}
                    >
                      {busy ? "Cancelar operação" : "Voltar sem importar"}
                    </Button>
                  </div>
                </>
              )
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}
