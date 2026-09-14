# Evidência — catálogos por categorias

Data: 2026-09-14.

## Solicitação

Organizar as telas de Filmes e Séries em categorias, seguindo a linguagem visual da Home.

## Resultado

- O estado padrão de `#/movies` e `#/series` começa por **Em destaque** e continua em trilhos editoriais de gêneros relacionados.
- Os trilhos usam o `MediaCard` compartilhado em orientação `landscape`, backdrops locais, Torrent Health e metadata já disponível.
- Busca, Favoritos e ordenações `Mais votados`/`A–Z` mantêm uma grade única, sem duplicar o mesmo resultado em várias categorias.
- Cada trilho declara navegação horizontal; abrir um item por uma categoria e voltar restaura o card exato e o contexto de scroll.
- Itens sem gênero reconhecido permanecem acessíveis em **Outros**.
- Nenhum provider, persistência, backend ou request de rede foi introduzido.

Categorias atuais: Ação e aventura; Drama; Comédia; Crime e suspense; Ficção científica e fantasia; Mistério e terror; Família e animação; Biografias e história; Outros quando necessário.

## Validação

- `pnpm typecheck`: passou.
- `pnpm lint`: passou.
- `pnpm build`: passou; aviso conhecido de chunk acima de 500 kB preservado.
- Suíte Playwright contra build estático em porta isolada: **142/142 passaram em 2,1 min**, sem reload do Vite de desenvolvimento.
- Electron M02 e M03, executados isoladamente após o build: **2/2 passaram**.
- Inspeção visual: [Filmes](../../milestones/M02-movies/evidence/imdb-movies-1920.png) e [Séries](../../milestones/M03-series/evidence/imdb-series-1920.png).

Uma execução anterior contra o servidor `pnpm dev --tv` já ativo sofreu reloads enquanto a integração M01 era alterada em paralelo. As falhas transitórias foram repetidas isoladamente ou eliminadas pela execução estática acima; não foram tratadas como defeitos deste ajuste.

## Limites preservados

Browser/Electron macOS e controle sintético não substituem Windows, TV/Moonlight e controle físico. O ajuste permanece frontend; integrações reais de M02/M03 continuam fora de escopo.
