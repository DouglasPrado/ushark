# Checkpoint funcional — M09

## Status

NOT_STARTED. Decisão: PENDING. Roteiro preparado; nenhuma aprovação ou validação executada.

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

PENDENTES. Registrar decisão humana com contexto e evidência; não inferir aprovação pelo silêncio. Alterações de UX exigidas na integração voltam à revisão correspondente. Este roteiro não autoriza execução nem fecha S08.

## Mudanças solicitadas

Nenhuma registrada; isso não equivale a aprovação.

Frontend entregue em simulação; este checkpoint e S03–S08 continuam adiados.
