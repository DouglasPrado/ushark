# M04 — Frontend pronto para revisão UX

S00–S02 concluídas no checkout real. Home, busca/filtros, origens/coleções, detalhe comum por Content, teclado TV, retorno de foco e cenários de erro/offline/hydration implementados com mocks em memória. Catálogo extenso usa janela de 24 cards; não há FTS, watcher, persistência ou playback reais.

Validações: formatação dos arquivos alterados, lint/typecheck/build e diff check passaram; 15 testes M04, validação cruzada M02/M04 48/48 e regressão completa 136/136 passaram. [Evidências e acesso à prévia](evidence/VALIDATION.md). Capturas 1080p/1440p/4K; Electron macOS offline com controle sintético e foco visível. Hardware Windows/TV/gamepad físico e budgets reais pendentes.

Próxima ação: revisão humana do [checkpoint UX](UX_CHECKPOINT.md), READY_FOR_REVIEW/PENDING. M03 mantém seu aceite; a citação de aprovação indevidamente associada ao current M04 foi reconciliada com o checkpoint específico M03. Backend/S03–S08 continuam adiados pela onda frontend M01–M22. M04 não está DONE.

## Preparação documental — 2026-09-13

PREPARED: S00–S08 e ambos os roteiros de checkpoint conferidos; [cobertura por requisito](PREPARATION_COVERAGE.md) adicionada. Nenhuma story executada nesta preparação. Evidências e aceites anteriores preservados; backend/S03–S08 permanecem adiados até UX M01–M22.

## Auditoria transversal da fase frontend

Jornadas conectadas e correções finais registradas em [auditoria](../../execution/FRONTEND_COVERAGE_AUDIT.md) e [validação final](../../execution/evidence/FINAL_VALIDATION.md). Esta atualização não muda aceites humanos existentes. S03–S08 continuam adiadas.

## Ajuste durante a revisão — Home de streaming

A Home foi recomposta com cabeçalho sobreposto, navegação principal Início/Filmes/Séries/Bibliotecas, ações contextuais, Hero de largura total e trilhos horizontais panorâmicos. Busca preserva a grade vertical e os fluxos/dados mockados existentes. Setas/controle percorrem os cards e deslocam o trilho; teste dedicado e capturas 1080p/1440p/4K atualizadas cobrem o ajuste. A decisão UX de M04 continua PENDING.

## Ajuste durante a revisão — imagens IMDb na Home

O boundary `DiscoveryItem` passou a transportar `backdrop` opcional. A Home usa o backdrop horizontal do IMDb no Hero e nos trilhos panorâmicos do catálogo padrão, com fallback para o pôster; a busca vertical continua usando o pôster. O mock permanece local e offline, sem chamada de rede no renderer. Typecheck, lint, build Vite e os 12 testes focados de M04 passaram; [captura 1920×1080](evidence/imdb-home-1920.png). A decisão UX de M04 continua PENDING.

## Correção durante a revisão — Torrent Health

O primeiro selo de resolução não correspondia ao sinal solicitado. Home, busca e Hero agora mostram 1–5 barras crescentes, semelhantes a sinal de celular, acompanhadas do rótulo textual de Torrent Health. A resolução (`4K`/`1080p`) voltou para a linha de metadata. O valor vem do boundary mockado de M08 e é determinístico; não representa probe real nem dado do IMDb. A captura 1920×1080 foi renovada. A decisão UX de M04 continua PENDING.

No trilho de Séries, o badge passou a exibir `Média` e agrega uma vez cada torrent/source único da série, em vez de repetir a mesma source por episódio. No seed atual, Breaking Bad combina as duas sources de temporada em `Média · Muito bom`. A decisão UX de M04 continua PENDING.

## Ajuste durante a revisão — navegação espacial da Home

Os trilhos agora declaram eixo horizontal: esquerda/direita nunca saltam acidentalmente para outra seção, enquanto cima/baixo preservam a coluna visual entre trilhos. O card focado é centralizado com scroll suave, respeitando `prefers-reduced-motion`; manter o direcional pressionado produz repetição progressiva. Controle remoto e gamepad compartilham o mesmo caminho e o foco retorna ao card após fechar detalhes. A decisão UX de M04 continua PENDING.

## Ajuste durante a revisão — detalhe rico de Filme e Série

O modal comum foi recomposto como uma superfície cinematográfica: backdrop amplo, sinopse, badges de tipo/ano ou período/duração ou temporadas/avaliação/resolução/Torrent Health, gêneros, elenco quando disponível, votos, episódios, disponibilidade, IMDb ID e memberships. Assistir/Continuar, Baixar e Trailer ficam agrupados; o trailer abre como prévia local no próprio modal, com play/pause, progresso e fechamento em camada antes do detalhe. O boundary mockado passou a transportar os campos editoriais necessários sem acesso de rede no renderer.

Typecheck, lint, build e a suíte focada de comportamento/layout passaram **10/10**; a regressão completa passou **131/131**. Foram inspecionados [Filme 1080p](evidence/rich-movie-detail-1920.png), [trailer 1080p](evidence/rich-movie-trailer-1920.png) e [Série 1080p](evidence/rich-series-detail-1920.png), além do encaixe do modal em 1080p/1440p/4K. A prévia não é um trailer de provider nem reprodução real. A decisão UX de M04 continua READY_FOR_REVIEW/PENDING.

No ajuste seguinte, `Voltar` passou a ocupar a posição imediatamente posterior a Assistir/Continuar na mesma linha de ações, com ícone de retorno. O fechamento usa o próprio escopo do diálogo e restaura o foco no card de origem; o comportamento também permanece disponível no modo TV. A captura do trailer foi renovada e a regressão completa continuou verde em **131/131**.

## Ajuste durante a revisão — Recomendados

O rodapé do modal agora apresenta até seis recomendações em cards 16:9, com título, tipo, ano, avaliação e sinopse curta. A ordenação mockada é determinística e prioriza o mesmo tipo, gêneros compartilhados, memberships e avaliação, sempre removendo o título aberto. Selecionar um recomendado troca o conteúdo no próprio modal, volta ao topo e mantém o card externo original como destino de foco ao fechar. A [captura 1080p](evidence/rich-series-recommendations-1920.png) foi inspecionada; cinco testes focados e a regressão completa **131/131** passaram. M04 continua READY_FOR_REVIEW/PENDING.

## Ajuste durante a revisão — marca somente visual

A marca textual `Ushark` no cabeçalho deixou de ser botão e não participa mais da navegação por teclado, controle ou pointer; o texto também não pode ser selecionado acidentalmente. `Início` continua como ação explícita para retornar à Home. Um teste dedicado percorre Home, Filmes e Séries, e a regressão completa passou **133/133 em 2,3 min**. M04 continua READY_FOR_REVIEW/PENDING.

## Correção durante a revisão — contenção dos cards

Os cards da busca receberam uma superfície de mídia posicionada e recortada. Torrent Health agora é calculado contra a arte do próprio conteúdo, em vez da página, e sua largura máxima respeita o pôster em telas estreitas. A mesma contenção foi aplicada aos cards do catálogo de Filmes. O teste dedicado passou **2/2** em 480, 700, 761, 1100 e 1920 px; M04 continua READY_FOR_REVIEW/PENDING.

## Ajuste durante a revisão — detalhe de Filme como página

Filmes abertos pela Home ou busca deixaram de usar modal e agora ocupam exatamente a mesma página `#/content/:contentId` do catálogo M02, renderizada pelo componente compartilhado `ContentDetails`. O Hero, sinopse, badges, fatos, ações, trailer e Recomendados foram preservados; a lista subjacente fica oculta e a aba Filmes acrescenta somente suas ações contextuais de gestão. Voltar restaura consulta, scroll e card de origem, e a saída do player devolve foco a Assistir/Continuar. Séries continuam no modal existente. A validação direcionada passou **48/48** em browser, Electron e 1080p/1440p/4K; a regressão limpa passou **136/136 em 2,2 min**. M04 continua READY_FOR_REVIEW/PENDING.

## Ajuste durante a revisão — ordem das ações e foco inicial

A linha de ações agora começa com Voltar somente por ícone, Assistir/Continuar e Trailer; Baixar aparece depois quando disponível. O retorno mantém nome acessível e tooltip, sem texto visível. Assistir/Continuar recebe foco na abertura da página ou modal, na troca de recomendação e ao retornar do player. Quinze testes direcionados, seis layouts e a regressão completa **136/136 em 2,2 min** passaram; a captura `rich-detail-1920.png` foi inspecionada. M04 continua READY_FOR_REVIEW/PENDING.

## Ajuste durante a revisão — ações acima da sinopse

O agrupamento completo de ações foi reposicionado para imediatamente abaixo do Hero e acima da sinopse, tanto na página canônica de Filme quanto no modal de Série. Ordem, foco inicial em Assistir/Continuar, trailer e handlers foram preservados. Oito testes direcionados, seis layouts 1080p/1440p/4K, inspeção das capturas de Filme e Série, lint, typecheck, build e a regressão completa **138/138 em 2,2 min** passaram. M04 continua READY_FOR_REVIEW/PENDING.

## Ajuste durante a revisão — conteúdo junto à base do Hero

Na página canônica de Filme, a folga superior da faixa de ações caiu de 28px para 8px. Botões e todo o conteúdo abaixo sobem juntos e passam a encostar visualmente no fim do Hero, sem sobreposição; o modal de Série não foi alterado. Sete testes focados, incluindo seis layouts 1080p/1440p/4K com limite geométrico de 16px, lint, typecheck, build e a regressão completa **138/138 em 2,2 min** passaram. M04 continua READY_FOR_REVIEW/PENDING.

## Ajuste durante a revisão — título, ações e sinopse no Hero

A página canônica de Filme agora usa um grid de duas colunas dentro do Hero. Título, badges e ações ficam no mesmo bloco à esquerda, fazendo o título subir; sinopse, gêneros e elenco ocupam um card translúcido à direita. Os fatos continuam abaixo e o modal de Série não foi alterado. Sete testes focados verificam a hierarquia DOM e a geometria em 1080p/1440p/4K; lint, typecheck, build e a regressão final passaram **138/138 em 2,2 min**. A primeira rodada completa teve um timeout isolado no Electron, que passou sozinho em 3,1s e na repetição integral. M04 continua READY_FOR_REVIEW/PENDING.

## Ajuste durante a revisão — Recomendados no trilho compartilhado

O rodapé de `ContentDetails` deixou de manter cards próprios. Recomendados agora usa o mesmo `DiscoveryRail`/`DiscoveryCard` de `Filmes para descobrir`, `Continuar assistindo` e demais seções da Home: arte 16:9, título/tipo/ano/qualidade, Torrent Health, progresso quando existente, overflow e navegação horizontal. Ranking, exclusão do título atual, abertura na mesma superfície e restauração de foco foram preservados. A inspeção de [Filme em 1080p](evidence/rich-detail-1920.png) confirmou o padrão; a validação focada passou **19/19** após a reorganização A11. M04 continua READY_FOR_REVIEW/PENDING.

## Ajuste durante a revisão — transparência da sinopse

O card de sinopse do detalhe compartilhado de Filme agora deixa o backdrop mais visível: fundo escuro com 58% de opacidade e blur de 14px, sem aplicar opacidade ao texto. A mudança vale para a Home/busca e para Filmes porque ambas usam `ContentDetails`. [Captura atualizada](evidence/rich-movie-detail-1920.png). Os seis layouts 1080p/1440p/4K e dois fluxos de captura passaram **8/8**; M04 continua READY_FOR_REVIEW/PENDING.

## Ajuste durante a revisão — alinhamento vertical da página de Filme

As duas colunas do Hero agora compartilham o mesmo centro vertical, mantendo título/badges/ações à esquerda e sinopse/gêneros/elenco à direita. Fatos, cenários e Recomendados também usam uma única largura e guia lateral. A geometria passou em 1920/2560/3840 e o empilhamento responsivo passou em 480 px, sem overflow; os layouts completos M02/M04 em 1920 passaram **2/2**. A captura [rich-movie-detail-1920.png](evidence/rich-movie-detail-1920.png) foi inspecionada. M04 continua READY_FOR_REVIEW/PENDING.

## Ajuste durante a revisão — recomendações logo após o Hero

Na página canônica de Filme, a faixa que repetia título original, avaliação, disponibilidade, IMDb e memberships foi removida. Título e sinopse subiram discretamente dentro do Hero, e o trilho compartilhado Recomendados agora começa imediatamente abaixo dele; os cenários de revisão vêm depois. O modal de Série mantém seus fatos. O teste rico e os layouts M02/M04 em 1920 passaram **3/3**; a geometria adicional passou em 1920/2560/3840/480 sem overflow. Lint, typecheck, build e hashes passaram. A regressão integral anterior permanece **141/141** e M04 continua READY_FOR_REVIEW/PENDING.
