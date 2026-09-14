# S02 — Comportamento frontend — M09

Status: frontend concluído; ../evidence/VALIDATION.md. UX READY_FOR_REVIEW/PENDING.

## Objetivo

Completar interações de M09 antes da revisão humana.

## Contexto e dependências

S01 concluída. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Implementar navegação e ações: Detalhes → baixar e escolher destino → fila → pausar → reabrir → retomar → cancelar preservando catálogo; validação, retry, cancelamento, resposta antiga e duplo acionamento; foco preso/restaurado e estados fila vazia; queued; downloading; paused; complete; sem espaço; resume inválido; falha; cancelado.

## Fora de escopo

Persistência real, integração e aprovação UX automática.

## Critérios de aceite

Cancelar preserva dados confirmados; retry não duplica operação; respostas antigas não sobrescrevem contexto novo; teclado/gamepad alcançam ações essenciais e retorno previsível.

## Validação

Testes relevantes de interação e roteiro UX; simular os efeitos observáveis destes casos: Pausar/restart/retomar sem recheck global desnecessário; cancelar mantém Content; apagar dados exige outra confirmação; download concorrente cede ao playback; disco cheio pausa escrita. Não atribuir prova de runtime aos mocks.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
