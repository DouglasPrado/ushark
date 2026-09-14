# M05 — Evidências frontend — 2026-09-13

Implementação no checkout real: Player.tsx/player.css, types/player.ts e mocks/player.ts; entradas Filmes/Discovery e leitura compartilhada de progresso. Nenhum runtime de reprodução.

- `pnpm typecheck`: passou.
- `pnpm build`: passou.
- ESLint dos arquivos TS/TSX alterados: passou.
- `USHARK_DEV_PORT=5191 CI=1 pnpm exec playwright test tests/player.behavior.spec.ts --trace=off`: 4 passaram, incluindo chrome por ícones, linha única, auto-ocultação, revelação por input, pausa persistente e superfície comum sem ferramentas/linguagem de revisão.
- `CI=1 USHARK_DEV_PORT=5192 pnpm test -- --trace=off`: 130 passaram, zero falhas e zero skips, em 2,2 min após o build.
- Regressão `tests/discovery.behavior.spec.ts`: 4 passaram inicialmente; caso restante esperava o antigo aviso sem ação M04. Atualizado para validar abertura do player, posição 3737, volta ao detalhe e foco; rerun isolado passou (1).
- Rerun de cancelamento/layout após corrigir zoom global: 1 passou. Capturas player-1080/1440/2160.png geradas por Chromium. Inspeção visual direta 1080p/2160p identificou/corrigiu grid global e altura multiplicada por zoom. Tipografia 4K ampliada após inspeção; nova captura na próxima verificação visual.

Cenários automatizados: preparar/cancelar com evento tardio descartado, pausa/seek, áudio cancelado, legenda inválida/válida, sair/retomar mesma posição, falha/retry, offline simulado, Escape em camadas e retorno de foco, ausência de overflow horizontal em 3 resoluções.

Inspeção visual direta de [player-streaming-1080.png](player-streaming-1080.png): toolbar sutil ancorada ao rodapé, progresso acima, nove botões com ícones e tempo/volume na mesma linha. A rota comum não exibiu diagnóstico, recuperação, cenários, “simulado” ou “prévia local”. Ferramentas técnicas exigem `?review=1`.

Limites: Chromium local macOS; não comprova Electron/Windows, TV, controle físico, vídeo/codec, hardware decode, captura do overlay sobre MPV ou persistência. Efeitos de tracks/volume/decode são simulações. Nenhum aceite humano novo. Funcional/S03–S08 adiados.
