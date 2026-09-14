# Evidência S04.3 — persistência e deduplicação

Data: 2026-09-14. Ambiente: macOS local, SQLite embutido do Node/Electron.

## Implementação

`packages/core/src/torrent-inspection-store.cjs` adiciona migração v5 e transações
para:

- `torrent_runtimes`: uma linha por infoHash e torrentId estável;
- `torrent_sources`: uma source reutilizada por infoHash;
- `content_source_selectors`: selector pertencente à relação conteúdo-source;
- `torrent_pending`: entrada privada, snapshot público redigido e contador de retry;
- `torrent_idempotency`: replay seguro de save/retry/confirm.

Confirmação rejeita sample/extra como seleção automática/manual de vídeo, remove
a pendência somente dentro da transação e preserva estado integral em falha. Os
stores M01/M02 foram atualizados para reconhecer o schema aditivo v5.

## Validação executada

Testes focados de M06: **4 passed**. Provas: dois conteúdos/dois selectors usam
um runtime e uma source; replay idempotente; restart; pendência sem magnet na
listagem e retry idempotente; rejeição de sample; falha injetada com rollback;
compatibilidade M01/M02.

Regressão de stores afetados:

`pnpm exec playwright test tests/torrent-inspection-store.spec.ts tests/movie-catalog-store.spec.ts tests/movie-asset-store.spec.ts tests/tmdb-metadata-provider.spec.ts tests/configuration-store.spec.ts --workers=1`

Resultado: **23 passed**. Typecheck e lint dos arquivos M06 também passaram.

## Limites

O banco persiste o magnet para retry no arquivo SQLite local protegido; listagens,
snapshots e logs não o retornam. Criptografia em repouso não foi prometida pelo
contrato v1. A orquestração Core/UI e a jornada Electron pertencem a S05.
