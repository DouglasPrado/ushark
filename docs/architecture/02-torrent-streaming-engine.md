# Ushark — Architecture 02: Torrent & Streaming Engine

**Status:** Draft v1  
**Produto:** Ushark\
**Documento:** Architecture Specification  
**Dependências:**  
- `01-prd-master.md`
- `02-user-journeys.md`
- `03-functional-requirements.md`
- `04-non-functional-requirements.md`
- `docs/architecture/01-library-manifest.md`

---

# 1. Objetivo

Este documento define a arquitetura do engine responsável por:

- receber magnets e arquivos `.torrent`;
- manter sessões BitTorrent;
- resolver metadata;
- selecionar arquivos;
- priorizar pieces para streaming;
- reagir a seek;
- controlar cache;
- persistir resume data;
- entregar mídia ao player;
- expor telemetria;
- isolar a UI dos detalhes do engine.

O objetivo principal é:

> **Transformar uma source torrent em uma mídia reproduzível com o menor tempo possível até o primeiro frame, sem exigir download completo.**

---

# 2. Princípio central

O engine não é um downloader tradicional.

Ele é um:

```text
Streaming-Oriented Torrent Runtime
```

A prioridade não é:

```text
terminar o arquivo o mais rápido possível
```

A prioridade é:

```text
entregar os bytes certos
no momento certo
para o player
```

---

# 3. Arquitetura macro

```text
┌──────────────────────────────────────────┐
│              Desktop UI                  │
│         Electron / React                 │
└─────────────────┬────────────────────────┘
                  │ IPC / RPC
                  ▼
┌──────────────────────────────────────────┐
│             Application Core             │
│                                          │
│ Library                                  │
│ Source Selection                         │
│ Playback Coordination                    │
│ Torrent Controller                       │
└─────────────────┬────────────────────────┘
                  │ RPC
                  ▼
┌──────────────────────────────────────────┐
│               torrentd                   │
│                                          │
│ libtorrent                               │
│ Session Manager                          │
│ Piece Scheduler                          │
│ Streaming Planner                        │
│ Cache Manager                            │
│ Resume Manager                           │
│ Health Metrics                           │
└─────────────────┬────────────────────────┘
                  │
                  ▼
              Media Data
                  │
                  ▼
┌──────────────────────────────────────────┐
│                  MPV                     │
└──────────────────────────────────────────┘
```

---

# 4. Separação de responsabilidades

## UI

Responsável por:

- comandos do usuário;
- estados visuais;
- progresso;
- health;
- erros;
- seleção de conteúdo.

Não deve conhecer:

- piece index;
- peer internals;
- block requests;
- tracker internals;
- storage internals.

---

## Application Core

Responsável por:

- resolver qual Content será reproduzido;
- resolver qual Source será utilizada;
- iniciar/preparar torrent;
- solicitar stream;
- coordenar player;
- aplicar user preferences;
- persistir estado de domínio.

---

## torrentd

Responsável por:

- sessão libtorrent;
- swarm;
- peers;
- pieces;
- cache;
- streaming windows;
- seek;
- resume;
- métricas;
- lifecycle torrent.

---

## MPV

Responsável por:

- demux;
- decode;
- playback;
- áudio;
- legendas;
- tempo;
- seek solicitado pelo usuário.

---

# 5. Processo separado

O torrent engine deve preferencialmente rodar fora da UI.

```text
Ushark.exe
      │
      ├── UI
      ├── Core
      │
      └── torrentd.exe
```

Benefícios:

- crash isolation;
- menor risco de travar render;
- possibilidade de restart;
- monitoramento independente;
- facilidade para trocar implementação futura.

---

# 6. Engine escolhido

A implementação principal prevista deve usar:

```text
libtorrent
```

Motivos:

- engine maduro;
- controle de piece priority;
- deadlines;
- DHT;
- PEX;
- LSD;
- trackers;
- resume data;
- alerts;
- métricas de sessão;
- controle de storage;
- capacidade adequada para streaming.

---

# 7. Abstração obrigatória

O restante do Ushark não deve depender diretamente de libtorrent.

Contrato conceitual:

```ts
interface TorrentEngine {
  addSource(input: TorrentSourceInput): Promise<TorrentSessionRef>;

  prepareStream(
    torrentId: string,
    selector: MediaSelector
  ): Promise<PreparedMedia>;

  setPlaybackPosition(
    torrentId: string,
    fileId: string,
    position: PlaybackPosition
  ): Promise<void>;

  pause(torrentId: string): Promise<void>;
  resume(torrentId: string): Promise<void>;

  getStatus(torrentId: string): Promise<TorrentStatus>;

  remove(torrentId: string, options?: RemoveOptions): Promise<void>;
}
```

---

# 8. Source Input

Entradas suportadas:

```text
magnet
.torrent file
infoHash + metadata local
```

Modelo conceitual:

```ts
type TorrentSourceInput =
  | {
      type: 'magnet';
      magnet: string;
    }
  | {
      type: 'torrent-file';
      path: string;
    };
```

---

# 9. Estados do torrent runtime

Estado mínimo:

```text
created
resolving-metadata
ready
preparing
streaming
downloading
paused
stalled
completed
error
removed
```

---

# 10. Metadata Resolution

Para magnet:

```text
magnet
↓
session.add_torrent
↓
DHT / trackers / peers
↓
torrent metadata
↓
file list
↓
ready
```

A UI deve receber eventos progressivos.

Exemplo:

```text
metadata:waiting
peers:4
metadata:ready
files:23
```

---

# 11. Timeout de metadata

O engine não deve esperar indefinidamente.

Política conceitual:

```text
soft timeout
→ informar demora

hard timeout
→ marcar tentativa como stalled
```

O torrent pode permanecer salvo para retry posterior.

---

# 12. File Model

Cada arquivo deve ser normalizado em:

```ts
interface TorrentFileInfo {
  id: string;
  path: string;
  name: string;
  extension: string;
  size: number;
  offset: number;
  firstPiece: number;
  lastPiece: number;
}
```

---

# 13. Seleção de mídia

Selectors definidos no Library Manifest devem ser resolvidos pelo engine.

Tipos iniciais:

```text
largest-video
filename
episode
manual
```

---

# 14. largest-video

Algoritmo:

```text
listar arquivos de vídeo
↓
ignorar samples conhecidos
↓
ordenar por tamanho
↓
selecionar maior candidato
```

Heurísticas adicionais podem penalizar:

```text
sample
trailer
featurette
extras
behind-the-scenes
```

---

# 15. episode selector

Entrada:

```text
season = 1
episode = 3
```

Resolver por padrões:

```text
S01E03
s01e03
1x03
Season 1 Episode 3
```

Se houver ambiguidade:

```text
resolver no indexador
ou
solicitar mapping manual
```

---

# 16. Media Probe

Depois de identificar o arquivo:

```text
torrent file
↓
partial availability suficiente
↓
ffprobe / media probe
↓
container metadata
```

Detectar:

- duração;
- codec;
- resolução;
- bitrate;
- áudio;
- tracks;
- HDR quando possível.

---

# 17. Probe parcial

O engine deve evitar exigir arquivo inteiro para probe.

Quando o container permitir:

```text
HEAD
+
TAIL opcional
```

devem ser priorizados para obter metadata.

---

# 18. Streaming Session

Uma sessão de playback deve possuir ID próprio.

```ts
interface StreamingSession {
  id: string;
  torrentId: string;
  fileId: string;
  contentId: string;
  sourceId: string;
  startedAt: number;
}
```

Isso permite separar:

```text
torrent lifetime
≠
playback lifetime
```

---

# 19. Piece Scheduler

O Piece Scheduler é o componente mais importante do engine.

Responsável por transformar:

```text
posição temporal
```

em:

```text
prioridade de pieces
```

---

# 20. Mapping tempo → byte

Quando duração e tamanho forem conhecidos:

```text
estimatedByte =
(currentTime / duration) * fileSize
```

Porém isso é apenas aproximação.

Para containers com índice utilizável, o sistema deve preferir mapeamento mais preciso quando disponível.

---

# 21. Mapping byte → piece

```text
pieceIndex =
(fileOffset + byteOffset) / pieceLength
```

Deve respeitar:

- offset do arquivo dentro do torrent;
- piece compartilhado entre arquivos;
- firstPiece;
- lastPiece.

---

# 22. Streaming Windows

Scheduler deve trabalhar com múltiplas janelas.

Exemplo inicial:

```text
HOT
posição atual → +30s

WARM
+30s → +2min

BUFFER
+2min → +10min

BACKGROUND
restante
```

---

# 23. Prioridades

Exemplo conceitual:

```text
HOT         100
WARM         80
BUFFER       50
BACKGROUND   10
UNNEEDED      0
```

Valores exatos pertencem à implementação.

---

# 24. Hot Window

Contém os pieces necessários para reprodução imediata.

Deve receber:

- prioridade máxima;
- deadlines quando apropriado;
- reavaliação frequente.

---

# 25. Warm Window

Evita starvation do player.

Objetivo:

```text
próximos minutos prontos
antes de serem necessários
```

---

# 26. Background Window

Pode baixar dados restantes quando:

- buffer está saudável;
- banda está sobrando;
- modo Keep/Download está ativo.

---

# 27. Download por modo

## Stream Only

```text
HOT
WARM
pequeno BUFFER
restante quase zero
```

## Keep After Watching

```text
HOT
WARM
BUFFER
BACKGROUND ativo
```

## Download

```text
stream priority
+
download completo
```

---

# 28. Buffer baseado em tempo

O scheduler não deve pensar apenas em MB.

Melhor métrica:

```text
secondsBuffered
```

Exemplo:

```text
60s buffered
```

é mais útil que:

```text
256 MB buffered
```

porque bitrate varia.

---

# 29. Buffer Target

Configuração conceitual:

```text
critical      < 20s
low           20–45s
healthy       45–180s
high          > 180s
```

Valores devem ser ajustáveis.

---

# 30. Buffer adaptativo

Target pode mudar com base em:

- bitrate;
- swarm stability;
- source health;
- RAM;
- disk speed;
- user mode.

---

# 31. Throughput Margin

Para playback estável:

```text
download sustentável
>
media bitrate
```

Objetivo prático:

```text
ratio > 1.5x
```

Melhor:

```text
2x+
```

---

# 32. Scheduler Loop

Loop conceitual:

```text
read playback position
↓
read current buffer
↓
read throughput
↓
read piece availability
↓
calculate target windows
↓
apply priorities
↓
schedule deadlines
↓
repeat
```

---

# 33. Frequência do Scheduler

Não deve recalcular em cada frame.

Exemplo:

```text
250ms – 1000ms
```

dependendo do estado.

Mais frequente quando:

```text
buffer crítico
seek recente
startup
```

Menos frequente quando estável.

---

# 34. Startup Planning

Ao clicar Play:

```text
ensure metadata
↓
resolve file
↓
probe required regions
↓
prioritize startup pieces
↓
wait minimum playable buffer
↓
start MPV
```

---

# 35. Minimum Startup Buffer

Não deve ser fixo globalmente.

Deve considerar:

```text
bitrate
throughput
health
container
```

Exemplo:

```text
source excelente
→ buffer menor

source instável
→ buffer maior
```

---

# 36. Preflight

Preflight pode acontecer antes do Play.

Triggers:

```text
card focused por alguns segundos
details opened
hero active
next episode near completion
```

---

# 37. Preflight Budget

Preflight deve ser leve.

Não deve:

- iniciar downloads massivos de dezenas de cards;
- saturar rede;
- ocupar cache excessivo.

---

# 38. Preflight Concurrency

Limitar quantidade de probes simultâneos.

Exemplo conceitual:

```text
1–3 active probes
```

Prioridade:

```text
selected content
details content
next episode
visible nearby content
```

---

# 39. Seek Handling

Ao detectar seek:

```text
oldWindow = invalidate
↓
newPosition
↓
new byte region
↓
new pieces
↓
set HOT
↓
reduce old priority
↓
buffer
↓
resume
```

---

# 40. Seek Generation

Cada seek recebe geração:

```text
seekGeneration = N
```

Requests antigos podem ser ignorados se:

```text
generation < currentGeneration
```

Isso evita race conditions.

---

# 41. Rapid Seek

Se usuário fizer:

```text
10m
→ 40m
→ 1h20
```

em poucos segundos, engine não deve tentar completar todas as regiões intermediárias.

Apenas posição final deve prevalecer.

---

# 42. Reverse Seek

Voltar para área previamente cacheada deve ser quase imediato quando os dados ainda estiverem disponíveis.

---

# 43. HEAD Priority

Alguns containers precisam de dados iniciais para abrir.

Scheduler deve garantir HEAD cedo.

Exemplo:

```text
first 8–32 MB
```

configurável.

---

# 44. TAIL Priority

Quando necessário:

```text
last 8–16 MB
```

podem ser priorizados.

Particularmente útil em determinados MP4s.

---

# 45. Sparse Storage

O engine deve permitir arquivo incompleto no disco.

Não exigir allocation completa prévia quando storage mode escolhido permitir.

---

# 46. RAM Cache

Objetivo:

```text
reduzir latência de leitura
e escrita repetitiva
```

Cache quente pode conter:

- blocks recentes;
- HOT window;
- dados solicitados pelo player.

---

# 47. RAM Cache Limit

Não hardcodar valor universal.

Configuração pode ser:

```text
Auto
512 MB
1 GB
2 GB
```

Auto deve respeitar memória disponível.

---

# 48. Disk Cache

Pasta recomendada:

```text
<cache-root>/torrent-data/
```

Idealmente SSD/NVMe.

---

# 49. Permanent Data

Downloads mantidos podem ser movidos/promovidos para:

```text
<library-root>/media/
```

ou diretório definido pelo usuário.

---

# 50. Cache Promotion

Quando:

```text
Stream Only
↓
Keep
```

o sistema deve promover dados já baixados sem redownload.

---

# 51. Cache Demotion

Conteúdo Keep pode ser convertido para cache temporário apenas mediante ação explícita.

---

# 52. Cache Index

O Core deve manter índice de:

```text
sourceId
infoHash
fileId
path
bytesAvailable
retentionMode
lastAccessAt
protected
```

---

# 53. Cache Eviction

Ordem conceitual:

```text
unused stream-only
↓
completed old cache
↓
unwatched old cache
↓
other unprotected
```

Nunca remover ativo.

---

# 54. Resume Data

Persistir:

- torrent state;
- piece completion;
- priorities quando úteis;
- trackers;
- resume metadata suportada.

---

# 55. Resume Save Triggers

Salvar:

```text
periodicamente
on pause
on completion
on shutdown
on significant state change
```

---

# 56. Resume Restore

Startup:

```text
load resume
↓
register torrents
↓
restore in background
↓
UI remains usable
```

---

# 57. Recheck Policy

Evitar full recheck sem necessidade.

Fazer recheck apenas quando:

- storage mudou;
- integrity uncertain;
- resume invalid;
- user requested.

---

# 58. Session Manager

Um único torrentd pode manter múltiplos torrents.

Responsável por:

```text
torrent lifecycle
session limits
resource limits
alerts
resume
```

---

# 59. Active Session Limits

Configuração deve existir para evitar explosão de recursos.

Exemplo:

```text
max active torrents
max active downloads
max active probes
```

---

# 60. Playback Priority

Enquanto houver playback:

```text
playback torrent
>
background downloads
>
health probes
```

---

# 61. Network Budget

Engine deve coordenar:

```text
streaming
downloads
probing
upload
```

sem deixar probes degradarem playback.

---

# 62. Rate Limits

Suportar:

```text
download unlimited/limited
upload unlimited/limited
```

Usuário pode controlar globalmente.

---

# 63. Upload

BitTorrent upload pode permanecer ativo conforme configuração.

Playback não deve depender de upload alto.

---

# 64. Peer Discovery

Suportar quando aplicável:

```text
trackers
DHT
PEX
LSD
```

---

# 65. Peer Connections

Engine deve distinguir:

```text
discovered
connecting
connected
useful
unchoked
transferring
```

Health Score usará essas distinções.

---

# 66. Useful Peer

Peer útil para streaming é peer que:

- está conectado;
- possui pieces relevantes;
- consegue transferir dados;
- apresenta desempenho utilizável.

---

# 67. Alerts

torrentd deve transformar alerts do engine em eventos normalizados.

Exemplo:

```ts
type TorrentEvent =
  | { type: 'metadata.ready' }
  | { type: 'peer.connected' }
  | { type: 'peer.disconnected' }
  | { type: 'torrent.stalled' }
  | { type: 'torrent.completed' }
  | { type: 'error'; code: string };
```

---

# 68. Event Bus

Core deve receber eventos sem polling excessivo.

Pode combinar:

```text
events
+
snapshots periódicos
```

---

# 69. Status Snapshot

Exemplo:

```ts
interface TorrentStatus {
  state: string;
  progress: number;

  downloadBps: number;
  uploadBps: number;

  peersConnected: number;
  peersUseful: number;

  piecesHave: number;
  piecesTotal: number;

  bufferSeconds?: number;
}
```

---

# 70. Playback Position Updates

MPV deve informar periodicamente:

```text
currentTime
duration
paused
seeking
```

Core envia posição relevante ao torrentd.

---

# 71. Position Update Rate

Evitar spam de IPC.

Exemplo:

```text
2–4 updates/second
```

mais evento explícito de seek.

---

# 72. Player Data Delivery

Duas estratégias são possíveis.

## Estratégia A — Arquivo parcial

MPV lê arquivo no filesystem enquanto libtorrent escreve.

## Estratégia B — Local HTTP/stream adapter

torrentd/Core expõe bytes via endpoint local com Range support.

---

# 73. Recomendação inicial

Preferir:

```text
arquivo parcial + MPV
```

quando funcionar de forma robusta.

Vantagens:

- menos uma camada;
- seek nativo;
- MPV lê diretamente;
- menor complexidade.

---

# 74. HTTP Adapter

Deve permanecer como opção arquitetural para casos onde for útil.

Contrato:

```text
GET /stream/:sessionId
Range: bytes=X-Y
```

---

# 75. Range Requests

Se HTTP adapter for usado:

- suportar `206 Partial Content`;
- validar ranges;
- bloquear requests fora do arquivo;
- mapear Range para prioridade de pieces.

---

# 76. Security do HTTP Adapter

Se existir:

```text
bind apenas em localhost
token por sessão
TTL curto
```

Não expor stream diretamente na LAN por default.

---

# 77. MPV Startup

Core inicia MPV apenas quando:

```text
media resolvida
startup data disponível
player args prontos
```

---

# 78. MPV IPC

Core deve controlar MPV por IPC.

Operações mínimas:

```text
loadfile
pause
seek
audio track
subtitle track
get position
get duration
quit
```

---

# 79. Feedback MPV → Scheduler

Eventos importantes:

```text
playback started
pause
seek
buffering
EOF
error
```

---

# 80. Buffering Detection

Se MPV sinalizar starvation/buffering:

```text
scheduler urgency ↑
background download ↓
probe traffic ↓
```

---

# 81. Playback Paused

Se usuário pausar:

Política configurável:

```text
continue prefetch
ou
reduce activity
```

Recomendação inicial:

```text
continuar até target buffer saudável
depois reduzir
```

---

# 82. Exit Playback

Ao sair:

```text
save position
↓
stop streaming urgency
↓
retention policy decides torrent behavior
```

---

# 83. Stream Only após Exit

Se modo Stream Only:

```text
torrent may pause
cache becomes eviction candidate
```

---

# 84. Keep after Exit

Se Keep:

```text
torrent may continue background download
```

conforme configuração.

---

# 85. Download Mode após Exit

Continua até completion salvo se usuário pausar.

---

# 86. Next Episode Prefetch

Trigger próximo do final:

```text
remainingTime <= configured threshold
```

Exemplo:

```text
2–5 min
```

---

# 87. Next Episode Strategy

```text
resolve source
↓
resolve file
↓
probe swarm
↓
download HEAD/startup pieces
```

Sem iniciar download agressivo cedo demais.

---

# 88. Multi-file Torrent Priorities

Arquivos irrelevantes devem receber prioridade baixa/zero quando possível.

Exemplo:

```text
selected episode → high
other episodes → low/zero
subtitles → optional
sample → zero
```

---

# 89. Season Pack

Ao assistir S01E01:

```text
E01 high
E02 optional prefetch
E03+ low
```

Ao terminar:

```text
E02 high
E03 optional
```

---

# 90. Subtitles within Torrent

Arquivos `.srt`, `.ass`, `.vtt` podem ser detectados.

Priorizar legenda selecionada junto com mídia.

---

# 91. External Subtitle

Não faz parte do scheduler torrent se estiver fora da source.

Core gerencia separadamente.

---

# 92. Health Integration

torrentd expõe métricas brutas.

Não deve ser responsável sozinho pelo score final de produto.

Separação:

```text
torrentd
→ metrics

Health Engine
→ score
```

---

# 93. Métricas brutas necessárias

- download rate;
- upload rate;
- peer count;
- useful peer count;
- piece availability;
- connection times;
- request latency aproximada;
- stalled state;
- buffer;
- completed pieces;
- swarm availability.

---

# 94. Piece Availability Window

Além da disponibilidade global, engine deve calcular disponibilidade dos pieces próximos ao playback.

---

# 95. Stable Throughput

Health Engine precisa de série temporal.

torrentd deve disponibilizar samples.

Exemplo:

```text
1s samples
rolling windows:
5s
15s
30s
```

---

# 96. Stall Detection

Considerar stalled quando:

```text
wanted pieces existem
+
download rate ≈ 0
+
tempo excede threshold
```

Não confundir com:

```text
paused
completed
no wanted data
```

---

# 97. Recovery Strategy

Quando stalled:

```text
tracker announce
peer discovery refresh
priority refresh
connection strategy
fallback signal
```

---

# 98. Fallback Signal

torrentd não escolhe outra source.

Ele informa:

```text
source degraded
source stalled
source unavailable
```

Source Selection Engine decide fallback.

---

# 99. Error Model

Erros devem ser normalizados.

Exemplo:

```text
TORRENT_METADATA_TIMEOUT
TORRENT_NO_PEERS
TORRENT_STORAGE_ERROR
TORRENT_PERMISSION_DENIED
TORRENT_DISK_FULL
TORRENT_CORRUPT_RESUME
TORRENT_FILE_NOT_FOUND
STREAM_BUFFER_STARVATION
```

---

# 100. Recoverable vs Fatal

Cada erro deve classificar:

```text
recoverable
retryable
fatal
user-action-required
```

---

# 101. Disk Full

Ao detectar falta de espaço:

```text
pause affected torrent
↓
emit disk-full
↓
Core invokes cache cleanup
↓
retry if space recovered
```

---

# 102. Storage Permission Error

Não tentar loop infinito.

Informar ação necessária.

---

# 103. Corrupt Resume

Fallback:

```text
discard resume
↓
re-add torrent
↓
optional recheck
```

sem apagar metadata do Content.

---

# 104. Torrent Removal

Opções:

```text
remove runtime only
remove runtime + cache
remove runtime + files
```

A UI deve diferenciar claramente.

---

# 105. Shutdown

torrentd deve suportar shutdown gracioso.

Fluxo:

```text
stop new work
↓
save resume
↓
flush critical state
↓
close session
↓
exit
```

---

# 106. Shutdown Timeout

Se ultrapassar limite:

```text
force terminate
```

mas estado crítico deve ser salvo antes sempre que possível.

---

# 107. Crash Recovery

No próximo startup:

```text
detect unclean shutdown
↓
validate resume/cache indexes
↓
restore safely
```

---

# 108. Logging

Logs estruturados.

Campos úteis:

```text
torrentId
sourceId
infoHash
streamSessionId
piece
event
durationMs
```

---

# 109. Sensitive Data

Evitar logar:

- magnets completos quando possuírem parâmetros sensíveis;
- paths pessoais desnecessários;
- tokens;
- secrets.

---

# 110. Metrics

Expor internamente:

```text
torrent_active
download_bps
upload_bps
peers_connected
peers_useful
buffer_seconds
scheduler_window
cache_bytes
stream_startup_ms
seek_recovery_ms
```

---

# 111. Performance Benchmarks

Casos obrigatórios:

```text
1080p low bitrate
1080p high bitrate
4K HEVC
4K remux
single-file torrent
season pack
large multi-file torrent
```

---

# 112. Network Benchmarks

Testar:

```text
stable fast swarm
few fast peers
many slow peers
unstable swarm
peer churn
low bandwidth
high latency
```

---

# 113. Disk Benchmarks

Testar:

```text
NVMe
SATA SSD
HDD
network-mounted permanent storage
```

Cache ativo deve continuar preferencialmente local.

---

# 114. Startup Benchmark

Medir:

```text
Play click
→ first decoded frame
```

Não apenas:

```text
Play click
→ MPV process launch
```

---

# 115. Seek Benchmark

Medir:

```text
seek command
→ playback resumed
```

---

# 116. Buffer Benchmark

Medir:

```text
buffer seconds over time
```

para identificar starvation.

---

# 117. Concurrency

Testar:

```text
1 playback
+
2 downloads
+
health probes
```

Sem degradar playback de forma crítica.

---

# 118. Isolation Tests

Simular:

```text
UI crash
player crash
torrentd crash
```

e validar recuperação.

---

# 119. API entre Core e torrentd

Preferir protocolo local simples e versionado.

Opções:

```text
Unix domain socket
Named Pipe
localhost RPC
```

No Windows:

```text
Named Pipe
ou
localhost RPC
```

---

# 120. RPC Contract

Chamadas devem possuir:

```text
requestId
version
method
payload
```

Resposta:

```text
requestId
ok
data
error
```

---

# 121. RPC Versioning

Core e torrentd devem negociar versão de protocolo.

---

# 122. RPC Timeout

Toda chamada deve possuir timeout apropriado.

---

# 123. Long-running operations

Operações longas devem retornar handle/session e emitir eventos.

Não manter request bloqueada indefinidamente.

---

# 124. Example RPC — Add Torrent

```json
{
  "requestId": "req-123",
  "method": "torrent.add",
  "payload": {
    "type": "magnet",
    "value": "magnet:?xt=..."
  }
}
```

---

# 125. Example RPC — Prepare Stream

```json
{
  "requestId": "req-124",
  "method": "stream.prepare",
  "payload": {
    "torrentId": "torrent-1",
    "selector": {
      "type": "largest-video"
    }
  }
}
```

---

# 126. Example Event — Buffer

```json
{
  "type": "stream.buffer",
  "streamSessionId": "stream-1",
  "bufferSeconds": 74.2
}
```

---

# 127. Example Event — Stalled

```json
{
  "type": "torrent.stalled",
  "torrentId": "torrent-1",
  "reason": "no-useful-peer"
}
```

---

# 128. Core State

Core deve manter visão derivada:

```text
Source
↓
Torrent Runtime
↓
Streaming Session
↓
Player Session
```

Esses IDs não devem ser confundidos.

---

# 129. ID Model

Exemplo:

```text
contentId
movie:tmdb:157336

sourceId
source:interstellar:4k

torrentId
runtime:abc123

streamSessionId
stream:xyz789

playerSessionId
player:p123
```

---

# 130. Lifecycle completo

```text
Content selected
↓
Source selected
↓
torrent.add / resume
↓
metadata ready
↓
file resolved
↓
media probe
↓
health/preflight
↓
stream.prepare
↓
startup pieces
↓
MPV launch
↓
playback feedback
↓
scheduler follows position
↓
exit
↓
resume/state save
```

---

# 131. Princípios de otimização

Nunca otimizar primeiro por:

```text
maximum raw download throughput
```

Priorizar:

```text
startup latency
seek latency
buffer stability
UI isolation
resource predictability
```

---

# 132. Anti-patterns

Não fazer:

```text
baixar torrent inteiro antes do Play
```

Não fazer:

```text
recalcular toda biblioteca para cada playback
```

Não fazer:

```text
render thread controlar libtorrent diretamente
```

Não fazer:

```text
transcoding obrigatório
```

Não fazer:

```text
health probe de todos os torrents ao mesmo tempo
```

Não fazer:

```text
manter RAM cache sem limite
```

---

# 133. Estratégia de implementação incremental

## Fase A

```text
add torrent
resolve files
select media
direct playback parcial
basic priorities
```

## Fase B

```text
streaming windows
seek-aware scheduler
buffer metrics
resume data
```

## Fase C

```text
preflight
adaptive buffer
advanced caching
multi-source feedback
```

## Fase D

```text
health integration
auto fallback signals
next episode prefetch
```

---

# 134. Critérios de aceite arquiteturais

O engine será considerado funcional quando:

1. um torrent de filme puder começar a tocar antes de completar;
2. seek alterar prioridades para a nova região;
3. fechar e reabrir não perder progresso torrent relevante;
4. UI permanecer responsiva durante download;
5. season pack permitir priorizar apenas episódio atual;
6. cache não crescer sem limite;
7. source stalled gerar evento recuperável;
8. player e torrentd puderem falhar independentemente da UI;
9. métricas necessárias ao Health Score estiverem disponíveis;
10. o engine não depender de metadata visual da biblioteca.

---

# 135. Relação com Functional Requirements

Principais FRs atendidos:

```text
FR-009–020
Import e identificação

FR-028–037
Sources

FR-038–060
Streaming, cache e resume

FR-092–115
Health inputs e source behavior

FR-116–123
Downloads

FR-129–132
Next episode
```

---

# 136. Relação com NFRs

Principais NFRs:

```text
NFR-018–039
Streaming / seek / health

NFR-040–050
Cache

NFR-051–060
Persistência e integridade

NFR-066–078
Rede / CPU / GPU / disco

NFR-083–090
Isolation e resiliência

NFR-111–117
Observabilidade
```

---

# 137. Decisões fechadas

Para a arquitetura atual:

```text
libtorrent
= engine BitTorrent

torrentd
= processo separado

MPV
= player

SQLite/Core
= persistência de domínio

piece scheduler
= streaming-aware

cache
= RAM + disco

Sunshine
= transmissão PC → TV

Moonlight
= cliente TV
```

---

# 138. Questões que ficam para specs seguintes

Este documento não define o algoritmo final de:

```text
Health Score
Source Selection
```

Esses pertencem a:

```text
03-health-score-source-selection.md
```

Também não define detalhes completos do:

```text
MPV
Sunshine lifecycle
Gamepad mapping
```

que pertencem a:

```text
04-playback-mpv-sunshine.md
```

---

# 139. Regra central

> **O Torrent Engine deve perseguir o playback, não o completion.**

O arquivo completo é consequência opcional.

A prioridade permanente é manter o player alimentado.
