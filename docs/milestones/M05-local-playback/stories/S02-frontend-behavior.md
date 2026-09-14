# S02 — Comportamento frontend — M05

Status: frontend concluído; evidências em ../evidence/VALIDATION.md. UX READY_FOR_REVIEW/PENDING.

## Objetivo

Completar interações de M05 antes da revisão humana.

## Contexto e dependências

S01 concluída. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Implementar navegação e ações: Detalhes → Play → preparar → primeiro frame → controles/tracks → sair → retomar ou recomeçar; validação, retry, cancelamento, resposta antiga e duplo acionamento; foco preso/restaurado e estados sem arquivo; preparando; tocando; pausado; seeking; encerrando; arquivo removido; codec não suportado; MPV falhou; sem legendas.

## Fora de escopo

Persistência real, integração e aprovação UX automática.

## Critérios de aceite

Cancelar preserva dados confirmados; retry não duplica operação; respostas antigas não sobrescrevem contexto novo; teclado/gamepad alcançam ações essenciais e retorno previsível.

## Validação

Testes relevantes de interação e roteiro UX; simular os efeitos observáveis destes casos: Reproduzir fixture local autorizada offline, trocar áudio/legenda sem reiniciar source, sair/reabrir e verificar posição; matar MPV e comprovar UI viva e progresso dentro do budget definido. Não atribuir prova de runtime aos mocks.

## Evidências

Executado no frontend mockado. A toolbar inferior usa ícones acessíveis, permanece em linha única, desaparece após quatro segundos em reprodução e reaparece por input; pausado e seleção de faixas preservam o chrome. A superfície comum oculta ferramentas de revisão, disponíveis somente com `?review=1`. Evidências e limites: [VALIDATION](../evidence/VALIDATION.md).

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
