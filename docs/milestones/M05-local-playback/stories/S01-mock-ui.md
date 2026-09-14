# S01 — UI mockada — M05

Status: frontend implementado. Player.tsx e MockPlayerPreview; pnpm typecheck passou em 2026-09-13. Inspeção da jornada e ajustes visuais continuam em S02.

## Objetivo

Tornar inspecionável: Arquivo já disponível toca no MPV, aceita controles e retoma da posição salva.

## Contexto e dependências

S00 concluída; execução frontend autorizada. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Construir as superfícies /player/:contentId; overlay de áudio/legendas; detalhes e Continuar com boundary substituível: PlayerService: abrir(contentId, sourceId, posição), pausar, buscar, selecionar track, encerrar; snapshot com sessionId, posição, duração e tracks; eventos de readiness/primeiro frame distintos do processo iniciado. Fixtures selecionáveis para sem arquivo; preparando; tocando; pausado; seeking; encerrando; arquivo removido; codec não suportado; MPV falhou; sem legendas; fluxo principal completo em memória.

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
