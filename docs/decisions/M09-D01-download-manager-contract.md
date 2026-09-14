# M09 — contrato e decisões do Download Manager v1

Data: 2026-09-14. Status: aceita para S03–S05.

## Identidade e ownership

Core possui fila, persistência, idempotência e eventos. `torrentd` possui
libtorrent, resume data privado, prioridades e arquivos sob roots gerenciadas.
Renderer recebe somente snapshots agregados; paths, magnets, resume bytes,
bitfields e IPs não atravessam preload.

Um download é identificado por `contentId + sourceId + fileId`; enfileirar a
mesma combinação é idempotente. Cancelar interrompe a transferência mas mantém
Content/Source. Remover dados exige `confirmed: true` em operação separada.

## Defaults e limites v1

- 256 itens persistidos; envelope renderer/Core de 64 KiB;
- 4 torrents ativos, 2 downloads concorrentes e 1 probe;
- download 8 MiB/s e upload 1 MiB/s; zero significa ilimitado;
- resume salvo a cada 30 s, ao pausar, concluir e shutdown;
- prioridades baixa/normal/alta = 0/1/2; playback sempre precede download, que
  precede probe.

Os defaults refletem a UX aprovada e podem ser configurados sem alterar o
contrato público.

## Resume inválido e disco

Resume inválido isola somente o item, move-o para erro recuperável e permite
re-adicionar/recheck daquela source; nunca inicia scan global nem apaga catálogo.
Disco cheio pausa a escrita afetada, persiste o motivo e aguarda ação/retry.
Restore ocorre em background; a lista persistida fica disponível antes da
reconexão ao swarm.
