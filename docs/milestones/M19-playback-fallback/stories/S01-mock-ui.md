# S01 — UI mockada — M19

Status: implementada e validada no frontend.

## Objetivo

Tornar inspecionável: Fallback compatível retoma posição e histórico ajuda decisões futuras sem depender de servidor.

## Contexto e dependências

S00 concluída; execução frontend autorizada. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Construir as superfícies player; lista de alternativas; preferências auto-switch; histórico local com boundary substituível: PlaybackFallback: avaliar candidato/content/episódio/duração, preparar antes do handoff, trocar com geração/posição; HealthHistory agregado local com decay/TTL/algorithmVersion; override original preservado. Fixtures selecionáveis para degradado; sem alternativa; preparando; edição incompatível; cancelado; trocando; cooldown; falha; fluxo principal completo em memória.

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
