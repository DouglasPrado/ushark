# Checkpoint UX — M05

## Status

APPROVED. Aprovação consolidada do usuário em 2026-09-14: “O frontend foi aprovado ja”. [Evidências frontend](evidence/VALIDATION.md).

## Pré-condições

S00–S02 implementadas com evidências; só então READY_FOR_REVIEW.

## Jornada para testar

Detalhes → Play → preparar → primeiro frame → controles/tracks → sair → retomar ou recomeçar.

1. Percorrer o caminho principal e verificar o resultado: Arquivo sintético abre no player simulado, aceita controles e retoma da posição salva.
2. Exercitar estados: sem arquivo; preparando; tocando; pausado; seeking; encerrando; arquivo removido; codec não suportado; MPV falhou; sem legendas.
3. Voltar/cancelar/repetir e conferir foco, contexto e ausência de mutação não confirmada.
4. Usar fixtures determinísticas, teclado/gamepad e superfícies 1080p/1440p/4K; conferir copy, hierarquia, legibilidade e recuperação.
5. Registrar ambiente, versões, corpus, evidências e limitações; separar controle sintético e hardware real.

## O que está mockado

PlayerService: abrir(contentId, sourceId, posição), pausar, buscar, selecionar track, encerrar; snapshot com sessionId, posição, duração e tracks; eventos de readiness/primeiro frame distintos do processo iniciado.

Todos os efeitos de runtime/rede/disco são simulados em memória. Não afirmar persistência/reprodução/publicação real. A aprovação libera apenas o avanço frontend conforme GOAL, não encerra o milestone.

## Evidências e decisão

PENDENTES. Registrar decisão humana com contexto e evidência; não inferir aprovação pelo silêncio. Alterações de UX exigidas na integração voltam à revisão correspondente. Este roteiro não autoriza execução nem fecha S08.

## Mudanças solicitadas

Durante a revisão, o usuário solicitou que a exibição se aproximasse das plataformas de streaming: toolbar sutil e transparente no rodapé, desaparecimento por inatividade, botões por ícones sem textos visuais e controles alinhados ao tempo/posição. Implementado e automatizado; o ajuste está coberto pelo aceite consolidado de 2026-09-14.

## Revisão final consolidada

APPROVED na revisão consolidada de 2026-09-14; [roteiro e evidência do aceite](../../execution/FRONTEND_REVIEW.md). O aceite cobre UX mockada, não integração funcional ou hardware físico.
