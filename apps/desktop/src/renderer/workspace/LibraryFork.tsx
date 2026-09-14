import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@ushark/ui";
import type { LibraryForkPreview } from "@ushark/types/library-fork";
import type { LibraryPackageSnapshot } from "@ushark/types/library-package";
import { useNavigation } from "../app/navigation";
export function LibraryFork({
  snapshot,
  service,
  onActive,
  onCreated,
}: {
  snapshot: LibraryPackageSnapshot;
  service: LibraryForkPreview;
  onActive: (v: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const [open, setOpen] = useState(false),
    [name, setName] = useState(""),
    [provenance, setProvenance] = useState(true),
    [scenario, setScenario] = useState<
      "normal" | "error" | "offline" | "missing"
    >("normal"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const c = useRef<AbortController | null>(null),
    lock = useRef(false),
    trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => () => c.current?.abort(), []);
  function close() {
    c.current?.abort();
    lock.current = false;
    setBusy(false);
    setOpen(false);
    onActive(false);
    requestAnimationFrame(() => trigger.current?.focus());
  }
  useNavigation(close, open);
  return (
    <>
      <Button
        ref={trigger}
        variant="secondary"
        onClick={() => {
          setName(`Cópia de ${snapshot.draft.name}`);
          setError("");
          setOpen(true);
          onActive(true);
        }}
      >
        Duplicar curadoria
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
            <Dialog.Title>Criar cópia independente</Dialog.Title>
            <Dialog.Description>
              A cópia terá sua própria identidade, reutilizará conteúdos e
              fontes e não seguirá atualizações da origem. Nenhuma mídia será
              copiada.
            </Dialog.Description>
            <label>
              Novo nome
              <input
                maxLength={80}
                disabled={busy}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={provenance}
                disabled={busy}
                onChange={(e) => setProvenance(e.target.checked)}
              />
              Registrar origem e versão
            </label>
            <p>
              Origem: {snapshot.draft.name} · versão {snapshot.version}. Artes
              compartilhadas por referência na simulação.
            </p>
            {scenario === "offline" && (
              <p>
                Origem remota offline; o snapshot instalado permite copiar nesta
                sessão.
              </p>
            )}
            {error && <p role="alert">{error}</p>}
            {busy && <p role="status">Copiando curadoria…</p>}
            <div className="workspace-actions">
              <Button
                disabled={busy}
                onClick={async () => {
                  if (lock.current) return;
                  lock.current = true;
                  setBusy(true);
                  setError("");
                  const abort = new AbortController();
                  c.current = abort;
                  try {
                    const copy = await service.copy(
                      snapshot,
                      name,
                      provenance,
                      scenario,
                      abort.signal,
                    );
                    if (!abort.signal.aborted) {
                      close();
                      onCreated(copy.id);
                    }
                  } catch (e) {
                    if (!abort.signal.aborted) setError((e as Error).message);
                  } finally {
                    if (!abort.signal.aborted) {
                      setBusy(false);
                      lock.current = false;
                    }
                  }
                }}
              >
                Criar cópia e editar
              </Button>
              <Button variant="secondary" onClick={close}>
                {busy ? "Cancelar cópia" : "Voltar sem copiar"}
              </Button>
            </div>
            <details>
              <summary>Cenários de cópia</summary>
              <label>
                Estado da cópia
                <select
                  disabled={busy}
                  value={scenario}
                  onChange={(e) =>
                    setScenario(e.target.value as typeof scenario)
                  }
                >
                  <option value="normal">Normal</option>
                  <option value="error">Falha ao copiar</option>
                  <option value="offline">Origem remota offline</option>
                  <option value="missing">Snapshot local indisponível</option>
                </select>
              </label>
            </details>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
