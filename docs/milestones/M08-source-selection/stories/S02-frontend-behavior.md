# S02 — Comportamento frontend — M08

Status: frontend concluído; ../evidence/VALIDATION.md. UX READY_FOR_REVIEW/PENDING.

## Objetivo

Completar interações de M08 antes da revisão humana.

## Contexto e dependências

S01 concluída. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Implementar navegação e ações: Detalhes → fontes medindo → comparar → preferência ou override → Play → retirar override; validação, retry, cancelamento, resposta antiga e duplo acionamento; foco preso/restaurado e estados unknown; measuring; ready; degraded; unavailable; error; confiança baixa; fonte local; 4K inviável; múltiplas origens.

## Fora de escopo

Persistência real, integração e aprovação UX automática.

## Critérios de aceite

Cancelar preserva dados confirmados; retry não duplica operação; respostas antigas não sobrescrevem contexto novo; teclado/gamepad alcançam ações essenciais e retorno previsível.

## Validação

Testes relevantes de interação e roteiro UX; simular os efeitos observáveis destes casos: Fixtures determinísticas de ranking incluindo menor tamanho, qualidade máxima inviável e fonte local; ranking <10ms sem probes; confirmar escolha com player e cancelar preflight ao sair sem flicker. Não atribuir prova de runtime aos mocks.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
