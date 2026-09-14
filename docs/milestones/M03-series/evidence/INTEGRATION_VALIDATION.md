# Evidência S05 — integração real de séries

Data: 2026-09-14.

## Resultado

O caminho Electron de Séries agora usa `DesktopSeriesCatalog`, preload/IPC
versionado, `SeriesCatalogApplicationService`, SQLite e a inspeção M06 com
CPython/libtorrent. O mock continua somente no navegador de preview e nos testes
frontend que o injetam explicitamente.

A jornada real coberta importa um `.torrent` multifile autorizado com dois
episódios de temporada, um especial e uma legenda. Uma única source é
persistida com três relações e selectors independentes; a legenda permanece
associada apenas a S01E01. Encerrar e reabrir o Electron conserva série,
episódios, source, nomes de arquivo, selector e revisão.

A arte de episódio aprovada no frontend também saiu do mock: o renderer envia
somente data URL, nome e MIME; Core limita a 12 MB, confere extensão, MIME e
magic bytes, grava por SHA-256 no cache privado e persiste apenas
`ushark-asset://<hash>`. PNG e GIF são aceitos. A prova Electron reabriu o PNG
do protocolo local após restart.

## Recuperação e invariantes

- `tests/series-catalog-integration.spec.ts` injeta falha depois de criar a
  hierarquia e antes de confirmar a source. O primeiro retorno é recuperável e
  o retry conclui sem fundir episódios.
- O mesmo teste cobre S01E01, S01E02, especial S00E01, correção manual de
  S01E03, legenda independente, restart e `readSourceReview`.
- A revisão persistida conserva colisões, não identificado, multi-episódio,
  skip, correção e revisão otimista, conforme os testes S04.
- O catálogo M02 passou a filtrar memberships pelo tipo `movie`; isso evita que
  uma série legítima produza item indefinido ao hidratar Filmes depois do
  restart.
- O corpus de 50.000 episódios continua paginado pelo índice, com inserção
  medida em aproximadamente 444 ms no mesmo host; a prova detalhada está em
  `BACKEND_S04_1.md`.

## Ambiente e comandos

- macOS 26.6.2 arm64
- Node 26.8.1; SQLite 3.53.4; Electron 44.3.0
- CPython 3.12.14; libtorrent 2.1.1.0
- Fixture local bencoded; apenas metadata foi lida, sem download de conteúdo.

Validações:

- `pnpm lint` — passou.
- `pnpm typecheck` — passou.
- `pnpm build` — passou; apenas o aviso já conhecido de chunk maior que 500 kB.
- suíte afetada M02/M03/M06 + Electron real — **86/86 passaram** em 41,6 s.
- `git diff --check` — passou.

Captura: [episódio real no Electron](electron-real-episode.png).

## Limites do checkpoint

O smoke TMDB ao vivo segue pendente sem `USHARK_TMDB_TOKEN`; cache, timeout,
cancelamento e modo degradado foram testados deterministicamente. Empacotamento
do runtime torrent e validação física Windows/TV/controle/Moonlight também
permanecem pendentes. Nenhum desses itens recebe aceite implícito.
