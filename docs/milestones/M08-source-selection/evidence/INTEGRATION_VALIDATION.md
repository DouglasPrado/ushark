# M08 S05 — validação de integração

O caminho principal do Electron usa `DesktopSelectionPreview`, preload e IPC
restritos, `SourceSelectionApplicationService`, `ProgressiveHealthSampler`,
`TorrentHealthMetricsAdapter` e SQLite. O browser continua com o mock explícito.

Comandos executados em macOS arm64 em 2026-09-14:

- `pnpm lint` e `pnpm typecheck`: PASS;
- `pnpm build`: PASS com Electron/Vite e bundle de produção;
- recorte M08 (engine, sampler, ranking/store/service, IPC e adapter): 16/16
  PASS;
- `tests/source-selection.electron.spec.ts`: 1/1 PASS, abrindo detalhes,
  exibindo Health 100 local, definindo/retirando override pela UI, exercitando
  o IPC e reidratando o override após restart;
- `tests/torrent-daemon.spec.ts` com CPython 3.12/libtorrent 2.1.1: 6/6 PASS,
  incluindo `health.sample` real e ausência de peers sem falso dado.

Fixtures cobrem fonte local, menor tamanho, 4K inviável, múltiplas origens
válidas via duas relações, timeout/cancelamento, source estrangeira, confiança
e ranking de 64 candidates abaixo de 10 ms. Eventos públicos não expõem paths,
IPs, bitfields ou SQL.

Limitações: o swarm controlado de M07 comprova entrega real; uma sessão visual
com source remota saudável ainda depende de peers externos. Windows/TV,
Moonlight e controle físico continuam sem validação. Não há decisão humana do
checkpoint funcional e S06–S08 não foram iniciadas.

