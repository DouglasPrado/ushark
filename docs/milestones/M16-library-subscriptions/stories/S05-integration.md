# S05 — Integração da jornada — M16

Status: DONE em 2026-09-14.

## Objetivo

Provar a jornada real: Link/código → preview e confiança → assinar → abrir offline → verificar update/diff → aplicar ou retry → unsubscribe.

## Contexto e dependências

S04 concluída; dependências reais disponíveis. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Trocar adapters mockados pelos reais mantendo a UX. Demonstrar Versão nova aplica atomicamente; falha mantém versão anterior e dados pessoais. Exercitar todos os estados aplicáveis, incluindo recuperação e dados preservados.

## Fora de escopo

Usar mocks acidentais no caminho principal, alterar UX sem revisão e declarar funcionamento por build verde.

## Critérios de aceite

Update e crash em cada fase preservam uma versão válida; progresso/favoritos/overrides/downloads sobrevivem update/unsubscribe/delete remoto; downgrade e mesma versão com outro hash bloqueiam; contexto/foco/playback preservados; snapshot abre sem Registry. Aplicam-se também os critérios comuns acima.

## Validação

Crash em stage/verify/commit preserva uma versão válida; update/unsubscribe mantém progresso/favoritos/overrides/downloads; mesmo número com outro hash e downgrade bloqueados; item focado removido restaura contexto. Registrar observação real no checkpoint funcional e aguardar decisão humana antes de S06.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
