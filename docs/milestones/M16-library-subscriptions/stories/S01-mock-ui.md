# S01 — UI mockada — M16

Status: implementada e validada no frontend.

## Objetivo

Tornar inspecionável: Versão nova aplica atomicamente; falha mantém versão anterior e dados pessoais.

## Contexto e dependências

S00 concluída; execução frontend autorizada. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Construir as superfícies adicionar biblioteca; detalhes da subscription; diff/rollback; confirmação de unsubscribe com boundary substituível: SubscriptionSync: preview/instalar/check/pausar/aplicar/rollback/unsubscribe; versão/hash/identity e operação idempotente; atomic swap mantém snapshot anterior; GC por referências. Fixtures selecionáveis para preview; instalada; checking; update disponível; staging; verifying; applying; atualizada; offline; erro; rollback; fluxo principal completo em memória.

## Fora de escopo

Rede, filesystem, persistência, processos/serviços reais e release.

## Critérios de aceite

Jornada principal navegável; todos estados do README reproduzíveis; metadata desconhecida não inventada; mocks explicitamente separados de adapters reais.

## Validação

Inspeção visual e checks frontend existentes pertinentes; comparar estados em 1080p/1440p/4K, registrar ambiente e limitações.

## Evidências

Evidências registradas no UPDATE e evidence/VALIDATION.md; somente frontend mockado.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
