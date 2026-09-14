# S02 — Comportamento frontend — M16

Status: implementada e validada no frontend.

## Objetivo

Completar interações de M16 antes da revisão humana.

## Contexto e dependências

S01 concluída. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Implementar navegação e ações: Link/código → preview e confiança → assinar → abrir offline → verificar update/diff → aplicar ou retry → unsubscribe; validação, retry, cancelamento, resposta antiga e duplo acionamento; foco preso/restaurado e estados preview; instalada; checking; update disponível; staging; verifying; applying; atualizada; offline; erro; rollback.

## Fora de escopo

Persistência real, integração e aprovação UX automática.

## Critérios de aceite

Cancelar preserva dados confirmados; retry não duplica operação; respostas antigas não sobrescrevem contexto novo; teclado/gamepad alcançam ações essenciais e retorno previsível.

## Validação

Testes relevantes de interação e roteiro UX; simular os efeitos observáveis destes casos: Crash em stage/verify/commit preserva uma versão válida; update/unsubscribe mantém progresso/favoritos/overrides/downloads; mesmo número com outro hash e downgrade bloqueados; item focado removido restaura contexto. Não atribuir prova de runtime aos mocks.

## Evidências

Evidências registradas no UPDATE e evidence/VALIDATION.md; somente frontend mockado.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
