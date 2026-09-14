# Checkpoint funcional — M07

## Status

READY_FOR_REVIEW. Decisão: PENDING. S03–S05 foram executadas e a aprovação
funcional humana não foi inferida.

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

[Validação integrada](evidence/INTEGRATION_VALIDATION.md): **27/27** no recorte
M07; primeiro frame MPV em 2.764 ms com 31/174 pieces, seek fora do cache em
509 ms e somente a geração 4 após três seeks rápidos. Electron usa o serviço
real por IPC restrito, sem path/pieces no renderer.

Decisão humana continua PENDING. Alterações de UX exigidas na revisão voltam ao
checkpoint correspondente; este estado não autoriza S06–S08 nem fecha M07.

## Mudanças solicitadas

Nenhuma registrada; isso não equivale a aprovação.

Windows x64, TV/Moonlight, controle físico, empacotamento, rede pública e disco
cheio real continuam pendentes. A validação local macOS não substitui esses
gates.
