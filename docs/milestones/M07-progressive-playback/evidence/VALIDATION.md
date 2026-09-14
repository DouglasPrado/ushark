# M07 — Validação frontend — 2026-09-13

Player.tsx reutilizado com StreamPreview/MockStreamPreview; Filmes, Home e episódios conectados ao player. Sem MPV/torrentd/probe/cache real.

- Typecheck, ESLint dos arquivos alterados e pnpm build passaram.
- Playwright stream.behavior + player.behavior: 4 passaram (27.8s), cobrindo último de três seeks, pausa, metadata/rede/disco/retry, VBR com unidades, cancelamento sem salvar posição não confirmada, M06→M07 filme e regressão M05.
- Caso adicional M07 episódio importado: 1 passou (5s), mantendo episódio/selector e retorno ao detalhe.
- Inspeção direta da captura stream.png (1440×1000): buffer e controles legíveis; player herdou capturas M05 1080p/1440p/2160p regeneradas nesta rodada.

Todos os valores são ilustrativos. Timers não comprovam metas 1–5s/1–3s nem prioridades de engine, codec, I/O ou proteção de arquivos reais. Electron/Windows/TV/controle físico e throughput real pendentes. UX READY_FOR_REVIEW/PENDING, revisão humana adiada por instrução explícita. S03–S08 DEFERRED.
