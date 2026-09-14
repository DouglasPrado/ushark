# S01 — UI mockada — M21

Status: implementada e validada no frontend.

## Objetivo

Tornar inspecionável: Usuário restaura backup consistente e volta a navegar/retomar sem perda silenciosa.

## Contexto e dependências

S00 concluída; execução frontend autorizada. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Construir as superfícies recovery no startup; backup/restore em configurações; progresso e falha recuperável com boundary substituível: Recovery: criar snapshot consistente DB/WAL/manifests/resume/config e chaves conforme storage, validar backup, stage/restore atômico, supervisor com tentativas/timeouts; original preservado até commit. Fixtures selecionáveis para backup criando; consistente; inválido; incompatível; DB ocupado; sem espaço; restaurando; falha parcial; recuperado; fluxo principal completo em memória.

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
