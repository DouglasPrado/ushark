# M10 S04.1 — índice, leases e reconciliação

`StoragePolicyService` persiste índice e política em SQLite, reconcilia arquivos
reais de downloads/torrents, lê a capacidade física com `statfs` e combina
leases de playback/streaming com downloads ativos antes de calcular
elegibilidade. Keep, favoritos e parciais seguem a política registrada.

Validação em 2026-09-14: o caso S04.1 de
`tests/storage-policy-service.spec.ts` passou no macOS, usando diretórios e
arquivos temporários reais. A proteção física Windows/TV continua fora desta
evidência.
