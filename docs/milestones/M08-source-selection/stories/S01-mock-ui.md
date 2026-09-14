# S01 — UI mockada — M08

Status: frontend implementado; SourceChoices/SelectionPreview em Filmes/Home/episódios. Typecheck e ESLint passaram. S02 valida comportamento e integrações frontend.

## Objetivo

Tornar inspecionável: Details mostra medição progressiva e a escolha automática respeita preferências e limites reais.

## Contexto e dependências

S00 concluída; execução frontend autorizada. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Construir as superfícies lista de fontes nos detalhes; preferências de reprodução com boundary substituível: SourceSelection: observar/cancelar preflight, rankear métricas, definir/remover override; Health/confidence/ratio/startup e reasonCodes separados; unidades e budget explícitos. Fixtures selecionáveis para unknown; measuring; ready; degraded; unavailable; error; confiança baixa; fonte local; 4K inviável; múltiplas origens; fluxo principal completo em memória.

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
