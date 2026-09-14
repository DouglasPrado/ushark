# Checkpoint funcional — M07

## Status

NOT_STARTED. Decisão: PENDING. Roteiro preparado; nenhuma aprovação ou validação executada.

## Pré-condições

S03–S05 integradas após UX M01–M22 e dependências reais; só então READY_FOR_REVIEW.

## Jornada para testar

Detalhes → Play parcial → buffering → primeiro frame → seek fora do cache → retomar → sair.

1. Percorrer o caminho principal e verificar o resultado: Filme e episódio tocam parcialmente; seek descarta trabalho antigo e reconstrói buffer.
2. Exercitar estados: metadata incompleta; buffer inicial; pronto parcial; rebuffering; seeks sucessivos; rede perdida; disco cheio; cancelado.
3. Voltar/cancelar/repetir e conferir foco, contexto e ausência de mutação não confirmada.
4. Filme e episódio de pack incompletos tocam; seek fora do cache e três seeks rápidos reproduzem a última posição; medir primeiro frame 1–5s/seek 1–3s em swarm controlado; inspecionar prioridade e limites RAM/disco.
5. Registrar ambiente, versões, corpus, evidências e limitações; separar controle sintético e hardware real.

## Integrações reais e verificações

StreamSession: abrir(sourceId, selector), buscar(sessionId, posição, geração), cancelar; readiness e buffer em segundos, bytes e bitrate com unidades; última geração vence; scheduler protege ativo.

Verificar ausência de mock no caminho principal, persistência pertinente após restart, permissões, erro/sucesso refletidos na UI e dependências M03, M05, M06. Testes verdes não substituem demonstração da jornada real.

## Evidências e decisão

PENDENTES. Registrar decisão humana com contexto e evidência; não inferir aprovação pelo silêncio. Alterações de UX exigidas na integração voltam à revisão correspondente. Este roteiro não autoriza execução nem fecha S08.

## Mudanças solicitadas

Nenhuma registrada; isso não equivale a aprovação.

Frontend validado por simulação; este checkpoint e S03–S08 permanecem DEFERRED.
