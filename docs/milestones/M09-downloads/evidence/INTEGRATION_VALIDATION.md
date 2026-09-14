# M09 S05 — integração real

Electron usa `DesktopDownloadPreview`, preload/IPC v1 restrito,
`DownloadApplicationService`, SQLite e o mesmo torrentd/libtorrent de M06/M07.
O browser conserva o mock explícito e os controles de fixture não aparecem no
runtime real.

Em macOS arm64, o ensaio criou um `.torrent` sintético próprio, enfileirou-o,
observou estado real `downloading`, pausou pela UI, fechou o app, confirmou
resume data, reabriu com fila paused, retomou e cancelou mantendo o título no
catálogo. O runtime não tinha peers, portanto não se declarou download completo.

Validação em 2026-09-14: lint/typecheck/build PASS e recorte integrado 14/14
PASS, incluindo 7 testes reais do torrentd/libtorrent e 1 Electron/restart.
Payload público não contém paths, magnet, resume bytes, IPs ou bitfields.

Windows/TV/Moonlight, controle físico, disco cheio físico e download completo
por swarm externo permanecem pendentes. Decisão funcional humana PENDING;
S06–S08 não iniciadas.

