# M02 — Seed padrão com metadados IMDb

Data: 2026-09-13. Solicitações explícitas do usuário: “Vamos fazer uma chamada com imdb e preencher um mock com filmes reais por padrao” e, na revisão, “Precisa estar com as imagens do imdb a capa e etc”.

## Decisão de escopo

Foram feitas consultas pontuais aos datasets oficiais não comerciais `title.basics` e `title.ratings`, disponíveis em `https://datasets.imdbws.com/`, para materializar um fixture estático e determinístico. Na correção visual, a página pública de cada título forneceu o pôster principal e uma imagem horizontal, copiados como assets locais. Isso mantém a entrega em S01/S02: não existe chamada IMDb no renderer, segredo no frontend, cache remoto, persistência ou adapter de produção. A integração de metadata prevista na arquitetura continua sendo TMDB e permanece adiada para S04.

## Consulta executada

O arquivo publicado em 2026-09-12 foi acessado em 2026-09-13. O recorte usado foi obtido com:

```sh
curl -L --fail --silent --show-error https://datasets.imdbws.com/title.basics.tsv.gz \
  | gzip -dc \
  | rg '^tt(0816692|0468569|0245429|6751668|15239678|15398776|6710474|0068646)\t'
```

As avaliações e quantidades de votos foram obtidas no mesmo dia com:

```sh
curl -L --fail --silent --show-error https://datasets.imdbws.com/title.ratings.tsv.gz \
  | gzip -dc \
  | rg '^tt(0816692|0468569|0245429|6751668|15239678|15398776|6710474|0068646)\t'
```

| IMDb ID    | Título primário                   |  Ano | Min | Nota |     Votos | Gêneros                      |
| ---------- | --------------------------------- | ---: | --: | ---: | --------: | ---------------------------- |
| tt0816692  | Interstellar                      | 2014 | 169 |  8.7 | 2,605,028 | Adventure, Drama, Sci-Fi     |
| tt15239678 | Dune: Part Two                    | 2024 | 166 |  8.4 |   792,368 | Action, Adventure, Drama     |
| tt15398776 | Oppenheimer                       | 2023 | 180 |  8.2 | 1,096,626 | Biography, Drama, History    |
| tt6751668  | Parasite                          | 2019 | 132 |  8.5 | 1,194,868 | Drama, Thriller              |
| tt0468569  | The Dark Knight                   | 2008 | 152 |  9.1 | 3,225,193 | Crime, Thriller              |
| tt6710474  | Everything Everywhere All at Once | 2022 | 139 |  7.7 |   661,007 | Action, Adventure, Comedy    |
| tt0245429  | Spirited Away                     | 2001 | 124 |  8.6 |   984,364 | Adventure, Animation, Family |
| tt0068646  | The Godfather                     | 1972 | 175 |  9.2 | 2,255,117 | Crime, Drama                 |

## Materialização no mock

- `packages/mocks/data/imdb-movies.ts` registra os oito títulos, seus IMDb IDs, ratings/votos do snapshot e os caminhos locais de pôster/backdrop.
- `apps/desktop/public/movie-art/imdb/` contém oito pôsteres e oito backdrops JPEG; o [manifesto de origem](../../../../apps/desktop/public/movie-art/imdb/README.md) registra página e URL exata de cada imagem.
- `packages/mocks/services/movies.ts` inicia o catálogo padrão com esses títulos e permite busca pelo título de apresentação ou original.
- `apps/desktop/src/renderer/app/App.tsx` aplica o seed à biblioteca padrão, portanto a Home e Filmes já abrem preenchidos.
- `apps/desktop/src/renderer/catalog/Movies.tsx` apresenta ano, duração, gêneros, nota, votos e ID nos cards, além do título original nos detalhes.
- `tests/movies.catalog.spec.ts` protege quantidade, identidade externa, ratings/votos, caminhos dos assets e busca por `Interstellar`; `tests/movies.behavior.spec.ts` protege a apresentação e o carregamento dos oito pôsteres e do backdrop; o teste Electron repete a checagem offline via `file:`.

Os IDs canônicos da aplicação continuam locais (`movie:local:*`); `tt*` fica em `externalIds.imdb`. Os títulos em português, sinopses e fontes `.mkv` são conteúdo local/sintético do mock. IMDb ID, títulos originais, ano, duração e gêneros vieram de `title.basics`; avaliações e votos vieram de `title.ratings`; pôsteres e backdrops vieram das páginas públicas dos títulos. Nenhum elenco, sinopse ou dado de usuário foi obtido do IMDb. A revisão visual detectou e removeu tanto o reaproveitamento inicial de SVGs fictícios quanto a correção intermediária com artes geométricas.

## Validação

- Prettier dos arquivos alterados, ESLint completo, `tsc --noEmit` e `git diff --check`: aprovados.
- Build direto `vite build --config apps/desktop/vite.config.ts`: aprovado, com o aviso já conhecido de chunk acima de 500 kB.
- Suíte afetada de browser/layout/Electron: 26/26 em 34,0 s.
- Cobertura focada após apresentar a metadata: **21/21**.
- Regressão Playwright completa: **123/123**, zero skips, em 2,4 min.
- Inspeção no navegador do servidor em execução: Home exibiu `Interestelar` como Hero e cards reais no trilho de continuação.
- Assets IMDb: 16 JPEGs válidos — oito pôsteres entre `1000x1331` e `1000x1482`, e oito backdrops `1000x563` — com origem registrada.
- Carregamento: teste de catálogo validou os caminhos; teste de comportamento carregou os oito pôsteres e o backdrop; Electron real repetiu a checagem com a rede desativada e URL `file:`.
- Apresentação IMDb: o [catálogo](imdb-movies-1920.png) mostra pôster, nota, votos, ID, duração e gêneros nos oito cards; o [detalhe](imdb-details-1920.png) mostra pôster, backdrop, título original e o bloco IMDb.

A checagem global de formatação apontou somente o arquivo concorrente `apps/desktop/src/main/index.cjs`. O build via Turbo não iniciou porque o pnpm solicitou purga/reinstalação interativa de `node_modules` após a reorganização concorrente do workspace; o build Vite direto validou o bundle efetivamente alterado.

## Licença e limite funcional

Os datasets públicos do IMDb são destinados a uso pessoal e não comercial e exigem a atribuição indicada pelo próprio IMDb. O fixture contém essa atribuição no código. Os arquivos de imagem não fazem parte desses datasets; foram incluídos apenas para o protótipo solicitado, com origem registrada, e este repositório não estabelece licença de redistribuição comercial para eles. Uso comercial ou distribuição em produção exige provider/contrato e revisão de licença próprios. A API GraphQL do IMDb não foi usada: ela requer assinatura pelo AWS Data Exchange, credenciais AWS e chave de API.

Fontes oficiais:

- Dataset e esquema: <https://developer.imdb.com/non-commercial-datasets/>
- Condições de uso: <https://help.imdb.com/article/imdb/general-information/can-i-use-imdb-data-in-my-software/G5JTRESSHJBBHTGX>
- API e acesso: <https://developer.imdb.com/documentation/api-documentation/getting-access/>

Este ajuste não implementa backend/provider runtime, não avança S03–S08 e não altera o aceite funcional de M02.
