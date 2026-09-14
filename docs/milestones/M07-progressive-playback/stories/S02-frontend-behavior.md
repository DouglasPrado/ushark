# S02 — Comportamento frontend — M07

Status: frontend concluído; ../evidence/VALIDATION.md. UX READY_FOR_REVIEW/PENDING.

## Objetivo

Completar interações de M07 antes da revisão humana.

## Contexto e dependências

S01 concluída. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Implementar navegação e ações: Detalhes → Play parcial → buffering → primeiro frame → seek fora do cache → retomar → sair; validação, retry, cancelamento, resposta antiga e duplo acionamento; foco preso/restaurado e estados metadata incompleta; buffer inicial; pronto parcial; rebuffering; seeks sucessivos; rede perdida; disco cheio; cancelado.

## Fora de escopo

Persistência real, integração e aprovação UX automática.

## Critérios de aceite

Cancelar preserva dados confirmados; retry não duplica operação; respostas antigas não sobrescrevem contexto novo; teclado/gamepad alcançam ações essenciais e retorno previsível.

## Validação

Testes relevantes de interação e roteiro UX; simular os efeitos observáveis destes casos: Filme e episódio de pack incompletos tocam; seek fora do cache e três seeks rápidos reproduzem a última posição; medir primeiro frame 1–5s/seek 1–3s em swarm controlado; inspecionar prioridade e limites RAM/disco. Não atribuir prova de runtime aos mocks.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
