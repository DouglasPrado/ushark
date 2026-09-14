# Evidência S04.1 — hierarquia persistente e índices

Data: 2026-09-14.

## Implementação

Foi adicionado `@ushark/core/series`, um store SQLite síncrono e testável sem
renderer. A migration v6:

- amplia `contents.type` de `movie` para `movie | series | episode | local-video`
  preservando linhas e FKs existentes;
- cria `series` e `episodes`, com FK de parentesco e unique constraint
  `(series_content_id, season_number, episode_number)`;
- cria índice ordenado para paginação por série/temporada/episódio;
- mantém temporada como agregação derivada e especiais como temporada zero;
- cria apenas a casca persistente de review/idempotência consumida pelas
  sub-stories seguintes;
- usa transação, revision otimista e replay idempotente;
- não apaga episódios ausentes em refresh nem permite mover uma identidade de
  episódio para outra série/posição.

Os stores M01, M02, metadata/assets e M06 passaram a reconhecer a versão global
v6 sem alterar seus schemas próprios.

## Ambiente

```text
macOS 26.6.2 arm64
Node v26.8.1
SQLite 3.53.4 (node:sqlite)
```

## Validação

Suíte focada S04.1: **3/3**.

- upgrade M02/M06 → M03 preservou o filme existente e passou
  `PRAGMA foreign_key_check`;
- restart preservou série, especial, temporada e episódios;
- cursor opaco percorreu a temporada sem repetição;
- tentativa de mover um episode ID fez rollback inclusive da metadata da série;
- revision obsoleta falhou de forma retryable;
- 50.000 episódios foram inseridos em cerca de **444 ms** no host acima;
- a primeira página de 128 itens ficou abaixo do budget de 1 s e
  `EXPLAIN QUERY PLAN` confirmou `idx_episodes_series_order`.

Regressão conjunta dos stores afetados: **26/26** (`configuration`, catálogo e
assets de filmes, TMDB, torrent e séries).

```text
pnpm exec playwright test tests/series-catalog-store.spec.ts --workers=1 --trace=off
# 3 passed

pnpm exec playwright test tests/configuration-store.spec.ts tests/movie-catalog-store.spec.ts tests/movie-asset-store.spec.ts tests/tmdb-metadata-provider.spec.ts tests/torrent-inspection-store.spec.ts tests/series-catalog-store.spec.ts --workers=1 --trace=off
# 26 passed
```

S04.1 não implementa inferência, arquivos de review, selectors nem metadata
hierárquica remota; essas responsabilidades seguem para S04.2 e S04.3.
