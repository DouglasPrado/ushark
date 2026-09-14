# Evidência S04.1 — adapter MPV isolado e primeiro frame

Data: 2026-09-14.

Foi criado `@ushark/core/mpv-adapter`, com MPV em processo filho separado,
`shell: false`, argumentos em array, sem terminal/OSD, hardware decode
`auto-safe`, socket Unix privado aleatório (named pipe no Windows) e fila de
comandos. Raw JSON permanece encapsulado no adapter.

O adapter normaliza tracks, posição, duração, pause, codecs, frames descartados
e estado de hardware decode. `file-loaded` não é tratado como primeiro frame: o
evento normalizado só ocorre após `playback-restart` da mídia carregada.
Requests têm timeout; exit inesperado rejeita pendências e emite crash sem
derrubar o processo chamador. Stop é repetível e remove socket/processo.

## Validação

MPV 0.41.0, FFmpeg 9.0.1, macOS arm64. Uma fixture MP4 de dois segundos,
320×180, H.264/AAC foi gerada localmente com FFmpeg e tocada por MPV real com
saídas nulas para a prova automatizada de decode/IPC. O teste observou
`file-loaded` antes de `first-frame`, codecs/duração reais e comandos pause/seek.

Um processo protocol-compatible separado também comprovou argumentos, socket,
tracks, volume/mute, seleção/desativação de legenda, serialização, validação e
cleanup determinísticos. Não houve processo órfão após a suíte.

```text
mpv --version
# mpv v0.41.0; FFmpeg 9.0.1

pnpm exec playwright test tests/mpv-adapter.spec.ts --workers=1 --trace=off
# 3 passed

pnpm lint
pnpm typecheck
# passed
```

A saída de vídeo nula confirma decode/direct play e sinal de primeiro frame,
mas não comprova composição visual de janelas, fullscreen, Sunshine/Moonlight
ou hardware decode ativo. Essas provas permanecem em S05 e na matriz física
Windows/TV.
