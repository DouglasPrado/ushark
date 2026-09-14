# Checkpoint funcional — M06

## Status

READY_FOR_REVIEW em 2026-09-14. Decisão humana: PENDING.

## Pré-condições

S03–S05 integradas após UX M01–M22 e M02. Contrato, adapters e jornada Electron
possuem [evidência real](evidence/INTEGRATION_VALIDATION.md).

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

Automação local disponível: parser/staging, libtorrent real, IPC autenticado,
SQLite/restart, arquivo `.torrent`, magnet público, timeout/pendência/retry,
deduplicação e crash isolado. Suite afetada final: **47/47**.

PENDENTES: percorrer a jornada humana; binário empacotado; Windows x64; TV,
controle físico e Moonlight. Registrar a decisão humana com contexto; não inferir
aprovação pelo silêncio. Este checkpoint não autoriza S06–S08.

## Mudanças solicitadas

Nenhuma registrada; isso não equivale a aprovação.

Frontend aprovado; S03–S05 executadas. S06–S08 permanecem não autorizadas.
