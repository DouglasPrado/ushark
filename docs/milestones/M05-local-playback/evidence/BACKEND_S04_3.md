# Evidência S04.3 — tracks e legenda externa validada

Data: 2026-09-14.

`@ushark/core/playback-tracks` valida e troca áudio/legenda usando IDs
normalizados do mesmo adapter; ausência de track falha fechado. A troca não
reinicia processo nem source. Legenda externa é escolhida pelo host e copiada
para temp privado da sessão antes do comando MPV; o resultado público contém
somente ID/nome/extensão.

A política D21 aceita `.srt`, `.ass`, `.ssa` e `.vtt`, arquivo regular de até
20 MiB. URL, path relativo, extensão fora da allowlist, symlink, troca de inode/
tamanho durante leitura e excesso são rejeitados. A cópia usa `O_NOFOLLOW`,
`O_EXCL`, permissão 0600 e diretório 0700; erro/stop remove o temp e não altera
manifest.

Validação **3/3**: cópia/permite/cleanup, matriz hostil e áudio/legenda interna/
off/externa no mesmo adapter. Lint e typecheck passaram. Junto de S04.1–S04.2,
a suíte backend M05 está **9/9**.

```text
pnpm exec playwright test tests/playback-tracks.spec.ts --workers=1 --trace=off
# 3 passed
```

Diálogo nativo, IPC Electron, wiring do player real e jornada completa
pertencem a S05. Windows/TV/Moonlight físicos continuam pendentes.
