# Checkpoint funcional — M06

## Status

NOT_STARTED. Decisão: PENDING. Roteiro preparado; nenhuma aprovação ou validação executada.

## Pré-condições

S03–S05 integradas após UX M01–M22 e dependências reais; só então READY_FOR_REVIEW.

## Jornada para testar

Adicionar → magnet ou torrent → resolver metadata → revisar arquivos → escolher selector → confirmar ou salvar pendente → retry.

1. Percorrer o caminho principal e verificar o resultado: Usuário importa, revisa arquivos e mantém tentativa pendente para retry.
2. Exercitar estados: entrada inválida; resolvendo; sem peers; timeout; cancelado; pendente; sample/extras; seleção ambígua; daemon indisponível.
3. Voltar/cancelar/repetir e conferir foco, contexto e ausência de mutação não confirmada.
4. Usar torrent e magnet autorizados com metadata e sem peers; cancelar/repetir/reabrir pendente; mesmo hash com selectors distintos reutiliza sessão; derrubar daemon mantém UI; rejeitar bencode hostil e paths fora do sandbox.
5. Registrar ambiente, versões, corpus, evidências e limitações; separar controle sintético e hardware real.

## Integrações reais e verificações

TorrentInspection: inspecionar entrada, cancelar(operationId), salvar pendente, repetir; Source/infoHash separado de ContentSourceSelector; snapshot de arquivos e eventos versionados.

Verificar ausência de mock no caminho principal, persistência pertinente após restart, permissões, erro/sucesso refletidos na UI e dependências M02. Testes verdes não substituem demonstração da jornada real.

## Evidências e decisão

PENDENTES. Registrar decisão humana com contexto e evidência; não inferir aprovação pelo silêncio. Alterações de UX exigidas na integração voltam à revisão correspondente. Este roteiro não autoriza execução nem fecha S08.

## Mudanças solicitadas

Nenhuma registrada; isso não equivale a aprovação.

Frontend entregue somente em simulação; este checkpoint e S03–S08 continuam DEFERRED.
