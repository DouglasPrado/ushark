# S01 — Home e busca mockadas

Status: DONE (frontend), 2026-09-13.

## Objetivo

Disponibilizar as superfícies para inspeção visual.

## Contexto e dependências

Ler [M04](../README.md). S00 concluída e EXPERIENCE.md; shell e catálogos existentes.

## Escopo

Implementar cabeçalho de navegação sobreposto, Hero de largura total, Continuar/Mais informações, trilhos horizontais de filmes/séries/recentes, acesso às bibliotecas, busca global e filtros de tipo/recentes/favoritos/gênero/coleção. Reutilizar detalhes de M02/M03 quando disponíveis; se M03 não estiver executado, usar adapter e superfície simulada identificada no roteiro. O detalhe comum deve usar backdrop panorâmico e reunir sinopse, gêneros, elenco quando disponível, avaliação, ano/período, duração ou temporadas/episódios, resolução, Torrent Health, identificadores, memberships e ações agrupadas, além de uma prévia local de trailer. Filmes reutilizam exatamente a mesma página `ContentDetails` da aba Filmes; Séries mantêm o modal. Ao final, exibir recomendações do catálogo com imagem, badges e resumo. Fixtures determinísticas em memória cobrem todos os estados, biblioteca grande, progressos, memberships e sources. Limitar os trilhos a dez cards e reservar espaço para imagens e metadata. Quando o catálogo fornecer ambos, usar backdrop horizontal no Hero/trilhos e pôster vertical na grade de busca.

## Fora de escopo

Rede, filesystem, localStorage/IndexedDB, SQLite, FTS real, watchers e player.

## Critérios de aceite

Caminho principal navegável; seções vazias seguem contrato; pôsteres e backdrops têm fallback e dimensões adequadas. Hero e progresso são compreensíveis e nenhum estado simulado é apresentado como integração real.

## Validação

Lint/typecheck/build existentes, inspeção 1080p/1440p/4K e Electron disponível; validação de layout proporcional.

## Evidências

Discovery.tsx/ContentDetails.tsx/discovery.css e boundary types/mocks discovery.ts implementados. A revisão de UX deixou a Home com composição de streaming, mantendo identidade própria e sem copiar marcas ou assets externos. O detalhe de Filme converge com M02 no componente e na rota canônica; a comparação automatizada cobre as duas entradas. Typecheck, lint e build passaram; três testes de layout 1080p/1440p/4K passaram, com capturas em evidence/. Inspeção Electron e comportamento aprofundado seguem em S02.

## Done When

UI mockada cobre o contrato com boundary substituível identificado. O trailer é somente uma experiência local determinística nesta fase; provider e reprodução de mídia reais continuam fora de escopo.
