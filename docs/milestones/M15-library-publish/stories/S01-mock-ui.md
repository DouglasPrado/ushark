# S01 — UI mockada — M15

Status: implementada e validada no frontend.

## Objetivo

Tornar inspecionável: Autor publica versão imutável, recebe link/código e revisa mudanças da próxima publicação.

## Contexto e dependências

S00 concluída; execução frontend autorizada. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Construir as superfícies publicar biblioteca; diff de versões; link/código; retirada com boundary substituível: RegistryPublisher: autenticar, stage blobs, publicar(snapshot/hash/expectedVersion), resolver link/código, retirar; auth de editor separada de assinatura; commit só após blobs íntegros. Fixtures selecionáveis para não autenticado; sem permissão; upload em andamento; quota; conflito de versão; falha parcial; publicado; retirado; fluxo principal completo em memória.

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
