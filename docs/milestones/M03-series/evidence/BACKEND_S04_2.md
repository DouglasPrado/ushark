# Evidência S04.2 — inferência e selectors por episódio

Data: 2026-09-14.

## Implementação

O boundary `@ushark/core/episode-mapper` reconhece, sem diferenciar caixa e com
fronteiras de token, `SxxExx`, `NxNN` e `Season N Episode N`. Especiais usam
temporada zero. Mais de uma coordenada, `S01E01E02`, arquivo sem padrão e dois
vídeos para a mesma coordenada continuam estados revisáveis; samples, extras e
legendas não viram episódio automaticamente.

O store M03 agora persiste review e correções por arquivo, revision otimista,
paginação, retry idempotente, selector e legenda candidata da mesma source. Ao
confirmar mappings, uma source M06 pode atender vários episódios com
`contentSourceId`, selector e `resolvedFileId` independentes. Mudança/ausência de
arquivo falha como `SERIES_SOURCE_CHANGED` e a transação não deixa vínculos
parciais.

## Validação

```text
pnpm exec playwright test tests/episode-mapper.spec.ts tests/series-catalog-store.spec.ts --workers=1 --trace=off
# 7 passed
```

Casos cobertos: casing, fronteiras falsas, três padrões, especiais,
multi-episódio, ambiguidade, colisão, correção manual, skip, legenda, restart,
source compartilhada, selectors distintos, retry e source alterada. S04.2 não
implementa scheduler/prioridade de download nem playback.
