# Validação de integração — M02/S03–S05

Data: 2026-09-14. Ambiente: macOS local, Node 26.8.1, Electron 44.3.0/Node 24.20.0, SQLite `node:sqlite`, Chromium/Playwright. Rede TMDB real não exercitada por ausência de `USHARK_TMDB_TOKEN`.

## Resultado entregue

- Contrato schema/protocolo v1 com snapshots revisionados, idempotência, erros e delete por identidade.
- Migration aditiva até v4 no banco do M01: catálogo relacional, estado pessoal, cache de provider e assets.
- Store transacional com ordem, restart, merge conservador, rollback e remoções não destrutivas.
- Adapter TMDB real no Core, base HTTPS fixa, token fora do renderer, timeout/cancelamento, payload bounded e cache/fallback degradado.
- Assets por hash em cache gerenciado, magic bytes/limites/allowlist e URI interna `ushark-asset://`.
- Preload/IPC allowlisted; renderer usa `DesktopMovieCatalog` no Electron e preserva `MockMovieCatalog` no browser.
- Ferramentas de fixture, sources demonstrativas e import torrent mockado não aparecem no caminho Electron real de M02.

## Validação

- `pnpm typecheck`: passou.
- ESLint dos arquivos afetados: passou.
- `pnpm build`: passou; aviso conhecido do chunk Vite acima de 500 kB permanece.
- Suíte afetada serial: 49/49 passaram em 55,1 s.
- Electron empacotado: onboarding, catálogo vazio, busca TMDB não configurada com fallback manual, save, favorito, Home, reload e reabertura preservando título/ano/sinopse/favorito passaram offline.
- Browser: 19 testes de comportamento/domínio e três layouts preservaram o adapter mockado e a UX aprovada.
- Core/IPC: migrations, idempotência, conflito de revisão, merge/rollback, path confinado, delete confirmado, cache/SSRF/limites, provider/cancelamento e sender/frame/protocolo exercitados.

## Limites do checkpoint

- O adapter TMDB é real, mas o smoke contra a rede TMDB não foi executado sem credencial configurada; os testes de contrato usam respostas controladas.
- Nenhum source real foi produzido por M02: torrent/import pertence ao M06. Delete real foi comprovado somente em arquivo temporário dedicado dentro de raiz gerenciada.
- Windows/TV/controle físicos, overscan e Moonlight permanecem pendentes.
- CI, review, merge, distribuição e aprovação funcional humana não foram executados.

