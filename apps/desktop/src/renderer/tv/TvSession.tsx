import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@ushark/ui";
import { MockTvSessionPreview } from "@ushark/mocks/tv";
import { DesktopTvSessionPreview } from "./desktop-tv-session";
import type { TvSessionPreview, TvSessionState } from "@ushark/types/tv";
import { useNavigation } from "../app/navigation";
import "./tv.css";
interface TvContextValue {
  service: TvSessionPreview;
  state: TvSessionState;
  mode: boolean;
  previewControls: boolean;
  refresh: () => void;
  menu: boolean;
  setMenu: (v: boolean) => void;
}
const TvContext = createContext<TvContextValue | null>(null);
export function useTv() {
  return useContext(TvContext);
}
export function TvSessionProvider({ children }: { children: ReactNode }) {
  const [service] = useState(() =>
      window.ushark?.tvSession
        ? new DesktopTvSessionPreview(window.ushark.tvSession)
        : new MockTvSessionPreview(),
    ),
    [state, setState] = useState({ ...service.state }),
    [menu, setMenu] = useState(false),
    [launch] = useState(() => {
      const query = new URLSearchParams(window.location.search);
      return {
        tv: query.get("mode") === "tv",
        previewControls: query.get("review") === "1",
      };
    });
  const value = {
    service,
    state,
    mode: launch.tv || state.active,
    previewControls: launch.previewControls,
    refresh: () => setState({ ...service.state }),
    menu,
    setMenu,
  };
  return (
    <TvContext.Provider value={value}>
      {children}
      {state.active && <TvPanel />}
    </TvContext.Provider>
  );
}
function TvPanel() {
  const tv = useTv()!;
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [fail, setFail] = useState(false),
    [exitConfirm, setExitConfirm] = useState(false);
  const control = useRef<AbortController | null>(null),
    origin = useRef<HTMLElement | null>(null),
    lock = useRef(false);
  useEffect(() => () => control.current?.abort(), []);
  function close() {
    if (busy) {
      control.current?.abort();
      setBusy(false);
      lock.current = false;
    } else if (exitConfirm) setExitConfirm(false);
    else {
      tv.setMenu(false);
      requestAnimationFrame(() => origin.current?.focus());
    }
  }
  useNavigation(close, tv.menu, "tv");
  async function run(stop: boolean) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    const c = new AbortController();
    control.current = c;
    const task = stop
      ? tv.service.stop(fail, c.signal)
      : tv.service.connect(true, fail, c.signal);
    tv.refresh();
    try {
      await task;
      if (!c.signal.aborted) {
        if (stop) {
          tv.setMenu(false);
          if (document.fullscreenElement)
            void document.exitFullscreen().catch(() => {});
        }
        tv.refresh();
      }
    } catch (e) {
      if (!c.signal.aborted) setError((e as Error).message);
      tv.refresh();
    } finally {
      if (!c.signal.aborted) {
        setBusy(false);
        lock.current = false;
      }
    }
  }
  return (
    <>
      <Button
        className="tv-session-trigger"
        variant="secondary"
        aria-label="Abrir controles da TV"
        title="Controles da TV"
        onClick={() => {
          origin.current = document.activeElement as HTMLElement;
          tv.setMenu(true);
        }}
      >
        <span className="tv-power-symbol" aria-hidden="true">
          ⏻
        </span>
      </Button>
      <Dialog.Root
        open={tv.menu}
        onOpenChange={(v) => {
          if (!v) close();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay tv-overlay" />
          <Dialog.Content
            className="modal tv-session-dialog"
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              origin.current?.focus();
            }}
          >
            <Dialog.Title>
              {exitConfirm ? "Sair do modo TV?" : "Sessão de TV"}
            </Dialog.Title>
            <Dialog.Description>
              {exitConfirm
                ? "A reprodução será fechada e sua posição ficará guardada."
                : "Acompanhe a conexão ou volte a assistir."}
            </Dialog.Description>
            <p>
              Conexão: {tv.state.connected ? "ativa" : "perdida"} · controle{" "}
              {tv.state.controller ? "conectado" : "desconectado"}
            </p>
            {!tv.state.connected && (
              <p>
                {tv.state.policy === "pause"
                  ? "Playback pausado; reconectar não retoma automaticamente."
                  : "Playback continua conforme sua política."}
              </p>
            )}
            {error && <p role="alert">{error}</p>}
            {busy && (
              <p role="status">
                {tv.state.phase === "closing"
                  ? "Encerrando sessão…"
                  : "Reconectando…"}
              </p>
            )}
            <div className="workspace-actions">
              {exitConfirm ? (
                <Button disabled={busy} onClick={() => void run(true)}>
                  Confirmar saída
                </Button>
              ) : (
                <>
                  {!tv.state.connected && (
                    <Button disabled={busy} onClick={() => void run(false)}>
                      Reconectar
                    </Button>
                  )}
                  <Button
                    disabled={busy}
                    variant="secondary"
                    onClick={() => setExitConfirm(true)}
                  >
                    Sair do modo TV
                  </Button>
                </>
              )}
              <Button variant="secondary" onClick={close}>
                {busy
                  ? "Cancelar operação"
                  : exitConfirm
                    ? "Continuar assistindo"
                    : "Voltar"}
              </Button>
            </div>
            {tv.previewControls && (
              <details className="tv-review-controls">
                <summary>Ferramentas de revisão</summary>
                <label>
                  Ao perder a sessão
                  <select
                    value={tv.state.policy}
                    disabled={busy}
                    onChange={(e) => {
                      tv.service.state.policy = e.target.value as
                        "pause" | "continue";
                      tv.refresh();
                    }}
                  >
                    <option value="pause">Pausar</option>
                    <option value="continue">Continuar</option>
                  </select>
                </label>
                <div className="workspace-actions">
                  <Button
                    disabled={busy || !tv.state.connected}
                    variant="secondary"
                    onClick={() => {
                      tv.service.disconnect();
                      tv.refresh();
                    }}
                  >
                    Simular desconexão Moonlight
                  </Button>
                  <Button
                    disabled={busy}
                    variant="secondary"
                    onClick={() => {
                      tv.service.hotplug(!tv.state.controller);
                      tv.refresh();
                    }}
                  >
                    {tv.state.controller
                      ? "Simular controle desconectado"
                      : "Reconectar controle simulado"}
                  </Button>
                </div>
                <label>
                  <input
                    type="checkbox"
                    checked={fail}
                    disabled={busy}
                    onChange={(e) => setFail(e.target.checked)}
                  />
                  Simular falha de conexão ou encerramento
                </label>
              </details>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
export function TvSetup({
  onBack,
  onBrowse,
  policy,
}: {
  onBack: () => void;
  onBrowse: () => void;
  policy: string;
}) {
  const tv = useTv()!;
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [fail, setFail] = useState(false),
    [fullscreen, setFullscreen] = useState(true);
  const c = useRef<AbortController | null>(null),
    first = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    first.current?.focus();
    tv.service.state.policy = policy === "continue" ? "continue" : "pause";
    tv.refresh();
    return () => c.current?.abort();
  }, []);
  function back() {
    if (busy) {
      c.current?.abort();
      setBusy(false);
    } else onBack();
  }
  useNavigation(back, !tv.menu);
  return (
    <main className="workspace-page">
      <header>
        <Button ref={first} variant="secondary" onClick={back}>
          Voltar às preferências
        </Button>
        <h1>Sessão de TV</h1>
      </header>
      <p>
        {tv.service.runtime === "desktop"
          ? "Sessão local iniciada explicitamente por --tv; Sunshine captura no computador e Moonlight é o cliente da TV."
          : "Prévia de sala usando a mesma biblioteca e player. Sunshine captura no computador; Moonlight é o cliente da TV. Integração real permanece pendente."}
      </p>
      <section className="workspace-list">
        <article>
          <h2>Preparar a experiência</h2>
          <ol>
            <li>
              Na integração futura, cadastrar o executável Ushark no Sunshine
              com o argumento ilustrativo <code>--tv</code>.
            </li>
            <li>
              Conectar Moonlight ao computador na LAN e selecionar Ushark.
            </li>
            <li>
              Navegar com direcionais, A/Enter para abrir, B/Escape para voltar.
            </li>
          </ol>
          <p>
            Este roteiro não registra o aplicativo nem confirma compatibilidade
            física.
          </p>
          <label>
            <input
              type="checkbox"
              checked={fullscreen}
              disabled={busy}
              onChange={(e) => setFullscreen(e.target.checked)}
            />
            Solicitar tela cheia do navegador ao iniciar
          </label>
          <label>
            <input
              type="checkbox"
              checked={fail}
              disabled={busy}
              onChange={(e) => setFail(e.target.checked)}
            />
            Simular sessão indisponível/offline
          </label>
          {error && <p role="alert">{error}</p>}
          {busy && <p role="status">Iniciando sessão simulada…</p>}
          <div className="workspace-actions">
            <Button
              disabled={busy}
              onClick={async () => {
                if (busy) return;
                setBusy(true);
                setError("");
                const control = new AbortController();
                c.current = control;
                if (fullscreen && !document.fullscreenElement)
                  void document.documentElement
                    .requestFullscreen?.()
                    .catch(() =>
                      setError(
                        "Tela cheia não permitida; prévia disponível em janela.",
                      ),
                    );
                const task = tv.service.connect(false, fail, control.signal);
                tv.refresh();
                try {
                  await task;
                  if (!control.signal.aborted) {
                    tv.refresh();
                    onBrowse();
                  }
                } catch (e) {
                  tv.refresh();
                  if (!control.signal.aborted) setError((e as Error).message);
                } finally {
                  if (!control.signal.aborted) setBusy(false);
                }
              }}
            >
              Iniciar sessão TV simulada
            </Button>
            {busy && (
              <Button variant="secondary" onClick={back}>
                Cancelar início
              </Button>
            )}
          </div>
        </article>
        <article>
          <h2>Validação física pendente</h2>
          <p>
            Sunshine/Moonlight: versões suportadas ainda não verificadas.
            Windows, TV, controle físico, LAN, captura de áudio/vídeo, encoder e
            foco entre janelas aguardam integração e ensaio real.
          </p>
          <p>
            O frontend pode demonstrar conexão, hotplug, política de desconexão
            e retorno ao app; essas simulações não comprovam hardware.
          </p>
        </article>
      </section>
    </main>
  );
}
