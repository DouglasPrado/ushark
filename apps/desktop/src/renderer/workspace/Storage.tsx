import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@ushark/ui";
import type {
  StorageEntry,
  StoragePreview,
  StorageScenario,
  StoragePolicy,
} from "@ushark/types/storage";
import { useNavigation } from "../app/navigation";
import "./workspace.css";
export function Storage({
  service,
  onBack,
  onPolicy,
}: {
  service: StoragePreview;
  onBack: () => void;
  onPolicy: (p: StoragePolicy, folderChanged: boolean) => void;
}) {
  const [rows, setRows] = useState<StorageEntry[]>([]),
    [loading, setLoading] = useState(true),
    [draft, setDraft] = useState({ ...service.policy }),
    [scenario, setScenario] = useState<StorageScenario>("normal"),
    [plan, setPlan] = useState<StorageEntry[] | null>(null),
    [demote, setDemote] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const control = useRef<AbortController | null>(null),
    lock = useRef(false),
    origin = useRef<HTMLElement | null>(null),
    backButton = useRef<HTMLButtonElement>(null);
  const desktop = service.runtime === "desktop";
  useEffect(() => {
    let disposed = false;
    const load = async () => {
      try {
        await service.refresh?.();
        if (!disposed) {
          setRows(service.list());
          setDraft({ ...service.policy });
        }
      } catch (cause) {
        if (!disposed) setError((cause as Error).message);
      } finally {
        if (!disposed) setLoading(false);
      }
    };
    const timer = setTimeout(() => void load(), desktop ? 0 : 250);
    backButton.current?.focus();
    return () => {
      disposed = true;
      clearTimeout(timer);
      control.current?.abort();
    };
  }, [desktop, service]);
  function cancel() {
    control.current?.abort();
    lock.current = false;
    setBusy(false);
    setPlan(null);
    setDemote(null);
    setError("");
  }
  useNavigation(() => {
    if (plan || demote || busy) cancel();
    else onBack();
  });
  async function run(action: (signal: AbortSignal) => Promise<string>) {
    if (lock.current) return;
    lock.current = true;
    const abort = new AbortController();
    control.current = abort;
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const text = await action(abort.signal);
      if (!abort.signal.aborted) {
        setNotice(text);
        setRows(service.list());
        setPlan(null);
        setDemote(null);
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
  function autoClean() {
    return run(async (signal) => {
      const cacheUsed = service
        .list()
        .filter((e) => !e.keep)
        .reduce((n, e) => n + e.gb, 0);
      let remaining = Math.max(0, cacheUsed - service.policy.limitGB);
      const ids: string[] = [];
      for (const e of service.estimate()) {
        if (remaining <= 0) break;
        ids.push(e.id);
        remaining -= e.gb;
      }
      if (!ids.length) return "Nenhum item elegível precisa ser removido.";
      const freed = await service.clean(ids, signal);
      return `Limpeza automática: ${freed.toFixed(2)} GB liberados. Protegidos preservados.`;
    });
  }
  const used = rows.reduce((n, e) => n + e.gb, 0),
    estimate = service.estimate().reduce((n, e) => n + e.gb, 0);
  return (
    <main className="workspace-page">
      <header>
        <Button
          ref={backButton}
          variant="secondary"
          onClick={() => {
            cancel();
            onBack();
          }}
        >
          Voltar às configurações
        </Button>
        <h1>Espaço e retenção</h1>
      </header>
      <p>
        {desktop
          ? "Uso físico dos diretórios gerenciados, com proteção para reprodução, favoritos, parciais e Keep."
          : "Uso ilustrativo em memória. Não inspeciona nem modifica seus discos."}
      </p>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {loading ? (
        <p role="status">Calculando espaço…</p>
      ) : (
        <>
          <section className="workspace-empty">
            <h2>
              {used.toFixed(2)} GB em uso{desktop ? "" : " simulado"}
            </h2>
            <p>
              Limite de cache: {service.policy.limitGB} GB · elegível estimado:{" "}
              {estimate.toFixed(2)} GB
            </p>
            {scenario === "full" && (
              <p role="alert">
                Disco cheio simulado. Revise elegíveis ou altere o destino.
              </p>
            )}
            {scenario === "offline" && (
              <p>Offline: operações locais simuladas continuam disponíveis.</p>
            )}
            <Button
              disabled={busy || estimate === 0}
              onClick={() => {
                origin.current = document.activeElement as HTMLElement;
                setPlan(service.estimate());
              }}
            >
              Revisar limpeza
            </Button>
            {estimate === 0 && <p>Nenhum dado elegível para limpeza.</p>}
          </section>
          <section className="workspace-list">
            <article>
              <h2>Política de cache</h2>
              <p>
                {desktop
                  ? "O cache ativo usa a pasta configurada; conteúdo Keep permanece na biblioteca."
                  : "Conforme o projeto, cache ativo deve preferir SSD/NVMe. Volumes abaixo são somente fixtures."}
              </p>
              <div className="workspace-fields">
                <label>
                  {desktop
                    ? "Pasta de cache gerenciada"
                    : "Pasta de cache simulada"}
                  <select
                    value={draft.folder}
                    onChange={(e) =>
                      setDraft({ ...draft, folder: e.target.value })
                    }
                  >
                    {desktop ? (
                      <option>Cache</option>
                    ) : (
                      <>
                        <option>Cache SSD simulado</option>
                        <option>Cache HDD simulado</option>
                      </>
                    )}
                  </select>
                </label>
                <label>
                  Limite de cache (GB)
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={draft.limitGB}
                    onChange={(e) =>
                      setDraft({ ...draft, limitGB: Number(e.target.value) })
                    }
                  />
                </label>
              </div>
              {(
                [
                  ["autoCleanup", "Limpeza automática"],
                  ["retainPartial", "Reter parciais"],
                  ["retainFavorites", "Proteger favoritos"],
                ] as const
              ).map(([key, label]) => (
                <label key={key}>
                  <input
                    type="checkbox"
                    checked={draft[key]}
                    onChange={(e) =>
                      setDraft({ ...draft, [key]: e.target.checked })
                    }
                  />
                  {label}
                </label>
              ))}
              <div className="workspace-actions">
                <Button
                  disabled={busy}
                  onClick={() =>
                    void run(async (signal) => {
                      const folderChanged =
                        draft.folder !== service.policy.folder;
                      await service.apply(draft);
                      onPolicy(draft, folderChanged);
                      if (!draft.autoCleanup)
                        return "Política de armazenamento aplicada.";
                      const cacheUsed = service
                        .list()
                        .filter((entry) => !entry.keep)
                        .reduce((sum, entry) => sum + entry.gb, 0);
                      let remaining = Math.max(0, cacheUsed - draft.limitGB);
                      const ids: string[] = [];
                      for (const entry of service.estimate()) {
                        if (remaining <= 0) break;
                        ids.push(entry.id);
                        remaining -= entry.gb;
                      }
                      const freed = ids.length
                        ? await service.clean(ids, signal)
                        : 0;
                      return `Política aplicada; ${freed.toFixed(2)} GB liberados automaticamente. Protegidos preservados.`;
                    })
                  }
                >
                  Aplicar política
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setDraft({ ...service.policy });
                    setError("");
                  }}
                >
                  Descartar alterações
                </Button>
                <Button
                  variant="secondary"
                  disabled={busy || !service.policy.autoCleanup}
                  onClick={() => void autoClean()}
                >
                  Executar limpeza automática
                </Button>
              </div>
            </article>
          </section>
          {!rows.length ? (
            <p>Cache vazio.</p>
          ) : (
            <section className="workspace-list">
              {rows.map((e) => (
                <article key={e.id}>
                  <h2>{e.name}</h2>
                  <p>
                    {e.gb.toFixed(2)} GB · {e.volume} ·{" "}
                    {e.keep ? "Keep" : e.partial ? "Parcial" : "Stream Only"} ·{" "}
                    {e.active
                      ? "Ativo/protegido"
                      : service.eligible(e)
                        ? "Elegível"
                        : "Protegido"}
                  </p>
                  <div className="workspace-actions">
                    <Button
                      disabled={busy || e.active}
                      variant="secondary"
                      onClick={() => {
                        origin.current = document.activeElement as HTMLElement;
                        if (e.keep) setDemote(e.id);
                        else
                          void run(async (signal) => {
                            await service.retain(e.id, true, signal);
                            return "Promovido para Keep; bytes reaproveitados, sem redownload.";
                          });
                      }}
                    >
                      {e.keep
                        ? "Demover para cache"
                        : "Manter após assistir (Keep)"}
                    </Button>
                    {e.corrupt && (
                      <>
                        <p role="alert">Cache corrompido.</p>
                        <Button
                          disabled={busy || e.active}
                          onClick={() =>
                            void run(async (signal) => {
                              await service.repair(e.id, signal);
                              return "Cache inválido removido. Metadata e progresso preservados.";
                            })
                          }
                        >
                          Reparar cache
                        </Button>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </section>
          )}
        </>
      )}
      {busy && (
        <p role="status">
          Aplicando operação{desktop ? "" : " simulada"}…{" "}
          <Button variant="secondary" onClick={cancel}>
            Cancelar operação
          </Button>
        </p>
      )}
      {!desktop && (
        <details className="workspace-scenarios">
          <summary>Cenários de armazenamento</summary>
          <label>
            Estado do armazenamento
            <select
              disabled={busy}
              value={scenario}
              onChange={(e) => {
                const next = e.target.value as StorageScenario;
                setScenario(next);
                service.configure(next);
                setRows(service.list());
                setError("");
                setNotice("");
              }}
            >
              {Object.entries({
                normal: "Normal",
                empty: "Vazio",
                protected: "Todos protegidos",
                full: "Disco cheio",
                corrupt: "Cache corrompido",
                permission: "Permissão negada",
                offline: "Offline",
              }).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </details>
      )}
      <Dialog.Root
        open={!!plan || !!demote}
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
              (origin.current ?? backButton.current)?.focus();
            }}
          >
            <Dialog.Title>
              {plan ? "Revisar limpeza" : "Demover retenção Keep?"}
            </Dialog.Title>
            <Dialog.Description>
              {plan
                ? `Somente elegíveis serão removidos${desktop ? "" : " da simulação"}; proteções serão conferidas novamente ao confirmar.`
                : "O conteúdo volta a ser elegível conforme política. Nenhum dado será apagado agora."}
            </Dialog.Description>
            {plan && (
              <>
                <p>
                  Estimativa: {plan.reduce((n, e) => n + e.gb, 0).toFixed(2)} GB
                </p>
                <ul>
                  {plan.map((e) => (
                    <li key={e.id}>
                      {e.name} · {e.gb} GB
                    </li>
                  ))}
                </ul>
                <Button
                  disabled={busy}
                  onClick={() =>
                    void run(async (signal) => {
                      const freed = await service.clean(
                        plan.map((e) => e.id),
                        signal,
                      );
                      return `${freed.toFixed(2)} GB liberados${desktop ? "" : " na simulação"}; estimativa revalidada.`;
                    })
                  }
                >
                  Confirmar limpeza
                </Button>
                {!desktop && (
                  <Button
                    variant="secondary"
                    disabled={busy || !plan[0]}
                    onClick={() => {
                      service.activate(plan[0].id);
                      setRows(service.list());
                    }}
                  >
                    Simular uso durante revisão
                  </Button>
                )}
              </>
            )}
            {demote && (
              <Button
                disabled={busy}
                onClick={() =>
                  void run(async (signal) => {
                    await service.retain(demote, false, signal);
                    return "Retenção alterada para cache. Nenhum dado apagado.";
                  })
                }
              >
                Confirmar demotion
              </Button>
            )}
            {error && <p role="alert">{error}</p>}
            <Button variant="secondary" onClick={cancel}>
              Cancelar
            </Button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}
