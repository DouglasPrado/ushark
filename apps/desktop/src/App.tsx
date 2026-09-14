import { useEffect, useRef, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Folder,
  Gamepad2,
  Library,
  Monitor,
  Play,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Button } from "../../../packages/ui/src";
import type {
  Configuration,
  Preferences,
  Scenario,
} from "../../../packages/types/src";
import { configurationError } from "../../../packages/types/src";
import { useConfigurationController } from "./features/configuration/useConfigurationController";
import { useNavigation } from "./navigation";
import { useConfigurationStore } from "./state/configuration.store";
import { useUiStore, type AppModal } from "./state/ui.store";

const steps = [
  "Boas-vindas",
  "Sua biblioteca",
  "Espaço para assistir",
  "Do seu jeito",
];
function Options<Value extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: Value;
  options: readonly (readonly [Value, string])[];
  onChange: (value: Value) => void;
}) {
  return (
    <fieldset>
      <legend>{label}</legend>
      <div className="choices">
        {options.map(([id, text]) => (
          <button
            key={id}
            type="button"
            aria-pressed={value === id}
            className="choice"
            onClick={() => onChange(id)}
          >
            {value === id && <Check size={17} />} {text}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
function Toggle({
  label,
  detail,
  checked,
  onChange,
}: {
  label: string;
  detail?: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      className="toggle-row"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
    >
      <span>
        {label}
        {detail && <small>{detail}</small>}
      </span>
      <span className={"toggle " + (checked ? "on" : "")}>
        <i />
      </span>
    </button>
  );
}
export function App() {
  const config = useConfigurationStore((state) => state.configuration);
  const updateConfiguration = useConfigurationStore(
    (state) => state.updateConfiguration,
  );
  const updatePreference = useConfigurationStore(
    (state) => state.updatePreference,
  );
  const route = useUiStore((state) => state.route);
  const step = useUiStore((state) => state.step);
  const modal = useUiStore((state) => state.modal);
  const scenario = useUiStore((state) => state.scenario);
  const error = useUiStore((state) => state.error);
  const notice = useUiStore((state) => state.notice);
  const advanced = useUiStore((state) => state.advanced);
  const setRoute = useUiStore((state) => state.navigate);
  const setStep = useUiStore((state) => state.setStep);
  const setModal = useUiStore((state) => state.setModal);
  const setError = useUiStore((state) => state.setError);
  const clearFeedback = useUiStore((state) => state.clearFeedback);
  const setAdvanced = useUiStore((state) => state.setAdvanced);
  const { busy, save, reset, changeScenario } = useConfigurationController();
  const heading = useRef<HTMLHeadingElement>(null);
  const actionOrigin = useRef<HTMLElement | null>(null);
  const primary = useRef<HTMLButtonElement>(null);
  function navigate(next: string) {
    if (next !== "onboarding" && next !== "home" && next !== "settings") {
      return;
    }
    setRoute(next);
    window.location.hash = "/" + next;
  }
  function back() {
    if (modal) {
      setModal(null);
      return;
    }
    if (busy) return;
    if (route === "settings") {
      navigate("home");
      return;
    }
    if (route === "onboarding" && step > 0) setStep(step - 1);
  }
  const input = useNavigation(back);
  useEffect(() => {
    window.location.hash = "/onboarding";
  }, []);
  useEffect(() => {
    primary.current?.focus();
  }, [route, step]);
  const update = <K extends keyof Configuration>(
    key: K,
    value: Configuration[K],
  ) => {
    updateConfiguration(key, value);
    clearFeedback();
  };
  function preference<K extends keyof Preferences>(
    key: K,
    value: Preferences[K],
  ) {
    updatePreference(key, value);
    clearFeedback();
  }
  function advance() {
    clearFeedback();
    if (step === 1 && !config.name.trim()) {
      setError("Dê um nome à biblioteca.");
      return;
    }
    if (step === 2) {
      const invalid = configurationError(config);
      if (invalid) {
        setError(invalid);
        return;
      }
    }
    if (step < 3) setStep(step + 1);
    else void save();
  }
  const open = (kind: AppModal) => {
    actionOrigin.current = document.activeElement as HTMLElement;
    setError("");
    setModal(kind);
  };
  const folders = (kind: "libraryPath" | "cachePath") => (
    <div className="folder-field">
      <span>
        <Folder />
        <span>
          <strong>
            {kind === "libraryPath" ? "Pasta da biblioteca" : "Pasta do cache"}
          </strong>
          <small>{config[kind]}</small>
        </span>
      </span>
      <Button variant="secondary" onClick={() => open(kind)}>
        Escolher pasta
      </Button>
    </div>
  );
  const playback = (
    <>
      <Options
        label="O que importa mais para você?"
        value={config.preferences.strategy}
        options={[
          ["balanced", "Melhor equilíbrio"],
          ["quality", "Melhor qualidade"],
          ["fast", "Começar mais rápido"],
        ]}
        onChange={(v) => preference("strategy", v)}
      />
      <Options
        label="Resolução máxima"
        value={config.preferences.resolution}
        options={[
          ["720p", "720p"],
          ["1080p", "1080p"],
          ["2160p", "4K"],
        ]}
        onChange={(v) => preference("resolution", v)}
      />
      <div className="two-columns">
        <Options
          label="Idioma de áudio"
          value={config.preferences.audio}
          options={[
            ["pt-BR", "Português"],
            ["en", "English"],
          ]}
          onChange={(v) => preference("audio", v)}
        />
        <Options
          label="Legendas"
          value={config.preferences.subtitle}
          options={[
            ["pt-BR", "Português"],
            ["en", "English"],
            ["off", "Desligadas"],
          ]}
          onChange={(v) => preference("subtitle", v)}
        />
      </div>
      <Button
        variant="ghost"
        aria-expanded={advanced}
        onClick={() => setAdvanced(!advanced)}
      >
        <SlidersHorizontal size={18} /> Automação e modo TV{" "}
        <ChevronRight size={18} />
      </Button>
      {advanced && (
        <div className="advanced">
          {(
            [
              ["autoSelect", "Selecionar a melhor fonte"],
              ["autoSwitch", "Trocar fonte se necessário"],
              ["autoplay", "Reproduzir próximo episódio"],
              ["preflight", "Preparar conteúdo em foco"],
              ["nextPreflight", "Preparar próximo episódio"],
            ] as const
          ).map(([key, label]) => (
            <Toggle
              key={key}
              label={label}
              checked={config.preferences[key]}
              onChange={() => preference(key, !config.preferences[key])}
            />
          ))}
          <Options
            label="Ao desconectar da TV"
            value={config.preferences.disconnect}
            options={[
              ["pause", "Pausar"],
              ["continue", "Continuar"],
            ]}
            onChange={(v) => preference("disconnect", v)}
          />
        </div>
      )}
    </>
  );
  let content: ReactNode;
  if (route === "home")
    content = (
      <div className="home">
        <div className="eyebrow">SEU ESPAÇO, SUAS ESCOLHAS</div>
        <h1 ref={heading}>{config.name}</h1>
        <p className="intro">Toda boa coleção começa com uma descoberta.</p>
        <div className="empty-art">
          <Library size={68} />
          <span className="orbit o1" />
          <span className="orbit o2" />
        </div>
        <h2>Um novo lugar para suas histórias.</h2>
        <p>
          Filmes, séries e suas coleções favoritas.
          <br />
          Tudo junto, do seu jeito.
        </p>
        <div className="empty-actions">
          <Button disabled>
            <Play size={18} /> Adicionar conteúdo
          </Button>
          <Button variant="secondary" disabled>
            <Library size={18} /> Importar biblioteca
          </Button>
        </div>
        <small>
          Adicionar conteúdo e importar bibliotecas chegam nos próximos
          milestones.
        </small>
        <Button
          ref={primary}
          variant="ghost"
          onClick={() => navigate("settings")}
        >
          <Settings size={18} /> Ajustar preferências
        </Button>
      </div>
    );
  else if (route === "settings")
    content = (
      <>
        <div className="eyebrow">CONFIGURAÇÕES</div>
        <h1>Seu jeito de assistir.</h1>
        <p className="intro">Escolhas que deixam tudo mais confortável.</p>
        {playback}
        <div className="settings-storage">
          <h2>Biblioteca e armazenamento</h2>
          {folders("libraryPath")}
          {folders("cachePath")}
          <label>
            Limite do cache (GB)
            <input
              type="number"
              min="1"
              max="10000"
              value={config.cacheGB}
              onChange={(e) => update("cacheGB", Number(e.target.value))}
            />
          </label>
        </div>
        <div className="footer-actions">
          <Button variant="secondary" onClick={() => open("reset")}>
            Restaurar preferências
          </Button>
          <Button ref={primary} disabled={busy} onClick={() => void save()}>
            {busy ? "Salvando…" : "Salvar preferências"}
            <Check size={18} />
          </Button>
        </div>
      </>
    );
  else
    content = (
      <>
        <div className="eyebrow">
          {step === 0
            ? "BEM-VINDO AO USHARK"
            : `VAMOS PREPARAR TUDO · ${String(step).padStart(2, "0")} / 03`}
        </div>
        <h1 ref={heading}>
          {
            [
              "Suas histórias.\nSeu lugar.",
              "Uma casa para\nsua coleção.",
              "Espaço para\na próxima história.",
              "A melhor experiência\né a sua.",
            ][step]
          }
        </h1>
        <p className="intro">
          {
            [
              "Sua biblioteca, suas fontes e a liberdade de assistir do seu jeito. No computador ou na sua TV.",
              "Dê um nome à sua biblioteca e escolha onde ela vai morar. Você pode mudar isso depois.",
              "Reserve um espaço temporário para assistir. Sua biblioteca fica separada e protegida.",
              "Escolha como você prefere assistir. Nós cuidamos dos detalhes quando for hora de dar play.",
            ][step]
          }
        </p>
        {step === 0 ? (
          <div className="benefits">
            <div>
              <Library />
              <span>
                <strong>Sua coleção, organizada</strong>
                <small>Filmes e séries em um só lugar.</small>
              </span>
            </div>
            <div>
              <Monitor />
              <span>
                <strong>Da sua tela para a sala</strong>
                <small>Uma experiência pensada para controle.</small>
              </span>
            </div>
            <div>
              <ShieldCheck />
              <span>
                <strong>Seu espaço continua seu</strong>
                <small>Biblioteca e preferências locais.</small>
              </span>
            </div>
          </div>
        ) : step === 1 ? (
          <>
            <label>
              Nome da biblioteca
              <input
                autoComplete="off"
                maxLength={80}
                value={config.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </label>
            {folders("libraryPath")}
            <p className="note">
              <ShieldCheck size={18} /> A biblioteca guarda sua organização.
              Seus arquivos de mídia têm escolhas próprias.
            </p>
          </>
        ) : step === 2 ? (
          <>
            {folders("cachePath")}
            <label>
              Limite do cache (GB)
              <input
                type="number"
                value={config.cacheGB}
                min="1"
                max="10000"
                onChange={(e) => update("cacheGB", Number(e.target.value))}
              />
            </label>
            <p className="note">
              SSD ou NVMe é recomendado para o cache ativo.
            </p>
            <Toggle
              label="Limpar automaticamente"
              detail="Liberar apenas dados temporários elegíveis."
              checked={config.cleanup}
              onChange={() => update("cleanup", !config.cleanup)}
            />
            <Toggle
              label="Manter o que comecei a assistir"
              detail="Preservar conteúdos parcialmente assistidos."
              checked={config.retainPartial}
              onChange={() => update("retainPartial", !config.retainPartial)}
            />
          </>
        ) : (
          playback
        )}
        <div className="footer-actions">
          <span className="step-detail">
            {step === 0
              ? "Poucos passos. Tudo no seu ritmo."
              : `${step} de 3 · ${steps[step]}`}
          </span>
          <Button ref={primary} disabled={busy} onClick={advance}>
            {busy
              ? "Preparando…"
              : step === 0
                ? "Começar"
                : step === 3
                  ? "Abrir minha biblioteca"
                  : "Continuar"}
            <ArrowRight size={20} />
          </Button>
        </div>
      </>
    );
  return (
    <div className="app">
      <main>
        <aside>
          <div className="aside-top">
            <span className="mini-label">SEU CINEMA COMEÇA AQUI</span>
            <div className="cinema-art">
              <div className="ticket">
                <Play size={42} fill="currentColor" />
                <span>
                  PRESS PLAY.
                  <br />
                  FEEL AT HOME.
                </span>
              </div>
              <span className="art-ring" />
            </div>
          </div>
          <nav aria-label="Etapas de configuração">
            {steps.map((s, i) => (
              <div
                className={
                  "step " +
                  (route === "onboarding" && i === step ? "active" : "") +
                  (i < step ? " complete" : "")
                }
                key={s}
              >
                <span>
                  {i < step ? (
                    <Check size={15} />
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </span>
                <strong>{s}</strong>
                {route === "onboarding" && i === step && <i />}
              </div>
            ))}
          </nav>
          <div className="aside-bottom">
            <ShieldCheck size={16} /> Feito para continuar sendo seu.
          </div>
        </aside>
        <section className="surface">
          {(route === "settings" || (route === "onboarding" && step > 0)) && (
            <Button className="back" variant="ghost" onClick={back}>
              <ArrowLeft size={17} /> Voltar
            </Button>
          )}
          {scenario === "offline" && (
            <div className="banner">
              Você está offline. A configuração local continua disponível.
            </div>
          )}
          {scenario === "degraded" && (
            <div className="banner">
              Alguns serviços estão indisponíveis. Você pode continuar.
            </div>
          )}
          {content}
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          {notice && (
            <div className="success" role="status">
              {notice}
            </div>
          )}
        </section>
      </main>
      <footer>
        <span>
          <Gamepad2 size={17} />{" "}
          {input === "gamepad"
            ? "Controle conectado · A selecionar · B voltar"
            : input === "disconnected"
              ? "Controle desconectado · teclado disponível"
              : "Tab navegar · Enter selecionar · Esc voltar"}
        </span>
        <span>Prévia em memória · reiniciar descarta alterações</span>
        <label className="scenario">
          Cenário
          <select
            aria-label="Cenário de teste"
            value={scenario}
            onChange={(e) => {
              const v = e.target.value as Scenario;
              changeScenario(v);
            }}
          >
            {[
              ["normal", "Normal"],
              ["loading", "Salvamento lento"],
              ["offline", "Offline"],
              ["error", "Erro ao salvar"],
              ["folder-error", "Pasta inacessível"],
              ["degraded", "Serviço degradado"],
            ].map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </footer>
      <Dialog.Root
        open={!!modal}
        onOpenChange={(v) => {
          if (!v && !busy) setModal(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay" />
          <Dialog.Content
            className="modal"
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              actionOrigin.current?.focus();
            }}
          >
            <Dialog.Title>
              {modal === "reset"
                ? "Voltar às preferências iniciais?"
                : "Escolha um lugar"}
            </Dialog.Title>
            <Dialog.Description>
              {modal === "reset"
                ? "Somente preferências de reprodução serão restauradas. Sua biblioteca, cache, histórico e downloads permanecem."
                : "Seletor simulado. Nenhuma pasta será criada ou acessada nesta prévia."}
            </Dialog.Description>
            {modal !== "reset" && (
              <div className="folder-options">
                {["C:\\Ushark\\", "D:\\Cinema\\", "E:\\Media\\"].map((base) => {
                  const path =
                    base + (modal === "libraryPath" ? "Library" : "Cache");
                  return (
                    <Button
                      variant="secondary"
                      key={base}
                      onClick={() => {
                        if (modal === "libraryPath" || modal === "cachePath")
                          update(modal, path);
                        setModal(null);
                      }}
                    >
                      <Folder size={19} />
                      {path}
                    </Button>
                  );
                })}
              </div>
            )}
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <div className="footer-actions">
              <Dialog.Close asChild>
                <Button variant="secondary" disabled={busy}>
                  Cancelar
                </Button>
              </Dialog.Close>
              {modal === "reset" && (
                <Button disabled={busy} onClick={() => void reset()}>
                  {busy ? "Restaurando…" : "Restaurar"}
                </Button>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                aria-label="Fechar"
                className="modal-close"
                disabled={busy}
              >
                <X size={22} />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
