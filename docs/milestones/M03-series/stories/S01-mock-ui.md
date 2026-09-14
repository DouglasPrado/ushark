# S01 — Biblioteca, hierarquia e revisão mockadas

Status: DONE (frontend), 2026-09-13.

## Objetivo

Tornar lista, detalhes hierárquicos e revisão de episódios visualmente inspecionáveis no shell existente.

## Contexto e dependências

Ler [M03](../README.md), S00 concluída e `EXPERIENCE.md`. Reutilizar boundaries, padrões de foco e linguagem visual aprovados em M01/M02.

## Escopo

Construir lista de séries com busca por título/original/gênero e ordenação por destaque, votos ou A–Z, detalhes com temporadas, grade/lista de episódios e fluxo de adição/revisão usando serviços substituíveis. Incluir fixtures determinísticas para episódio avulso, season pack, pack multitemporada com especiais e pack ambíguo. Mostrar total identificado, pendências, arquivo, temporada/episódio, legenda associada e selector em linguagem de produto. Simular loading, offline, falha, metadata ausente, vazio e coleção extensa.

## Fora de escopo

Rede, persistência, localStorage/IndexedDB, TMDB real, arquivo `.torrent`, magnet, torrentd, filesystem e player.

## Critérios de aceite

Todos os estados podem ser selecionados para inspeção; hierarquia continua compreensível sem poster ou título de episódio. A mesma source aparece vinculada a vários episódios sem criar séries duplicadas. Pendências são visíveis antes de confirmar e nenhuma fixture é apresentada como dado real.

## Validação

Executar lint, typecheck e build; inspecionar superfícies em 1080p/1440p/4K e navegação no Electron quando disponível. Adicionar testes frontend apenas para riscos relevantes de layout e hierarquia.

## Evidências

`Series.tsx`, `series.css`, `packages/types/src/series.ts` e `packages/mocks/services/series.ts`: boundary SeriesCatalog, quatro packs, metadata ausente e corpus 20.000. Lint/typecheck/build passaram; 3 testes layout Chromium passaram em 1080p/1440p/4K, capturas em `../evidence/`, incluindo `catalog-search-sort-1920.png`. Corrigido diálogo que extrapolava viewport com zoom global. Electron e comportamento continuam na validação S02.

## Done When

Fluxo mockado navegável e estados visuais disponíveis para S02, com boundary substituível identificado.

## Ajuste de revisão — catálogo por categorias

Em 2026-09-14, a lista padrão passou a usar trilhos panorâmicos como a Home: `Em destaque` e categorias editoriais derivadas dos gêneros. Busca e ordenações explícitas continuam em grade única. `CatalogRail` e o `MediaCard` compartilhado mantêm o padrão sem alterar série, temporada, episódio ou source. [Evidência](../../../execution/evidence/CATALOG_CATEGORY_RAILS.md).
