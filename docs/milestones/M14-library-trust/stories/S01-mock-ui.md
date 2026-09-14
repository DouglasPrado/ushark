# S01 — UI mockada — M14

Status: implementada e validada no frontend.

## Objetivo

Tornar inspecionável: Cliente verifica assinatura e lembra a identidade aceita; autor pode assinar pacote.

## Contexto e dependências

S00 concluída; execução frontend autorizada. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Construir as superfícies painel de confiança no preview; identidade do autor; confirmação de chave alterada com boundary substituível: LibraryTrust: verificar payload canônico/hash/assinatura, consultar/aceitar pin explícito, assinar com chave em secure storage; resultado não confunde autenticidade com direitos. Fixtures selecionáveis para não assinado; assinatura válida; inválida; hash divergente; primeira confiança; chave alterada; storage indisponível; fluxo principal completo em memória.

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
