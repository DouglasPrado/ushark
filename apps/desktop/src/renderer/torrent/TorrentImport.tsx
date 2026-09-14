import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Magnet } from "lucide-react";
import { useNavigation } from "../app/navigation";
import { Button } from "@ushark/ui";
import type {
  Inspection,
  InspectionScenario,
  TorrentPreview,
} from "@ushark/types/torrent";
import { previewMagnet, validateTorrentInput } from "@ushark/mocks/torrent";
export function TorrentImport({
  service,
  onConfirm,
  onActive,
  compact = false,
}: {
  service: TorrentPreview;
  onActive: (active: boolean) => void;
  onConfirm: (inspection: Inspection, fileIds: string[]) => Promise<void>;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [input, setInput] = useState(""),
    [scenario, setScenario] = useState<InspectionScenario>("normal");
  const [inspection, setInspection] = useState<Inspection | null>(null),
    [selected, setSelected] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [pending, setPending] = useState(service.pending());
  const abort = useRef<AbortController | null>(null),
    lock = useRef(false),
    trigger = useRef<HTMLButtonElement>(null),
    version = useRef(0);
  useEffect(
    () => () => {
      abort.current?.abort();
      version.current++;
    },
    [],
  );
  useNavigation(close, open);
  useEffect(() => {
    onActive(open);
  }, [open, onActive]);
  function cancel() {
    abort.current?.abort();
    version.current++;
    lock.current = false;
    setBusy(false);
    setInspection(null);
    setError("");
  }
  async function inspect(value = input) {
    if (lock.current) return;
    const invalid = validateTorrentInput(value);
    if (invalid) {
      setError(invalid);
      return;
    }
    lock.current = true;
    const generation = ++version.current;
    abort.current?.abort();
    const control = new AbortController();
    abort.current = control;
    setBusy(true);
    setError("");
    setInspection(null);
    try {
      const result = await service.inspect(value, scenario, control.signal);
      if (generation !== version.current) return;
      setInspection(result);
      const videos = result.files.filter((f) => f.kind === "video");
      setSelected(videos.length === 1 ? [videos[0].id] : []);
    } catch (e) {
      if (generation === version.current && !control.signal.aborted)
        setError((e as Error).message);
    } finally {
      if (generation === version.current) {
        lock.current = false;
        setBusy(false);
      }
    }
  }
  function close() {
    if (lock.current && !abort.current) return;
    cancel();
    setOpen(false);
  }
  async function confirm() {
    if (lock.current || !inspection) return;
    if (!selected.length) {
      setError("Escolha pelo menos um arquivo de vídeo.");
      return;
    }
    lock.current = true;
    abort.current = null;
    setBusy(true);
    setError("");
    try {
      await onConfirm(inspection, selected);
      service.confirm(inspection);
      setPending(service.pending());
      setNotice(
        `Importação concluída. ${service.count()} origem(ns) disponíveis.`,
      );
      lock.current = false;
      setBusy(false);
      setOpen(false);
    } catch (e) {
      setError((e as Error).message);
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <Button
        ref={trigger}
        variant="secondary"
        className={compact ? "torrent-trigger-icon" : undefined}
        aria-label="Importar torrent ou magnet"
        title={compact ? "Importar torrent ou magnet" : undefined}
        onClick={() => {
          setOpen(true);
          setNotice("");
        }}
      >
        {compact ? <Magnet size={21} /> : "Importar torrent ou magnet"}
      </Button>
      {notice && <p role="status">{notice}</p>}
      <Dialog.Root
        open={open}
        onOpenChange={(v) => {
          if (!v) close();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay" />
          <Dialog.Content
            className="modal torrent-import"
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              trigger.current?.focus();
            }}
          >
            <Dialog.Title>Importar torrent ou magnet</Dialog.Title>
            <Dialog.Description>
              Adicione um magnet ou selecione um arquivo torrent.
            </Dialog.Description>
            {!inspection ? (
              <>
                <label>
                  Magnet link
                  <input
                    value={input}
                    disabled={busy}
                    onChange={(e) => {
                      setInput(e.target.value);
                      setError("");
                    }}
                    placeholder="magnet:?xt=urn:btih:…"
                  />
                </label>
                <div className="footer-actions">
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => setInput(previewMagnet)}
                  >
                    Preencher magnet
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => setInput("fixture:filme.torrent")}
                  >
                    Selecionar filme.torrent
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => setInput("fixture:serie.torrent")}
                  >
                    Selecionar serie.torrent
                  </Button>
                </div>
                <Button disabled={busy} onClick={() => void inspect()}>
                  Resolver metadata
                </Button>
                {busy && (
                  <p role="status">Resolvendo metadata… aguarde ou cancele.</p>
                )}
                {pending.length > 0 && (
                  <section>
                    <h3>Importações pendentes</h3>
                    {pending.map((p, i) => (
                      <div key={p}>
                        <span>
                          Pendente {i + 1} ·{" "}
                          {p.startsWith("fixture:")
                            ? "Arquivo torrent"
                            : "Magnet"}
                        </span>
                        <Button
                          variant="secondary"
                          disabled={busy}
                          onClick={() => {
                            setInput(p);
                            void inspect(p);
                          }}
                        >
                          Repetir pendência {i + 1}
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={busy}
                          onClick={() => {
                            service.forget(p);
                            setPending(service.pending());
                          }}
                        >
                          Remover pendência {i + 1}
                        </Button>
                      </div>
                    ))}
                  </section>
                )}
              </>
            ) : (
              <>
                <h3>{inspection.name}</h3>
                <p className="source-hash">InfoHash: {inspection.hash}</p>
                <p>
                  Metadados encontrados. Samples e extras não são escolhidos
                  automaticamente.
                </p>
                <fieldset>
                  <legend>Arquivos para vincular</legend>
                  {inspection.files.map((f) => (
                    <label key={f.id} className="torrent-file">
                      <input
                        type="checkbox"
                        checked={selected.includes(f.id)}
                        disabled={busy || f.kind !== "video"}
                        onChange={() => {
                          setError("");
                          setSelected((s) =>
                            s.includes(f.id)
                              ? s.filter((x) => x !== f.id)
                              : [...s, f.id],
                          );
                        }}
                      />
                      <span>
                        {f.name} · {f.size} · {f.kind}
                      </span>
                    </label>
                  ))}
                </fieldset>
                {inspection.files.filter((f) => f.kind === "video").length >
                  1 && (
                  <p>
                    Seleção ambígua: confirme explicitamente os arquivos
                    desejados.
                  </p>
                )}
                <Button disabled={busy} onClick={() => void confirm()}>
                  Confirmar arquivos
                </Button>
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => setInspection(null)}
                >
                  Editar entrada
                </Button>
              </>
            )}
            {notice && <p role="status">{notice}</p>}
            {error && (
              <div role="alert">
                <p>{error}</p>
                {!inspection && (
                  <>
                    <Button disabled={busy} onClick={() => void inspect()}>
                      Tentar novamente
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={busy || !!validateTorrentInput(input)}
                      onClick={() => {
                        service.remember(input);
                        setPending(service.pending());
                        setError("");
                        setNotice("Importação salva como pendente.");
                      }}
                    >
                      Salvar pendente
                    </Button>
                  </>
                )}
              </div>
            )}
            <details>
              <summary>Opções avançadas</summary>
              <label>
                Condição da origem
                <select
                  disabled={busy}
                  value={scenario}
                  onChange={(e) =>
                    setScenario(e.target.value as InspectionScenario)
                  }
                >
                  {Object.entries({
                    normal: "Normal",
                    "no-peers": "Sem peers",
                    timeout: "Timeout",
                    daemon: "Daemon indisponível",
                    offline: "Offline",
                    ambiguous: "Seleção ambígua",
                    hostile: "Path hostil",
                    bencode: "Bencode inválido",
                  }).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
            </details>
            <Button
              variant="secondary"
              disabled={busy && !abort.current}
              onClick={close}
            >
              {busy ? "Cancelar resolução" : "Cancelar"}
            </Button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
