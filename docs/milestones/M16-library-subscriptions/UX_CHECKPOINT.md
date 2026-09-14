# Checkpoint UX — M16

## Status

READY_FOR_REVIEW. Decisão: PENDING. Revisão humana adiada por instrução explícita até o fim de M01–M22.

## Pré-condições

S00–S02 implementadas com evidências; só então READY_FOR_REVIEW.

## Jornada para testar

Link/código → preview e confiança → assinar → abrir offline → verificar update/diff → aplicar ou retry → unsubscribe.

1. Percorrer o caminho principal e verificar o resultado: Versão nova aplica atomicamente; falha mantém versão anterior e dados pessoais.
2. Exercitar estados: preview; instalada; checking; update disponível; staging; verifying; applying; atualizada; offline; erro; rollback.
3. Voltar/cancelar/repetir e conferir foco, contexto e ausência de mutação não confirmada.
4. Usar fixtures determinísticas, teclado/gamepad e superfícies 1080p/1440p/4K; conferir copy, hierarquia, legibilidade e recuperação.
5. Registrar ambiente, versões, corpus, evidências e limitações; separar controle sintético e hardware real.

## O que está mockado

SubscriptionSync: preview/instalar/check/pausar/aplicar/rollback/unsubscribe; versão/hash/identity e operação idempotente; atomic swap mantém snapshot anterior; GC por referências.

Todos os efeitos de runtime/rede/disco são simulados em memória. Não afirmar persistência/reprodução/publicação real. A aprovação libera apenas o avanço frontend conforme GOAL, não encerra o milestone.

## Evidências e decisão

Evidências em [UPDATE](UPDATE.md) e [VALIDATION](evidence/VALIDATION.md). Decisão humana pendente; não inferir aprovação pelo silêncio. Alterações de UX exigidas na integração voltam à revisão correspondente. Este roteiro não autoriza execução nem fecha S08.

## Mudanças solicitadas

Nenhuma registrada; isso não equivale a aprovação.

## Revisão final consolidada

READY_FOR_REVIEW / decisão PENDING. A revisão intermediária foi adiada por instrução explícita, não aprovada. Usar o [roteiro único](../../execution/FRONTEND_REVIEW.md); resultados automatizados e inspeções não substituem sua decisão.
