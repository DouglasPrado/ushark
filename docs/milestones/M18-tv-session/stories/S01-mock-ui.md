# S01 — UI mockada — M18

Status: implementada e validada no frontend.

## Objetivo

Tornar inspecionável: TV abre app, controla player, desconecta/reconecta e sai corretamente.

## Contexto e dependências

S00 concluída; execução frontend autorizada. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Construir as superfícies orientação Sunshine; sessão fullscreen; Home/Filmes/Séries somente de consumo; player/overlay; política de desconexão com boundary substituível. Em TV, ocultar cadastro, importação, bibliotecas, downloads, edição, gestão de fontes, diagnóstico e cenários; preservar busca, favoritos, Play, transporte, áudio e legendas. TvSession: sinal de conexão verificável, política pause/continue, handoff de foco entre UI/MPV, input hotplug e shutdown limitado; versões suportadas e origem do sinal explícitas. Fixtures selecionáveis para iniciando; foco no app; player ativo; controle desconectado; sessão perdida; pausado/continuando; reconectando; encerrando; fluxo principal completo em memória.

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
