# M10 S05 — integração funcional

O Electron expõe um IPC versionado e autorizado para leitura, limpeza,
retenção, reparo e política. O renderer usa `DesktopStoragePreview`; os
controles sintéticos ficam disponíveis apenas no runtime mockado.

Validação executada em 2026-09-14:

- build Vite/Turbo, typecheck e lint dos arquivos alterados passaram;
- suíte focada M09/M10: 13/13 casos passaram;
- Electron real: arquivo de cache foi promovido para a biblioteca, a origem foi
  removida apenas após o destino existir, outro arquivo foi limpo fisicamente e
  a tela exibiu o runtime real sem cenários simulados;
- regressão Electron de M09 passou após o cache do torrent ser movido para a
  pasta configurada.

Ambiente: macOS, Electron 44.3.0, Node SQLite e filesystem local. Não constitui
aceite humano do checkpoint nem valida Windows/TV, controle físico, Moonlight
ou falhas reais de um volume removível.
