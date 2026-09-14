# M07 S04.3 — delivery parcial e geração

Data: 2026-09-14.

## Entrega

- `ProgressiveStreamApplicationService` resolve apenas a relação confirmada
  conteúdo/source/file, agenda o torrent e entrega o arquivo sparse ao adapter
  MPV sem publicar o path no renderer.
- `torrentd` expõe readiness e stop por sessão, mantém geração monotônica e
  recompõe prioridades de sessões concorrentes. Stop é seguro quando repetido.
- O resolver reidrata o runtime a partir do `.torrent` gerenciado ou do magnet
  derivado do infoHash depois de restart.
- Paths passam novamente pela contenção real do `dataRoot`; aliases
  `/var` → `/private/var` do macOS são normalizados antes da decisão.
- A aplicação espera a confirmação assíncrona das prioridades de arquivo antes
  de aplicar o vetor de pieces. Isso evita que a prioridade default sobrescreva
  HOT/WARM/BUFFER no libtorrent.

## Validação

`tests/progressive-stream-service.spec.ts` passou **4/4**, incluindo MPV 0.41
headless até o primeiro frame e três seeks rápidos em que somente a última
geração alcança o player. `tests/torrent-daemon.spec.ts` passou **6/6** com
CPython 3.12.14 e libtorrent 2.1.1.0 reais. O path aparece somente no boundary
Core→MPV; snapshots públicos não contêm path, pieces, peers ou trackers.

O swarm integral e a ligação Electron pertencem a S05.
