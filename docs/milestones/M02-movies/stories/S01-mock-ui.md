# S01 — Lista, cadastro e detalhes mockados

Status: IMPLEMENTED — UI mockada e boundary disponíveis; aprovação UX pendente.

## Objetivo

Tornar a jornada de filmes visualmente inspecionável no shell existente.

## Contexto e dependências

Ler [M02](../README.md) e apenas as fontes aplicáveis: S00 concluída; EXPERIENCE.md, packages/types, packages/mocks e packages/ui existentes.

## Escopo

Construir lista com busca e ordenação, cadastro por busca, manual, revisão, detalhes, edição e painel Fontes. A busca da lista considera título localizado, original e gêneros; a ordenação oferece destaque, votos e A–Z. Usar o shell superior da Home, com navegação principal e ações compactas por ícones; não expor mensagens internas de mock/provisoriedade na superfície de produto. O detalhe de Filme reutiliza o componente e a página canônica de M04, preservando ferramentas de gestão como ações contextuais da aba Filmes. Usar MetadataProvider substituível e operações de catálogo em memória fora dos componentes; fixtures determinísticas, assets locais e resposta assíncrona simulada. Mostrar título/original, ano, sinopse, duração, gêneros/elenco e imagens quando disponíveis; IDs externos na revisão apropriada. Preparar cenários de duplicata, overrides por biblioteca e confirmação de remoções.

## Fora de escopo

Rede, localStorage/IndexedDB/banco, leitura torrent, download, player, cache real e backend.

## Critérios de aceite

Todos os estados do README são selecionáveis para inspeção; “Buscar filme” não exige conhecimento do TMDB. Zero fontes permite manter Content; valores técnicos desconhecidos ficam indisponíveis. Lista/detalhes acessíveis no shell sem regressão do onboarding.

## Validação

pnpm lint, pnpm typecheck e pnpm build; inspecionar capturas das novas superfícies nas resoluções previstas. Testes frontend somente para riscos relevantes.

## Evidências

Movies.tsx, ContentDetails.tsx, discovery.css, movies.css, packages/types/src/movies.ts e packages/mocks/services/movies.ts. Lint/typecheck/build passaram. Três testes de layout passaram (1080p/1440p/4K); capturas em evidence/. A revisão posterior recapturou lista e detalhes com cabeçalho superior, sem lateral/rodapé técnico, e ações secundárias por ícones. A página de Filme foi unificada com Home/busca em `ContentDetails`, sob `#/content/:contentId`. Busca/ordenação foram inspecionadas em `evidence/catalog-search-sort-1920.png`. Corrigida altura de viewport com CSS zoom.

## Conclusão

UI mockada navegável, evidência visual registrada e boundary substituível identificado.

Estado consolidado da fase: S00–S02 implementadas; aceite UX já existente de M02 preservado em ../UX_CHECKPOINT.md. Referências a revisão pendente acima registram o estágio histórico anterior ao aceite. S03–S08 adiadas.
