# Checkpoint UX — M15

## Status

READY_FOR_REVIEW. Decisão: PENDING. Revisão humana adiada por instrução explícita até o fim de M01–M22.

## Pré-condições

S00–S02 implementadas com evidências; só então READY_FOR_REVIEW.

## Jornada para testar

Draft → diff e preview → publicar explicitamente → upload → versão imutável → copiar link/código → nova versão ou retirada.

1. Percorrer o caminho principal e verificar o resultado: Autor publica versão imutável, recebe link/código e revisa mudanças da próxima publicação.
2. Exercitar estados: não autenticado; sem permissão; upload em andamento; quota; conflito de versão; falha parcial; publicado; retirado.
3. Voltar/cancelar/repetir e conferir foco, contexto e ausência de mutação não confirmada.
4. Usar fixtures determinísticas, teclado/gamepad e superfícies 1080p/1440p/4K; conferir copy, hierarquia, legibilidade e recuperação.
5. Registrar ambiente, versões, corpus, evidências e limitações; separar controle sintético e hardware real.

## O que está mockado

RegistryPublisher: autenticar, stage blobs, publicar(snapshot/hash/expectedVersion), resolver link/código, retirar; auth de editor separada de assinatura; commit só após blobs íntegros.

Todos os efeitos de runtime/rede/disco são simulados em memória. Não afirmar persistência/reprodução/publicação real. A aprovação libera apenas o avanço frontend conforme GOAL, não encerra o milestone.

## Evidências e decisão

Evidências em [UPDATE](UPDATE.md) e [VALIDATION](evidence/VALIDATION.md). Decisão humana pendente; não inferir aprovação pelo silêncio. Alterações de UX exigidas na integração voltam à revisão correspondente. Este roteiro não autoriza execução nem fecha S08.

## Mudanças solicitadas

Nenhuma registrada; isso não equivale a aprovação.

## Revisão final consolidada

READY_FOR_REVIEW / decisão PENDING. A revisão intermediária foi adiada por instrução explícita, não aprovada. Usar o [roteiro único](../../execution/FRONTEND_REVIEW.md); resultados automatizados e inspeções não substituem sua decisão.
