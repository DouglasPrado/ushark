# M06 — Validação frontend — 2026-09-13

Checkout real: TorrentImport.tsx + types/torrent.ts + mocks/torrent.ts, entradas Filmes e Séries usando catálogos existentes em memória.

- pnpm typecheck e ESLint dos arquivos TS/TSX alterados passaram.
- Playwright tests/torrent.behavior.spec.ts: 2 casos principais passaram (10.5s); caso adicional de fixtures/teclado/resoluções passou (8s).
- Casos: magnet inválido, confirmação/metadata/hash, samples ignorados, dedup e catálogo sem duplicata, série/episódios explícitos, pendência sem peers, retry, cancelamento/evento tardio e foco, path hostil, timeout, daemon, offline e bencode inválido simulados.
- Capturas review.png e import-1080/1440/2160.png. Inspeção direta de review.png confirma modal legível e seleção explícita; capturas multirresolução e ausência de overflow horizontal automatizadas. Hardware físico não testado.

Limites: não lê .torrent do usuário; seletor trabalha com arquivos sintéticos declarados. Não há parser bencode/IPC/daemon/rede/disco. Rejeição hostil é fixture e não prova sandbox. Persistência, normalização definitiva de hashes, empacotamento e isolamento real S03–S08 adiados. UX READY_FOR_REVIEW/PENDING, adiada por instrução do usuário; nenhum aceite novo.
