# S03 — Contrato de domínio — M07

Status: DONE em 2026-09-14.

## Objetivo

Derivar o contrato mínimo de M07 da experiência aprovada.

## Contexto e dependências

UX M01–M22 aprovada; execução autorizada; dependências de integração M03, M05, M06 disponíveis conforme ondas do plano. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

StreamSession: abrir(sourceId, selector), buscar(sessionId, posição, geração), cancelar; readiness e buffer em segundos, bytes e bitrate com unidades; última geração vence; scheduler protege ativo. Definir operações, DTOs, ownership, eventos/snapshots, unidades, limites, erros, transações e invariantes; fechar decisões: D09/D13/D18: budgets calibrados em S03; arquivo parcial primeiro, Range somente com necessidade demonstrada.

## Fora de escopo

Código/adapters e schema total do projeto; promover exemplos a defaults sem decisão.

## Critérios de aceite

Cada ação da UX tem contrato de sucesso/falha/cancelamento; identidade e dados pessoais preservados; limites verificáveis; decisão pendente que afete integração resolvida antes de S04.

## Validação

Revisão de contratos com fixtures UX e contra cenários reais planejados: Filme e episódio de pack incompletos tocam; seek fora do cache e três seeks rápidos reproduzem a última posição; medir primeiro frame 1–5s/seek 1–3s em swarm controlado; inspecionar prioridade e limites RAM/disco.

## Evidências

[Contrato e validação](../evidence/DOMAIN_CONTRACT.md) e
[decisões D09/D13/D18](../../../decisions/M07-D09-D13-D18-streaming-contract.md).

## Done When

Cumprido. S04.1 é a próxima sub-story; nenhuma capacidade runtime foi inferida
do contrato.
