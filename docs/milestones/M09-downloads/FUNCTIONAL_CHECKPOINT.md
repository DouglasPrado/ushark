# Checkpoint funcional — M09

## Status

READY_FOR_REVIEW. Decisão: PENDING. S03–S05 concluídas; nenhuma aprovação
funcional foi inferida.

## Pré-condições

S03–S05 integradas após UX M01–M22 e dependências reais; só então READY_FOR_REVIEW.

## Jornada para testar

Detalhes → baixar e escolher destino → fila → pausar → reabrir → retomar → cancelar preservando catálogo.

1. Percorrer o caminho principal e verificar o resultado: Download sobrevive ao restart e pode ser acompanhado e controlado.
2. Exercitar estados: fila vazia; queued; downloading; paused; complete; sem espaço; resume inválido; falha; cancelado.
3. Voltar/cancelar/repetir e conferir foco, contexto e ausência de mutação não confirmada.
4. Pausar/restart/retomar sem recheck global desnecessário; cancelar mantém Content; apagar dados exige outra confirmação; download concorrente cede ao playback; disco cheio pausa escrita.
5. Registrar ambiente, versões, corpus, evidências e limitações; separar controle sintético e hardware real.

## Integrações reais e verificações

DownloadService: enfileirar(sourceId, selector, destino), pausar, retomar, cancelar, removerDados confirmado; snapshot com bytes totais/concluídos, velocidade, peers, prioridade e estado; resume versionado.

Verificar ausência de mock no caminho principal, persistência pertinente após restart, permissões, erro/sucesso refletidos na UI e dependências M06, M07. Testes verdes não substituem demonstração da jornada real.

## Evidências e decisão

[Contrato](evidence/DOMAIN_CONTRACT.md),
[fila](evidence/BACKEND_S04_1.md), [resume](evidence/BACKEND_S04_2.md),
[recovery](evidence/BACKEND_S04_3.md) e
[integração](evidence/INTEGRATION_VALIDATION.md). Decisão humana PENDING.

## Mudanças solicitadas

Nenhuma registrada; isso não equivale a aprovação.

Nenhuma registrada. Windows/TV/hardware, disco cheio físico e swarm com
conclusão completa permanecem pendentes; isso não equivale a aprovação.
