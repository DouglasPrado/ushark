# S06 — Regressões de jornada

Status: DEFERRED. Preparar este arquivo não executa a story.

## Objetivo

Consolidar cobertura dos riscos de busca, foco e índice.

## Contexto e dependências

Ler [M04](../README.md). S05 concluída e checkpoint funcional aprovado.

## Escopo

Reaproveitar testes existentes; cobrir FTS/cursor/filtros, acessos, memberships homônimas, múltiplas sources, episodes distintos, watcher duplicado/fora de ordem, rename/delete, interrupção e restart. E2E Home offline→busca→detalhes→voltar com virtualização/hydration e cache local. Verificar migração fresh/upgrade e rollback para o schema introduzido.

## Fora de escopo

Testes espelhando implementação, suites de playback/sync futuros e repetição sem risco novo.

## Critérios de aceite

Suíte detecta resultado duplicado/omitido, resposta antiga, perda de foco, rebuild indevido e estado incoerente após falha. Fixtures são isoladas e reproduzíveis.

## Validação

Suítes relevantes e gates existentes; registrar comandos, resultados, ambiente e limitações.

## Evidências

PENDENTES. Registrar arquivos, comandos/resultados, ambiente e limitações ao executar esta story.

## Done When

Regressões materiais cobertas sem confundir simulação com execução real.
