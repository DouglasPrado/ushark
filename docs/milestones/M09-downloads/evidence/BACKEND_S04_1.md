# M09 S04.1 — fila, comandos e limites

`DownloadStore` e `DownloadApplicationService` implementam fila SQLite,
idempotência, prioridades, concorrência e limites globais. `torrentd` ganhou
allowlist própria de download, prioridades de arquivo/pieces e rate limits; em
playback ativo o budget de download de fundo é reduzido a 25% sem interferir
nas prioridades HOT do streaming.

Fixtures comprovam fila sem duplicação, máximo concorrente, pause/resume e
limites 8/1 MiB/s, 4 sessões, 2 downloads e 1 probe.

