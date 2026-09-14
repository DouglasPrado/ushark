# S02 — Comportamento frontend — M19

Status: implementada e validada no frontend.

## Objetivo

Completar interações de M19 antes da revisão humana.

## Contexto e dependências

S01 concluída. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Implementar navegação e ações: Fonte degrada → informar alternativa → confirmar ou auto-switch permitido → preparar → trocar → retomar posição; validação, retry, cancelamento, resposta antiga e duplo acionamento; foco preso/restaurado e estados degradado; sem alternativa; preparando; edição incompatível; cancelado; trocando; cooldown; falha.

## Fora de escopo

Persistência real, integração e aprovação UX automática.

## Critérios de aceite

Cancelar preserva dados confirmados; retry não duplica operação; respostas antigas não sobrescrevem contexto novo; teclado/gamepad alcançam ações essenciais e retorno previsível.

## Validação

Testes relevantes de interação e roteiro UX; simular os efeitos observáveis destes casos: Retirar peers de source controlada; auto-switch off não troca; outra edição não troca automaticamente; seek concorrente usa posição correta; cooldown impede loop; expiração reduz peso do histórico. Não atribuir prova de runtime aos mocks.

## Evidências

Evidências registradas no UPDATE e evidence/VALIDATION.md; somente frontend mockado.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
