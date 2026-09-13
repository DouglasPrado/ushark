# Ushark — Architecture 07: IPC Contracts

**Status:** Draft v1  
**Produto:** Ushark\
**Documento:** Architecture Specification  
**Dependências:**  
- `01-prd-master.md`
- `02-user-journeys.md`
- `03-functional-requirements.md`
- `04-non-functional-requirements.md`
- `docs/architecture/01-library-manifest.md`
- `docs/architecture/02-torrent-streaming-engine.md`
- `docs/architecture/03-health-score-source-selection.md`
- `docs/architecture/04-playback-mpv-sunshine.md`
- `docs/architecture/05-shared-libraries-sync.md`
- `docs/architecture/06-data-model.md`

---

# 1. Objetivo

Este documento define os contratos de comunicação entre os processos e módulos principais do Ushark.

Os contratos devem permitir:

- isolamento de processos;
- versionamento;
- testes;
- substituição de implementação;
- recovery;
- logs correlacionados;
- tratamento uniforme de erros;
- comunicação assíncrona sem bloquear a UI.

Os principais canais são:

```text
UI
↔
Core

Core
↔
torrentd

Core
↔
MPV
```

---

# 2. Princípio central

Nenhuma camada deve depender dos detalhes internos da outra.

A comunicação deve acontecer por contratos explícitos.

```text
implementation
≠
contract
```

---

# 3. Visão macro

```text
┌─────────────────┐
│       UI        │
└────────┬────────┘
         │ IPC
         ▼
┌─────────────────┐
│      Core       │
└───────┬─────────┘
        │
        ├──────────── RPC ────────────┐
        │                             │
        ▼                             ▼
┌─────────────────┐           ┌─────────────────┐
│    torrentd     │           │       MPV       │
└─────────────────┘           └─────────────────┘
```

---

# 4. Tipos de comunicação

Existem quatro padrões principais:

```text
request → response
command → ack
event stream
snapshot
```

---

# 5. Request → Response

Usado quando o caller precisa de uma resposta imediata.

Exemplo:

```text
get torrent status
get source list
get player tracks
```

---

# 6. Command → Ack

Usado quando uma ação começa mas não termina dentro do request.

Exemplo:

```text
prepare stream
start sync
start playback
```

Resposta:

```text
accepted
+
operationId
```

Depois:

```text
events
```

indicam progresso e término.

---

# 7. Event Stream

Usado para:

- status;
- progresso;
- mudança de state;
- erros;
- métricas;
- completion.

---

# 8. Snapshot

Usado para reconstruir estado atual caso eventos sejam perdidos.

Exemplo:

```text
torrent.status
player.status
sync.status
```

---

# 9. Envelope padrão

Toda mensagem RPC deve seguir formato conceitual:

```ts
interface RpcRequest<T = unknown> {
  protocolVersion: string;
  requestId: string;
  method: string;
  payload: T;
  timestamp: number;
}
```

---

# 10. Response Envelope

```ts
interface RpcResponse<T = unknown> {
  protocolVersion: string;
  requestId: string;
  ok: boolean;
  data?: T;
  error?: RpcError;
  timestamp: number;
}
```

---

# 11. Error Envelope

```ts
interface RpcError {
  code: string;
  message: string;
  recoverable: boolean;
  retryable: boolean;
  details?: Record<string, unknown>;
}
```

---

# 12. Event Envelope

```ts
interface RpcEvent<T = unknown> {
  protocolVersion: string;
  eventId: string;
  type: string;
  payload: T;
  timestamp: number;
  correlationId?: string;
}
```

---

# 13. IDs obrigatórios

Os seguintes IDs devem existir conforme o contexto:

```text
requestId
operationId
contentId
sourceId
torrentId
streamSessionId
playerSessionId
librarySyncId
playbackSessionId
```

---

# 14. Correlation ID

Operações relacionadas devem compartilhar:

```text
correlationId
```

Exemplo:

```text
Play button
↓
Source Selection
↓
stream.prepare
↓
MPV launch
↓
first frame
```

podem carregar o mesmo correlation ID.

---

# 15. Protocol Version

Cada canal deve possuir versão explícita.

Exemplo:

```text
core-torrentd/1
core-ui/1
core-mpv/1
```

---

# 16. Version Negotiation

Na inicialização:

```text
hello
↓
supported versions
↓
select compatible version
```

---

# 17. Incompatibilidade

Se não existir versão compatível:

```text
fail fast
```

com erro claro.

Nunca tentar interpretar payload desconhecido silenciosamente.

---

# 18. Transport — UI/Core

Como UI e Core podem viver no mesmo processo Electron:

```text
Electron IPC
```

é aceitável.

Ainda assim, manter contratos tipados.

---

# 19. Transport — Core/torrentd

No Windows, opções preferenciais:

```text
Named Pipe
ou
localhost RPC
```

Recomendação:

```text
Named Pipe
```

quando viável.

---

# 20. Transport — Core/MPV

MPV deve usar IPC nativo suportado pelo player.

No Windows:

```text
Named Pipe
```

---

# 21. Security dos canais

Todos os canais devem ser locais.

Não expor externamente por default.

---

# 22. UI → Core Namespace

Métodos devem ser agrupados.

Exemplo:

```text
library.*
content.*
source.*
playback.*
settings.*
downloads.*
sharing.*
search.*
```

---

# 23. Core → torrentd Namespace

Exemplo:

```text
torrent.*
stream.*
health.*
runtime.*
```

---

# 24. UI/Core — library.list

Request:

```json
{
  "method": "library.list",
  "payload": {}
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "libraries": []
  }
}
```

---

# 25. UI/Core — library.get

Payload:

```ts
{
  libraryId: string;
}
```

---

# 26. UI/Core — library.create

Payload:

```ts
{
  name: string;
  description?: string;
}
```

Response:

```ts
{
  libraryId: string;
}
```

---

# 27. UI/Core — library.update

Payload:

```ts
{
  libraryId: string;
  patch: {
    name?: string;
    description?: string;
  };
}
```

---

# 28. UI/Core — library.delete

Payload:

```ts
{
  libraryId: string;
  deleteLocalFiles?: boolean;
}
```

Ação destrutiva deve exigir confirmação na UI antes.

---

# 29. UI/Core — content.get

Payload:

```ts
{
  contentId: string;
}
```

Response deve retornar DTO agregado, não entidades cruas do banco.

---

# 30. Content Details DTO

Exemplo:

```ts
interface ContentDetailsDto {
  contentId: string;
  type: string;
  title: string;
  description?: string;
  poster?: string;
  backdrop?: string;
  progress?: {
    positionSeconds: number;
    durationSeconds?: number;
    watched: boolean;
  };
  sources: SourceSummaryDto[];
}
```

---

# 31. UI/Core — search.query

Payload:

```ts
{
  query: string;
  limit?: number;
  cursor?: string;
}
```

---

# 32. UI/Core — source.addTorrent

Payload:

```ts
{
  input:
    | { type: 'magnet'; magnet: string }
    | { type: 'torrent-file'; path: string };
}
```

Response:

```ts
{
  operationId: string;
}
```

---

# 33. Source Import Events

```text
source.import.started
source.import.metadata-waiting
source.import.files-ready
source.import.identification-ready
source.import.completed
source.import.failed
```

---

# 34. UI/Core — source.confirmIdentification

Payload:

```ts
{
  operationId: string;
  contentMatch: {
    type: string;
    provider?: string;
    providerId?: string;
    manualTitle?: string;
  };
}
```

---

# 35. UI/Core — playback.prepare

Payload:

```ts
{
  contentId: string;
  sourceId?: string;
}
```

Response:

```ts
{
  operationId: string;
}
```

---

# 36. Playback Prepare Events

```text
playback.prepare.started
playback.prepare.source-selected
playback.prepare.health-ready
playback.prepare.buffering
playback.prepare.ready
playback.prepare.failed
```

---

# 37. UI/Core — playback.start

Payload:

```ts
{
  operationId: string;
}
```

Response:

```ts
{
  playerSessionId: string;
}
```

---

# 38. UI/Core — playback.pause

Payload:

```ts
{
  playerSessionId: string;
  paused: boolean;
}
```

---

# 39. UI/Core — playback.seek

Payload:

```ts
{
  playerSessionId: string;
  positionSeconds: number;
}
```

---

# 40. UI/Core — playback.stop

Payload:

```ts
{
  playerSessionId: string;
  reason?: 'user' | 'error' | 'shutdown';
}
```

---

# 41. UI/Core — playback.selectAudio

Payload:

```ts
{
  playerSessionId: string;
  trackId: string | number;
}
```

---

# 42. UI/Core — playback.selectSubtitle

Payload:

```ts
{
  playerSessionId: string;
  trackId: string | number | null;
}
```

`null`:

```text
disable subtitles
```

---

# 43. UI/Core — playback.getState

Response:

```ts
interface PlaybackStateDto {
  state: string;
  positionSeconds: number;
  durationSeconds?: number;
  paused: boolean;
  audioTracks: TrackDto[];
  subtitleTracks: TrackDto[];
  selectedSourceId: string;
  health?: HealthDto;
}
```

---

# 44. Playback Events

```text
playback.started
playback.first-frame
playback.position
playback.paused
playback.resumed
playback.seeking
playback.seeked
playback.buffering-start
playback.buffering-end
playback.source-switching
playback.source-switched
playback.ended
playback.failed
```

---

# 45. Position Event Frequency

Não enviar em cada frame.

Exemplo:

```text
2–4 events/s
```

ou menos se UI não precisar.

---

# 46. UI/Core — source.listForContent

Payload:

```ts
{
  contentId: string;
}
```

Response inclui:

- source;
- media info;
- health;
- recommendation;
- local override.

---

# 47. UI/Core — source.setOverride

Payload:

```ts
{
  contentId: string;
  sourceId: string | null;
}
```

---

# 48. UI/Core — health.probe

Payload:

```ts
{
  sourceId: string;
  priority?: 'high' | 'normal' | 'low';
}
```

Response:

```ts
{
  operationId: string;
}
```

---

# 49. Health Events

```text
health.measuring
health.updated
health.ready
health.degraded
health.unavailable
```

---

# 50. UI/Core — downloads.list

Response:

```ts
{
  items: DownloadDto[];
}
```

---

# 51. UI/Core — downloads.pause

Payload:

```ts
{
  sourceId: string;
}
```

---

# 52. UI/Core — downloads.resume

Payload:

```ts
{
  sourceId: string;
}
```

---

# 53. UI/Core — downloads.cancel

Payload:

```ts
{
  sourceId: string;
  deleteData?: boolean;
}
```

---

# 54. UI/Core — sharing.export

Payload:

```ts
{
  libraryId: string;
  destinationPath: string;
}
```

Response:

```ts
{
  operationId: string;
}
```

---

# 55. UI/Core — sharing.importFile

Payload:

```ts
{
  path: string;
}
```

Response:

```ts
{
  operationId: string;
}
```

---

# 56. UI/Core — sharing.importUrl

Payload:

```ts
{
  uri: string;
}
```

---

# 57. Sharing Import Events

```text
library.import.started
library.import.validating
library.import.preview-ready
library.import.installing
library.import.completed
library.import.failed
```

---

# 58. UI/Core — sharing.subscribe

Payload:

```ts
{
  previewOperationId: string;
  autoUpdate: boolean;
}
```

---

# 59. UI/Core — sharing.checkUpdates

Payload:

```ts
{
  libraryId: string;
}
```

---

# 60. UI/Core — sharing.applyUpdate

Payload:

```ts
{
  libraryId: string;
  version: number;
}
```

---

# 61. Sync Events

```text
library.sync.checking
library.sync.update-available
library.sync.downloading
library.sync.validating
library.sync.staging
library.sync.applying
library.sync.completed
library.sync.failed
```

---

# 62. Core/torrentd — torrent.add

Payload:

```ts
type TorrentAddPayload =
  | {
      sourceId: string;
      type: 'magnet';
      magnet: string;
    }
  | {
      sourceId: string;
      type: 'torrent-file';
      path: string;
    };
```

Response:

```ts
{
  torrentId: string;
  state: string;
}
```

---

# 63. Core/torrentd — torrent.remove

Payload:

```ts
{
  torrentId: string;
  removeData: boolean;
}
```

---

# 64. Core/torrentd — torrent.pause

Payload:

```ts
{
  torrentId: string;
}
```

---

# 65. Core/torrentd — torrent.resume

Payload:

```ts
{
  torrentId: string;
}
```

---

# 66. Core/torrentd — torrent.getStatus

Response:

```ts
interface TorrentStatusDto {
  torrentId: string;
  state: string;
  progress: number;
  downloadBps: number;
  uploadBps: number;
  peersConnected: number;
  peersUseful: number;
  piecesHave: number;
  piecesTotal: number;
}
```

---

# 67. Core/torrentd — torrent.getFiles

Response:

```ts
{
  files: TorrentFileDto[];
}
```

---

# 68. Core/torrentd — stream.prepare

Payload:

```ts
{
  torrentId: string;
  sourceId: string;
  contentId: string;
  selector: MediaSelectorDto;
  mode: 'stream-only' | 'keep' | 'download';
}
```

Response:

```ts
{
  streamSessionId: string;
}
```

---

# 69. Core/torrentd — stream.setPosition

Payload:

```ts
{
  streamSessionId: string;
  positionSeconds: number;
  durationSeconds?: number;
  seekGeneration?: number;
}
```

---

# 70. Core/torrentd — stream.seek

Payload:

```ts
{
  streamSessionId: string;
  positionSeconds: number;
  seekGeneration: number;
}
```

---

# 71. Core/torrentd — stream.stop

Payload:

```ts
{
  streamSessionId: string;
}
```

---

# 72. Stream Events

```text
stream.preparing
stream.file-resolved
stream.buffer-updated
stream.ready
stream.stalled
stream.recovered
stream.completed
stream.failed
```

---

# 73. Buffer Event

Payload:

```ts
{
  streamSessionId: string;
  bufferSeconds: number;
  hotWindowReady: boolean;
  warmWindowReady?: boolean;
}
```

---

# 74. Core/torrentd — health.getSnapshot

Payload:

```ts
{
  sourceId: string;
}
```

---

# 75. Core/torrentd — health.startProbe

Payload:

```ts
{
  sourceId: string;
  priority: 'high' | 'normal' | 'low';
  maxBytes?: number;
}
```

---

# 76. Core/torrentd — health.cancelProbe

Payload:

```ts
{
  operationId: string;
}
```

---

# 77. Raw Health Metrics Event

torrentd deve emitir métricas, não score final.

Payload exemplo:

```ts
{
  sourceId: string;
  downloadBps: number;
  peersConnected: number;
  peersUseful: number;
  wantedPieceAvailability?: number;
  bufferSeconds?: number;
  stalled: boolean;
}
```

---

# 78. Core/torrentd — runtime.saveResume

Payload:

```ts
{
  torrentId: string;
}
```

---

# 79. Core/torrentd — runtime.shutdown

Payload:

```ts
{
  graceful: boolean;
}
```

---

# 80. Torrentd Events

Eventos mínimos:

```text
torrent.metadata-waiting
torrent.metadata-ready
torrent.peer-connected
torrent.peer-disconnected
torrent.progress
torrent.stalled
torrent.recovered
torrent.completed
torrent.error
runtime.resume-saved
runtime.shutdown-complete
```

---

# 81. MPV Command Envelope

MPV usa formato próprio JSON IPC.

Core deve esconder isso atrás de adapter.

---

# 82. MpvAdapter

Interface conceitual:

```ts
interface MpvAdapter {
  start(options: MpvStartOptions): Promise<PlayerHandle>;
  load(path: string): Promise<void>;
  pause(value: boolean): Promise<void>;
  seek(seconds: number): Promise<void>;
  selectAudio(trackId: number): Promise<void>;
  selectSubtitle(trackId: number | null): Promise<void>;
  getState(): Promise<MpvState>;
  stop(): Promise<void>;
}
```

---

# 83. MPV Events Normalizados

```text
mpv.ready
mpv.file-loaded
mpv.first-frame
mpv.position
mpv.pause
mpv.unpause
mpv.seek
mpv.buffering
mpv.end-file
mpv.shutdown
mpv.error
```

---

# 84. MPV Raw Command Example

Adapter pode emitir:

```json
{
  "command": ["get_property", "time-pos"]
}
```

Mas esse formato nunca deve escapar do adapter.

---

# 85. Timeouts

Toda chamada síncrona deve possuir timeout.

---

# 86. Timeout Classes

Exemplo:

```text
FAST
500ms–2s

NORMAL
2–5s

SLOW
5–30s

LONG-RUNNING
operationId + events
```

---

# 87. Operações longas

Nunca manter request aberto para:

```text
metadata resolution
torrent completion
library sync
health probe
playback preparation
```

---

# 88. Idempotência

Métodos devem declarar se são idempotentes.

Exemplos:

```text
torrent.pause
idempotente

torrent.resume
idempotente

playback.stop
idempotente

library.create
não necessariamente idempotente
```

---

# 89. Idempotency Key

Para operações que podem ser repetidas por retry, pode existir:

```text
idempotencyKey
```

---

# 90. Retry Policy

Retry automático apenas quando:

```text
retryable = true
```

---

# 91. Backoff

Usar:

```text
exponential backoff
+
jitter
```

para operações adequadas.

---

# 92. Não repetir ações destrutivas cegamente

Exemplo:

```text
delete file
publish version
```

devem ter idempotência forte ou confirmação de estado.

---

# 93. Sequence Numbers

Streams de eventos de alta frequência podem possuir:

```text
sequence
```

para detectar eventos fora de ordem.

---

# 94. Event Ordering

Para uma mesma sessão:

```text
started
→
ready
→
ended
```

deve ser monotônico.

---

# 95. Late Events

Evento de sessão antiga:

```text
playerSessionId != current
```

deve ser ignorado.

---

# 96. Session Generation

Cada nova sessão deve possuir ID único.

Não reutilizar ID depois de finalizar.

---

# 97. Cancellation

Operações longas devem ser canceláveis quando fizer sentido.

Exemplo:

```text
health probe
library import
stream prepare
```

---

# 98. Cancellation Method

Exemplo:

```text
operation.cancel
```

Payload:

```ts
{
  operationId: string;
}
```

---

# 99. Cancellation Result

Estados:

```text
cancelled
already-completed
not-cancellable
not-found
```

---

# 100. Progress Contract

Operações longas podem emitir:

```ts
interface OperationProgress {
  operationId: string;
  phase: string;
  current?: number;
  total?: number;
  percentage?: number;
  message?: string;
}
```

---

# 101. Operation State Machine

```text
created
↓
running
↓
completed
```

ou:

```text
failed
cancelled
```

---

# 102. Operation Registry

Core deve manter mapa das operações ativas.

---

# 103. UI Reconnect

Se UI recarregar, deve conseguir perguntar:

```text
operation.listActive
```

e reconstruir progresso.

---

# 104. Operation Snapshot

Método:

```text
operation.get
```

retorna state atual.

---

# 105. Crash Recovery

Se torrentd reiniciar:

```text
Core reconnect
↓
hello/version
↓
runtime.list
↓
rebind sourceIds/torrentIds
```

---

# 106. Torrent Runtime Discovery

Método conceitual:

```text
runtime.list
```

Response:

```ts
{
  torrents: RuntimeTorrentDto[];
}
```

---

# 107. MPV Reconnect

MPV normalmente não será reconectado após crash.

Core cria nova player session.

---

# 108. Core/UI Rehydration

Ao reload da UI:

```text
playback.getState
downloads.list
library.list
operation.listActive
```

reconstroem tela.

---

# 109. Snapshot over Event Replay

V1 não precisa persistir/replay de todos os eventos.

Preferir:

```text
latest snapshot
+
live events
```

---

# 110. Logging

Cada RPC deve registrar:

```text
requestId
method
durationMs
ok/error
correlationId
```

---

# 111. Payload Logging

Não logar payload completo quando contiver:

- magnets;
- tokens;
- paths sensíveis;
- external URLs privadas.

---

# 112. Metrics

Medir:

```text
rpc_calls_total
rpc_errors_total
rpc_duration_ms
events_total
active_operations
```

---

# 113. Typed Contracts

Contratos devem existir em package compartilhado.

Exemplo:

```text
packages/contracts
```

---

# 114. TypeScript Contracts

UI/Core podem compartilhar types TS.

torrentd pode gerar/consumir schema equivalente.

---

# 115. Wire Schema

Não depender apenas de TypeScript.

Definir schema serializável.

Opções:

```text
JSON Schema
Zod-derived JSON Schema
Protocol Buffers
MessagePack schema
```

---

# 116. Recomendação inicial

Para simplicidade:

```text
JSON
+
Zod
+
JSON Schema
```

No IPC local, performance é suficiente para comandos/estado.

Dados de vídeo nunca passam pelo RPC.

---

# 117. Binary Data

Não trafegar:

```text
video bytes
large torrent blobs
images
```

pelo IPC JSON.

Passar:

```text
path
handle
sessionId
```

---

# 118. Large Payload Limits

Definir limite por mensagem.

Exemplo:

```text
1–4 MB
```

para RPC comum.

---

# 119. Backpressure

Event streams não devem inundar Core/UI.

---

# 120. Throttling

Eventos de alta frequência devem ser agregados.

Exemplos:

```text
download speed
position
health
```

---

# 121. Latest-value Semantics

Para métricas:

```text
latest value wins
```

Não é necessário entregar cada sample à UI.

---

# 122. Critical Events

Nunca descartar:

```text
error
completed
ended
source-switched
sync-failed
```

---

# 123. Heartbeat

Core ↔ torrentd pode possuir heartbeat.

Exemplo:

```text
5s
```

---

# 124. Heartbeat Failure

Após N falhas:

```text
runtime unavailable
```

Core tenta restart conforme política.

---

# 125. Hello Contract

Request:

```ts
{
  client: 'core';
  clientVersion: string;
  supportedProtocols: string[];
}
```

Response:

```ts
{
  server: 'torrentd';
  serverVersion: string;
  selectedProtocol: string;
  capabilities: string[];
}
```

---

# 126. Capabilities

Exemplos:

```text
piece-deadlines
health-probe
resume-v1
range-stream
```

---

# 127. Feature Detection

Core deve preferir capabilities em vez de inferir por versão.

---

# 128. Graceful Degradation

Se capability opcional faltar:

```text
desabilitar feature
```

sem quebrar todo app.

---

# 129. Error Codes — Core/torrentd

Exemplos:

```text
TORRENT_NOT_FOUND
TORRENT_METADATA_TIMEOUT
TORRENT_NO_PEERS
TORRENT_STORAGE_ERROR
TORRENT_DISK_FULL
TORRENT_RESUME_INVALID
STREAM_NOT_FOUND
STREAM_NOT_READY
STREAM_STALLED
STREAM_SELECTOR_INVALID
RPC_PROTOCOL_MISMATCH
RPC_TIMEOUT
```

---

# 130. Error Codes — Playback

```text
PLAYER_NOT_FOUND
PLAYER_LAUNCH_FAILED
PLAYER_IPC_FAILED
PLAYER_MEDIA_OPEN_ERROR
PLAYER_CODEC_ERROR
PLAYER_CRASHED
PLAYER_TRACK_NOT_FOUND
```

---

# 131. Error Codes — Sharing

```text
LIBRARY_SCHEMA_INVALID
LIBRARY_SIGNATURE_INVALID
LIBRARY_HASH_MISMATCH
LIBRARY_VERSION_CONFLICT
LIBRARY_IDENTITY_CHANGED
LIBRARY_IMPORT_FAILED
LIBRARY_SYNC_FAILED
```

---

# 132. UI Error Mapping

UI não deve exibir error code cru como mensagem principal.

Exemplo:

```text
TORRENT_NO_PEERS
```

vira:

```text
Esta fonte não possui peers disponíveis no momento.
```

---

# 133. Advanced Details

Error code pode aparecer em:

```text
Detalhes técnicos
```

---

# 134. Security — Command Allowlist

torrentd deve aceitar apenas métodos conhecidos.

Nunca executar comando arbitrário recebido por IPC.

---

# 135. Security — Path Validation

Paths recebidos devem ser validados e normalizados.

---

# 136. Security — No Shell

IPC nunca deve virar:

```text
shell(commandFromPayload)
```

---

# 137. Security — MPV Args

Argumentos MPV devem ser montados por array/estrutura segura.

---

# 138. Security — Local Peer Authentication

Opcionalmente usar secret efêmero por startup entre Core e torrentd.

Especialmente se transport for localhost TCP.

---

# 139. Named Pipe Permissions

Restringir ao usuário atual quando possível.

---

# 140. Testing — Contract

Cada método deve possuir tests de:

```text
valid request
invalid payload
missing field
unknown method
timeout
error mapping
version mismatch
```

---

# 141. Testing — Event Ordering

Testar:

```text
late events
duplicate events
out-of-order metrics
session replacement
```

---

# 142. Testing — Restart

Simular:

```text
torrentd restart
UI reload
MPV crash
Core reconnect
```

---

# 143. Contract Fixtures

Criar fixtures em:

```text
packages/contracts/fixtures
```

---

# 144. Schema Compatibility

Mudança backward-compatible:

```text
adicionar campo opcional
```

Mudança breaking:

```text
renomear/remover campo obrigatório
```

requer nova protocol version.

---

# 145. Unknown Fields

Receivers devem poder ignorar campos desconhecidos quando schema/version permitir.

---

# 146. Required Fields

Campo obrigatório ausente:

```text
reject request
```

---

# 147. Enum Evolution

Preferir:

```text
unknown fallback
```

para eventos não críticos.

Para state machines críticas:

```text
protocol mismatch
```

pode ser mais seguro.

---

# 148. Contract Documentation

Cada method deve ter:

```text
purpose
request
response
events
errors
timeout
idempotency
```

---

# 149. Example — Prepare Playback End-to-End

```text
UI
→ playback.prepare(contentId)

Core
→ source selection

Core
→ torrent.add/resume

Core
→ health.startProbe

Core
→ stream.prepare

torrentd
→ stream.buffer-updated

torrentd
→ stream.ready

Core
→ MPV start/load

MPV
→ first-frame

Core
→ playback.first-frame

UI
→ player visible
```

---

# 150. Example — Seek End-to-End

```text
UI
→ playback.seek(4200)

Core
→ MPV seek(4200)

Core
→ stream.seek(4200, generation=7)

torrentd
→ reprioritize pieces

torrentd
→ stream.buffer-updated

MPV
→ playback-restart

Core
→ playback.seeked
```

---

# 151. Example — Source Fallback

```text
torrentd
→ stream.stalled

Core
→ Health Engine

Core
→ Source Selection

Core
→ prepare source B

Core
→ stream.prepare(B)

Core
→ MPV load source B

Core
→ seek currentTime

MPV
→ first frame

Core
→ playback.source-switched
```

---

# 152. Example — Library Update

```text
UI/Core
→ sharing.checkUpdates

Core
→ Registry

Core
→ library.sync.update-available

UI
→ apply

Core
→ stage/validate

Core
→ transaction commit

Core
→ library.sync.completed
```

---

# 153. Acceptance Criteria — IPC

Considerado funcional quando:

1. todos os processos usam contratos versionados;
2. long-running operations retornam operationId;
3. erros são normalizados;
4. timeouts existem;
5. eventos possuem session/correlation IDs;
6. UI pode reidratar estado após reload;
7. torrentd pode reconectar;
8. MPV fica escondido atrás de adapter;
9. payloads são validados;
10. contratos são testáveis isoladamente.

---

# 154. Relação com Functional Requirements

Atende principalmente:

```text
FR-038–080
Streaming, Playback e Controle

FR-092–123
Health, Selection e Downloads

FR-149–167
Import, Subscription e Sync

FR-204–210
Error Handling
```

---

# 155. Relação com NFRs

Atende principalmente:

```text
NFR-009
Async isolation

NFR-083–090
Process isolation e resiliência

NFR-111–117
Logs e observabilidade

NFR-137–144
Modularidade e testabilidade

NFR-152–154
Shutdown e recovery
```

---

# 156. Decisões fechadas

```text
Wire format
= JSON inicialmente

Validation
= Zod / JSON Schema

UI/Core
= Electron IPC

Core/torrentd
= Named Pipe ou localhost RPC

Core/MPV
= MPV IPC via adapter

Long operations
= operationId + events

High-frequency metrics
= throttled snapshots/events

Video bytes
= nunca trafegam pelo RPC
```

---

# 157. Próxima Etapa

O próximo documento recomendado é:

```text
08-security-model.md
```

Depois:

```text
09-ux-navigation-spec.md
```

---

# 158. Regra central

> **IPC deve transportar intenção, estado e eventos — nunca detalhes de implementação ou dados pesados de mídia.**
