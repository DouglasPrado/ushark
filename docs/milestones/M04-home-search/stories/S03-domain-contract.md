# S03 — Contrato de leitura e indexação

Status: DONE em 2026-09-14.

## Objetivo

Formalizar apenas as consultas e eventos exigidos pela UX aprovada.

## Contexto e dependências

Ler [M04](../README.md). UX M01–M22 aprovada e catálogo M02/M03 integrado; A06 §§54–56/106–114.

## Escopo

Definir DTOs de Home/seção/card, resultado por Content, memberships, sources permitidas, leitura de biblioteca/coleção, progresso e filtros. Especificar ordenação estável/cursor, semântica de busca e nomes de origem, autorização local, erros/cancelamento, atualização e invalidação incremental. Delimitar watcher e trabalho fora da thread de UI, transações e recuperação de índice. Definir providers de leitura para futuros M05/M12/M13/M16 sem implementar seus comandos. Consolidar protocolo e budgets do README.

## Fora de escopo

Schema completo de futuros milestones, sync, seleção de source, implementação e RPC sem consumidor.

## Critérios de aceite

Uma busca independe da renderização; IDs diferentes não se fundem; origins indisponíveis não apagam Content. Contrato evita N+1 e restringe sources/memberships conforme permissão. Adição/alteração/remoção de item e renomeação de biblioteca/coleção têm invalidação delimitada.

## Validação

Tabela UI→query/evento→erros; revisão com fixtures, ordenação concorrente, escopo de acesso e limites de payload.

## Evidências

[Contrato e matriz UI→query/evento](../evidence/DOMAIN_CONTRACT.md) e
[decisões D26–D29](../../../decisions/M04-D26-D29-discovery-index-contract.md).
Protocolo/índice v1, identidade, FTS, acesso, cursor, budgets, invalidação,
watcher e providers futuros foram delimitados. Formatação, lint e typecheck
passaram.

## Done When

Cumprido. Contrato suficiente para adapters reais e sub-stories S04.
