# Atualização — UX frontend de M02 aprovada

## Reparo pós-checkpoint — merge de Content importado

Em 2026-09-14, o merge passou a migrar também
`content_source_selectors`, na mesma transação que move `content_sources`.
Isso impede que o cascade do Content provisório apague o arquivo torrent
selecionado antes da reprodução. O teste de merge agora cobre a relação real e
o banco local foi reparado após backup. Evidência cruzada:
[M07 — importação até exibição](../M07-progressive-playback/evidence/POST_CHECKPOINT_DISPLAY_REPAIR.md).
M02 continua `READY_FOR_REVIEW/PENDING`.

## S03 — contrato real do catálogo — 2026-09-14

Definidos schema/protocolo v1, limites, snapshot/revisão, taxonomia de erros e capability Core/preload para leitura, busca de metadata, save/merge, favorito, refresh, sources, memberships e delete gerenciado. Mutations usam idempotência e revisão opcional; o renderer nunca envia path para exclusão. D03/D19 foram resolvidas com merge conservador e precedência de apresentação explícita. [Contrato](evidence/DOMAIN_CONTRACT.md) · [decisão](../../decisions/M02-D03-D19-catalog-identity-and-presentation.md).

## S04.1 — catálogo SQLite transacional — 2026-09-14

O banco do M01 recebeu migration aditiva v2 para `contents`, `movies`, `sources`, relações, memberships, estado pessoal, revisões e idempotência. O Core persiste e reabre o catálogo mantendo ordem; merge é uma transação conservadora, com rollback integral, e remoções de vínculo/source não apagam Content nem arquivo. Seis testes de store passaram junto de typecheck e lint afetado.

## S04.2 — provider TMDB e cache — 2026-09-14

Implementado adapter TMDB real no Core com base HTTPS fixa, token fora do renderer, cache SQLite, limites, validação de payload, timeout, cancelamento e fallback degradado. Cinco testes do provider e onze testes combinados de backend passaram. Não existe `USHARK_TMDB_TOKEN` configurado neste ambiente, portanto nenhuma chamada externa foi alegada; o smoke real continua pendente no checkpoint funcional.

## S04.3 — imagens e arquivo gerenciados — 2026-09-14

O cache de imagens aceita somente `https://image.tmdb.org/t/p/`, valida tamanho e magic bytes, grava por hash de forma atômica e expõe apenas URI `ushark-asset://`. Downloads cancelados não deixam parcial. Exclusão recebe IDs e confirmação, resolve o path apenas no Core e rejeita arquivo fora da raiz gerenciada; source e Content permanecem após delete. O conjunto S04 passou 15/15 testes, typecheck e lint afetado.

## S05 — integração Electron — 2026-09-14

O Electron passou a usar `MovieCatalogApplicationService` por IPC/preload restritos e o renderer ganhou `DesktopMovieCatalog`; o browser continua com mocks. Ferramentas de fixture e integrações simuladas futuras ficam ocultas no caminho real. A jornada catálogo vazio → provider não configurado → cadastro manual → favorito → Home → reload/restart foi comprovada offline. A suíte afetada passou 49/49, além de typecheck, lint e build. M02 está [pronto para checkpoint funcional](FUNCTIONAL_CHECKPOINT.md), com decisão humana, smoke TMDB e hardware ainda pendentes.

S00–S02 implementadas no checkout real: lista, cadastro manual/busca mockada, revisão de identificação/duplicata/merge, detalhes com assets locais, favoritos, fontes e remoções distintas. Cancelamento, retry e foco têm validação. Dados ficam em memória e sobrevivem à navegação pela Home; reload reinicia a sessão.

Estado: FRONTEND_UX_APPROVED. O usuário confirmou explicitamente em 2026-09-13: “UX Aprovada”. Próxima ação: preparar M03 quando autorizado. S03–S08 de M02 permanecem adiadas até a fase frontend M01–M22 aprovada; M02 não está DONE. M01 mantém UX aprovada e integração adiada.

Validação: lint, typecheck, formatação e build aprovados; suíte final M01/M02 com 29 testes passou em 58,4 s, incluindo foco visível ao alternar de mouse para gamepad. Capturas 1080p/1440p/4K e Electron macOS inspecionadas. [Evidências e roteiro](evidence/VALIDATION.md).

Correções relevantes: viewport com zoom, modal de fontes limitado à tela, foco visível e restaurado, resposta de busca cancelada, arquivo simulado apagado não reaparece ao recolocar source; assets relativos funcionam via file: no Electron. Lançamento desktop ignora ELECTRON_RUN_AS_NODE herdado, sem mudar ambiente global.

Pendências: Windows/TV e gamepad físico; backend/persistência/provider/torrent/player reais e fechamento funcional. Uma falha inicial de navegação Electron não foi reproduzida nas repetições nem na suíte final; registrada sem atribuir causa não comprovada. Nenhum commit/merge/publicação externa.

## Preparação documental — 2026-09-13

PREPARED: S00–S08 e ambos os roteiros de checkpoint conferidos; [cobertura por requisito](PREPARATION_COVERAGE.md) adicionada. Nenhuma story executada nesta preparação. Evidências e aceites anteriores preservados; backend/S03–S08 permanecem adiados até UX M01–M22.

## Auditoria transversal da fase frontend

Jornadas conectadas e correções finais registradas em [auditoria](../../execution/FRONTEND_COVERAGE_AUDIT.md) e [validação final](../../execution/evidence/FINAL_VALIDATION.md). Esta atualização não muda aceites humanos existentes. S03–S08 continuam adiadas.

## Ajuste visual posterior — 2026-09-13

Por solicitação do usuário, Filmes abandonou o shell lateral e a barra inferior de inspeção. A superfície agora usa o mesmo cabeçalho de streaming da Home, com navegação principal e ações compactas por ícones para importar, downloads, adicionar, filtrar, favoritar, gerenciar fontes, editar, atualizar e remover. Textos internos sobre mock, prévia, simulação, provider futuro e arquivos de exemplo foram retirados da interface; os limites técnicos continuam documentados nas evidências.

As capturas 1080p/1440p/4K foram renovadas e inspecionadas. Um novo teste impede o retorno da lateral/rodapé, verifica a navegação ativa, os ícones e a ausência dos avisos internos. A cobertura atual possui 123 casos validados após o modo TV, os gates A11 e o fixture IMDb. O aceite histórico de M02 é preservado, mas esta alteração posterior permanece disponível para confirmação visual do usuário; nenhuma nova aprovação foi inferida.

## Seed padrão IMDb — 2026-09-13

Por solicitação do usuário, consultas pontuais aos datasets oficiais não comerciais `title.basics` e `title.ratings` materializaram oito filmes reais no mock padrão. Home e Filmes agora iniciam com Interestelar, Duna: Parte Dois, Oppenheimer, Parasita, Batman: O Cavaleiro das Trevas, Tudo em Todo Lugar ao Mesmo Tempo, A Viagem de Chihiro e O Poderoso Chefão. O mock guarda IMDb ID, título original, ano, duração, gêneros, nota e quantidade de votos; títulos de apresentação em português, sinopses e fontes continuam locais/sintéticos.

Não há chamada de rede em runtime, credencial no renderer ou provider real. Os cenários sintéticos anteriores continuam isolados para vazio, conflito e falhas. A regressão completa passou 123/123; consulta, implementação, validação e limites de licença estão em [IMDB_SEED](evidence/IMDB_SEED.md). O ajuste não avança S03–S08 e permanece sujeito à confirmação visual da revisão final.

Na primeira inspeção, os cards reais ainda apontavam para artes antigas que exibiam títulos fictícios dentro do SVG. O mapeamento foi substituído temporariamente por oito SVGs próprios, uma etapa intermediária depois superada pela solicitação explícita das imagens IMDb.

Na inspeção seguinte, o usuário apontou que os dados IMDb ainda não estavam visíveis na listagem. Cada card agora mostra ano, duração, gêneros, nota, votos e `tt-ID`; detalhes mostram também o título original. A cobertura focada passou 21/21 e a regressão completa 123/123. [Captura com metadata visível](evidence/imdb-movies-1920.png).

Na correção final, “Precisa estar com as imagens do imdb a capa e etc”, cada um dos oito títulos recebeu um pôster vertical e um backdrop horizontal obtidos da respectiva página pública no IMDb. Os 16 JPEGs ficam locais para operação offline; o renderer não faz hotlink nem request em runtime. A origem exata e o limite de licença estão registrados no [manifesto dos assets](../../../apps/desktop/public/movie-art/imdb/README.md). [Catálogo com os oito pôsteres](evidence/imdb-movies-1920.png) e [detalhe com backdrop](evidence/imdb-details-1920.png).

Durante a revisão do sinalizador, os cards de Filmes receberam o indicador compartilhado de Torrent Health: barras crescentes tipo sinal de celular mais o rótulo textual. A resolução continua separada na metadata (`2160p` apresentado como `4K`); o ícone de favorito fica no canto oposto. O Health é um snapshot determinístico do mock M08, sem alegar probe real. O print do catálogo foi regenerado; o aceite histórico é preservado e não é estendido automaticamente a esta alteração visual.

## Ajuste posterior — busca e ordenação do catálogo

A lista de Filmes recebeu busca local por título localizado, título original e gêneros, ignorando acentos/caixa e aceitando termos separados. O seletor oferece `Em destaque`, `Mais votados` e `A–Z`; a primeira opção conserva a curadoria atual, enquanto votos usam o snapshot IMDb. [Captura 1080p](evidence/catalog-search-sort-1920.png). O teste conjunto com Séries e a regressão completa passaram **132/132 em 2,3 min**. O aceite histórico de M02 é preservado; esta alteração posterior aguarda confirmação própria.

No ajuste transversal seguinte, a marca `Ushark` do cabeçalho deixou de ser botão e saiu da sequência de foco/controle; `Início` é a ação explícita para voltar à Home. A regressão completa passou 133/133. O aceite histórico de M02 permanece preservado.

## Ajuste posterior — detalhe como página

O filme selecionado agora abre na mesma página `#/content/:contentId` usada pela Home/busca, sem caixa modal ou overlay. O componente cinematográfico compartilhado mantém backdrop, sinopse, badges, fatos, ações e Recomendados; a aba Filmes acrescenta somente suas ações contextuais de gestão. Voltar retorna ao card e restaura scroll/foco. A saída do player reabre a mesma página com foco em Assistir/Continuar, inclusive para filme importado. Séries não foram alteradas e continuam em modal. A validação direcionada passou **48/48** e a regressão completa **136/136 em 2,2 min**. O aceite UX histórico de M02 continua preservado; esta alteração posterior aguarda confirmação visual própria.

## Correção durante a revisão — contenção dos cards

O pôster, o badge de Torrent Health e o favorito agora compartilham uma superfície interna própria, com posicionamento e recorte no raio do card. Os overlays deixam de depender do botão inteiro e permanecem dentro da arte inclusive nos breakpoints estreitos. Um teste geométrico dedicado cobre 480, 700, 761, 1100 e 1920 px. O aceite histórico de M02 permanece preservado; esta correção não implica novo aceite UX.

## Ajuste posterior — ações do detalhe

Voltar passou a ser um botão compacto somente por ícone à esquerda de Assistir/Continuar, e Trailer ocupa imediatamente o lado direito da reprodução; Baixar e ferramentas de gestão seguem depois. A ação Assistir/Continuar recebe foco ao abrir o filme, trocar uma recomendação ou retornar do player. Quinze testes direcionados, layouts 1080p/1440p/4K e a regressão completa **136/136 em 2,2 min** passaram. O aceite histórico de M02 permanece preservado; esta alteração posterior aguarda confirmação visual.

## Correção posterior — componentes internos dos cards

Pôster, Torrent Health, favorito, título e metadata agora formam uma única superfície visual. `movie-card-copy` limita e recorta os componentes textuais; título usa até duas linhas e ano/fontes, gêneros, votos e IMDb ID truncam dentro da largura disponível. Entre 761 e 1000 px, o catálogo usa três colunas em vez de quatro. A validação geométrica cobre todo o conteúdo em 480, 700, 761, 1100 e 1920 px; 19 testes focados e a regressão completa **137/137 em 2,2 min** passaram. [Captura em 761 px](evidence/card-internals-761.png). O aceite histórico permanece preservado e este ajuste aguarda confirmação visual.

## Ajuste posterior — ações acima da sinopse

Na página canônica compartilhada com M04, Voltar, Assistir/Continuar, Trailer, Baixar e ferramentas de gestão agora ficam imediatamente abaixo do Hero e acima da sinopse. A ordem, o foco inicial e os comportamentos existentes não mudaram. Oito testes direcionados, incluindo os layouts 1080p/1440p/4K, lint, typecheck, build e a regressão completa **138/138 em 2,2 min** passaram. O aceite histórico de M02 permanece preservado; esta alteração posterior aguarda confirmação visual.

## Ajuste posterior — conteúdo junto à base do Hero

A página canônica de Filme reduziu a folga entre o Hero e a faixa de ações de 28px para 8px. Todo o conteúdo abaixo acompanha a subida, sem margem negativa ou sobreposição da imagem. Sete testes focados, incluindo os seis layouts 1080p/1440p/4K, lint, typecheck, build e a regressão completa **138/138 em 2,2 min** passaram. O aceite histórico de M02 permanece preservado; esta alteração posterior aguarda confirmação visual.

## Ajuste posterior — composição interna do Hero

Título, badges e ações agora compartilham o mesmo bloco à esquerda do Hero, elevando o título; sinopse, gêneros e elenco ocupam o card da coluna direita. Os fatos seguem abaixo e o modal de Série não mudou. Sete testes focados cobrem hierarquia e layouts 1080p/1440p/4K; lint, typecheck, build e a regressão final passaram **138/138 em 2,2 min**. O aceite histórico de M02 permanece preservado; esta alteração posterior aguarda confirmação visual.

## Ajuste posterior — Recomendados no componente compartilhado

Na página canônica, Recomendados passou a usar o mesmo `DiscoveryRail`/`DiscoveryCard` dos trilhos da Home, incluindo arte horizontal, qualidade, Torrent Health, progresso opcional e navegação lateral. O ranking e a abertura do próximo detalhe foram preservados. A validação focada de M02/M04 e estrutura passou **19/19**. O aceite histórico de M02 permanece preservado; esta alteração posterior aguarda confirmação visual.

## Ajuste posterior — transparência do card de sinopse

O fundo do card de sinopse na página canônica de Filme passou de aproximadamente 72% para **58% de opacidade**, mantendo o texto totalmente opaco, a borda e o blur de 14px. O backdrop fica mais presente sem reduzir contraste ou alterar a composição. Como `ContentDetails` é compartilhado, o resultado é idêntico ao abrir pela Home ou pela aba Filmes. [Print atualizado de Interestelar](../M04-home-search/evidence/rich-movie-detail-1920.png). Seis layouts 1080p/1440p/4K e dois fluxos de captura passaram **8/8**; a regressão integral anterior permanece **141/141**.

## Ajuste posterior — alinhamento vertical do detalhe

O Hero da página canônica passou a centralizar verticalmente o bloco de título/badges/ações com o card de sinopse/gêneros/elenco. Fatos, cenários e Recomendados também seguem a mesma guia lateral. A geometria passou em 1920/2560/3840 e o empilhamento em 480 px; os layouts completos M02/M04 em 1920 passaram **2/2**. O aceite histórico de M02 permanece preservado; esta alteração posterior aguarda confirmação visual.

## Ajuste posterior — faixa redundante removida

Na página canônica compartilhada com M04, a faixa de título original, avaliação, disponibilidade, IMDb e memberships deixou de repetir os dados do Hero. A composição principal subiu discretamente e Recomendados passou a ser o primeiro bloco após o Hero, antes dos cenários de revisão. Série permanece em modal com seus fatos. A validação direcionada passou **3/3** e a geometria responsiva passou em 1920/2560/3840/480 sem overflow. O aceite histórico de M02 permanece preservado; esta alteração posterior aguarda confirmação visual.

## Ajuste posterior — catálogo por categorias

Em 2026-09-14, Filmes adotou trilhos panorâmicos como a Home. A tela padrão reúne `Em destaque` e categorias de gêneros relacionados. Busca, Favoritos, `Mais votados` e `A–Z` preservam a grade única. O retorno do detalhe restaura o card exato. [Evidência e validação](../../execution/evidence/CATALOG_CATEGORY_RAILS.md).

## Ajuste posterior — busca recolhida

A busca permanente saiu da sequência inicial de foco. Uma lupa à direita, junto de Todos/Favoritos, expande o campo somente quando ativada; fechar ou usar Voltar/Escape limpa a consulta e restaura o foco na lupa. [Evidência e validação](../../execution/evidence/COLLAPSED_CATALOG_SEARCH.md).
