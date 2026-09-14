# Checkpoint UX — M09

## Status

READY_FOR_REVIEW. Decisão: PENDING. Revisão adiada por instrução explícita até fim M01–M22. Evidências em evidence/VALIDATION.md. Sem aceite humano novo.

## Pré-condições

S00–S02 implementadas com evidências; só então READY_FOR_REVIEW.

## Jornada para testar

Detalhes → baixar e escolher destino → fila → pausar → reabrir → retomar → cancelar preservando catálogo.

1. Percorrer o caminho principal e verificar o resultado: Download sobrevive ao restart e pode ser acompanhado e controlado.
2. Exercitar estados: fila vazia; queued; downloading; paused; complete; sem espaço; resume inválido; falha; cancelado.
3. Voltar/cancelar/repetir e conferir foco, contexto e ausência de mutação não confirmada.
4. Usar fixtures determinísticas, teclado/gamepad e superfícies 1080p/1440p/4K; conferir copy, hierarquia, legibilidade e recuperação.
5. Registrar ambiente, versões, corpus, evidências e limitações; separar controle sintético e hardware real.

## O que está mockado

DownloadService: enfileirar(sourceId, selector, destino), pausar, retomar, cancelar, removerDados confirmado; snapshot com bytes totais/concluídos, velocidade, peers, prioridade e estado; resume versionado.

Todos os efeitos de runtime/rede/disco são simulados em memória. Não afirmar persistência/reprodução/publicação real. A aprovação libera apenas o avanço frontend conforme GOAL, não encerra o milestone.

## Evidências e decisão

PENDENTES. Registrar decisão humana com contexto e evidência; não inferir aprovação pelo silêncio. Alterações de UX exigidas na integração voltam à revisão correspondente. Este roteiro não autoriza execução nem fecha S08.

## Mudanças solicitadas

Nenhuma registrada; isso não equivale a aprovação.

## Revisão final consolidada

READY_FOR_REVIEW / decisão PENDING. A revisão intermediária foi adiada por instrução explícita, não aprovada. Usar o [roteiro único](../../execution/FRONTEND_REVIEW.md); resultados automatizados e inspeções não substituem sua decisão.
