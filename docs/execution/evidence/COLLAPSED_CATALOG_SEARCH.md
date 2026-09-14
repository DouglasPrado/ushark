# Evidência — busca recolhida nos catálogos

Data: 2026-09-14.

## Solicitação

Retirar o campo de busca permanente das telas de Filmes e Séries para que ele não atrapalhe a navegação do catálogo. A busca deve começar como um ícone ao lado das ações à direita e abrir somente quando ativada.

## Resultado

- Filmes e Séries iniciam sem `searchbox` na árvore de foco; apenas o botão de lupa fica disponível no grupo de ações à direita.
- Ativar `Buscar filmes` ou `Buscar séries` expande o campo correspondente e transfere o foco diretamente para ele.
- O botão vira `Fechar busca de filmes/séries`; fechar limpa a consulta para não deixar um filtro invisível.
- Voltar/Escape enquanto o campo está aberto recolhe e limpa a busca antes de sair da tela, restaurando o foco na lupa.
- Ordenação, tabs Todos/Favoritos, trilhos por categorias, detalhes e boundaries mockados não mudaram.

## Validação

- Typecheck, lint e build: passaram; o aviso conhecido de chunk acima de 500 kB permanece.
- Testes direcionados de busca/categorias: **3/3 passaram**.
- Regressão browser contra build estático isolado: **144/144 passaram em 2,2 min**.
- Electron M02/M03 após o build: **2/2 passaram**.
- Inspeção visual do estado recolhido: [Filmes](../../milestones/M02-movies/evidence/imdb-movies-1920.png) e [Séries](../../milestones/M03-series/evidence/imdb-series-1920.png).
- Inspeção visual do estado expandido: [Filmes](../../milestones/M02-movies/evidence/catalog-search-sort-1920.png) e [Séries](../../milestones/M03-series/evidence/catalog-search-sort-1920.png).

## Limites preservados

A automação de teclado/controle e o Electron macOS não substituem a validação com controle físico, Windows e TV/Moonlight.
