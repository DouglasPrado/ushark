# M11 — Evidências frontend — 2026-09-13

NextEpisode/NextEpisodePreview/MockNextEpisodePreview conectados ao catálogo de séries, SourceSelection e Player por identidade. Player remonta por id e retorno seleciona o episódio atual. Typecheck e ESLint passaram.

Playwright: teste preflight/erro/Escape passou (5.8s). Countdown/cancelamento/autoplay off/manual e início automático passaram juntos (2, 27.4s). Correções de teste: conteúdo sob dialog sai da árvore acessível; assert do título usa nó existente; autoplay inicial de M01 é false e teste liga explicitamente. Teste de catálogo com lacuna/especial/fim de temporada/source ausente passou (1, 246ms).

Inspeção direta next.png (1440×1000) confirma informação e ações; checkbox de autoplay alinhado após inspeção. Herda superfície do player validada em três resoluções M05/M07; não constitui teste físico de TV. Fixtures de 30s/5s não fixam budgets definitivos nem comprovam banda/engine/reutilização real de pack.

UX READY_FOR_REVIEW/PENDING adiada por instrução explícita. S03–S08, Electron/Windows/TV/controle físico e integrações pendentes.
