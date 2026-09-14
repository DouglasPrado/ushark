# Checkpoint funcional — M10

## Status

NOT_STARTED. Decisão: PENDING. Roteiro preparado; nenhuma aprovação ou validação executada.

## Pré-condições

S03–S05 integradas após UX M01–M22 e dependências reais; só então READY_FOR_REVIEW.

## Jornada para testar

Configurações → espaço e estimativa → revisar protegidos → limpar elegíveis → promover para Keep → conferir uso.

1. Percorrer o caminho principal e verificar o resultado: Usuário inspeciona uso/liberação estimada, aplica política e promove cache para Keep sem redownload.
2. Exercitar estados: calculando; vazio; sem elegíveis; protegido; ativo; disco cheio; cache corrompido; movendo; permissão negada.
3. Voltar/cancelar/repetir e conferir foco, contexto e ausência de mutação não confirmada.
4. Limpeza concorrente com playback/download nunca remove ativos/Keep; promoção reaproveita bytes; falha entre volumes mantém original; corrupção afeta apenas cache; conferir espaço físico.
5. Registrar ambiente, versões, corpus, evidências e limitações; separar controle sintético e hardware real.

## Integrações reais e verificações

StoragePolicy: consultar uso/elegibilidade, estimar limpeza, aplicar plano revalidado, promover/demover retenção, mudar pasta; lease de ativo e referências; bytes estimados distintos de liberados.

Verificar ausência de mock no caminho principal, persistência pertinente após restart, permissões, erro/sucesso refletidos na UI e dependências M09. Testes verdes não substituem demonstração da jornada real.

## Evidências e decisão

PENDENTES. Registrar decisão humana com contexto e evidência; não inferir aprovação pelo silêncio. Alterações de UX exigidas na integração voltam à revisão correspondente. Este roteiro não autoriza execução nem fecha S08.

## Mudanças solicitadas

Nenhuma registrada; isso não equivale a aprovação.

Frontend validado somente em simulação; este checkpoint e S03–S08 permanecem adiados.
