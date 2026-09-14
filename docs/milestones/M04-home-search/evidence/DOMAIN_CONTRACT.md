# Evidência S03 — contrato de leitura e indexação

Data: 2026-09-14.

## Entrega

`packages/types/src/discovery.ts` preserva o boundary frontend aprovado e
adiciona protocolo/índice v1 para Home, busca, escopo, facets, paginação,
cancelamento, invalidação e aplicação Core-only. Os budgets são exatos e
compartilhados. As decisões D26–D29 estão registradas em
`docs/decisions/M04-D26-D29-discovery-index-contract.md`.

## UI → query/evento → falhas

| Superfície/estado                      | Query ou evento                              | Resultado e falhas explícitas                                                   |
| -------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------- |
| Home/hero/seções                       | `readHome(libraryId, sectionLimit)`          | snapshot local em lote; seção vazia omitida; `INDEX_UNAVAILABLE` permite retry  |
| Busca e filtros                        | `search(query, filtros, cursor, requestId)`  | FTS independente dos cards; cancelamento; cursor obsoleto recuperável           |
| Biblioteca/coleção/subscription        | `readScope(scopeId, cursor)`                 | um Content por ID; origem homônima não funde; escopo ausente/não autorizado     |
| Alteração de catálogo/progresso/origem | `DiscoveryInvalidationEvent`                 | IDs/escopos delimitados após commit; UI preserva snapshot anterior em erro      |
| Watcher add/change/rename/remove       | `apply(upserts, removals, reason, mutation)` | lote idempotente; path fica no Core; rollback integral                          |
| Corrupção/interrupção                  | recovery explícito                           | `INDEX_CORRUPT` ou `INDEX_UNAVAILABLE`; nunca rebuild silencioso a cada startup |

## Invariantes

- `contentId`, e não título, consolida resultados.
- Série e episódios diferentes nunca são fundidos.
- Membership/source indisponível não apaga Content indexado.
- Renderer não recebe SQL, paths ou payloads de provider.
- Cursor é opaco, limitado e preso à revisão.
- Sources e memberships retornadas já passaram pelo escopo local autorizado.
- Home inicial não depende de TMDB, tracker, DHT, health ou watcher terminar.
- Atualização de um item invalida apenas o documento e escopos relacionados.

## Validação

`pnpm exec prettier --check packages/types/src/discovery.ts
docs/decisions/M04-D26-D29-discovery-index-contract.md
docs/milestones/M04-home-search/evidence/DOMAIN_CONTRACT.md`,
`pnpm lint` e `pnpm typecheck`.

S03 não cria schema, IPC ou watcher. Essas responsabilidades seguem,
respectivamente, para S04.1–S04.3 e S05.
