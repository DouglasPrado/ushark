# S01 — UI mockada — M06

Status: frontend implementado; TorrentImport.tsx + MockTorrentPreview conectados a Filmes/Séries. pnpm typecheck passou. Inspeção e correções continuam em S02.

## Objetivo

Tornar inspecionável: Usuário importa, revisa arquivos e mantém tentativa pendente para retry.

## Contexto e dependências

S00 concluída; execução frontend autorizada. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Construir as superfícies wizard de importação em Filmes/Séries; revisão de arquivos; pendências com boundary substituível: TorrentInspection: inspecionar entrada, cancelar(operationId), salvar pendente, repetir; Source/infoHash separado de ContentSourceSelector; snapshot de arquivos e eventos versionados. Fixtures selecionáveis para entrada inválida; resolvendo; sem peers; timeout; cancelado; pendente; sample/extras; seleção ambígua; daemon indisponível; fluxo principal completo em memória.

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
