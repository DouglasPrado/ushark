# Checkpoint UX — M04

Status: READY_FOR_REVIEW. Decisão: PENDING. S00–S02 concluídas em 2026-09-13.

## Pré-condições e mocks

S00–S02 concluídas e evidenciadas. Catálogo, busca, progresso, memberships, sources, indexação e indisponibilidade de rede são simulados em memória; playback não é executado.

## Jornada para revisar

1. Abrir Home com o seed IMDb; verificar backdrop horizontal no Hero e nos trilhos, pôster vertical na busca, além de Continuar/filmes/séries/recentes/bibliotecas. Conferir também Home vazia e seções ocultas conforme contrato.
2. Navegar por teclado/gamepad, digitar busca sem teclado físico e cancelar; conferir Hero pausado durante foco/interação.
3. Buscar por título/original/série/episódio/biblioteca/coleção, incluindo Content fora dos cards montados.
4. Combinar e limpar tipo/recentes/favoritos/gênero/coleção; validar zero resultados, erro/retry e respostas antigas.
5. Abrir Filme e conferir a página dedicada em largura total, sem overlay ou papel de diálogo; abrir Série e confirmar que seu detalhe continua em modal. Em ambos, conferir backdrop, sinopse, gêneros, badges, avaliação/votos, duração ou temporadas/episódios, Torrent Health, IMDb ID, memberships e disponibilidade sem duplicatas.
6. Conferir o ícone Voltar sem texto à esquerda de Assistir/Continuar, com Trailer imediatamente à direita e Baixar depois. Assistir/Continuar deve receber foco sempre que o detalhe abrir, trocar de recomendação ou retornar do player. Abrir a prévia local do trailer; Escape fecha primeiro o trailer e Voltar sai da página/modal de detalhe, restaurando consulta, filtro, scroll e foco.
7. Repetir em lista extensa, Content sem source e remoção do item focado; acionar Continuar e conferir o encaminhamento simulado sem apresentar playback como entregue.
8. Descer até Recomendados; conferir seis cards 16:9 sem o título atual, abrir outro título na mesma superfície e verificar retorno ao topo. Ao sair, o foco deve voltar ao card externo original.
9. Inspecionar offline/sync/peers indisponíveis, poster/metadata ausentes e hydration tardia sem salto ou perda de foco.
10. Abrir biblioteca/coleção, falhar próxima página, repetir e conferir contexto; validar 1080p/1440p/4K e Electron.

## Evidências e decisão

Disponíveis: [evidências e roteiro de acesso](evidence/VALIDATION.md), capturas 1080p/1440p/4K, 15 testes M04, validação cruzada M02/M04 e Electron macOS offline com controle sintético. Windows/TV/gamepad físico pendentes. Avaliar clareza das seções, filtros, página de Filme, modal de Série, badges, ações agrupadas, trailer local, origens, entrada de texto, recuperação e legibilidade à distância. Aprovação humana explícita é obrigatória; não encerra M04 nem libera S03 antes da UX da onda M01–M22.

## Requested Changes

Solicitação de usar capa e demais imagens do IMDb registrada em 2026-09-13. Atendida no frontend com pôsteres verticais em Filmes/busca e backdrops horizontais no Hero/trilhos, todos locais e offline. O checkpoint continua PENDING até decisão explícita do usuário.

Solicitação de enriquecer o modal antes da abertura de Filme/Série registrada em 2026-09-13. Atendida com sinopse, metadata específica, badges, fatos, memberships, ações próximas e prévia local de trailer. A integração com provider de trailer e a reprodução real continuam adiadas; o checkpoint permanece PENDING até decisão explícita do usuário.

Solicitação de posicionar Voltar ao lado de Assistir registrada em 2026-09-13. Atendida nas variantes de Filme, Série e modo TV, mantendo o retorno de foco do diálogo. O checkpoint permanece PENDING.

Solicitação de adicionar Recomendados abaixo de todo o conteúdo registrada em 2026-09-13. Atendida com seis cards responsivos e troca de título dentro do modal; o ranking continua uma fixture local substituível. O checkpoint permanece PENDING.

Solicitação de tornar a logo `Ushark` não selecionável registrada em 2026-09-13. Atendida como marca textual estática, fora do foco e sem clique; a navegação para a Home permanece no item `Início`. O checkpoint permanece PENDING.

Solicitação de padronizar a visualização do filme entre Home e aba Filmes registrada em 2026-09-13. Atendida nas duas entradas com a mesma página `#/content/:contentId`, o mesmo componente em largura total e a mesma estrutura cinematográfica; a aba Filmes acrescenta somente suas ações contextuais de gestão. Séries preservam o modal. Voltar e o retorno do player restauram contexto e foco. O checkpoint permanece PENDING.

Solicitação de inverter as ações registrada em 2026-09-13. Atendida com Voltar somente por ícone à esquerda, Assistir/Continuar com foco inicial e Trailer imediatamente à direita; Baixar permanece depois. O foco também retorna à reprodução após recomendações e player. O checkpoint permanece PENDING.

Solicitação de manter Voltar, Assistir, Baixar e Trailer acima da sinopse registrada em 2026-09-13. Atendida reposicionando o agrupamento compartilhado entre o Hero e a sinopse na página de Filme e no modal de Série, sem alterar a ordem ou o foco inicial já solicitados. A validação direcionada passou 8/8 e a regressão completa 138/138. O checkpoint permanece PENDING.

Solicitação de subir os elementos de `content/movie` e encostá-los no bottom do Hero registrada em 2026-09-13. Atendida na página canônica de Filme com folga superior de 8px, sem sobrepor o backdrop e sem alterar o modal de Série. A validação direcionada passou 7/7 e a regressão completa 138/138. O checkpoint permanece PENDING.

Solicitação de colocar a sinopse à direita, subir o título e manter os botões na mesma `div` do título registrada em 2026-09-13. Atendida com duas colunas no Hero de Filme: bloco único de título/badges/ações à esquerda e sinopse/gêneros/elenco à direita. O modal de Série foi preservado. A validação direcionada passou 7/7 e a regressão completa 138/138. O checkpoint permanece PENDING.

## Atribuição do aceite

A citação “aprovado” que apareceu no STATE durante trabalho simultâneo corresponde ao [checkpoint M03](../M03-series/UX_CHECKPOINT.md), após correção do ícone de Séries. M04 não recebeu aceite nesta execução; seu estado é READY_FOR_REVIEW/PENDING.

## Revisão final consolidada

READY_FOR_REVIEW / decisão PENDING. A revisão intermediária foi adiada por instrução explícita, não aprovada. Usar o [roteiro único](../../execution/FRONTEND_REVIEW.md); resultados automatizados e inspeções não substituem sua decisão.

Solicitação de reutilizar em Recomendados o mesmo componente de `Filmes para descobrir` e `Continuar assistindo` registrada em 2026-09-13. Atendida com o trilho/card compartilhado, mantendo Health, qualidade, progresso opcional e navegação horizontal. A validação focada passou 19/19; o checkpoint permanece PENDING.

Solicitação de alinhar verticalmente os elementos da página registrada em 2026-09-13. Atendida na página canônica de Filme com as colunas do Hero no mesmo centro vertical e os blocos inferiores na mesma guia lateral. O comportamento responsivo empilha a sinopse abaixo do bloco principal. O checkpoint permanece PENDING.

Solicitação de remover a faixa redundante de título original, avaliação e afins, subir a composição e trazer Recomendados logo abaixo registrada em 2026-09-13. Atendida somente na página canônica de Filme: os fatos duplicados saíram, o Hero foi elevado e Recomendados é seu próximo bloco. O modal de Série preserva seus fatos. A validação direcionada passou 3/3 e a geometria responsiva passou em 1920/2560/3840/480. O checkpoint permanece PENDING.
