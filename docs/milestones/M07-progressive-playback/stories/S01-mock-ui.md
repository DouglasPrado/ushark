# S01 — UI mockada — M07

Status: frontend implementado; Player.tsx + StreamPreview/MockStreamPreview. typecheck passou antes dos ajustes finais S02.

## Objetivo

Tornar inspecionável: Filme e episódio tocam parcialmente; seek descarta trabalho antigo e reconstrói buffer.

## Contexto e dependências

S00 concluída; execução frontend autorizada. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Construir as superfícies overlay do player; timeline; feedback de preparação com boundary substituível: StreamSession: abrir(sourceId, selector), buscar(sessionId, posição, geração), cancelar; readiness e buffer em segundos, bytes e bitrate com unidades; última geração vence; scheduler protege ativo. Fixtures selecionáveis para metadata incompleta; buffer inicial; pronto parcial; rebuffering; seeks sucessivos; rede perdida; disco cheio; cancelado; fluxo principal completo em memória.

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
