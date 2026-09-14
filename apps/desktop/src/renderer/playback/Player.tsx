import { PlaybackFallback } from "./PlaybackFallback";
import type { FallbackPreview } from "@ushark/types/fallback";
import { useTv } from "../tv/TvSession";
import { NextEpisode } from "./NextEpisode";
import type { NextEpisodePreview } from "@ushark/types/next-episode";
import type {
  StreamPreview,
  StreamScenario,
  StreamSnapshot,
} from "@ushark/types/stream";
import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@ushark/ui";
import {
  ArrowLeft,
  Captions,
  CheckCircle2,
  FastForward,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Rewind,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import type {
  PlaybackContent,
  PlayerPreview,
  PlayerScenario,
} from "@ushark/types/player";
import { useNavigation } from "../app/navigation";
import "./player.css";
const stamp = (n: number) =>
  `${Math.floor(n / 60)}:${Math.floor(n % 60)
    .toString()
    .padStart(2, "0")}`;
export function Player({
  nextService,
  preferredAudio,
  preferredSubtitle,
  suspended = false,
  onDiagnostics,
  fallback,
  autoSwitch,
  autoplay,
  nextPreflight,
  onNext,
  content,
  stream,
  service,
  onExit,
}: {
  nextService: NextEpisodePreview;
  preferredAudio: string;
  preferredSubtitle: string;
  suspended?: boolean;
  onDiagnostics: () => void;
  fallback: FallbackPreview;
  autoSwitch: boolean;
  autoplay: boolean;
  nextPreflight: boolean;
  onNext: (content: PlaybackContent) => void;
  stream: StreamPreview;
  content: PlaybackContent;
  service: PlayerPreview;
  onExit: () => void;
}) {
  const [sessionSource, setSessionSource] = useState({
    id: content.sourceId ?? content.id,
    name: content.sourceName ?? "Fonte não informada",
  });
  const fallbackLayer = useRef<(() => boolean) | null>(null),
    fallbackSeek = useRef<(() => void) | null>(null);
  const tv = useTv();
  const consumerMode = tv?.mode ?? false;
  const reviewMode = tv?.previewControls ?? false;
  const consumerPlayer = consumerMode || !reviewMode;
  const tvWasActive = useRef(tv?.state.active ?? false);
  const [progressive, setProgressive] = useState(content.progressive ?? false);
  const [streamScenario, setStreamScenario] =
    useState<StreamScenario>("normal");
  const [buffer, setBuffer] = useState<StreamSnapshot | null>(null);
  const seekResume = useRef<"paused" | "playing">("playing");
  const nextLayer = useRef<(() => boolean) | null>(null);
  const duration = content.duration || 5400;
  const [position, setPosition] = useState(
    service.progress(content.id)?.position ?? content.position ?? 0,
  );
  const confirmedPosition = useRef(position);
  const [status, setStatus] = useState<
    "preparing" | "playing" | "paused" | "error" | "seeking" | "closing"
  >("preparing");
  const [scenario, setScenario] = useState<PlayerScenario>("normal");
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState("");
  const [volume, setVolume] = useState(70);
  const [muted, setMuted] = useState(false);
  const [tracks, setTracks] = useState(false);
  const [settings, setSettings] = useState({
    audio: preferredAudio === "en" ? "English" : "Português",
    subtitle:
      preferredSubtitle === "off"
        ? "Desativada"
        : preferredSubtitle === "en"
          ? "English"
          : "Português",
    delay: 0,
    sync: 0,
    style: "Padrão",
    decode: "Automático",
  });
  const [draft, setDraft] = useState(settings);
  const [external, setExternal] = useState("");
  const [trackError, setTrackError] = useState("");
  const [controls, setControls] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [watched, setWatched] = useState(
    service.progress(content.id)?.watched ?? false,
  );
  const [notice, setNotice] = useState("");
  const root = useRef<HTMLElement>(null);
  const first = useRef<HTMLButtonElement>(null);
  const trackTrigger = useRef<HTMLButtonElement>(null);
  const controller = useRef<AbortController | null>(null);
  const seekTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = useRef(false);
  const closing = useRef(false);
  function exit() {
    if (closing.current) return;
    closing.current = true;
    controller.current?.abort();
    if (seekTimer.current) clearTimeout(seekTimer.current);
    if (active.current)
      service.save(content.id, confirmedPosition.current, watched);
    setStatus("closing");
    if (document.fullscreenElement && !tv?.mode)
      void document.exitFullscreen().catch(() => {});
    onExit();
  }
  useNavigation(() => {
    if (tracks) setTracks(false);
    else if (!fallbackLayer.current?.() && !nextLayer.current?.()) exit();
  }, !suspended);
  useEffect(() => {
    const abort = new AbortController();
    controller.current = abort;
    if (seekTimer.current) clearTimeout(seekTimer.current);
    setStatus("preparing");
    setError("");
    const prepare = progressive
      ? stream.request(position, streamScenario, abort.signal, setBuffer)
      : service.prepare(content, scenario, abort.signal);
    prepare
      .then(() => {
        if (!abort.signal.aborted) {
          active.current = true;
          setStatus("playing");
        }
      })
      .catch((e: Error) => {
        if (!abort.signal.aborted) {
          setError(e.message);
          setStatus("error");
        }
      });
    return () => abort.abort();
  }, [
    content,
    service,
    scenario,
    revision,
    progressive,
    streamScenario,
    stream,
  ]);
  useEffect(() => {
    first.current?.focus();
    const syncFullscreen = () =>
      setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
      controller.current?.abort();
      if (seekTimer.current) clearTimeout(seekTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);
  useEffect(() => {
    if (status !== "playing") {
      setControls(true);
      return;
    }
    reveal();
    const timer = setInterval(
      () => setPosition((p) => Math.min(p + 1, duration)),
      1000,
    );
    return () => clearInterval(timer);
  }, [status, duration]);
  useEffect(() => {
    if (active.current && (status === "playing" || status === "paused")) {
      confirmedPosition.current = position;
      service.save(content.id, position, watched);
    }
  }, [position, watched, content.id, service, status]);
  useEffect(() => {
    if (position >= duration && status === "playing") setStatus("paused");
  }, [position, duration, status]);
  function reveal() {
    setControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (status === "playing" && !tracks)
      hideTimer.current = setTimeout(() => setControls(false), 4000);
  }
  useEffect(() => {
    if (status === "playing" && !tracks) return;
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setControls(true);
  }, [status, tracks]);
  useEffect(() => {
    if (tv?.state.active && !tv.state.connected) {
      service.save(content.id, confirmedPosition.current, watched);
      if (tv.state.policy === "pause") {
        controller.current?.abort();
        if (seekTimer.current) clearTimeout(seekTimer.current);
        seekResume.current = "paused";
        setPosition(confirmedPosition.current);
        setStatus("paused");
        setNotice("Sessão TV desconectada; posição preservada.");
      }
    }
  }, [tv?.state.pauseEpoch]);
  useEffect(() => {
    if (tvWasActive.current && !tv?.state.active) exit();
    tvWasActive.current = tv?.state.active ?? false;
  }, [tv?.state.active]);
  const usable =
    status === "playing" || status === "paused" || status === "seeking";
  function seek(next: number) {
    fallbackSeek.current?.();
    if (!usable) return;
    if (status !== "seeking")
      seekResume.current = status === "paused" ? "paused" : "playing";
    const resume = seekResume.current;
    if (progressive) {
      controller.current?.abort();
      const control = new AbortController();
      controller.current = control;
      setStatus("seeking");
      setPosition(Math.max(0, Math.min(duration, next)));
      setBuffer(null);
      stream
        .request(
          Math.max(0, Math.min(duration, next)),
          streamScenario,
          control.signal,
          setBuffer,
        )
        .then(() => {
          if (!control.signal.aborted) setStatus(resume);
        })
        .catch((e: Error) => {
          if (!control.signal.aborted) {
            setError(e.message);
            setStatus("error");
          }
        });
      return;
    }
    if (seekTimer.current) clearTimeout(seekTimer.current);
    setStatus("seeking");
    setPosition(Math.max(0, Math.min(duration, next)));
    seekTimer.current = setTimeout(() => setStatus(resume), 180);
  }
  return (
    <main
      ref={root}
      className="player-preview"
      data-tv-mode={consumerMode || undefined}
      onPointerMove={reveal}
      onPointerDown={reveal}
      onKeyDown={reveal}
    >
      <div
        className="player-scene"
        aria-label={`Reprodução de ${content.title}`}
      >
        <img src="/movie-art/orbitas.svg" alt="" />
        {!consumerPlayer && (
          <span>Simulação de reprodução · nenhum vídeo ou processo real</span>
        )}
      </div>
      <div
        className={
          "player-controls " +
          (!controls && status === "playing" && !tracks ? "resting" : "")
        }
        onFocus={reveal}
      >
        <div className="player-chrome">
          <header>
            <h1>{content.title}</h1>
            {!consumerPlayer && (
              <span>
                {scenario === "offline"
                  ? "Offline · arquivo local simulado"
                  : "Prévia local"}
              </span>
            )}
          </header>
          {!consumerPlayer && sessionSource.name && (
            <p className="player-source">
              Fonte: {sessionSource.name}
              {content.selector ? ` · arquivo ${content.selector}` : ""}
            </p>
          )}
          <section className="player-status" aria-live="polite">
            <h2>
              {
                {
                  preparing: "Preparando reprodução…",
                  playing: consumerPlayer
                    ? "Reproduzindo"
                    : "Reproduzindo · primeiro frame simulado",
                  paused: "Pausado",
                  error: "Não foi possível reproduzir",
                  seeking: "Buscando posição…",
                  closing: "Encerrando…",
                }[status]
              }
            </h2>
            {error && (
              <div role="alert">
                <p>{error}</p>
                <Button
                  onClick={() => {
                    setScenario("normal");
                    setStreamScenario("normal");
                    setRevision((v) => v + 1);
                  }}
                >
                  Tentar novamente
                </Button>
              </div>
            )}
          </section>
          {progressive && !consumerPlayer && (
            <section className="stream-buffer" aria-live="polite">
              <h3>
                {status === "error"
                  ? "Buffer indisponível"
                  : buffer?.phase === "ready"
                    ? "Pronto parcial · Stream Only"
                    : buffer?.phase === "metadata"
                      ? "Obtendo metadata e índice…"
                      : "Reconstruindo buffer…"}
              </h3>
              <progress
                aria-label="Buffer simulado"
                value={status === "error" ? 0 : (buffer?.seconds ?? 0)}
                max={buffer?.target ?? 12}
              />
              <p>
                {status === "error" ? 0 : (buffer?.seconds ?? 0)} s /{" "}
                {buffer?.target ?? 12} s ·{" "}
                {status === "error" ? 0 : (buffer?.megabytes ?? 0)} MB ·{" "}
                {buffer?.bitrate ?? 8} Mbps (valores ilustrativos)
              </p>
              <p>
                Arquivo parcial · somente cache temporário · conteúdo ativo
                protegido.
              </p>
            </section>
          )}
          <section className="player-transport">
            <label className="player-progress">
              <span className="player-visually-hidden">Posição</span>
              <input
                aria-label="Posição"
                type="range"
                min="0"
                max={duration}
                value={position}
                disabled={!usable}
                onChange={(e) => seek(Number(e.target.value))}
              />
            </label>
            <div
              className="player-toolbar"
              role="toolbar"
              aria-label="Controles de reprodução"
            >
              <Button
                ref={first}
                className="player-icon-button"
                variant="secondary"
                aria-label={
                  status === "preparing"
                    ? "Cancelar preparação"
                    : "Voltar aos detalhes"
                }
                title={
                  status === "preparing"
                    ? "Cancelar preparação"
                    : "Voltar aos detalhes"
                }
                onClick={exit}
              >
                <ArrowLeft aria-hidden="true" />
              </Button>
              <Button
                className="player-icon-button player-primary-control"
                disabled={!usable}
                aria-label={status === "paused" ? "Reproduzir" : "Pausar"}
                title={status === "paused" ? "Reproduzir" : "Pausar"}
                onClick={() =>
                  setStatus((s) => (s === "paused" ? "playing" : "paused"))
                }
              >
                {status === "paused" ? (
                  <Play aria-hidden="true" fill="currentColor" />
                ) : (
                  <Pause aria-hidden="true" fill="currentColor" />
                )}
              </Button>
              <Button
                className="player-icon-button"
                disabled={!usable}
                variant="secondary"
                aria-label="Recomeçar"
                title="Recomeçar"
                onClick={() => seek(0)}
              >
                <RotateCcw aria-hidden="true" />
              </Button>
              <Button
                className="player-icon-button"
                disabled={!usable}
                variant="secondary"
                aria-label="Voltar 10s"
                title="Voltar 10 segundos"
                onClick={() => seek(position - 10)}
              >
                <Rewind aria-hidden="true" fill="currentColor" />
              </Button>
              <Button
                className="player-icon-button"
                disabled={!usable}
                variant="secondary"
                aria-label="Avançar 30s"
                title="Avançar 30 segundos"
                onClick={() => seek(position + 30)}
              >
                <FastForward aria-hidden="true" fill="currentColor" />
              </Button>
              <Button
                className="player-icon-button"
                variant="secondary"
                aria-pressed={muted}
                aria-label={muted ? "Ativar som" : "Silenciar"}
                title={muted ? "Ativar som" : "Silenciar"}
                onClick={() => setMuted(!muted)}
              >
                {muted ? (
                  <VolumeX aria-hidden="true" />
                ) : (
                  <Volume2 aria-hidden="true" />
                )}
              </Button>
              <label className="player-volume">
                <span className="player-visually-hidden">Volume</span>
                <input
                  aria-label="Volume"
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                />
              </label>
              <span className="player-time" aria-label="Posição da reprodução">
                {stamp(position)} / {stamp(duration)}
              </span>
              <span className="player-toolbar-spacer" />
              <Button
                ref={trackTrigger}
                className="player-icon-button"
                variant="secondary"
                disabled={!usable}
                aria-label="Áudio e legendas"
                title="Áudio e legendas"
                onClick={() => {
                  setDraft(settings);
                  setTrackError("");
                  setTracks(true);
                }}
              >
                <Captions aria-hidden="true" />
              </Button>
              <Button
                className="player-icon-button"
                variant="secondary"
                disabled={!usable}
                aria-pressed={watched}
                aria-label={
                  watched ? "Marcar não assistido" : "Marcar assistido"
                }
                title={watched ? "Marcar não assistido" : "Marcar assistido"}
                onClick={() => setWatched(!watched)}
              >
                <CheckCircle2
                  aria-hidden="true"
                  fill={watched ? "currentColor" : "none"}
                />
              </Button>
              <Button
                className="player-icon-button"
                variant="secondary"
                aria-label={fullscreen ? "Sair da tela cheia" : "Tela cheia"}
                title={fullscreen ? "Sair da tela cheia" : "Tela cheia"}
                onClick={async () => {
                  try {
                    if (document.fullscreenElement)
                      await document.exitFullscreen();
                    else await root.current?.requestFullscreen();
                  } catch {
                    setNotice("Tela cheia indisponível neste ambiente.");
                  }
                }}
              >
                {fullscreen ? (
                  <Minimize2 aria-hidden="true" />
                ) : (
                  <Maximize2 aria-hidden="true" />
                )}
              </Button>
            </div>
            <p
              className="player-visually-hidden"
              data-testid="player-track-summary"
            >
              Áudio: {settings.audio} · Legenda:{" "}
              {scenario === "no-subtitles" &&
              !settings.subtitle.startsWith("Externa:")
                ? "Nenhuma faixa embutida"
                : settings.subtitle}{" "}
              · {watched ? "Assistido" : "Em andamento"}
              {notice && <span role="status"> · {notice}</span>}
            </p>
          </section>
        </div>
        {!consumerPlayer && (
          <>
            <Button
              className="player-diagnostics"
              variant="secondary"
              onClick={onDiagnostics}
            >
              Diagnóstico
            </Button>
            <PlaybackFallback
              contentId={content.id}
              current={sessionSource.id}
              service={fallback}
              automatic={autoSwitch}
              cancelLayer={fallbackLayer}
              cancelSeek={fallbackSeek}
              onSeek={() => seek(position + 30)}
              onSwitch={(candidate) => {
                setSessionSource({ id: candidate.id, name: candidate.name });
                setNotice("Fonte da sessão recuperada; posição preservada.");
              }}
            />
          </>
        )}
        <NextEpisode
          content={content}
          position={position}
          duration={duration}
          service={nextService}
          autoplay={autoplay}
          preflight={nextPreflight}
          onNext={(next) => {
            service.save(content.id, position, true);
            controller.current?.abort();
            onNext(next);
          }}
          onSimulateEnd={() => {
            setPosition(duration);
            setStatus("paused");
          }}
          cancelLayer={nextLayer}
          consumerMode={consumerPlayer}
        />
        {!consumerPlayer && (
          <details>
            <summary>Cenários do player</summary>
            <label>
              Modo de reprodução
              <select
                value={progressive ? "progressive" : "local"}
                onChange={(e) => {
                  controller.current?.abort();
                  setBuffer(null);
                  setProgressive(e.target.value === "progressive");
                }}
              >
                <option value="local">Arquivo local simulado</option>
                <option value="progressive">
                  Torrent progressivo simulado
                </option>
              </select>
            </label>
            {progressive && (
              <>
                <label>
                  Estado do stream
                  <select
                    value={streamScenario}
                    onChange={(e) => {
                      setBuffer(null);
                      setStreamScenario(e.target.value as StreamScenario);
                    }}
                  >
                    {Object.entries({
                      normal: "Normal",
                      metadata: "Metadata incompleta",
                      network: "Rede perdida",
                      disk: "Disco cheio",
                      slow: "Peers lentos",
                      vbr: "Bitrate variável",
                    }).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <p>
                  Diagnóstico simulado: detectado 1080p prevalece sobre
                  declarado 4K. HEAD/TAIL e HOT na posição{" "}
                  {Math.floor(position)} s; WARM até{" "}
                  {Math.floor(position + (buffer?.target ?? 12))} s. Geração{" "}
                  {buffer?.generation ?? 0}. Tempo→byte aproximado; RAM limitada
                  a 128 MB, disco temporário a 512 MB nesta fixture. Downloads
                  de fundo cedem prioridade ao playback; sem operações reais de
                  I/O.
                </p>
              </>
            )}
            <label>
              Estado simulado{" "}
              <select
                value={scenario}
                onChange={(e) => setScenario(e.target.value as PlayerScenario)}
              >
                {Object.entries({
                  normal: "Normal",
                  missing: "Sem arquivo",
                  removed: "Arquivo removido",
                  codec: "Codec não suportado",
                  crash: "MPV falhou (simulado)",
                  "no-subtitles": "Sem legendas",
                  offline: "Offline",
                }).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <p>
              Métricas ilustrativas: H.264 · 8 Mbps · dropped frames
              indisponível · decode {settings.decode}. Sem garantia de hardware.
            </p>
          </details>
        )}
      </div>
      <Dialog.Root open={tracks && !suspended} onOpenChange={setTracks}>
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay" />
          <Dialog.Content
            className="modal"
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              trackTrigger.current?.focus();
            }}
          >
            <Dialog.Title>Áudio e legendas</Dialog.Title>
            <Dialog.Description>
              {consumerPlayer
                ? "Escolha as faixas para esta reprodução."
                : "Preferências simuladas. Cancelar preserva os valores anteriores."}
            </Dialog.Description>
            <label>
              Faixa de áudio
              <select
                value={draft.audio}
                onChange={(e) => setDraft({ ...draft, audio: e.target.value })}
              >
                <option>Português</option>
                <option>English</option>
              </select>
            </label>
            <label>
              Legenda
              <select
                value={draft.subtitle}
                onChange={(e) =>
                  setDraft({ ...draft, subtitle: e.target.value })
                }
              >
                <option>Desativada</option>
                {scenario !== "no-subtitles" && (
                  <>
                    <option>Português</option>
                    <option>English</option>
                  </>
                )}
                {draft.subtitle.startsWith("Externa:") && (
                  <option>{draft.subtitle}</option>
                )}
              </select>
            </label>
            {!consumerPlayer && (
              <>
                <label>
                  Nome da legenda externa simulada
                  <input
                    value={external}
                    placeholder="legenda.srt"
                    onChange={(e) => setExternal(e.target.value)}
                  />
                </label>
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (!/^[\w .-]+\.(srt|vtt|ass)$/i.test(external.trim())) {
                      setTrackError(
                        "Use um nome .srt, .vtt ou .ass, sem caminho ou URL.",
                      );
                      return;
                    }
                    setDraft({
                      ...draft,
                      subtitle: `Externa: ${external.trim()}`,
                    });
                    setTrackError("");
                  }}
                >
                  Adicionar legenda simulada
                </Button>
                <label>
                  Atraso da legenda (s)
                  <input
                    type="number"
                    min="-60"
                    max="60"
                    value={draft.delay}
                    onChange={(e) =>
                      setDraft({ ...draft, delay: Number(e.target.value) })
                    }
                  />
                </label>
                <label>
                  Sincronia A/V (s)
                  <input
                    type="number"
                    min="-10"
                    max="10"
                    value={draft.sync}
                    onChange={(e) =>
                      setDraft({ ...draft, sync: Number(e.target.value) })
                    }
                  />
                </label>
                <label>
                  Estilo de legenda
                  <select
                    value={draft.style}
                    onChange={(e) =>
                      setDraft({ ...draft, style: e.target.value })
                    }
                  >
                    <option>Padrão</option>
                    <option>Grande</option>
                    <option>Alto contraste</option>
                  </select>
                </label>
                <label>
                  Decode simulado
                  <select
                    value={draft.decode}
                    onChange={(e) =>
                      setDraft({ ...draft, decode: e.target.value })
                    }
                  >
                    <option>Automático</option>
                    <option>Hardware</option>
                    <option>Software</option>
                  </select>
                </label>
              </>
            )}
            {trackError && <p role="alert">{trackError}</p>}
            <div className="player-actions">
              <Button
                onClick={() => {
                  if (Math.abs(draft.delay) > 60 || Math.abs(draft.sync) > 10) {
                    setTrackError(
                      "Atraso deve estar entre -60 e 60; sync entre -10 e 10.",
                    );
                    return;
                  }
                  setSettings(draft);
                  setTracks(false);
                }}
              >
                Aplicar
              </Button>
              <Dialog.Close asChild>
                <Button variant="secondary">Cancelar</Button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}
