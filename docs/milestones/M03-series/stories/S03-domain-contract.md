# S03 — Contrato de série, episódio e selector

Status: DONE em 2026-09-14.

## Objetivo

Formalizar o domínio mínimo exigido pela UX aprovada, preservando identidade e relações por episódio.

## Contexto e dependências

Ler [M03](../README.md) e apenas as fontes aplicáveis: UX M01–M22 aprovada, M02/M06 integrados, A01 §§20–23, A02 §§12–17/88–90 e A06 §§6–10/18–20/117–120.

## Escopo

Definir Series, Episode, season number, episode number, Content, Source, SourceFile e ContentSourceSelector separados. Especificar comandos/queries, DTOs, erros, transações, idempotência e invariantes de identidade. Formalizar inferência para `SxxExx`, `1x01` e `Season 01 Episode 01`; especiais; correção manual; selectors `episode`, `filename` e `manual`; associação opcional de legenda; colisões e metadata ausente. Definir paginação/índices e limites de payload para dezenas de milhares de episódios.

## Fora de escopo

Implementação, algoritmo de playback, prefetch, heurística automática de episódios duplos e schema completo de milestones futuros.

## Critérios de aceite

Cada operação da UI possui contrato e falhas; identidade de episódio depende da série e do número de temporada/episódio ou provider, nunca de semelhança do arquivo. Uma source pode servir muitos episódios, cada vínculo mantém selector independente, e retry não duplica relações. Ambiguidade retorna estado revisável em vez de escolha silenciosa.

## Validação

Revisão do contrato contra fixtures/UX e tabela de invariantes; casos de colisão, source compartilhada, especiais, legenda e escala; registrar ADR apenas para decisões duráveis realmente necessárias.

## Evidências

Contrato tipado, tabela de invariantes e validações em
[`DOMAIN_CONTRACT.md`](../evidence/DOMAIN_CONTRACT.md). As decisões de identidade,
inferência, selectors, paginação, limites e transação estão no ADR
[`M03-D23-D25`](../../../decisions/M03-D23-D25-series-episode-contract.md).

## Done When

Cumprido. O contrato é suficiente para S04, mantém as decisões rastreáveis e não
expande playback, scheduler, busca global ou curadoria.
