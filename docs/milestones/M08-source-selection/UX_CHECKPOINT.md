# Checkpoint UX — M08

## Status

READY_FOR_REVIEW. Decisão: PENDING. Revisão humana adiada até fim M01–M22 por instrução explícita. Evidências em evidence/VALIDATION.md. Sem aceite novo.

## Pré-condições

S00–S02 implementadas com evidências; só então READY_FOR_REVIEW.

## Jornada para testar

Detalhes → fontes medindo → comparar → preferência ou override → Play → retirar override.

1. Percorrer o caminho principal e verificar o resultado: Details mostra medição progressiva e a escolha automática respeita preferências e limites reais.
2. Exercitar estados: unknown; measuring; ready; degraded; unavailable; error; confiança baixa; fonte local; 4K inviável; múltiplas origens.
3. Voltar/cancelar/repetir e conferir foco, contexto e ausência de mutação não confirmada.
4. Usar fixtures determinísticas, teclado/gamepad e superfícies 1080p/1440p/4K; conferir copy, hierarquia, legibilidade e recuperação.
5. Registrar ambiente, versões, corpus, evidências e limitações; separar controle sintético e hardware real.

## O que está mockado

SourceSelection: observar/cancelar preflight, rankear métricas, definir/remover override; Health/confidence/ratio/startup e reasonCodes separados; unidades e budget explícitos.

Todos os efeitos de runtime/rede/disco são simulados em memória. Não afirmar persistência/reprodução/publicação real. A aprovação libera apenas o avanço frontend conforme GOAL, não encerra o milestone.

## Evidências e decisão

PENDENTES. Registrar decisão humana com contexto e evidência; não inferir aprovação pelo silêncio. Alterações de UX exigidas na integração voltam à revisão correspondente. Este roteiro não autoriza execução nem fecha S08.

## Mudanças solicitadas

Nenhuma registrada; isso não equivale a aprovação.

## Revisão final consolidada

READY_FOR_REVIEW / decisão PENDING. A revisão intermediária foi adiada por instrução explícita, não aprovada. Usar o [roteiro único](../../execution/FRONTEND_REVIEW.md); resultados automatizados e inspeções não substituem sua decisão.
