# Evidência S03 — contrato de playback local

Data: 2026-09-14.

O contrato real v1 foi adicionado a `@ushark/types/player`, separado do boundary
de prévia. A UI conhece `contentId`, `sourceId`, IDs de track, sessão, geração,
estado e métricas normalizadas; raw JSON IPC, PID, socket/named pipe e paths
permanecem no Core/adapter.

## Operações e lifecycle

`prepare` é uma operação curta que resolve Content/source e devolve
`operationId`; `start` cria uma única sessão. Read, pause/resume, seek,
volume/mute, áudio, legenda, stop e cancelamento possuem DTOs e resultados
tipados. Preparação, primeiro frame e posição são eventos distintos: processo
iniciado nunca equivale a reprodução visível.

Load/seek/stop são serializados por sessão. `sessionId` + `generation` tornam
eventos antigos inócuos; mutation keys tornam retries de comandos críticos
idempotentes. Um erro ou crash preserva UI e último progresso confirmado, limpa
processo/IPC/temp e produz falha recuperável sem stack trace pública.

## Limites e invariantes

- request 64 KiB; identificadores 256 bytes; no máximo 128 tracks;
- comandos 2 s, startup 15 s e shutdown 3 s;
- eventos de posição no máximo 4/s;
- persistência a cada 5 s e nas transições críticas, budget de perda 6 s;
- posição/duração em segundos, volume 0–100 e bitrate em bits/s;
- source e mídia são resolvidas no Core a partir de identidades persistidas;
- mídia é arquivo regular canonicalizado dentro de raiz autorizada/gerenciada;
- spawn usa executable + array de argumentos, `shell: false`, IPC local aleatório
  e sem console/OSD;
- hardware decode é `auto-safe`/equivalente e seu resultado observado pode ser
  active, inactive ou unknown; nunca é inventado;
- track muda no mesmo processo/source; somente source switch pode recarregar;
- legenda externa segue a política D21 e nunca modifica manifest.

## Ownership e decisões

M05 possui sessão, progresso, histórico, processo MPV e seleção de tracks. M02/
M03 possuem Content/source/selectors; M07 fornece arquivo parcial/scheduler;
M08 escolhe/faz fallback de source; M11 possui próximo episódio; M18 valida
Sunshine/Moonlight e janela/foco físicos. O caso M05 usa somente arquivo já
local e uma source explicitamente resolvível.

[D10/D11/D18/D21](../../../decisions/M05-D10-D11-D18-D21-playback-contract.md)
fecham progresso/conclusão, composição, matriz de prova e legenda. Typecheck,
lint e testes de contrato passam na validação de S03; runtime MPV começa em
S04.1.
