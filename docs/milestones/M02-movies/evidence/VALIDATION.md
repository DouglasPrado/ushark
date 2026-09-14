# M02 — Evidências da fase frontend

Data: 2026-09-12. Checkout real `/Users/douglasprado/www/ushark`. Ambiente: macOS Darwin 25.6.0 arm64, Node v26.8.1, Electron 44.3.0. Nenhum backend, persistência, provider remoto, torrent ou player real foi acrescentado.

## Entrega observável

[S00](../EXPERIENCE.md) define o contrato. [UI](../../../../apps/desktop/src/renderer/catalog/Movies.tsx), [estilos](../../../../apps/desktop/src/renderer/catalog/movies.css), [boundary](../../../../packages/types/src/movies.ts) e [adapters em memória](../../../../packages/mocks/services/movies.ts) implementam a jornada. A revisão posterior substituiu a lateral e o rodapé técnico por cabeçalho de streaming, navegação principal e ações compactas por ícones. O seed IMDb usa JPEGs locais de pôster/backdrop, carregados também pelo build via `file:`; os cenários técnicos preservam os SVGs sintéticos. Home de M01 abre Filmes; dados da coleção continuam disponíveis ao voltar à Home, mas reiniciar descarta a sessão.

## Validação executada

- `pnpm lint`, `pnpm typecheck`, `pnpm format:check` e `pnpm build`: aprovados. Após o último ajuste de foco, lint/typecheck/build passaram novamente; os arquivos alterados foram formatados.
- `pnpm exec playwright test --workers=1`: **29 passaram em 58,4 s no build final**, cobrindo M01 e M02.
- Após inspeção visual, foi refinado o foco inicial do modal de fontes: botão de fechar visível, em vez de ação no rodapé abaixo do scroll. A revalidação específica teve 13 casos aprovados. Em seguida, a garantia de contorno visível após mouse→gamepad ganhou um teste; toda a suíte final de 29 casos foi executada novamente e aprovada.
- Capturas: vazio/lista/detalhes/busca/fontes em 1920×1080, 2560×1440 e 3840×2160. Inspecionadas amostras de todas as resoluções, incluindo lista 4K, fontes 1080p e detalhes no Electron. Testes verificam ausência de overflow horizontal, CTAs visíveis e limites do modal.
- Electron real carregou `dist/index.html` por `file:`, operou offline, carregou posters/backdrop, favoritou e voltou da Home mantendo o estado. Nenhum erro JavaScript observado; `window.require` ausente. Testes M01 revalidaram sandbox/contextIsolation/nodeIntegration e janela/fullscreen simples macOS.
- Ajuste visual posterior: os testes M02 verificam ausência da lateral/rodapé e dos avisos internos, item ativo da navegação e ações secundárias acessíveis. Testes compartilhados de importação/seleção também passaram.
- Seed IMDb: o primeiro conjunto afetado passou 26/26; após tornar a metadata visível, a cobertura focada passou 21/21 e a regressão completa fechou em **123/123** em 2,4 min. Os testes verificam os oito IDs externos, ratings/votos, busca de `Interstellar` retornando `Interestelar` e apresentação dos dados no card/detalhe. A Home foi inspecionada com `Interestelar` como Hero. [Consulta, fixture e limites](IMDB_SEED.md).
- A inspeção do primeiro print encontrou capas antigas com títulos fictícios. Depois da correção intermediária por SVGs específicos, a solicitação final substituiu o seed por oito pôsteres e oito backdrops do IMDb, armazenados localmente. O teste de comportamento verifica os oito caminhos e imagens carregadas; o Electron confirma os mesmos assets via `file:` e offline. [Catálogo](imdb-movies-1920.png) e [detalhe](imdb-details-1920.png).
- Busca e ordenação posteriores: o campo procura termos normalizados em título localizado, original e gêneros; o seletor cobre `Em destaque`, `Mais votados` e `A–Z`. O teste conjunto M02/M03 verifica resultado filtrado e primeiro item de cada ordenação. [Captura 1080p](catalog-search-sort-1920.png). Typecheck, lint, build e regressão completa passaram **132/132 em 2,3 min**.
- Página canônica de Filme: Home/busca M04 e catálogo M02 renderizam `ContentDetails` sob `#/content/:contentId`, com a mesma composição, backdrop, trailer e Recomendados. A aba Filmes injeta somente favorito/fontes/edição/refresh/remoção no agrupamento de ações. O teste cruza as duas entradas, compara classe, rota e backdrop e verifica retorno de foco. A validação focada passou **48/48**; lint, typecheck, build e regressão completa passaram **136/136 em 2,2 min**.

## Cobertura de comportamento

| Garantia                                                          | Evidência                                                                                                                                                                                    |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Duas correspondências, entrada com source, favorito e duplicata   | [movies.behavior.spec.ts](../../../../tests/movies.behavior.spec.ts): cadastro ambíguo; duplo clique no mesmo tick; ID e favorito preservados                                                |
| Manual offline, campos obrigatórios, rascunho e sem imagem/source | Mesmo arquivo: cadastro manual com rede desativada, validação e Escape/reabertura                                                                                                            |
| Erro de salvar e retry                                            | Mesmo arquivo: falha, retomada da revisão e confirmação única                                                                                                                                |
| Cancelamento e resposta antiga                                    | Mesmo arquivo: relógio controlado, troca de consulta e cancelamento antes da resposta                                                                                                        |
| Identificação/merge e refresh                                     | Mesmo arquivo: cancelar união não muda origem; confirmar conserva favorito e fontes; refresh conserva ID e título da biblioteca                                                              |
| Remoção de membership/source versus arquivo                       | Mesmo arquivo: três confirmações distintas; arquivo apagado não remove entidade; última source não remove Content; adição posterior e foco no vizinho                                        |
| Erro de lista/imagem/provider                                     | Mesmo arquivo: catálogo conservado, fallback visual e erro de refresh sem bloquear detalhes                                                                                                  |
| Teclado/gamepad sintético                                         | Mesmo arquivo: foco preso/restaurado, A/B sem dupla navegação, setas ajustam opção nativa, contorno de foco permanece visível após mouse e busca vazia oferece manual                        |
| Estado conservado no merge                                        | [movies.catalog.spec.ts](../../../../tests/movies.catalog.spec.ts): sources, duas bibliotecas, override ativo/arquivado, favorito, maior progresso, históricos e preferências dos dois lados |
| Falha atômica simulada e duplicata concorrente                    | Mesmo arquivo: sem mutação em falha, snapshots isolados, duas confirmações não duplicam Content/membership/source                                                                            |
| Remover e recolocar fonte não ressuscita arquivo                  | Mesmo arquivo: disponibilidade do arquivo tem estado separado do vínculo                                                                                                                     |
| Imagens locais e sessão no Electron                               | [movies.electron.spec.ts](../../../../tests/movies.electron.spec.ts): naturalWidth > 0 offline, backdrop, favorito, Home, reload preserva a conclusão do onboarding e volta à Home           |
| Layout/scroll/foco nas resoluções previstas                       | [movies.layout.spec.ts](../../../../tests/movies.layout.spec.ts): capturas e geometria do modal/fontes                                                                                       |
| Busca e ordenação do catálogo                                     | [movies.behavior.spec.ts](../../../../tests/movies.behavior.spec.ts): termos sem acento, título original/gêneros, mais votados e A–Z em Filmes e Séries                                      |
| Página de Filme idêntica em Home e Filmes                         | [discovery.behavior.spec.ts](../../../../tests/discovery.behavior.spec.ts): mesmo componente, rota, backdrop, conteúdo e restauração do card nas duas entradas                               |

Os testes de merge são da simulação frontend; não comprovam SQLite, transações ou migrações reais. Source Selection/Health não foram implementados. O roteiro por requisito, distinguindo mock de evidência definitiva, está em EXPERIENCE.md.

## Ajustes derivados das verificações

Corrigidos altura sob CSS zoom, precedência de CSS que cortava modal de fontes, foco na troca de painéis e após remoção, busca antiga/cancelada e arquivo apagado que reaparecia ao recolocar source. Assets usam caminhos relativos para abrir no Electron via `file:`.

O sandbox do macOS bloqueou a inicialização do Chromium; testes de navegador/Electron foram executados com a escalada aprovada. `ELECTRON_RUN_AS_NODE=1` herdado do ambiente impedia o Electron de abrir; removido apenas do ambiente do subprocesso desktop em testes e em `dev.mjs`.

Uma execução de M01/Electron janela chegou inesperadamente às configurações antes da asserção de Home. Não foi reproduzida na repetição isolada, em três repetições adicionais nem na suíte final. Causa não comprovada; não atribuída a correção de produto inexistente. O teste antigo de ArrowUp foi ajustado para ArrowDown e alvo explícito porque a tela inicial atual não possui controle acima de Começar. No teste de fontes, a espera agora confirma que o painel retornou e que a ação está habilitada antes de pressionar Escape.

## Como revisar

Abrir o app (`pnpm dev`; usar servidor existente se a porta 5173 já estiver ocupada) → concluir onboarding → Filmes. Para inspecionar uma coleção pronta: ícone de ajustes no cabeçalho → Catálogo → Preenchido. Conflito de identificação oferece dois registros com estado pessoal/overrides. Trocar o catálogo reinicia somente os dados dessa superfície; fechar diálogo antes de trocar o estado da interface. Cadastro sempre pode ser feito a partir da coleção vazia pelo ícone `+`.

Capturas para revisão: [lista 1080p](list-1920.png), [busca e ordenação 1080p](catalog-search-sort-1920.png), [lista 4K](list-3840.png), [detalhes Electron](electron-details.png), [busca de cadastro 4K](search-3840.png), [fontes 1080p](sources-1920.png).

## Ajuste posterior — página de detalhes

O detalhe de Filme deixou de ser modal e usa `ContentDetails` na página canônica compartilhada com M04 em `#/content/:contentId`. A página preserva backdrop, sinopse, badges, fatos, ações, trailer e Recomendados; as ferramentas contextuais de catálogo e os diálogos de edição/fontes continuam disponíveis somente pela entrada da aba Filmes. Voltar e saída do player restauram scroll e foco. A validação direcionada conjunta passou **48/48**, incluindo Electron e 1080p/1440p/4K; a regressão completa passou **136/136 em 2,2 min**. [Captura da página](details-1920.png). O aceite histórico de M02 foi preservado, e a alteração posterior aguarda confirmação visual.

## Pendências explícitas

A UX humana original de M02 foi aprovada explicitamente em 2026-09-13 e confirmada pelo usuário: “UX Aprovada”. O ajuste visual posterior está pronto para nova confirmação, sem aprovação inferida. Windows x64, TV/Sunshine/Moonlight e controle físico não foram exercitados. Nenhuma medição real dos NFRs de cache/provider/persistência. S03–S08 permanecem adiadas conforme a fase frontend M01–M22; M02 não está DONE e não há aceite funcional. Nenhum commit, merge ou publicação externa realizado.

## Correção de contenção durante a revisão

`movie-card-media` passou a ancorar e recortar Health/favorito dentro do pôster. `tests/card-containment.spec.ts` percorreu 480, 700, 761, 1100 e 1920 px sem encontrar overlay fora da superfície; o caso específico passou **2/2** junto com a busca M04. Lint, typecheck e build passaram no checkout atual.

## Ordem das ações e foco inicial do detalhe

Na página canônica compartilhada com M04, Voltar agora é um ícone acessível à esquerda de Assistir/Continuar, e Trailer fica imediatamente à direita. Abrir um filme pelo catálogo, retornar do player ou trocar para um recomendado posiciona o foco em Assistir/Continuar. A validação direcionada conjunta passou **15/15**, incluindo seis layouts de Discovery/Filmes; typecheck, lint e build passaram. A regressão completa permaneceu em **136/136 em 2,2 min**. [Captura 1080p](../../M04-home-search/evidence/rich-detail-1920.png). O aceite histórico de M02 não foi ampliado automaticamente para este ajuste.

## Contenção dos componentes internos dos cards

O catálogo passou a tratar pôster e metadata como uma única superfície: `movie-card-media` contém Health/favorito e `movie-card-copy` contém título, ano, fontes, qualidade, IMDb, votos, identificador e gêneros. A caixa interna limita largura, recorta e trunca texto excedente; o breakpoint até 1000 px usa três colunas para não comprimir os componentes. `tests/card-containment.spec.ts` valida a geometria de overlays e conteúdo em 480, 700, 761, 1100 e 1920 px. [Captura inspecionada em 761 px](card-internals-761.png). Os **19/19 testes focados**, lint, typecheck e build passaram; a regressão completa passou **137/137 em 2,2 min**. O aceite histórico não foi ampliado automaticamente.

## Ações acima da sinopse

Na página canônica de Filme, `discovery-detail-actions` passou a vir imediatamente após o Hero e antes do bloco que começa pela sinopse. A ordem Voltar, Assistir/Continuar, Trailer, Baixar e ações contextuais, bem como o foco inicial na reprodução, foram mantidos. O teste de comportamento verifica a ordem semântica e a posição vertical, e os três layouts de Filmes cobrem 1080p, 1440p e 4K. A validação direcionada conjunta passou **8/8**; lint, typecheck, build e regressão completa passaram **138/138 em 2,2 min**. [Captura 1080p](../../M04-home-search/evidence/rich-movie-detail-1920.png). O aceite histórico não foi ampliado automaticamente.

## Conteúdo junto à base do Hero

A página canônica de Filme passou a aplicar 8px de `padding-top` na faixa de ações, em vez dos 28px compartilhados. O restante do conteúdo sobe pelo fluxo normal, sem margem negativa nem sobreposição. Os três layouts de Filmes e os três de Discovery limitam a distância entre o Hero e o primeiro botão a 16px em 1080p, 1440p e 4K. Com o teste rico, a validação focada passou **7/7**; lint, typecheck, build e regressão completa passaram **138/138 em 2,2 min**. [Captura 1080p](../../M04-home-search/evidence/rich-movie-detail-1920.png). O aceite histórico não foi ampliado automaticamente.

## Composição interna do Hero

Na página canônica, `discovery-detail-hero-copy` passou a conter título, badges e o bloco completo de ações. A sinopse, os gêneros e o elenco ficam em `discovery-detail-hero-overview`, na coluna direita do mesmo Hero; fatos permanecem abaixo. Os três layouts de Filmes e os três de Discovery verificam título acima dos botões, sinopse à direita e limites internos em 1080p, 1440p e 4K. Com o teste rico, a validação focada passou **7/7**; lint, typecheck e build passaram. Após um timeout isolado do próprio caso Electron M02, ele passou sozinho em **3,1s** e a repetição integral fechou em **138/138 em 2,2 min**. [Captura 1080p](../../M04-home-search/evidence/rich-movie-detail-1920.png). O aceite histórico não foi ampliado automaticamente.

## Recomendados com o componente da Home

O detalhe compartilhado usa agora `DiscoveryRail`/`DiscoveryCard` também em Recomendados, eliminando a grade exclusiva anterior. A composição é a mesma dos trilhos `Filmes para descobrir` e `Continuar assistindo`: arte 16:9, título/tipo/ano/qualidade, Torrent Health, progresso opcional e navegação horizontal. Ranking, exclusão do título atual, troca na mesma página e retorno final permanecem intactos. A validação focada conjunta, incluindo layouts e gates de estrutura/design system, passou **19/19**; lint, typecheck e build passaram. [Captura 1080p](../../M04-home-search/evidence/rich-detail-1920.png). O aceite histórico não foi ampliado automaticamente.

## Transparência do card de sinopse

O card `discovery-detail-hero-overview` usa agora `rgba(8, 12, 18, 0.58)` com blur de 14px; somente o fundo ficou mais transparente, enquanto texto, gêneros e borda preservam sua opacidade. Os testes dos dois pontos de entrada verificam os estilos computados e a geometria em 1920×1080, 2560×1440 e 3840×2160. Os seis layouts e os fluxos de captura de M02/M04 passaram **8/8**. [Captura atualizada](../../M04-home-search/evidence/rich-movie-detail-1920.png). A primeira tentativa em resoluções altas foi interrompida apenas por `ENOSPC` ao gravar traces; caches temporários foram removidos e a repetição sequencial, sem traces, passou 6/6.

## Alinhamento vertical do detalhe

`discovery-detail-hero-layout` centraliza agora copy e overview no mesmo eixo vertical. As medições registraram diferença de centro de 0 px em 1920/2560 e 0,01 px em 3840; conteúdo, cenários e Recomendados compartilham a mesma guia lateral. Em 480 px, a sinopse empilha abaixo do bloco principal sem overflow. Os layouts completos M02/M04 em 1920 passaram **2/2**, além de lint, typecheck e build. [Captura 1080p](../../M04-home-search/evidence/rich-movie-detail-1920.png). O aceite histórico não foi ampliado automaticamente.

## Faixa duplicada removida e recomendações após o Hero

O detalhe compartilhado de Filme não renderiza mais `discovery-detail-facts`; os sinais relevantes permanecem nos badges e na composição do Hero. O trilho Recomendados é o elemento seguinte e precede os cenários de revisão. A variante de Série conserva os fatos no modal. O comportamento rico e os layouts M02/M04 em 1920 passaram **3/3**; a verificação geométrica confirmou a estrutura sem overflow em 1920/2560/3840/480. Lint, typecheck, build e hashes passaram. [Captura 1080p](../../M04-home-search/evidence/rich-detail-1920.png). A regressão integral anterior permanece **141/141** e o aceite histórico não foi ampliado automaticamente.
