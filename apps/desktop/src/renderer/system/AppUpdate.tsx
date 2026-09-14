import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@ushark/ui";
import type {
  AppUpdatePreview,
  UpdateCandidate,
  UpdateChannel,
  UpdateScenario,
} from "@ushark/types/app-update";
import { useNavigation } from "../app/navigation";
export function AppUpdate({
  service,
  onBack,
  onHome,
  onRecovery,
}: {
  service: AppUpdatePreview;
  onBack: () => void;
  onHome: () => void;
  onRecovery: () => void;
}) {
  const [version, setVersion] = useState(service.version),
    [installed, setInstalled] = useState(service.installed),
    [channel, setChannel] = useState<UpdateChannel>("Stable"),
    [scenario, setScenario] = useState<UpdateScenario>("normal"),
    [candidate, setCandidate] = useState<UpdateCandidate | null>(null),
    [uninstall, setUninstall] = useState(false),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
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
    setNotice("Operação cancelada; versão e dados confirmados preservados.");
  }
  function back() {
    if (busy) cancel();
    else if (candidate || uninstall) {
      setCandidate(null);
      setUninstall(false);
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
        setVersion(service.version);
        setInstalled(service.installed);
      }
    }
  }
  return (
    <main className="workspace-page">
      <header>
        <Button ref={first} variant="secondary" onClick={back}>
          Voltar às preferências
        </Button>
        <h1>Sobre e atualização</h1>
      </header>
      <p>
        Ushark · build local de desenvolvimento. Este painel simula instalação e
        atualização; não baixa nem executa instaladores reais.
      </p>
      {notice && <p role="status">{notice}</p>}
      {error && !candidate && !uninstall && <p role="alert">{error}</p>}
      {busy && !candidate && !uninstall && (
        <p role="status">
          {busy}
          <Button variant="secondary" onClick={cancel}>
            Cancelar operação
          </Button>
        </p>
      )}
      <section className="workspace-list">
        <article>
          <h2>
            {installed
              ? "Instalação simulada presente"
              : "Aplicativo ausente na simulação"}
          </h2>
          <p>Versão simulada: {version}</p>
          <p>
            Plataforma alvo: Windows x64 · validação física e installer
            pendentes.
          </p>
          <label>
            Canal de atualização
            <select
              disabled={!!busy}
              value={channel}
              onChange={(e) => setChannel(e.target.value as UpdateChannel)}
            >
              {["Canary", "Beta", "Stable"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <p>
            Canal é metadado da fixture; o mesmo candidato mantém sua
            identidade. Nenhuma promoção de release está sendo feita.
          </p>
          <div className="workspace-actions">
            <Button
              disabled={!!busy}
              onClick={() => {
                origin.current = document.activeElement as HTMLElement;
                void run("Verificando atualização…", async (s) => {
                  const value = await service.check(channel, scenario, s);
                  if (!s.aborted) {
                    setCandidate(value);
                    if (!value) setNotice("Já atualizado na simulação.");
                  }
                });
              }}
            >
              {installed
                ? "Verificar atualização"
                : "Revisar instalação simulada"}
            </Button>
            <Button
              disabled={!!busy || !installed}
              variant="secondary"
              onClick={() => {
                origin.current = document.activeElement as HTMLElement;
                setUninstall(true);
              }}
            >
              Revisar desinstalação simulada
            </Button>
            <Button variant="secondary" onClick={onHome}>
              Reabrir biblioteca
            </Button>
          </div>
        </article>
        <article>
          <h2>Informações e suporte</h2>
          <p>
            MPV, torrentd, Registry, Sunshine/Moonlight e providers reais:
            integração adiada. Versões/pinning/schemas reais, SBOM, assinatura e
            provenance de distribuição não estão validados.
          </p>
          <p>
            Artes sintéticas do projeto; React, Electron e demais dependências
            mantêm suas licenças próprias. Código do projeto sob MIT (LICENSE no
            repositório). Canal de suporte público e distribuição empacotada
            permanecem pendentes.
          </p>
          <p>
            Relato de problema: descreva o cenário e consulte a prévia
            sanitizada em Diagnóstico. Não inclua credenciais, arquivos privados
            ou magnets pessoais. Nenhum relatório é enviado automaticamente.
          </p>
          <Button variant="secondary" onClick={onRecovery}>
            Abrir backup e recuperação
          </Button>
        </article>
      </section>
      <details className="workspace-scenarios">
        <summary>Cenários de atualização</summary>
        <label>
          Estado da atualização
          <select
            disabled={!!busy}
            value={scenario}
            onChange={(e) => setScenario(e.target.value as UpdateScenario)}
          >
            {Object.entries({
              normal: "Disponível",
              current: "Já atualizado",
              signature: "Assinatura inválida",
              hash: "Checksum divergente",
              incompatible: "Incompatível",
              "download-error": "Falha no download",
              migration: "Migração falhou",
              offline: "Offline",
            }).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </details>
      <Dialog.Root
        open={!!candidate || uninstall}
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
              {uninstall
                ? "Desinstalar apenas na simulação?"
                : "Revisar candidato demonstrativo"}
            </Dialog.Title>
            <Dialog.Description>
              {uninstall
                ? "Biblioteca, índice de cache, progresso e downloads da sessão serão preservados. Nenhum aplicativo ou arquivo real é removido."
                : "Valida a fixture e cria backup antes de aplicar. Falha mantém a versão atual. Nenhum binário real é instalado."}
            </Dialog.Description>
            {candidate && (
              <>
                <h3>
                  {candidate.version} · {candidate.channel}
                </h3>
                <p>{candidate.platform}</p>
                <ul>
                  {candidate.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
                <p>Checksum demonstrativo: {candidate.checksum}</p>
                <p>{candidate.signature}</p>
                <p>SBOM: {candidate.sbom}</p>
                <p>Provenance: {candidate.provenance}</p>
                <details>
                  <summary>Metadados do candidato</summary>
                  <pre className="package-payload">
                    {JSON.stringify(candidate, null, 2)}
                  </pre>
                </details>
              </>
            )}
            {error && <p role="alert">{error}</p>}
            {busy && <p role="status">{busy}</p>}
            <div className="workspace-actions">
              <Button
                disabled={!!busy}
                onClick={() =>
                  void run(
                    uninstall
                      ? "Desinstalando simulação…"
                      : "Preparando atualização…",
                    async (s) => {
                      if (uninstall) await service.uninstall(s);
                      else if (candidate)
                        await service.apply(candidate, scenario, s, setBusy);
                      if (!s.aborted) {
                        setCandidate(null);
                        setUninstall(false);
                        setNotice(
                          uninstall
                            ? "Desinstalação simulada concluída. Dados preservados."
                            : "Atualização simulada concluída. Biblioteca, progresso e downloads preservados.",
                        );
                      }
                    },
                  )
                }
              >
                {uninstall
                  ? "Confirmar desinstalação simulada"
                  : "Aplicar candidato simulado"}
              </Button>
              <Button variant="secondary" onClick={back}>
                {busy ? "Cancelar operação" : "Voltar sem confirmar"}
              </Button>
              {error && (
                <Button
                  disabled={!!busy}
                  variant="secondary"
                  onClick={onRecovery}
                >
                  Abrir recuperação
                </Button>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}
