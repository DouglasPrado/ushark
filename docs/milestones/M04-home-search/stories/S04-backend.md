# S04 — Queries e indexação incremental

Status: DONE em 2026-09-14 — S04.1, S04.2 e S04.3 concluídas.

## Objetivo

Fornecer leitura local rápida e atualização incremental sem bloquear Home ou renderer.

## Contexto e dependências

[M04](../README.md), S03 concluída, M02/M03 integrados e UX da onda M01–M22 aprovada.

## Escopo

Executar S04.1 → S04.2 → S04.3, uma por vez, com evidência por sub-story.

## Fora de escopo

Playback, sync/subscriptions remotas, publicação, curadoria e health probes.

## Critérios de aceite

Consultas e eventos do contrato implementados; renderer sem acesso direto a banco/disco; falhas preservam último catálogo consistente.

## Validação

Testes de cada sub-story, lint/typecheck/build aplicáveis e inspeção de queries/processos reais.

## Evidências

- [S04.1 — projeção local e leitura em lote](../evidence/BACKEND_S04_1.md):
  **3/3** focados; corpus de 10.000 Contents com cinco queries fixas; regressão
  afetada **55/55**.
- [S04.2 — busca FTS5 incremental](../evidence/BACKEND_S04_2.md): busca/cursor,
  filtros, apply delimitado, rollback, migração/restart/recovery; suíte conjunta
  **6/6**.
- [S04.3 — watcher e hydration em background](../evidence/BACKEND_S04_3.md):
  filesystem real, worker, coalescência, segurança, restart e cache-first;
  suíte conjunta **9/9** e regressão afetada **61/61**.

## Done When

Cumprido. As três sub-stories estão comprovadas e os adapters estão prontos
para S05.

## S04.1 — Leitura em lote, paginação e estado local

**Objetivo/contexto:** servir Home, biblioteca/coleção e filtros usando o catálogo M02/M03 e o contrato S03.
**Escopo:** queries em lote, índices e cursor estável; joins de metadata/progresso/favoritos/memberships e sources permitidas; cache local e acesso a subscription existente. Providers de dados futuros usam a mesma interface de leitura, sem antecipar comandos.
**Fora de escopo:** FTS/watcher, produzir histórico de playback ou assinar bibliotecas.
**Aceite:** sem N+1, um resultado por Content, sem fundir episódios; cursor não duplica nem omite itens em snapshot estável; offline preserva dados; payloads limitados.
**Validação:** corpus pequeno/grande, planos e contagem de queries, múltiplas origens/sources, acesso negado, migração fresh/upgrade e rollback.
**Done when:** cumprido. Projeção, leitura em lote, escopo, cursor, rollback,
restart, índices e corpus de 10.000 Contents foram comprovados antes de S04.2.

## S04.2 — Busca FTS5 incremental

**Objetivo/contexto:** buscar o catálogo completo conforme semântica S03, independente de cards montados.
**Escopo:** SQLite FTS5 e atualizações transacionais para título/original/descrição/série/episódio/nomes de bibliotecas/coleções; filtros e cursor; invalidação delimitada por identidade e relações. Definir recuperação/rebuild explícito de índice danificado sem torná-lo requisito de todo startup.
**Fora de escopo:** busca remota, watcher, seleção de source e rebuild periódico sem necessidade.
**Aceite:** títulos iguais com IDs diferentes permanecem distintos; memberships não multiplicam resultados; item alterado atualiza apenas entradas afetadas, incluindo renomeação de origem; restart não reconstrói FTS intacto.
**Validação:** termos vazios/acentos/pontuação/expressões hostis conforme contrato; rollback, indexação interrompida, rename/delete e busca de Content fora da janela virtual.
**Done when:** cumprido. Consistência, incrementalidade por ID, filtros,
paginação, rollback, upgrade/restart e recovery explícito foram comprovados
antes de S04.3.

## S04.3 — Watcher, background e hydration

**Objetivo/contexto:** refletir alterações externas autorizadas em índice/queries/UI sem bloquear startup.
**Escopo:** watcher limitado às pastas de biblioteca, coalescência de eventos e processamento idempotente de add/change/rename/delete; parsing/hashing/probing fora da thread de UI, com fronteiras aprovadas; invalidação após commit, cache/imagens dimensionadas e hydration progressiva.
**Fora de escopo:** varrer todo disco, seguir paths fora da raiz autorizada, scheduler torrent e serviços globais.
**Aceite:** um arquivo alterado não força rebuild global; rajada/retry não duplica Content; arquivo incompleto retorna pendência recuperável; erro mantém último estado consistente. Home mostra cache antes de scan/metadata/health e hydration não troca identidade/foco.
**Validação:** pasta temporária, arquivo real add/change/rename/delete, symlink/path fora da raiz, eventos repetidos, reinício durante indexação e threads/processos; registrar itens reprocessados e tempos.
**Done when:** cumprido. Watcher, coalescência, worker, segurança, mapping,
restart, erro recuperável e hydration cache-first foram demonstrados com disco
real, permitindo S05.
