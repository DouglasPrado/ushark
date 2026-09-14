# Evidência S04.1 — projeção local e leitura em lote

Data: 2026-09-14.

## Implementação

Foi adicionado `@ushark/core/discovery-index`, uma projeção SQLite local do
catálogo real de M02/M03. A migration global v7:

- cria documentos de descoberta, gêneros, origens e estado de revisão;
- mantém `contentId` como identidade única e episódios como documentos
  independentes;
- projeta metadata, progresso, favorito, memberships e descritores seguros de
  source, sem devolver paths ao renderer;
- agrega sources dos episódios na série sem duplicar a mesma source;
- serve Home e escopos por origem com índices e cursor opaco preso à revisão;
- limita páginas a 128, seções a 24 e origins/sources a 64 por Content;
- filtra toda leitura pela biblioteca local selecionada e retorna
  `DISCOVERY_UNAUTHORIZED` para origem fora desse alcance;
- persiste o último snapshot íntegro e usa transação/replay idempotente nas
  sincronizações.

Os stores M01, M02, metadata/assets, M03 e M06 reconhecem a versão global v7
sem mudar seus schemas próprios. FTS5 e watcher permanecem fora desta
sub-story.

## Sem N+1 e escala

A materialização lê o catálogo fonte com exatamente **cinco queries**,
independentemente do número de Contents: base, memberships, duas famílias de
source e agregados de episódios. Temporadas/episódios são contados em uma única
query `GROUP BY`, em vez de duas consultas por série.

O corpus de **10.000 filmes** confirmou:

- cinco queries de projeção;
- 10.000 documentos distintos e página máxima de 128;
- `idx_discovery_type_position` na Home;
- `idx_discovery_origins_scope` na leitura por biblioteca;
- teste completo, incluindo criação do corpus e materialização, em cerca de
  **400 ms** no host local.

## Validação

Suíte focada S04.1: **3/3**. Cobertura adicional:

- títulos iguais com IDs diferentes permanecem separados;
- série e três episódios não se fundem; contagens e source agregada são
  corretas;
- duas memberships não multiplicam resultados;
- Home da biblioteca A não vaza Content exclusivo da biblioteca C;
- paginação não repete itens e cursor anterior falha como stale após revisão;
- retry idempotente devolve o mesmo evento;
- falha no meio da escrita faz rollback e mantém o snapshot anterior;
- restart abre o índice persistido sem reconstruí-lo;
- upgrade v7 preserva tabelas e dados M02/M03.

Regressão conjunta dos stores/IPC afetados: **55/55**, incluindo os cinco testes
do daemon real com CPython 3.12/libtorrent 2.1.1.0. Lint, typecheck e build
passaram; o build mantém apenas o warning conhecido de chunk acima de 500 kB.

```text
pnpm exec playwright test tests/discovery-index-store.spec.ts
# 3 passed

USHARK_TEST_PYTHON="$(uv python find 3.12)" \
USHARK_TEST_LIBTORRENT_PYTHONPATH=/tmp/ushark-libtorrent-verify.GziKkI/site \
pnpm exec playwright test <stores e IPC M01/M02/M03/M04/M06>
# 55 passed
```

S04.1 não implementa busca textual, filtros FTS, atualização incremental por
documento nem watcher. Essas responsabilidades seguem, respectivamente, para
S04.2 e S04.3.
