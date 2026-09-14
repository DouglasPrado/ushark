# S01 — UI mockada — M13

Status: implementada e validada no frontend.

## Objetivo

Tornar inspecionável: .tslib exportado abre em outro perfil local com preview, layout e identidade preservados.

## Contexto e dependências

S00 concluída; execução frontend autorizada. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Construir as superfícies exportação de biblioteca; import .tslib; preview/erros de compatibilidade com boundary substituível: LibraryPackage: serializar snapshot canônico, validar/stage pacote, preview e commit atômico; schema/version/hash, limites e referências; sem mídia/estado pessoal; assinatura presente exige verificação suportada. Fixtures selecionáveis para validando; inválido; incompatível; asset ausente; assinatura não suportada; cancelado; importando; conflito; sucesso; fluxo principal completo em memória.

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
