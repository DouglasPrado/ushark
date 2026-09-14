# S01 — UI mockada — M11

Status: frontend implementado; NextEpisode/NextEpisodePreview ligado ao player/catálogo. Typecheck e ESLint passaram.

## Objetivo

Tornar inspecionável: Countdown cancelável e próximo episódio correto, com preflight limitado.

## Contexto e dependências

S00 concluída; execução frontend autorizada. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Construir as superfícies overlay de próximo episódio; preferências autoplay com boundary substituível: NextEpisode: resolver sequência por identidade, preparar com budget, iniciar/cancelar countdown; sessionId e geração evitam início duplicado; estado pessoal separado do pack. Fixtures selecionáveis para autoplay desligado; preparando próximo; countdown; cancelado; episódio ausente; fim de temporada; fim de série; preflight falhou; fluxo principal completo em memória.

## Fora de escopo

Rede, filesystem, persistência, processos/serviços reais e release.

## Critérios de aceite

Jornada principal navegável; todos estados do README reproduzíveis; metadata desconhecida não inventada; mocks explicitamente separados de adapters reais.

## Validação

Inspeção visual e checks frontend existentes pertinentes; comparar estados em 1080p/1440p/4K, registrar ambiente e limitações.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
