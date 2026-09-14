# S01 — UI mockada — M17

Status: implementada e validada no frontend.

## Objetivo

Tornar inspecionável: Fork possui novo ID, mantém apresentação e reutiliza conteúdos sem seguir updates da origem.

## Contexto e dependências

S00 concluída; execução frontend autorizada. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Construir as superfícies ação Duplicar; editor pessoal; coleções pessoais com boundary substituível: LibraryFork: duplicar(originLibraryId, version, novo nome, operationId), retornar novo libraryId; copiar apresentação/memberships por referência e provenance opcional; não criar subscription na cópia. Fixtures selecionáveis para copiando; cancelado; falhou; cópia pronta; origem indisponível; asset compartilhado; fluxo principal completo em memória.

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
