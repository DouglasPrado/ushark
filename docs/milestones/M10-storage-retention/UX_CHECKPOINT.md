# Checkpoint UX — M10

## Status

READY_FOR_REVIEW. Decisão: PENDING. Revisão humana adiada por instrução explícita até fim M01–M22. evidence/VALIDATION.md registra frontend; nenhum aceite novo.

## Pré-condições

S00–S02 implementadas com evidências; só então READY_FOR_REVIEW.

## Jornada para testar

Configurações → espaço e estimativa → revisar protegidos → limpar elegíveis → promover para Keep → conferir uso.

1. Percorrer o caminho principal e verificar o resultado: Usuário inspeciona uso/liberação estimada, aplica política e promove cache para Keep sem redownload.
2. Exercitar estados: calculando; vazio; sem elegíveis; protegido; ativo; disco cheio; cache corrompido; movendo; permissão negada.
3. Voltar/cancelar/repetir e conferir foco, contexto e ausência de mutação não confirmada.
4. Usar fixtures determinísticas, teclado/gamepad e superfícies 1080p/1440p/4K; conferir copy, hierarquia, legibilidade e recuperação.
5. Registrar ambiente, versões, corpus, evidências e limitações; separar controle sintético e hardware real.

## O que está mockado

StoragePolicy: consultar uso/elegibilidade, estimar limpeza, aplicar plano revalidado, promover/demover retenção, mudar pasta; lease de ativo e referências; bytes estimados distintos de liberados.

Todos os efeitos de runtime/rede/disco são simulados em memória. Não afirmar persistência/reprodução/publicação real. A aprovação libera apenas o avanço frontend conforme GOAL, não encerra o milestone.

## Evidências e decisão

PENDENTES. Registrar decisão humana com contexto e evidência; não inferir aprovação pelo silêncio. Alterações de UX exigidas na integração voltam à revisão correspondente. Este roteiro não autoriza execução nem fecha S08.

## Mudanças solicitadas

Nenhuma registrada; isso não equivale a aprovação.

## Revisão final consolidada

READY_FOR_REVIEW / decisão PENDING. A revisão intermediária foi adiada por instrução explícita, não aprovada. Usar o [roteiro único](../../execution/FRONTEND_REVIEW.md); resultados automatizados e inspeções não substituem sua decisão.
