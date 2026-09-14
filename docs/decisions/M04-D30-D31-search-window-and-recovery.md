# M04 D30–D31 — recentes e recuperação do FTS

Data: 2026-09-14. Status: ACCEPTED para S04.2.

## D30 — janela local de recentes

O filtro persistente `recent=true` usa `library_memberships.created_at` e uma
janela móvel de 30 dias. A data representa quando o Content entrou naquela
biblioteca, não quando a metadata foi atualizada nem quando o arquivo foi
assistido. Home continua ordenando a seção por `addedAt DESC`; esta decisão não
cria histórico de playback nem ownership fora de M04.

A janela fica encapsulada no adapter de índice e pode evoluir sem mudar o
protocolo. Contents sem membership autorizada não aparecem, mesmo que sejam
recentes em outra biblioteca.

## D31 — FTS íntegro não é reconstruído no startup

A migration v8 faz backfill uma única vez ao subir de v7. Em startups
posteriores, o FTS existente é reutilizado sem delete/reinsert. Se a tabela
estiver ausente, Home e escopos continuam lendo o último documento relacional,
enquanto a busca retorna `DISCOVERY_INDEX_CORRUPT` recuperável.

O rebuild é uma operação explícita, transacional e idempotente. Ele incrementa
a revisão e emite razão `recovery`; não roda silenciosamente no startup e não
depende de rede, provider ou watcher.
