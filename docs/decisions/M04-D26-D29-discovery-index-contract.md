# M04 D26–D29 — contrato de descoberta e índice local

Data: 2026-09-14. Status: ACCEPTED para S03.

## D26 — identidade global, origens separadas

Busca e Home retornam um item por `contentId`. Título nunca consolida
identidades: conteúdos homônimos com IDs diferentes permanecem separados.
Memberships, coleções e sources são projeções anexas, deduplicadas por seus
próprios IDs. Uma origem offline ou temporariamente indisponível não apaga o
Content já indexado; apenas muda sua disponibilidade. O renderer recebe somente
origens autorizadas e descritores seguros, nunca paths locais.

## D27 — FTS5 incremental e dados locais primeiro

`discovery_documents` será a projeção relacional canônica da leitura e
`discovery_search` seu índice FTS5. Título, original, sinopse, título da série,
título do episódio, bibliotecas e coleções são indexados. Toda alteração
atualiza somente documentos afetados na mesma transação; startup não reconstrói
índice íntegro. Rebuild existe apenas como recuperação explícita de corrupção.
Home usa a projeção SQLite antes de provider, scan, health ou rede.

Normalização da busca: Unicode NFKD, remoção de diacríticos, lowercase e tokens
separados por whitespace/pontuação. Todos os tokens precisam corresponder; cada
token é prefix match escapado para FTS. Consulta vazia é válida quando há
filtros/escopo e vira listagem estável.

## D28 — lote, ordenação e cursor

Home carrega seções em lote, sem query por card. Busca e escopos usam cursor
opaco preso à revisão, com default 24 e máximo 128. O cursor contém somente
revisão, chave de ordenação e `contentId`; revisão diferente retorna
`DISCOVERY_CURSOR_STALE` recuperável em vez de duplicar/omitir itens.

Ordem:

- busca textual: relevância FTS, título normalizado, `contentId`;
- continuar: `lastPlayedAt DESC, contentId`;
- recentes: `addedAt DESC, contentId`;
- filmes/séries e escopos: posição persistida, título normalizado,
  `contentId`.

Limites compartilhados estão em `DISCOVERY_LIMITS`: páginas até 128, seções
até 24, 64 origens/sources por Content, lotes e invalidações até 1.000.

## D29 — watcher, invalidação e ownership futuro

Watcher observa somente raízes de biblioteca já autorizadas. Eventos são
coalescidos por 150 ms e normalizados em add/change/rename/remove. Parsing,
hashing e probing pesado ficam fora do renderer e não bloqueiam a primeira
leitura. Commit produz um evento versionado com IDs e escopos invalidados; rajada
ou retry usa idempotência.

M04 lê progresso, coleções e subscriptions por providers de projeção, mas não
implementa os comandos pertencentes a M05/M12/M13/M16. Até esses produtores
existirem, S05 pode usar dados locais controlados, identificados como fixture de
leitura. O contrato não antecipa sync, seleção de source, playback ou curadoria.
