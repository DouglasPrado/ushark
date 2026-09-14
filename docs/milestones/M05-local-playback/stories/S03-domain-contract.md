# S03 — Contrato de domínio — M05

Status: DONE em 2026-09-14.

## Objetivo

Derivar o contrato mínimo de M05 da experiência aprovada.

## Contexto e dependências

UX M01–M22 aprovada; execução autorizada; dependências de integração M02 disponíveis conforme ondas do plano. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

PlayerService: abrir(contentId, sourceId, posição), pausar, buscar, selecionar track, encerrar; snapshot com sessionId, posição, duração e tracks; eventos de readiness/primeiro frame distintos do processo iniciado. Definir operações, DTOs, ownership, eventos/snapshots, unidades, limites, erros, transações e invariantes; fechar decisões: D10/D11/D18/D21: budget de progresso, assistido, composição de janelas e allowlist de legenda em S03.

## Fora de escopo

Código/adapters e schema total do projeto; promover exemplos a defaults sem decisão.

## Critérios de aceite

Cada ação da UX tem contrato de sucesso/falha/cancelamento; identidade e dados pessoais preservados; limites verificáveis; decisão pendente que afete integração resolvida antes de S04.

## Validação

Revisão de contratos com fixtures UX e contra cenários reais planejados: Reproduzir fixture local autorizada offline, trocar áudio/legenda sem reiniciar source, sair/reabrir e verificar posição; matar MPV e comprovar UI viva e progresso dentro do budget definido.

## Evidências

[Contrato v1](../evidence/DOMAIN_CONTRACT.md) e
[decisões D10/D11/D18/D21](../../../decisions/M05-D10-D11-D18-D21-playback-contract.md).
DTOs, limites, erros, invariantes, ownership, idempotência, cancelamento e
eventos foram materializados em `@ushark/types/player`.

## Done When

Cumprido. Contrato e decisões estão fechados para iniciar S04.1; nenhuma
capacidade de runtime foi alegada por esta story.
