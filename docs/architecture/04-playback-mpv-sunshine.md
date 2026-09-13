# TorrentStream — Architecture 04: Playback, MPV, Sunshine & Moonlight

**Status:** Draft v1  
**Produto:** TorrentStream  
**Documento:** Architecture Specification  
**Dependências:**  
- `01-prd-master.md`
- `02-user-journeys.md`
- `03-functional-requirements.md`
- `04-non-functional-requirements.md`
- `docs/architecture/01-library-manifest.md`
- `docs/architecture/02-torrent-streaming-engine.md`
- `docs/architecture/03-health-score-source-selection.md`

---

# 1. Objetivo

Este documento define a arquitetura de reprodução do TorrentStream.

Ele cobre:

- integração com MPV;
- lifecycle do player;
- IPC;
- fullscreen;
- direct play;
- hardware decoding;
- áudio;
- legendas;
- seek;
- overlays;
- integração com Sunshine;
- integração com Moonlight;
- navegação por controle;
- comportamento ao desconectar;
- retomada;
- encerramento.

O objetivo é:

> **Fazer o TorrentStream parecer um aplicativo nativo de TV, mesmo sendo executado no PC e transmitido via Sunshine/Moonlight.**

---

# 2. Princípio central

O TorrentStream não deve expor ao usuário:

```text
desktop
terminal
janelas auxiliares
filesystem
cliente torrent
MPV separado
```

A experiência deve parecer:

```text
Moonlight
↓
TorrentStream
↓
Biblioteca
↓
Play
↓
Player
```

---

# 3. Arquitetura macro

```text
┌──────────────────────────────────────┐
│         Electron / React UI          │
│                                      │
│ Home                                 │
│ Details                              │
│ Player Overlay                       │
└─────────────────┬────────────────────┘
                  │ IPC
                  ▼
┌──────────────────────────────────────┐
│            Application Core          │
│                                      │
│ Playback Coordinator                 │
│ Source Selection                     │
│ Torrent Controller                   │
│ User State                           │
└──────────────┬───────────────┬───────┘
               │               │
               │               │
               ▼               ▼
          torrentd            MPV
               │               │
               └──────┬────────┘
                      ▼
                  Sunshine
                      │
                      ▼
                  Moonlight
                      │
                      ▼
                      TV
```

---

# 4. Responsabilidades

## 4.1 UI

Responsável por:

- controles;
- overlays;
- navegação;
- feedback visual;
- seleção de áudio;
- seleção de legenda;
- exibição de progresso.

Não deve controlar diretamente detalhes internos do MPV.

---

## 4.2 Playback Coordinator

Responsável por:

- iniciar sessão de playback;
- iniciar/parar MPV;
- configurar source;
- sincronizar estado com torrentd;
- receber eventos;
- salvar progresso;
- tratar erro;
- executar fallback de source.

---

## 4.3 MPV

Responsável por:

- demux;
- decode;
- render;
- áudio;
- legendas;
- seek;
- clock;
- reprodução.

---

# 5. Player escolhido

A implementação planejada utiliza:

```text
MPV
```

Motivos:

- suporte amplo a codecs;
- hardware decode;
- suporte a MKV;
- múltiplas faixas;
- legendas;
- IPC;
- automação;
- boa performance;
- direct play.

---

# 6. MPV como processo separado

Estrutura:

```text
TorrentStream.exe
│
├── UI/Core
├── torrentd.exe
└── mpv.exe
```

Benefícios:

- crash isolation;
- restart do player;
- lifecycle controlado;
- logs separados;
- UI não bloqueada.

---

# 7. Player Session

Cada reprodução deve possuir:

```ts
interface PlayerSession {
  id: string;
  contentId: string;
  sourceId: string;
  streamSessionId: string;
  mpvProcessId?: number;
  startedAt: number;
  state: PlayerState;
}
```

Estados:

```text
idle
preparing
launching
buffering
playing
paused
seeking
ended
error
stopping
```

---

# 8. Fluxo de Playback

```text
Usuário clica Play
↓
Source Selection
↓
Torrent preflight
↓
Stream prepare
↓
Startup buffer
↓
Launch MPV
↓
Load media
↓
First frame
↓
Playing
```

---

# 9. Playback Readiness

MPV só deve ser iniciado quando:

```text
source resolvida
+
media file resolvida
+
startup data disponível
+
player args válidos
```

---

# 10. Direct Play

Default:

```text
Torrent
↓
Arquivo parcial/local
↓
MPV
```

Evitar:

```text
Torrent
↓
FFmpeg transcode
↓
HLS
↓
player
```

quando não necessário.

---

# 11. Hardware Decode

MPV deve ser configurado para usar aceleração de hardware quando disponível.

Exemplo conceitual:

```text
hwdec=auto-safe
```

Configuração exata fica sujeita ao ambiente.

---

# 12. Codec Support

Player deve suportar, quando o hardware/MPV permitir:

```text
H.264
HEVC / H.265
AV1
VP9
MPEG-4
AAC
AC3
EAC3
DTS
TrueHD
FLAC
```

---

# 13. Containers

Principalmente:

```text
MKV
MP4
AVI
WEBM
MPEG-TS
```

---

# 14. MPV IPC

O Core deve controlar MPV via IPC local.

No Windows, opções:

```text
Named Pipe
```

ou mecanismo equivalente suportado pelo MPV.

---

# 15. IPC Commands mínimos

```text
loadfile
set pause
seek
stop
quit
get_property time-pos
get_property duration
get_property pause
get_property track-list
set audio
set sid
```

---

# 16. IPC Events

Eventos importantes:

```text
file-loaded
playback-restart
pause
unpause
seek
end-file
shutdown
property-change
```

---

# 17. Event Normalization

Core deve converter eventos MPV para contrato interno.

Exemplo:

```ts
type PlaybackEvent =
  | { type: 'player.loaded' }
  | { type: 'player.playing' }
  | { type: 'player.paused' }
  | { type: 'player.seek'; position: number }
  | { type: 'player.ended' }
  | { type: 'player.error'; code: string };
```

---

# 18. First Frame

Métrica crítica:

```text
Play click
→ first decoded/rendered frame
```

Essa é a métrica real de startup.

---

# 19. Fullscreen

Em modo TV:

```text
MPV
= fullscreen
```

sem mostrar bordas de janela.

---

# 20. Embedded vs Separate Window

Duas estratégias possíveis:

## A — janela MPV separada

Mais simples e robusta.

## B — render embutido

Mais integrado, porém maior complexidade.

---

# 21. Recomendação inicial

Usar:

```text
MPV em janela controlada
```

com transição visual cuidadosamente coordenada.

A UI pode ocultar/mostrar player sem expor desktop.

---

# 22. Player Overlay

Controles visuais podem ser implementados na camada React.

Exemplo:

```text
┌───────────────────────────────────────┐
│                                       │
│                VIDEO                  │
│                                       │
│                                       │
│       01:02:17 ━━━━━━━━ 02:49:00      │
│                                       │
│        ⏪   ▶/❚❚   ⏩                  │
│                                       │
│  Áudio  Legendas  Fonte  Informações  │
└───────────────────────────────────────┘
```

---

# 23. Overlay Visibility

Overlay aparece quando:

```text
input recebido
pause
seek
erro
mudança de track
```

Oculta automaticamente após timeout.

---

# 24. Input sem overlay

Botões rápidos podem funcionar mesmo com overlay oculto.

Exemplo:

```text
A → pause/play
B → sair
←/→ → seek
```

---

# 25. Gamepad Mapping

Mapeamento inicial:

```text
D-pad / left stick
navegação

A
selecionar / play-pause

B
voltar / fechar overlay

X
ações contextuais

Y
áudio/legendas

LB
seek backward

RB
seek forward

Start
player menu

Select/View
diagnóstico opcional
```

---

# 26. Configurabilidade

Mapeamento pode futuramente ser configurável.

Na v1, manter esquema fixo e consistente.

---

# 27. Seek Curto

Exemplo:

```text
←
-10s

→
+10s
```

---

# 28. Seek Longo

Exemplo:

```text
LB
-30s

RB
+30s
```

ou configuração semelhante.

---

# 29. Scrubbing

Ao manter direção:

```text
10s
30s
1m
5m
```

incrementos podem acelerar.

---

# 30. Seek Event

Toda mudança significativa deve emitir:

```text
player.seek
```

para o Core.

Core envia ao torrent scheduler.

---

# 31. Seek Coordination

Fluxo:

```text
input
↓
MPV seek
↓
Core recebe nova posição
↓
torrentd recebe seek
↓
scheduler reprioriza
↓
buffering se necessário
↓
playback resume
```

---

# 32. Pause

Ao pausar:

```text
MPV pause
↓
Core update
↓
Torrent Engine continua até buffer target
↓
reduz atividade depois
```

---

# 33. Resume

Ao continuar:

```text
check buffer
↓
se adequado → play
↓
se baixo → prioridade máxima
```

---

# 34. Áudio

Player deve expor tracks disponíveis.

Modelo:

```ts
interface AudioTrack {
  id: number;
  language?: string;
  title?: string;
  codec?: string;
  channels?: string;
  default?: boolean;
}
```

---

# 35. Seleção automática de áudio

Preferência local:

```text
pt-BR
pt
en
```

Fallback:

```text
default track
```

---

# 36. Persistir preferência

Preferência de idioma é global do usuário.

Escolha manual por Content pode ser lembrada opcionalmente.

---

# 37. Legendas

Player deve suportar:

```text
embedded
external
torrent-contained
```

---

# 38. Subtitle Track Model

```ts
interface SubtitleTrack {
  id: number | string;
  language?: string;
  title?: string;
  format?: string;
  external: boolean;
}
```

---

# 39. Preferência de legenda

Exemplo:

```text
preferir pt-BR
fallback pt
fallback en
off
```

---

# 40. Subtitle Default

Usuário pode definir:

```text
sempre
somente quando áudio não é português
nunca automaticamente
```

---

# 41. Torrent-contained Subtitle

Se legenda estiver dentro do torrent:

```text
scheduler deve priorizar arquivo
```

quando selecionada.

---

# 42. External Subtitle

Pode ser adicionada localmente.

Não deve alterar manifest compartilhado.

---

# 43. Subtitle Styling

Preferências:

```text
font size
position
background
outline
```

Podem ser configuradas pelo MPV/Core.

---

# 44. Playback Progress

Core deve receber:

```text
currentTime
duration
paused
```

periodicamente.

---

# 45. Persist Frequency

Salvar progresso:

```text
a cada poucos segundos
+
pause
+
seek
+
exit
+
shutdown
```

---

# 46. Progress Loss Budget

Em crash:

```text
perda máxima aceitável:
alguns segundos
```

---

# 47. Watched Threshold

Regra inicial possível:

```text
>= 90%
```

ou:

```text
restante <= X minutos
```

Pode combinar ambos.

---

# 48. Continue Watching

Conteúdo incompleto deve permanecer em:

```text
Continuar assistindo
```

---

# 49. Restart

Usuário pode escolher:

```text
Continuar
Recomeçar
```

---

# 50. End of File

Ao receber `end-file`:

```text
save final position
↓
mark watched
↓
stop urgency
↓
next episode flow
```

---

# 51. Próximo Episódio

Quando aplicável:

```text
Episódio terminou
↓
mostrar countdown
↓
Play Next
```

---

# 52. Next Episode Preflight

Antes do final:

```text
resolve source
↓
health
↓
prefetch
```

para reduzir gap.

---

# 53. Autoplay

Configuração:

```text
on
off
```

---

# 54. Playback Error

Core deve categorizar:

```text
media-open-error
codec-error
stream-starvation
source-error
mpv-crash
unknown
```

---

# 55. MPV Crash

Fluxo:

```text
detect process exit
↓
save state
↓
show recoverable error
↓
offer retry
```

Não derrubar a UI.

---

# 56. Retry

Pode tentar:

```text
same source
ou
fallback source
```

dependendo do erro.

---

# 57. Source Fallback

Se Source Selection decidir troca:

```text
prepare new source
↓
capture current position
↓
stop/load new media
↓
seek to position
↓
resume
```

---

# 58. Seamless-ish Handoff

Objetivo:

```text
minimizar tempo sem frame
```

Não é necessário garantir troca completamente imperceptível na v1.

---

# 59. Duration Compatibility

Antes de fallback automático:

```text
validar duração
```

Se divergência grande:

```text
não trocar automaticamente
```

---

# 60. Player Startup Parameters

Core deve gerar argumentos determinísticos.

Exemplo conceitual:

```text
fullscreen
hardware decode
IPC path
audio preference
subtitle preference
no terminal UI
```

---

# 61. Sem console visível

MPV não deve abrir console perceptível no modo TV.

---

# 62. Sunshine

Sunshine será responsável por:

```text
captura
encode
input forwarding
stream PC → Moonlight
```

TorrentStream não deve duplicar essa função.

---

# 63. App Entry no Sunshine

TorrentStream deve poder ser configurado como app.

Conceitualmente:

```text
Name:
TorrentStream

Command:
TorrentStream.exe --tv
```

---

# 64. TV Mode Flag

Suportar modo explícito:

```text
--tv
```

ou detecção equivalente.

---

# 65. TV Mode

Ao iniciar:

```text
fullscreen
focus controller mode
hide desktop affordances
disable window chrome
```

---

# 66. Desktop Mode

Quando iniciado normalmente:

```text
janela desktop
mouse/keyboard permitido
```

---

# 67. Shared Core

TV e Desktop devem compartilhar domínio.

Não criar dois aplicativos independentes.

---

# 68. Sunshine Lifecycle

Fluxo desejado:

```text
Moonlight
↓
launch TorrentStream
↓
Sunshine starts process
↓
TorrentStream opens TV mode
↓
session active
↓
user exits
↓
TorrentStream closes
↓
Sunshine ends app session
```

---

# 69. App Ready Signal

Opcionalmente, o app pode emitir estado interno:

```text
ready
```

após UI estar carregada.

---

# 70. Splash

Se necessário:

```text
TorrentStream logo
```

curto e sem bloquear excessivamente.

---

# 71. Hide Desktop

Durante transições:

```text
background window
black frame
app surface
```

preferível a mostrar desktop.

---

# 72. Focus Ownership

TorrentStream deve capturar foco ao iniciar em TV mode.

---

# 73. Focus Recovery

Se MPV fechar:

```text
focus retorna para TorrentStream
```

automaticamente.

---

# 74. Alt-tab / External Window

TV mode deve minimizar risco de foco ir para outra janela.

---

# 75. Moonlight Input

O app recebe:

```text
gamepad
keyboard
mouse
```

forwarded pelo Moonlight.

A UI principal prioriza gamepad.

---

# 76. Controller Detection

App deve detectar controller conectado/virtual.

---

# 77. Controller Hotplug

Se controle reconectar:

```text
retomar input sem restart
```

---

# 78. Keyboard Fallback

Mesmo em TV mode, teclado pode funcionar como fallback.

---

# 79. Mouse Fallback

Não obrigatório para experiência principal, mas pode funcionar.

---

# 80. Navigation Model

UI deve possuir navegação espacial determinística.

Exemplo:

```text
linha atual
← →
seção
↑ ↓
```

---

# 81. Focus Graph

Cada tela deve definir relações de foco.

Não depender apenas da ordem DOM.

---

# 82. Focus Persistence

Ao entrar em Details e voltar:

```text
card original continua selecionado
```

---

# 83. Modal Focus Trap

Modal aberto:

```text
foco não sai do modal
```

---

# 84. Player Overlay Focus

Overlay deve lembrar último item selecionado.

---

# 85. Remote-friendly UI

Evitar:

- pequenos dropdowns;
- hover-only actions;
- context menus dependentes de mouse;
- campos minúsculos;
- scrollbars estreitas.

---

# 86. Typography

Texto deve ser legível em TV.

Detalhes exatos ficam para UX spec.

---

# 87. Safe Area

Layouts devem prever margens adequadas.

---

# 88. Refresh Rate

Futuramente, o player pode ajustar refresh rate conforme FPS.

Exemplo:

```text
23.976
24
25
30
50
60
```

Fora da v1 obrigatória.

---

# 89. HDR

Arquitetura deve permitir HDR quando:

```text
GPU
OS
MPV
Sunshine
Moonlight
display
```

suportarem.

---

# 90. HDR Fallback

Se cadeia HDR não for compatível:

```text
tone mapping
```

pode ser necessário.

Implementação específica fica para fase posterior.

---

# 91. Audio Output

MPV usa device de áudio do Windows.

Sunshine captura esse áudio para Moonlight.

---

# 92. Audio Device

App pode usar default device.

Seleção explícita pode ser configuração avançada.

---

# 93. Volume

Controle pode ser:

```text
MPV volume
```

ou delegação para dispositivo.

Na v1, preferir volume do player.

---

# 94. Mute

Deve existir comando.

---

# 95. Audio Sync

MPV deve manter sync A/V.

Torrent scheduler não deve interferir no clock.

---

# 96. Buffering UX

Quando player realmente estiver sem dados:

```text
Bufferizando...
```

Pode mostrar:

```text
████░ Muito bom
Buffer 12s
```

apenas em modo avançado.

---

# 97. Buffering Timeout

Se buffering exceder threshold:

```text
Health Engine reavalia
Source Selection busca fallback
```

---

# 98. Disconnect Moonlight

Core deve conseguir tratar perda de sessão de maneira previsível.

Configuração:

```text
Ao desconectar:
(x) pausar
( ) continuar
```

---

# 99. Pause on Disconnect

Fluxo:

```text
Moonlight disconnect
↓
pause MPV
↓
save progress
↓
torrent buffer pode continuar até target
```

---

# 100. Continue on Disconnect

Se configurado:

```text
playback continua
```

mesmo sem cliente.

---

# 101. Session Timeout

Opcionalmente, após desconexão prolongada:

```text
pause
ou
stop
```

conforme configuração futura.

---

# 102. Reconnect

Ao reconectar:

```text
Sunshine stream retorna
↓
TorrentStream mantém sessão
```

quando possível.

---

# 103. Resume after Reconnect

Se pausado automaticamente:

```text
usuário decide retomar
```

ou configuração futura pode retomar automaticamente.

---

# 104. Exit from Player

Botão B:

```text
save position
↓
stop player
↓
return to details
```

---

# 105. Exit from App

Na Home:

```text
Sair
```

deve:

```text
save state
↓
stop player
↓
flush resume data
↓
shutdown helpers
↓
exit
```

---

# 106. Force Close

Em fechamento abrupto:

```text
crash recovery
```

deve restaurar estado plausível.

---

# 107. Process Supervision

Core deve monitorar:

```text
mpv
torrentd
```

---

# 108. Restart MPV

Permitido sem reiniciar TorrentStream.

---

# 109. Restart torrentd

Core pode tentar recuperar quando seguro.

---

# 110. Player Logs

Separar logs do MPV.

Campos úteis:

```text
playerSessionId
sourceId
codec
hwdec
error
startupMs
seekMs
```

---

# 111. Startup Metric

Registrar:

```text
playRequestedAt
firstFrameAt
startupMs
```

---

# 112. Seek Metric

Registrar:

```text
seekRequestedAt
playbackResumedAt
seekRecoveryMs
```

---

# 113. Buffer Events

Registrar:

```text
bufferStart
bufferEnd
duration
sourceId
```

---

# 114. Watch Completion

Registrar localmente:

```text
watched
completedAt
```

---

# 115. No Telemetry Required

Todas as métricas podem permanecer locais.

---

# 116. Player Diagnostics

Tela avançada pode mostrar:

```text
Container
MKV

Video
HEVC 10-bit

Resolution
3840x2160

HDR
HDR10

Audio
EAC3 5.1

Hardware Decode
Yes

FPS
23.976

Dropped Frames
0
```

---

# 117. Sunshine Diagnostics

Quando disponível:

```text
Stream resolution
Stream FPS
Encoder
Latency
Bitrate
```

Não é requisito core obter todas essas métricas na v1.

---

# 118. TV Diagnostics

Tela avançada pode combinar:

```text
Torrent
Player
Sunshine
```

em visão única.

---

# 119. Error UX

Erro técnico não deve mostrar stack trace.

Exemplo:

```text
Não foi possível iniciar a reprodução.

[ Tentar novamente ]
[ Trocar fonte ]
[ Voltar ]
```

---

# 120. Advanced Error Details

Área avançada:

```text
PLAYER_MEDIA_OPEN_ERROR
Source: ...
Session: ...
```

---

# 121. Accessibility de Controle

Ações essenciais devem ter:

```text
focus
label
state
```

claros.

---

# 122. No Hover Dependency

Nenhuma ação principal pode depender exclusivamente de hover.

---

# 123. Loading States

Estados principais:

```text
Preparing
Buffering
Playing
Paused
Seeking
Switching Source
Error
```

---

# 124. Source Switch State

Durante fallback:

```text
Trocando para uma fonte mais estável...
```

---

# 125. Playback Locking

Enquanto player está em estado crítico de troca:

```text
evitar comandos conflitantes
```

mas permitir:

```text
cancel / back
```

quando seguro.

---

# 126. Command Queue

Core deve serializar comandos críticos:

```text
load
seek
switch source
stop
```

para evitar race conditions.

---

# 127. Session Generation

Cada playback possui geração/ID.

Eventos antigos de player encerrado não devem afetar nova sessão.

---

# 128. Idempotência

Comandos como:

```text
pause
stop
quit
```

devem ser tolerantes a chamadas repetidas.

---

# 129. Recovery from Partial Launch

Se MPV iniciar mas IPC falhar:

```text
kill process
↓
cleanup
↓
retry or error
```

---

# 130. Temp Files

Arquivos temporários do player devem ficar em diretório controlado.

---

# 131. Subtitle Temp Files

Downloads/extrações de legenda devem ser limpos conforme política.

---

# 132. Security do IPC

IPC MPV deve ser local.

Não expor remotamente.

---

# 133. IPC Naming

Usar ID aleatório por sessão.

Exemplo:

```text
\\.\pipe\torrentstream-mpv-<uuid>
```

---

# 134. IPC Permissions

Restringir ao usuário local quando possível.

---

# 135. Sunshine Command Security

Não interpolar conteúdo externo diretamente em command line.

---

# 136. Media Path Handling

Paths devem ser escapados corretamente.

Nunca montar shell command vulnerável a injection.

---

# 137. MPV Argument Builder

Gerar argumentos por API/array, não string shell concatenada.

---

# 138. Source Path Validation

A mídia deve vir apenas de paths conhecidos pelo runtime.

---

# 139. External Subtitle Validation

Validar extensão e path.

---

# 140. Performance Budget

Playback Coordinator deve adicionar overhead mínimo.

---

# 141. UI Transition Budget

Transição Details → Player deve parecer imediata.

Feedback visual:

```text
< 250ms
```

mesmo que playback ainda esteja preparando.

---

# 142. Overlay Performance

Overlay não deve causar stutter persistente no vídeo.

---

# 143. Animation

Animações devem ser leves e desativáveis/reduzíveis.

---

# 144. Memory

Player exit deve liberar memória associada.

---

# 145. GPU Resource Cleanup

MPV encerrado deve liberar contexto gráfico.

---

# 146. Audio Track Switching

Troca deve ocorrer sem reiniciar source.

---

# 147. Subtitle Switching

Troca deve ocorrer sem reiniciar playback.

---

# 148. Source Switching

É a única troca que pode exigir reload completo da mídia.

---

# 149. Player Restart Policy

Se MPV travar uma vez:

```text
retry permitido
```

Se repetidamente:

```text
mostrar erro
```

Evitar restart loop infinito.

---

# 150. Acceptance Criteria — Playback

Considerado funcional quando:

1. MPV inicia e toca arquivo parcial;
2. direct play funciona;
3. hardware decode pode ser habilitado;
4. áudio pode ser trocado;
5. legenda pode ser trocada;
6. seek informa torrent scheduler;
7. progresso é salvo;
8. MPV crash não derruba UI;
9. fallback pode recarregar source;
10. fullscreen funciona em TV mode.

---

# 151. Acceptance Criteria — Sunshine/Moonlight

Considerado funcional quando:

1. Sunshine consegue iniciar TorrentStream;
2. TV mode entra fullscreen;
3. toda navegação essencial funciona com gamepad;
4. desktop não aparece no fluxo normal;
5. sair encerra sessão corretamente;
6. disconnect pode pausar playback;
7. reconnect não exige reconstruir biblioteca;
8. foco retorna ao app após player;
9. overlay funciona por controle;
10. áudio e vídeo chegam via Sunshine/Moonlight.

---

# 152. Relação com Functional Requirements

Atende principalmente:

```text
FR-061–080
Playback / Sunshine / controles

FR-087–091
Details e Play

FR-129–132
Próximo episódio

FR-187–193
Preferências

FR-209
Player failure
```

---

# 153. Relação com NFRs

Atende principalmente:

```text
NFR-005–009
Responsividade

NFR-018–024
Startup e seek

NFR-070–075
CPU/GPU

NFR-083–085
Isolation

NFR-118–127
Compatibilidade e controle
```

---

# 154. Decisões fechadas

```text
Player
= MPV

Playback
= direct play preferencial

MPV
= processo separado

Controle
= IPC local

TV transport
= Sunshine

TV client
= Moonlight

TV UX
= gamepad-first

Desktop exposure
= evitar

Hardware decode
= preferido

Fallback
= coordenado pelo Core
```

---

# 155. Regra central

> **O usuário deve sentir que está usando um aplicativo de streaming nativo na TV, mesmo que por trás existam MPV, libtorrent, Sunshine e múltiplos processos locais.**
