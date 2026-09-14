# S01 — UI mockada — M12

Status: implementada e validada no frontend.

## Objetivo

Tornar inspecionável: Draft persistido com identidade, coleções/seções e preview fiel.

## Contexto e dependências

S00 concluída; execução frontend autorizada. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Construir as superfícies /libraries/new; editor /libraries/:libraryId/edit; preview como assinante com boundary substituível: LibraryDraft: ler/salvar draft com revisão, editar identidade, memberships, Collection e Section separados; apresentação escopada ao libraryId; preview usa mesmo modelo de leitura do assinante. Fixtures selecionáveis para draft vazio; inválido; editando; salvando; salvo; alterações não salvas; imagem ausente; preview vazio; fluxo principal completo em memória.

## Fora de escopo

Rede, filesystem, persistência, processos/serviços reais e release.

## Critérios de aceite

Jornada principal navegável; todos estados do README reproduzíveis; metadata desconhecida não inventada; mocks explicitamente separados de adapters reais.

## Validação

Inspeção visual e checks frontend existentes pertinentes; comparar estados em 1080p/1440p/4K, registrar ambiente e limitações.

## Evidências

Evidências: [UPDATE](../UPDATE.md) e evidence/VALIDATION.md; apenas frontend mockado.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
