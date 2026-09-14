# Evidência S04.3 — metadata hierárquica e recuperação

Data: 2026-09-14.

## Implementação

O provider TMDB real de M02 foi estendido, sem novo segredo, para:

- `search/tv` por título/ano;
- detalhes de série e external IDs;
- episódios por temporada;
- cache SQLite separado por busca, série e temporada;
- fallback degradado com cache expirado;
- cancelamento/timeout e limite de resposta já aplicados pelo provider.

`@ushark/core/series-service` coordena provider, store e cache de imagens. Refresh
localiza poster/backdrop/still em `ushark-asset://`, preserva o ID local de um
episódio já existente na mesma coordenada e cria ID provider apenas para
episódio novo. Falha/cancelamento acontece antes da mutação e mantém hierarquia,
selectors e correções locais.

## Validação

```text
pnpm exec playwright test tests/tmdb-metadata-provider.spec.ts tests/series-catalog-service.spec.ts tests/episode-mapper.spec.ts tests/series-catalog-store.spec.ts --workers=1 --trace=off
# 16 passed
```

Responses controladas cobrem busca, série, temporada, external IDs, duração,
cache fresh/stale, imagens localizadas, preservação de ID local, episódio novo,
provider offline e cancelamento explícito. O smoke TMDB de rede real permanece
`PENDING` porque `USHARK_TMDB_TOKEN` não está configurado; os testes não são
apresentados como tráfego real.
