# M07 S03 — contrato de domínio

Data: 2026-09-14.

## Resultado

`@ushark/types/stream` mantém o contrato de prévia e adiciona o protocolo real
v1 de streaming progressivo. A fronteira define preparação, posição, seek com
geração, stop/cancelamento, snapshots, buffer com unidades, metadata detectada,
delivery por arquivo parcial, eventos e falhas normalizadas.

O renderer não recebe piece index, path, tracker, peer ou segredo. O Core é dono
da sessão e o torrentd é dono de prioridades/deadlines/cache. `protected: true`
é invariante durante a sessão; última geração vence e Stream Only não ativa o
restante do torrent.

## Limites e decisões

Os limites verificáveis de mensagem, frequência, feedback, HEAD/TAIL, cache e
seeks rápidos estão em `STREAM_LIMITS`. Janelas/prioridades adaptativas,
delivery inicial por arquivo parcial e matriz física foram fechadas em
[D09/D13/D18](../../../decisions/M07-D09-D13-D18-streaming-contract.md).
Startup/seek continuam metas condicionais, não promessas universais.

## Validação

`pnpm exec prettier --check packages/types/src/stream.ts`,
`pnpm lint` e `pnpm typecheck` passaram. S03 não alega libtorrent, probe ou MPV
progressivo executados; essas provas pertencem a S04/S05.
