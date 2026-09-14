# M05/M07 — reparo pós-checkpoint da composição nativa

Data: 2026-09-14

## Retorno humano

A reprodução iniciou, mas o MPV apareceu como uma janela externa em vez de
integrar o reprodutor do Ushark. Esse comportamento foi tratado como mudança
solicitada sobre D11; não constitui aceite funcional.

## Implementação

- MPV continua em processo isolado e sob ownership do Core.
- A janela MPV abre sem borda, OSD, OSC, foco ou presença em taskbar/Dock.
- A geometria inicial usa os bounds de conteúdo do Electron e é atualizada em
  move, resize e transições de fullscreen.
- A janela Electron aceita transparência, mas somente a rota de playback real
  torna o fundo transparente; preparação, erro e saída continuam opacos.
- O overlay React, input e foco permanecem no Ushark, acima do vídeo.
- Stop, crash ou cancelamento removem listeners e restauram o z-order normal.
- No macOS, `macos-geometry-calculation=whole` elimina o deslocamento automático
  da área visível e mantém vídeo e área de conteúdo alinhados.

## Evidência automatizada

- `pnpm exec playwright test tests/mpv-adapter.spec.ts`: **3 passed**.
- `pnpm exec playwright test tests/playback.electron.spec.ts`: **1 passed**.
- `pnpm lint`, `pnpm typecheck` e `pnpm build`: passaram.
- O teste Electron confirma que runtime real remove a arte simulada, ativa a
  superfície transparente durante playback e a restaura ao voltar.

## Evidência runtime macOS

Fixture sintética H.264/AAC de 1280x720 foi reproduzida pelo MPV 0.41.0 em uma
instância Electron isolada. O evento `first-frame` ocorreu, a posição avançou de
0 para 1,5 s durante a amostra e o player permaneceu em `playing`.

A inspeção de janelas on-screen confirmou a ordem Electron acima de MPV e bounds
alinhados:

```text
Electron layer 3: x=240 y=60 width=1440 height=960
MPV      layer 0: x=240 y=92 width=1440 height=928
```

Os 32 px de diferença vertical/altura correspondem ao titlebar; portanto o MPV
coincide com a área de conteúdo do Electron (`x=240 y=92 1440x928`).

## Gates mantidos

O reparo está `READY_FOR_REVIEW/PENDING`. A composição ainda exige aceite humano
e prova física no Windows/TV/Moonlight, incluindo monitor externo, fullscreen,
captura Sunshine, foco e controle físico. S06-S08 não foram autorizadas.
