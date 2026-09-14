# M04 — Evidências frontend S00–S02

Data: 2026-09-13. Checkout real `/Users/douglasprado/www/ushark`. Ambiente macOS 26.6.2 (25G83), arm64; Chromium Playwright e Electron 44.3.0. Fixtures e estado somente em memória.

## Entrega

- `apps/desktop/src/renderer/catalog/Discovery.tsx`, `ContentDetails.tsx` e `discovery.css`: Home editorial/vazia com navegação sobreposta, Hero amplo e trilhos horizontais; o catálogo padrão usa backdrop no Hero/trilhos e pôster na busca; busca global em grade, filtros, bibliotecas/coleções e página cinematográfica de Filme compartilhada com M02, além de modal de Série, teclado TV, paginação e foco.
- `packages/types/src/discovery.ts` e `packages/mocks/services/discovery.ts`: boundary de leitura substituível com imagens e metadata editorial opcionais, adapters para os catálogos M02/M03, fixtures determinísticas e falhas/alterações simuladas.
- `App.tsx`: Home conectada ao shell e aos catálogos existentes; onboarding/configurações/Filmes/Séries preservados.
- O catálogo padrão reutiliza os JPEGs locais do seed IMDb; cenários editoriais reutilizam SVGs locais, incluindo `movie-art/orbitas.svg` para a série fictícia Entre Órbitas. Nenhuma imagem depende de rede em runtime.

## Verificação

Formatação dos arquivos alterados, `pnpm typecheck`, `pnpm lint`, `pnpm build` e `git diff --check` passaram. Build atual da fase: JavaScript ~580 kB / ~172 kB gzip, com o aviso de chunk já registrado na validação global e sem tratar tamanho como budget de startup comprovado.

Quinze testes M04 passaram: nove de comportamento, dois de contrato mockado, três de layout e um Electron. Cobrem a página canônica de Filme, o modal rico de Série, trailer local, equivalência entre as entradas M02/M04, navegação principal e deslocamento horizontal dos trilhos por foco; busca fora da janela de 24 cards em corpus de 10.000 Contents; origens homônimas e títulos iguais com IDs distintos; filtros/cancelamento; resposta antiga; falha de página/retry; foco após paginação/detalhes/remoção; hydration preservando o nó DOM; teclado TV com focus trap; offline e leitura do estado M02/M03. O Electron usa `file://`, offline, renderer sem `require`, botões A/B/direcional sintéticos e outline de foco de 3px.

Na execução original, os 11 testes M04 e 39 verificações anteriores passaram em rodadas complementares. Durante a revisão final, a navegação da Home ganhou um teste de comportamento e novos asserts de proporção do Hero e overflow controlado dos trilhos. A revalidação direcionada passou 9/9; a regressão completa atual passou 116/116. O histórico da primeira falha de foco e da instabilidade do servidor Vite permanece registrado na validação final da fase.

Após ligar o backdrop IMDb ao boundary da Home, typecheck, lint e build Vite passaram. A suíte focada M04 passou **12/12** em 15,8 s, incluindo comportamento, catálogo, layouts 1080p/1440p/4K e Electron macOS. O teste verifica diretamente que o Hero e o primeiro card panorâmico usam `tt0816692-backdrop.jpg`.

Na correção visual seguinte, Home, busca e Hero receberam Torrent Health com barras crescentes e rótulo textual, enquanto a resolução permanece na metadata. O Health é fornecido pelo boundary mockado de M08 e identificado na documentação como fixture, sem alegar probe real. O trilho Séries agrega somente sources únicas e explicita `Média`; o teste de comportamento verifica 5 barras/`Excelente` em Filmes e 4 barras/`Média · Muito bom` em Breaking Bad. A regressão completa passou **125/125** em 2,1 min. [A captura IMDb 1080p](imdb-home-1920.png) foi regenerada e inspecionada.

No ajuste de navegação, os trilhos receberam grupos horizontais explícitos e o motor espacial passou a priorizar a mesma lane. Testes adicionais verificam direita/esquerda dentro do trilho, cima/baixo entre Filmes e Séries mantendo a coluna, repetição do analógico, confirmação única, B/Voltar e restauração no mesmo card. [Captura 1920×1080 com foco por gamepad](../../M01-onboarding/evidence/fluid-navigation-home-1920.png) inspecionada. Regressão completa **127/127** passou.

No refinamento do detalhe, um novo teste de comportamento verifica Filme e Série, sinopse, badges, rating/votos, duração, temporadas/episódios, qualidade, Health, quatro ações alinhadas, abertura/progresso/fechamento do trailer e restauração de foco ao usar Voltar. Assistir/Continuar é seguido imediatamente por Voltar, depois Baixar e Trailer. Os sete testes de comportamento e três de layout passaram **10/10**; typecheck, lint e build também passaram. A regressão completa passou **131/131 em 2,2 min**. O modal permaneceu dentro do viewport em 1920×1080, 2560×1440 e 3840×2160.

Na extensão de Recomendados, o mesmo teste passou a verificar seis itens, exclusão do título atual, abertura do primeiro recomendado no mesmo modal, retorno do scroll ao topo e foco no fechamento. A inspeção da [seção em 1080p](rich-series-recommendations-1920.png) confirmou duas linhas de três cards com backdrops, badges e sinopses curtas. Typecheck, lint, cinco testes focados e a regressão completa **131/131 em 2,2 min** passaram.

Na padronização M02/M04, todo Filme passou a usar `ContentDetails` como página em largura total sob `#/content/:contentId`, tanto na Home/busca quanto na aba Filmes; a lista de origem permanece montada e oculta para restaurar consulta, scroll e foco. A aba Filmes injeta apenas as ações contextuais de catálogo. Um teste dedicado compara as duas entradas, rota, classe e backdrop. A validação focada passou **48/48** em browser, Electron e layouts; lint, typecheck, build e regressão completa passaram **136/136 em 2,2 min**. Séries continuam no modal anterior.

## Capturas e revisão

- [Home 1080p](home-1920.png), [1440p](home-2560.png), [4K](home-3840.png).
- [Home com o catálogo IMDb e backdrop horizontal 1080p](imdb-home-1920.png).
- [Busca 1080p](search-1920.png), [1440p](search-2560.png), [4K](search-3840.png).
- [Detalhes no Electron macOS](electron-detail.png).
- [Detalhe rico de Filme 1080p](rich-movie-detail-1920.png), [trailer local 1080p](rich-movie-trailer-1920.png) e [detalhe rico de Série 1080p](rich-series-detail-1920.png).
- [Recomendados no rodapé do detalhe de Série 1080p](rich-series-recommendations-1920.png).
- Encaixe do detalhe rico: [1080p](rich-detail-1920.png), [1440p](rich-detail-2560.png) e [4K](rich-detail-3840.png).

As capturas de Home e busca são de página inteira; dimensões de viewport são 1920×1080, 2560×1440 e 3840×2160. As capturas de Home foram renovadas após o ajuste e mostram cabeçalho sobreposto, Hero amplo e trilhos panorâmicos. A inspeção verificou composição e ausência de overflow horizontal da página; cada trilho tem overflow interno intencional. Foco, deslocamento do trilho, corrida e hydration também possuem asserts automatizados; screenshot isolado não comprova interação.

## Como revisar

Abrir `http://127.0.0.1:5173/` enquanto a prévia local estiver rodando, ou executar `pnpm dev`. Concluir onboarding. A Home começa com os oito filmes do seed IMDb; Filmes/Séries permitem alterar os mocks existentes. Para a composição editorial sintética, abrir “Cenários da prévia” no rodapé → “Prévia editorial”. Usar “10.000 histórias”, “Busca lenta”, “Offline”, “Imagens chegando” e botões de falha/alteração/remoção para os demais roteiros. Dados são descartados ao reiniciar.

## Limites e pendências

Busca usa normalização/filtro em memória e janela paginada de até 24 cards, com imagens lazy; não é FTS5, índice em disco nem virtualização contínua por scroll. Home limita cada seção a dez cards num trilho horizontal. Incrementalidade é simulada por ID; watcher, persistência/restart, subscriptions/sync e playback reais não foram implementados. Continuar e Mais informações encaminham ao mesmo detalhe nesta fase; nenhum deles inicia vídeo real. O trailer é uma prévia visual temporizada com o backdrop local, sem vídeo, áudio, provider ou requisição externa.

Windows/TV/gamepad físico e budgets quantitativos de startup/escala continuam pendentes conforme protocolo EXPERIENCE.md e S03–S07. Testes no macOS/controle sintético não equivalem a essas evidências. UX M04 ainda exige decisão humana; backend/S03–S08 continuam adiados pela onda frontend M01–M22.

## Reconciliação de estado

Durante trabalho simultâneo, STATE passou a associar `ux: approved` e “Usuário: aprovado” ao current M04, enquanto UX_CHECKPOINT M04 permanecia NOT_STARTED/PENDING. A evidência específica está em [M03 UX_CHECKPOINT](../../M03-series/UX_CHECKPOINT.md): “aprovado” após correção do ícone de Séries. O registro foi associado a M03; M04 ficou READY_FOR_REVIEW após S02, sem converter esse aceite em aprovação de M04. A preparação documental M01–M22 e seus registros foram preservados.

## Correção de contenção durante a revisão

`discovery-card-media` passou a ser o contexto de posicionamento e recorte dos overlays na busca e nos trilhos. Antes, os badges absolutos dos resultados verticais podiam usar a página como referência; agora cada badge permanece dentro da arte correspondente. [Captura 1920 px](card-containment-1920.png). `tests/card-containment.spec.ts` passou **2/2** e verificou 480, 700, 761, 1100 e 1920 px; lint, typecheck e build também passaram.

## Página canônica de Filme

O detalhe de Filme de M04 passou a usar uma página dedicada em largura total, compartilhando `ContentDetails` com M02. A lista da Home/busca permanece montada para restaurar contexto, mas não aparece atrás da página; não há overlay, botão X nem papel de diálogo. O modal de Série continua com focus trap. O teste cruzado abre o mesmo filme por M02 e M04 e verifica a página canônica; retorno de player, filme importado, Voltar, scroll e foco também foram exercitados.

A suíte direcionada de Discovery, Filmes, player, stream, navegação e TV passou **48/48** com browser, Electron e layouts 1080p/1440p/4K. Após executar sem traces, build e **136/136 testes passaram em 2,2 min**. Foram inspecionadas [a página pela Home](rich-movie-detail-1920.png) e [a página pelo catálogo M02](../../M02-movies/evidence/details-1920.png). M04 permanece READY_FOR_REVIEW/PENDING.

## Ordem das ações e foco inicial

O detalhe compartilhado passou a apresentar Voltar somente como ícone acessível, imediatamente à esquerda de Assistir/Continuar; Trailer fica imediatamente à direita da ação principal. A entrada por Home, busca, Filmes, recomendação e retorno do player inicia o foco em Assistir/Continuar. A validação direcionada passou **15/15**, incluindo os seis layouts de Discovery/Filmes em 1080p, 1440p e 4K; typecheck, lint e build passaram. A regressão completa permaneceu em **136/136 em 2,2 min**. A composição foi inspecionada em [1080p](rich-detail-1920.png). O checkpoint M04 continua PENDING.

## Ações acima da sinopse

O bloco `discovery-detail-actions` foi movido para depois do Hero e antes de `discovery-detail-content`, colocando Voltar, Assistir/Continuar, Trailer, Baixar e ações contextuais acima da sinopse nas variantes de Filme e Série. O teste rico valida a ordem no DOM e a geometria das duas variantes; os testes de layout de Discovery e Filmes repetem a posição em 1920×1080, 2560×1440 e 3840×2160. A validação direcionada passou **8/8**; lint, typecheck, build e regressão completa passaram **138/138 em 2,2 min**. A composição foi inspecionada em [Filme 1080p](rich-movie-detail-1920.png) e [Série 1080p](rich-series-detail-1920.png). M04 permanece READY_FOR_REVIEW/PENDING.

## Conteúdo de Filme junto ao Hero

A página `discovery-detail-page` reduz somente seu `padding-top` da faixa de ações de 28px para 8px. A faixa e o conteúdo subsequente sobem sem usar margem negativa ou sobreposição sobre o Hero; o modal de Série mantém o espaçamento próprio. Os layouts de Discovery e Filmes verificam que o primeiro botão fique a no máximo 16px do fim do Hero em 1920×1080, 2560×1440 e 3840×2160. Com o teste rico, a validação focada passou **7/7**; lint, typecheck, build e regressão completa passaram **138/138 em 2,2 min**. A [captura de Interestelar](rich-movie-detail-1920.png) foi renovada e inspecionada. M04 permanece READY_FOR_REVIEW/PENDING.

## Título, ações e sinopse no Hero

`ContentDetails` agora coloca `discovery-detail-actions` dentro de `discovery-detail-hero-copy` somente na página de Filme. `discovery-detail-hero-layout` organiza esse bloco à esquerda e `discovery-detail-hero-overview` à direita; o título fica acima das ações e todos permanecem dentro do Hero. O trailer oculta o grid editorial inteiro. Os layouts de Discovery e Filmes verificam a composição em 1920×1080, 2560×1440 e 3840×2160, e o teste rico preserva ordem, foco, trailer e o modal de Série. A validação focada passou **7/7**; lint, typecheck e build passaram. A primeira regressão integral teve um timeout de 30s no Electron M02, mas o caso passou isolado em **3,1s** e a segunda regressão integral passou **138/138 em 2,2 min**, sem mudança de produto. [Detalhe 1080p](rich-movie-detail-1920.png) e [trailer 1080p](rich-movie-trailer-1920.png) foram inspecionados. M04 permanece READY_FOR_REVIEW/PENDING.

## Recomendados com o componente da Home

`DiscoveryRail.tsx` concentra agora arte, sinal de fonte, card e trilho usados pela Home e pelo rodapé de `ContentDetails`. Recomendados renderiza a mesma superfície panorâmica das seções `Filmes para descobrir` e `Continuar assistindo`, com Torrent Health, qualidade e progresso quando aplicável. O teste rico confirma as classes compartilhadas, abertura na mesma superfície, exclusão do título atual e foco em reprodução; os layouts confirmam overflow horizontal sem vazamento da página. A [captura 1080p](rich-detail-1920.png) foi inspecionada. Discovery, layouts de M02/M04 e gates A11/design system passaram **19/19**; lint, typecheck e build passaram.

## Alinhamento vertical da página de Filme

O grid do Hero usa `align-items: center`, e copy/overview declaram o mesmo alinhamento vertical. Em medição automatizada, a diferença entre os centros foi 0 px em 1920/2560 e 0,01 px em 3840. Conteúdo, cenários e Recomendados apresentaram a mesma coordenada lateral em cada resolução, sem overflow. Em 480 px, overview ficou abaixo do copy e a página manteve a largura do viewport. Os layouts completos M02/M04 em 1920 passaram **2/2**; lint, typecheck e build passaram. [Captura inspecionada](rich-movie-detail-1920.png). A tentativa inicial dos sete testes de imagem foi interrompida apenas por `ENOSPC` na gravação das capturas; nenhuma falha geométrica precedeu o erro de ambiente.

## Transparência do card de sinopse

Na página de Filme, `discovery-detail-hero-overview` passou a usar fundo `rgba(8, 12, 18, 0.58)` e preservou o blur de 14px. O backdrop atravessa mais o card sem afetar a opacidade do texto. [Interestelar em 1080p](rich-movie-detail-1920.png) foi regenerado e inspecionado. Os estilos computados e a geometria passaram nos seis layouts compartilhados de M02/M04 em 1080p/1440p/4K; os dois fluxos que renovam as capturas também passaram. O checkpoint M04 permanece PENDING.

## Recomendados imediatamente após o Hero

A página canônica de Filme deixou de renderizar a faixa inferior de fatos que duplicava título original, avaliação, disponibilidade e IMDb. `DiscoveryRail` é o próximo elemento do Hero e os cenários de revisão foram deslocados para depois das recomendações; Série continua com seus fatos no modal. O teste rico e os dois layouts 1920 passaram **3/3**. A verificação geométrica em 1920/2560/3840/480 encontrou `facts = 0`, gap estrutural de 0 px entre Hero e Recomendados e nenhum overflow; em Série encontrou um bloco de fatos preservado. Lint, typecheck, build e hashes passaram. [Captura inspecionada](rich-detail-1920.png). A regressão integral anterior permanece **141/141** e o checkpoint M04 continua PENDING.
