# M05 S05 — integração e validação funcional

Data: 2026-09-14.

## Resultado

A jornada local real está integrada até o checkpoint funcional. O renderer
Electron usa `DesktopPlayer`; browser/review continua usando
`MockPlayerPreview`. O Core aceita somente source ligada ao Content e arquivo
regular previamente registrado dentro da raiz gerenciada, abre um processo MPV
separado e mantém caminhos, PID, SQL e protocolo MPV fora do renderer.

O coordenador distingue preparação, processo pronto e primeiro frame; mantém
sessão+geração, controla pause/seek/volume/mute/tracks, limita eventos de posição
a 4/s, persiste a cada 5 s e força flush em pause, seek, stop, EOF, erro e
shutdown. Seek mantém posição autoritativa até o MPV confirmar o novo tempo,
evitando regressão por evento anterior. Legendas externas passam pelo seletor
nativo e por staging privado validado.

## Ambiente e corpus

- Darwin 25.6.0 arm64.
- Electron 44.3.0.
- MPV 0.41.0, libplacebo 7.360.1 e FFmpeg 9.0.1.
- Fixture sintética local H.264/AAC, 320×180, 24 fps, 12 s, criada em diretório
  isolado de teste; nenhum conteúdo de terceiros e nenhuma rede.
- Smoke headless usa `vo=null`/`ao=null` e velocidade reduzida somente por flag
  de teste. Produção não recebe esses argumentos.

## Evidência executada

1. `pnpm exec playwright test tests/playback-service.spec.ts tests/playback-ipc.spec.ts tests/mpv-adapter.spec.ts tests/playback-store.spec.ts tests/playback-tracks.spec.ts`
   — **13 passed**.
2. `pnpm exec playwright test tests/playback.electron.spec.ts --workers=1`
   — **1 passed**; Details → Assistir → primeiro frame → pause/resume → stop →
   progresso → restart.
3. `pnpm exec playwright test tests/playback.electron.spec.ts --workers=3 --repeat-each=3`
   — **3 passed** simultaneamente após estabilizar a máquina de estados.
4. `pnpm lint` e `pnpm typecheck` — passaram.
5. `pnpm test` — build passou com o warning conhecido de chunk acima de 500
   kB; regressão integral **222 passed, 6 skipped, 0 failed** em 2,3 min. Os seis
   skips são testes opcionais M03/M06 condicionados ao runtime libtorrent, já
   executados separadamente na evidência desses milestones.

## Segurança e falhas verificadas

- payload IPC limitado e allowlist por canal; versão, janela dona e main frame
  obrigatórios;
- path de mídia ausente, fora da raiz, symlink ou extensão não permitida falha
  fechado;
- socket privado aleatório, `shell:false`, argumentos estruturados e cleanup do
  processo;
- idempotência, geração obsoleta, restart e sessão interrompida;
- legenda local regular, sem symlink, até 20 MiB, copiada com permissões privadas;
- crash/EOF/stop não derrubam o Electron e fecham o journal.

## Limites e gates restantes

O smoke macOS headless prova abertura/decode, sinal de primeiro frame, comandos,
persistência, IPC e restart. Ele não prova composição visual da janela MPV,
fullscreen, hardware decode ativo, pacote Windows x64, TV/Moonlight nem controle
físico. Esses itens permanecem explicitamente pendentes. S06–S08 não foram
executados e nenhuma aprovação funcional humana foi inferida.
