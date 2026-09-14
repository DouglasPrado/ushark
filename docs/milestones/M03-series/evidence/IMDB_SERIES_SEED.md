# M03 — Seed padrão de séries com metadata IMDb

Data: 2026-09-13. Solicitação explícita do usuário: aplicar em Séries o mesmo
padrão de Filmes, com séries reais, capas, backdrops e informações do IMDb,
mantendo temporadas e episódios mockados.

## Decisão de escopo

O catálogo inicial agora materializa um snapshot estático e determinístico. Os
IDs, títulos originais, anos e gêneros vieram dos datasets públicos não
comerciais `title.basics` e `title.ratings`; notas e quantidades de votos vieram
de `title.ratings`; títulos de apresentação, sinopses e imagens foram conferidos
nas páginas públicas dos títulos. Não existe chamada IMDb no renderer,
credencial, cache remoto, persistência ou adapter de produção.

Temporadas, episódios e qualidades das sources são uma amostra local
deliberadamente pequena: duas temporadas e seis episódios por série, sem alegar
correspondência com o guia de episódios ou com versões de mídia do IMDb. Essa
separação fica visível no detalhe e mantém M03 dentro da fronteira
frontend-first de S01/S02.

## Snapshot

| IMDb ID      | Título              | Período   | Nota |     Votos | Gêneros                  |
| ------------ | ------------------- | --------- | ---: | --------: | ------------------------ |
| `tt0903747`  | Breaking Bad        | 2008–2013 |  9.5 | 2,674,582 | Crime, Drama, Thriller   |
| `tt0944947`  | Game of Thrones     | 2011–2019 |  9.2 | 2,660,685 | Drama, Fantasy           |
| `tt0386676`  | The Office          | 2005–2013 |  9.0 |   849,416 | Comedy                   |
| `tt5753856`  | Dark                | 2017–2020 |  8.7 |   561,437 | Crime, Drama, Mystery    |
| `tt4574334`  | Stranger Things     | 2016–2025 |  8.6 | 1,737,778 | Drama, Fantasy, Horror   |
| `tt11280740` | Severance / Ruptura | 2022–     |  8.6 |   405,662 | Drama, Mystery, Sci-Fi   |
| `tt14452776` | The Bear / O Urso   | 2022–2026 |  8.5 |   325,147 | Comedy, Drama            |
| `tt3581920`  | The Last of Us      | 2023–     |  8.4 |   749,796 | Action, Adventure, Drama |

Os arquivos foram acessados em 2026-09-13 com recortes por esses oito IDs:

```sh
curl -L --fail --silent --show-error https://datasets.imdbws.com/title.basics.tsv.gz
curl -L --fail --silent --show-error https://datasets.imdbws.com/title.ratings.tsv.gz
```

## Materialização

- `packages/mocks/data/imdb-series.ts`: oito séries, metadata IMDb e 48
  episódios locais mockados com IDs independentes e sources demonstrativas com
  resolução declarada.
- `packages/mocks/services/series.ts`: `seedDefault()` isolado do catálogo vazio
  usado pelos cenários de revisão.
- `apps/desktop/public/series-art/imdb/`: oito pôsteres e oito backdrops JPEG; o
  `README.md` do diretório registra página e URL exata de cada imagem.
- `Series.tsx`: grade com pôster, Torrent Health mockado em barras, resolução,
  período, gêneros, nota/votos/ID; detalhe com capa, backdrop, sinais separados,
  sinopse e hierarquia de temporadas.
- `discovery.ts`: a mesma identidade e os backdrops alimentam o trilho Séries da
  Home, enquanto a busca continua usando pôster vertical; ambos mostram Torrent
  Health em barras e a resolução como metadata separada.

## Validação

- Regressão completa: **125/125**, zero falhas e zero skips, em 2,1 min.
- Typecheck, ESLint e build Vite/Turbo passaram; permanece apenas o aviso já
  conhecido de chunk acima de 500 kB.
- Electron macOS com a rede desligada carregou o catálogo padrão e os JPEGs a
  partir da URL `file:`.
- Fluxos M06/M07/M11 foram atualizados para selecionar a série importada por ID
  acessível, sem depender de ela ocupar o primeiro card do catálogo.
- [Catálogo 1080p](imdb-series-1920.png) e
  [detalhe 1080p](imdb-series-detail-1920.png) registram barras/rótulos de
  Torrent Health e `4K`/`1080p` separados.
- A [Home 1080p](../../M04-home-search/evidence/imdb-home-1920.png) registra o
  trilho Séries com backdrops locais.

## Licença e limite funcional

Os datasets públicos do IMDb são destinados a uso pessoal e não comercial. Os
arquivos de imagem não fazem parte desses datasets e foram incluídos somente no
protótipo solicitado, com origem registrada; este repositório não estabelece
licença de redistribuição comercial. Produção exige provider/contrato e revisão
de licença próprios.

Fontes oficiais:

- <https://developer.imdb.com/non-commercial-datasets/>
- <https://help.imdb.com/article/imdb/general-information/can-i-use-imdb-data-in-my-software/G5JTRESSHJBBHTGX>

Este ajuste não implementa backend/provider runtime, não avança S03–S08 e não
transforma o aceite histórico de M03 em aceite automático desta revisão visual.
