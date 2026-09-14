import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@ushark/ui";
import type {
  LibraryContent,
  LibraryDraft,
  LibraryPreviewService,
  LibrarySection,
} from "@ushark/types/libraries";
import type { PlaybackContent } from "@ushark/types/player";
import type {
  SelectionPreview,
  SelectionPreferences,
} from "@ushark/types/selection";
import type { DownloadRequest } from "@ushark/types/downloads";
import { LibraryPreview } from "./LibraryPreview";
import { SourceChoices } from "../catalog/SourceChoices";
import { useNavigation } from "../app/navigation";
import "./workspace.css";
import "./libraries.css";
const tabs = ["Identidade", "Conteúdos", "Coleções", "Seções", "Prévia"];
function move<T>(items: T[], index: number, delta: number) {
  const next = [...items],
    target = index + delta;
  if (target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
export function Libraries({
  service,
  editSession,
  onBack,
  onFiles,
  onPublish,
  onSubscriptions,
  selection,
  preferences,
  onPlay,
  onDownload,
  progress,
  suspended = false,
}: {
  service: LibraryPreviewService;
  editSession: { id?: string };
  onBack: () => void;
  onFiles: () => void;
  onPublish: () => void;
  onSubscriptions: () => void;
  selection: SelectionPreview;
  preferences: SelectionPreferences;
  onPlay: (c: PlaybackContent) => void;
  onDownload: (r: DownloadRequest) => void;
  progress: (id: string) => number;
  suspended?: boolean;
}) {
  const [saved, setSaved] = useState(service.list()),
    [draft, setDraft] = useState<LibraryDraft | null>(null),
    [baseline, setBaseline] = useState(""),
    [catalog, setCatalog] = useState<LibraryContent[]>([]),
    [loading, setLoading] = useState(true),
    [tab, setTab] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [discard, setDiscard] = useState(false),
    [detail, setDetail] = useState<string | null>(null),
    [scenario, setScenario] = useState<"normal" | "error" | "offline">(
      "normal",
    );
  const controller = useRef<AbortController | null>(null),
    lock = useRef(false),
    origin = useRef<HTMLElement | null>(null),
    first = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    let active = true;
    Promise.resolve(service.refresh?.())
      .then(() => service.catalog())
      .then((items) => {
        if (active) {
          setSaved(service.list());
          setCatalog(items);
          setLoading(false);
        }
      })
      .catch((e: Error) => {
        if (active) {
          setError(e.message);
          setLoading(false);
        }
      });
    return () => {
      active = false;
      controller.current?.abort();
    };
  }, [service]);
  useEffect(() => {
    first.current?.focus();
  }, [!!draft]);
  useEffect(() => {
    if (editSession.id) {
      const value = service.list().find((d) => d.id === editSession.id);
      if (value) edit(value);
      delete editSession.id;
    }
  }, [service, editSession]);
  const dirty = !!draft && JSON.stringify(draft) !== baseline;
  function back() {
    if (detail) {
      setDetail(null);
      return;
    }
    if (busy) {
      controller.current?.abort();
      lock.current = false;
      setBusy(false);
      return;
    }
    if (draft) {
      if (dirty) setDiscard(true);
      else setDraft(null);
    } else onBack();
  }
  useNavigation(() => {
    if (discard) setDiscard(false);
    else back();
  }, !suspended);
  function edit(value: LibraryDraft) {
    setDraft(structuredClone(value));
    setBaseline(JSON.stringify(value));
    setTab(0);
    setError("");
    setNotice("");
  }
  function patch(value: Partial<LibraryDraft>) {
    setDraft((d) => (d ? { ...d, ...value } : null));
    setError("");
    setNotice("");
  }
  async function save() {
    if (lock.current || !draft) return;
    lock.current = true;
    setBusy(true);
    setError("");
    const abort = new AbortController();
    controller.current = abort;
    service.failSave =
      service.runtime === "desktop" ? false : scenario === "error";
    try {
      const value = await service.save(draft, abort.signal);
      if (!abort.signal.aborted) {
        setDraft(value);
        setBaseline(JSON.stringify(value));
        setSaved(service.list());
        setNotice(
          `Rascunho salvo${service.runtime === "desktop" ? " localmente" : " nesta sessão"}. Nenhuma publicação foi feita.`,
        );
      }
    } catch (e) {
      if (!abort.signal.aborted) setError((e as Error).message);
    } finally {
      if (!abort.signal.aborted) {
        setBusy(false);
        lock.current = false;
      }
    }
  }
  const member = draft?.memberships.find((m) => m.contentId === detail),
    item = catalog.find((c) => c.id === detail);
  return (
    <main className="workspace-page libraries-page">
      <header>
        <Button ref={first} variant="secondary" onClick={back}>
          {draft ? "Voltar às bibliotecas" : "Voltar ao início"}
        </Button>
        <h1>{draft ? "Editar curadoria" : "Bibliotecas"}</h1>
        {!draft && (
          <Button variant="secondary" onClick={onSubscriptions}>
            Assinaturas
          </Button>
        )}
        {!draft && (
          <Button variant="secondary" onClick={onPublish}>
            Publicações simuladas
          </Button>
        )}
        {!draft && (
          <Button variant="secondary" onClick={onFiles}>
            Arquivos de biblioteca
          </Button>
        )}
        {!draft && (
          <Button onClick={() => edit(service.create())}>
            Criar biblioteca
          </Button>
        )}
        {draft && (
          <Button disabled={busy} onClick={() => void save()}>
            {busy ? "Salvando…" : "Salvar rascunho"}
          </Button>
        )}
      </header>
      <p>
        {service.runtime === "desktop"
          ? "Curadoria privada persistida neste dispositivo. Não publica nem inicia processos."
          : "Curadoria privada em memória. Não publica nem inicia processos."}
      </p>
      {draft?.provenance && (
        <p>
          Cópia independente da versão {draft.provenance.version} da origem. Não
          recebe atualizações automáticas.
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {scenario === "offline" && (
        <p role="status">Offline: edição local simulada disponível.</p>
      )}
      {loading ? (
        <p role="status">Lendo catálogo…</p>
      ) : !draft ? (
        <>
          <section className="workspace-list">
            {saved.map((lib) => (
              <article key={lib.id}>
                <h2>{lib.name}</h2>
                <p>
                  {lib.memberships.length} conteúdos · revisão {lib.revision} ·
                  rascunho privado
                </p>
                <Button variant="secondary" onClick={() => edit(lib)}>
                  Editar {lib.name}
                </Button>
              </article>
            ))}
          </section>
          {!saved.length && (
            <section className="workspace-empty">
              <h2>Nenhuma curadoria criada</h2>
              <p>Crie uma biblioteca para organizar suas histórias.</p>
            </section>
          )}
        </>
      ) : (
        <>
          <nav className="library-tabs" aria-label="Etapas da curadoria">
            {tabs.map((name, i) => (
              <Button
                key={name}
                variant={tab === i ? "primary" : "secondary"}
                disabled={busy}
                aria-current={tab === i ? "step" : undefined}
                onClick={() => setTab(i)}
              >
                {name}
              </Button>
            ))}
          </nav>
          <fieldset disabled={busy} className="library-editor">
            {tab === 0 && (
              <section className="workspace-list">
                <article>
                  <div className="workspace-fields">
                    <label>
                      Nome da biblioteca
                      <input
                        value={draft.name}
                        maxLength={80}
                        onChange={(e) => patch({ name: e.target.value })}
                      />
                    </label>
                    <label>
                      Autor
                      <input
                        value={draft.author}
                        onChange={(e) => patch({ author: e.target.value })}
                      />
                    </label>
                    <label>
                      Descrição
                      <textarea
                        value={draft.description}
                        onChange={(e) => patch({ description: e.target.value })}
                      />
                    </label>
                    <label>
                      Cor de destaque
                      <input
                        value={draft.accent}
                        onChange={(e) => patch({ accent: e.target.value })}
                      />
                    </label>
                    {(["avatar", "logo", "banner"] as const).map((key) => (
                      <label key={key}>
                        {key}
                        <select
                          value={draft[key]}
                          onChange={(e) => patch({ [key]: e.target.value })}
                        >
                          <option value="">Sem imagem</option>
                          <option value="/movie-art/orbitas.svg">
                            Órbitas (arte sintética)
                          </option>
                          <option value="/movie-art/horizon.svg">
                            Horizonte (arte sintética)
                          </option>
                        </select>
                      </label>
                    ))}
                  </div>
                </article>
              </section>
            )}
            {tab === 1 && (
              <>
                {service.runtime !== "desktop" && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      service.examples();
                      void service.catalog().then(setCatalog);
                    }}
                  >
                    Usar catálogo sintético
                  </Button>
                )}
                {!catalog.length && (
                  <p>
                    Catálogo vazio. Cadastre filmes/séries ou carregue exemplos
                    sintéticos.
                  </p>
                )}
                <section className="workspace-list">
                  {catalog.map((c) => {
                    const membership = draft.memberships.find(
                      (m) => m.contentId === c.id,
                    );
                    return (
                      <article key={c.id}>
                        <label>
                          <input
                            type="checkbox"
                            checked={!!membership}
                            onChange={() => {
                              if (membership)
                                patch({
                                  memberships: draft.memberships.filter(
                                    (m) => m.contentId !== c.id,
                                  ),
                                  collections: draft.collections.map((col) => ({
                                    ...col,
                                    items: col.items.filter(
                                      (id) => id !== c.id,
                                    ),
                                  })),
                                });
                              else
                                patch({
                                  memberships: [
                                    ...draft.memberships,
                                    {
                                      contentId: c.id,
                                      sourceIds: c.sources.map((s) => s.id),
                                      titleOverride: "",
                                    },
                                  ],
                                });
                            }}
                          />
                          {c.title}
                        </label>
                        {membership && (
                          <>
                            <label>
                              Título nesta biblioteca: {c.title}
                              <input
                                value={membership.titleOverride}
                                placeholder={c.title}
                                onChange={(e) =>
                                  patch({
                                    memberships: draft.memberships.map((m) =>
                                      m.contentId === c.id
                                        ? {
                                            ...m,
                                            titleOverride: e.target.value,
                                          }
                                        : m,
                                    ),
                                  })
                                }
                              />
                            </label>
                            <fieldset>
                              <legend>Fontes incluídas</legend>
                              {c.sources.map((source) => (
                                <label key={source.id}>
                                  <input
                                    type="checkbox"
                                    checked={membership.sourceIds.includes(
                                      source.id,
                                    )}
                                    onChange={() =>
                                      patch({
                                        memberships: draft.memberships.map(
                                          (m) =>
                                            m.contentId === c.id
                                              ? {
                                                  ...m,
                                                  sourceIds:
                                                    m.sourceIds.includes(
                                                      source.id,
                                                    )
                                                      ? m.sourceIds.filter(
                                                          (id) =>
                                                            id !== source.id,
                                                        )
                                                      : [
                                                          ...m.sourceIds,
                                                          source.id,
                                                        ],
                                                }
                                              : m,
                                        ),
                                      })
                                    }
                                  />
                                  {source.name}
                                </label>
                              ))}
                            </fieldset>
                          </>
                        )}
                      </article>
                    );
                  })}
                </section>
              </>
            )}
            {tab === 2 && (
              <>
                <Button
                  onClick={() =>
                    patch({
                      collections: [
                        ...draft.collections,
                        {
                          id: `${draft.id}:collection:${crypto.randomUUID()}`,
                          name: `Coleção ${draft.collections.length + 1}`,
                          items: [],
                        },
                      ],
                    })
                  }
                >
                  Adicionar coleção
                </Button>
                <section className="workspace-list">
                  {draft.collections.map((col, ci) => (
                    <article key={col.id}>
                      <label>
                        Nome da coleção {ci + 1}
                        <input
                          value={col.name}
                          onChange={(e) =>
                            patch({
                              collections: draft.collections.map((c) =>
                                c.id === col.id
                                  ? { ...c, name: e.target.value }
                                  : c,
                              ),
                            })
                          }
                        />
                      </label>
                      <p>
                        Conjunto lógico de conteúdo; independente das seções
                        visuais.
                      </p>
                      {draft.memberships.map((m) => (
                        <label key={m.contentId}>
                          <input
                            type="checkbox"
                            checked={col.items.includes(m.contentId)}
                            onChange={() =>
                              patch({
                                collections: draft.collections.map((c) =>
                                  c.id === col.id
                                    ? {
                                        ...c,
                                        items: c.items.includes(m.contentId)
                                          ? c.items.filter(
                                              (id) => id !== m.contentId,
                                            )
                                          : [...c.items, m.contentId],
                                      }
                                    : c,
                                ),
                              })
                            }
                          />
                          {m.titleOverride ||
                            catalog.find((c) => c.id === m.contentId)?.title ||
                            m.contentId}
                        </label>
                      ))}
                      <ol>
                        {col.items.map((id, index) => (
                          <li key={id}>
                            {catalog.find((c) => c.id === id)?.title ?? id}
                            <Button
                              variant="secondary"
                              disabled={index === 0}
                              aria-label={`Subir item ${index + 1} da coleção ${ci + 1}`}
                              onClick={() =>
                                patch({
                                  collections: draft.collections.map((c) =>
                                    c.id === col.id
                                      ? {
                                          ...c,
                                          items: move(c.items, index, -1),
                                        }
                                      : c,
                                  ),
                                })
                              }
                            >
                              Subir
                            </Button>
                            <Button
                              variant="secondary"
                              disabled={index === col.items.length - 1}
                              aria-label={`Descer item ${index + 1} da coleção ${ci + 1}`}
                              onClick={() =>
                                patch({
                                  collections: draft.collections.map((c) =>
                                    c.id === col.id
                                      ? { ...c, items: move(c.items, index, 1) }
                                      : c,
                                  ),
                                })
                              }
                            >
                              Descer
                            </Button>
                          </li>
                        ))}
                      </ol>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          patch({
                            collections: draft.collections.filter(
                              (c) => c.id !== col.id,
                            ),
                            sections: draft.sections.filter(
                              (s) => s.collectionId !== col.id,
                            ),
                          })
                        }
                      >
                        Remover coleção {ci + 1}
                      </Button>
                    </article>
                  ))}
                </section>
              </>
            )}
            {tab === 3 && (
              <>
                <Button
                  onClick={() =>
                    patch({
                      sections: [
                        ...draft.sections,
                        {
                          id: `${draft.id}:section:${crypto.randomUUID()}`,
                          title: "Nova seção",
                          type: "grid",
                          collectionId: draft.collections[0]?.id ?? "",
                        },
                      ],
                    })
                  }
                >
                  Adicionar seção
                </Button>
                <section className="workspace-list">
                  {draft.sections.map((section, index) => (
                    <article key={section.id}>
                      <label>
                        Título da seção {index + 1}
                        <input
                          value={section.title}
                          onChange={(e) =>
                            patch({
                              sections: draft.sections.map((s) =>
                                s.id === section.id
                                  ? { ...s, title: e.target.value }
                                  : s,
                              ),
                            })
                          }
                        />
                      </label>
                      <div className="workspace-fields">
                        <label>
                          Layout da seção {index + 1}
                          <select
                            value={section.type}
                            onChange={(e) =>
                              patch({
                                sections: draft.sections.map((s) =>
                                  s.id === section.id
                                    ? {
                                        ...s,
                                        type: e.target
                                          .value as LibrarySection["type"],
                                      }
                                    : s,
                                ),
                              })
                            }
                          >
                            <option value="hero">Hero</option>
                            <option value="carousel">Carrossel</option>
                            <option value="grid">Grid</option>
                            <option value="continue">
                              Continuar assistindo (pessoal)
                            </option>
                          </select>
                        </label>
                        <label>
                          Coleção da seção {index + 1}
                          <select
                            disabled={section.type === "continue"}
                            value={section.collectionId}
                            onChange={(e) =>
                              patch({
                                sections: draft.sections.map((s) =>
                                  s.id === section.id
                                    ? { ...s, collectionId: e.target.value }
                                    : s,
                                ),
                              })
                            }
                          >
                            <option value="">Escolher coleção…</option>
                            {draft.collections.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <div className="workspace-actions">
                        <Button
                          variant="secondary"
                          disabled={index === 0}
                          onClick={() =>
                            patch({ sections: move(draft.sections, index, -1) })
                          }
                        >
                          Subir seção {index + 1}
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={index === draft.sections.length - 1}
                          onClick={() =>
                            patch({ sections: move(draft.sections, index, 1) })
                          }
                        >
                          Descer seção {index + 1}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() =>
                            patch({
                              sections: draft.sections.filter(
                                (s) => s.id !== section.id,
                              ),
                            })
                          }
                        >
                          Remover seção {index + 1}
                        </Button>
                      </div>
                    </article>
                  ))}
                </section>
              </>
            )}
            {tab === 4 && (
              <>
                <p>Prévia como assinante · versão editada, ainda privada.</p>
                <LibraryPreview
                  draft={draft}
                  catalog={catalog}
                  progress={progress}
                  onContent={(id) => {
                    origin.current = document.activeElement as HTMLElement;
                    setDetail(id);
                  }}
                />
              </>
            )}
          </fieldset>
        </>
      )}
      {service.runtime !== "desktop" && (
        <details className="workspace-scenarios">
          <summary>Cenários de curadoria</summary>
          <label>
            Estado da curadoria
            <select
              disabled={busy}
              value={scenario}
              onChange={(e) => setScenario(e.target.value as typeof scenario)}
            >
              <option value="normal">Normal</option>
              <option value="error">Erro ao salvar</option>
              <option value="offline">Offline</option>
            </select>
          </label>
        </details>
      )}
      <Dialog.Root
        open={(discard || !!detail) && !suspended}
        onOpenChange={(v) => {
          if (!v) {
            setDiscard(false);
            setDetail(null);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay" />
          <Dialog.Content
            className="modal"
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              (origin.current ?? first.current)?.focus();
            }}
          >
            <Dialog.Title>
              {discard
                ? "Descartar alterações não salvas?"
                : member?.titleOverride ||
                  item?.title ||
                  "Conteúdo indisponível"}
            </Dialog.Title>
            <Dialog.Description>
              {discard
                ? "O rascunho salvo nesta sessão será preservado."
                : (item?.synopsis ?? "Detalhes do conteúdo nesta curadoria.")}
            </Dialog.Description>
            {discard ? (
              <>
                <Button
                  onClick={() => {
                    setDiscard(false);
                    setDraft(null);
                  }}
                >
                  Descartar e voltar
                </Button>
                <Button variant="secondary" onClick={() => setDiscard(false)}>
                  Continuar editando
                </Button>
              </>
            ) : (
              <>
                {item && member && (
                  <SourceChoices
                    contentId={item.id}
                    sources={item.sources.filter((s) =>
                      member.sourceIds.includes(s.id),
                    )}
                    service={selection}
                    preferences={preferences}
                    suspended={suspended}
                    onPlay={(s) =>
                      onPlay({
                        id: item.id,
                        title: member.titleOverride || item.title,
                        sourceId: s.id,
                        sourceName: s.name,
                        selector: s.selector,
                        available: true,
                        progressive: !s.local,
                      })
                    }
                    onDownload={(source) =>
                      onDownload({
                        content: {
                          id: item.id,
                          title: member.titleOverride || item.title,
                        },
                        source,
                      })
                    }
                  />
                )}
                <Button variant="secondary" onClick={() => setDetail(null)}>
                  Voltar à prévia
                </Button>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}
