# Checkpoint UX — M02

Status: APPROVED. Decisão: APPROVED em 2026-09-13. Confirmação explícita do usuário: “UX Aprovada”.

## Pré-condições

S00–S02 executadas; contrato EXPERIENCE.md e evidências disponíveis. Tudo em memória; provider, catálogo, sources, refresh, merge e delete simulados. Reload pode reiniciar fixtures, sem promessa de persistência. Roteiro com dados neutros e imagens locais.

## Jornada para revisar

1. Partir da Home de M01, abrir Filmes vazio e cadastrar por “Buscar filme”; revisar resultado ambíguo antes de confirmar.
2. Simular sem resultado e provider offline; criar manualmente com título e poster opcional; abrir detalhes sem fonte.
3. Entrar por source declarada simulada e chegar à mesma revisão; confirmar duas vezes sem duplicar o filme.
4. Editar identificação; revisar conflito com Content existente e cancelar sem perda. Confirmar merge simulado preservando sources, memberships, favoritos e fixtures de progresso/histórico/overrides.
5. Favoritar, voltar à lista e reabrir detalhes; atualizar metadata preservando identidade e override visual da biblioteca sem mudar metadata global.
6. Ver zero/uma/múltiplas fontes, dados técnicos ausentes e imagem com falha; remover última source e manter Content.
7. Remover da biblioteca e inspecionar a distinção de apagar arquivo; cancelar ambas e confirmar somente na fixture. Nenhum arquivo real é apagado.
8. Injetar erro de salvar, retry e resposta de busca atrasada; verificar rascunho, seleção atual e ausência de duplicatas.
9. Percorrer com teclado/gamepad: foco visível, retorno ao card ou vizinho após remoção, B/Escape fecha somente a superfície atual. Inspecionar 1080p/1440p/4K e sessão Electron.

## Registro de evidências e decisão

Capturas, comandos/resultados, ambiente e pendências em [VALIDATION.md](evidence/VALIDATION.md). Suíte final: 29 testes passaram, incluindo os ajustes de foco e mouse→gamepad. Controle físico e Windows/TV exigem registro próprio; teste sintético/macOS não é evidência desses ambientes.

Aprovação humana: APROVADA. Nenhuma alteração solicitada neste checkpoint. M02 continua aberto: S03–S08 aguardam a conclusão da fase frontend M01–M22. O próximo frontend é M03, mediante sua preparação/execução própria.

## Ajuste posterior ao aceite

Em 2026-09-13, o usuário solicitou limpar a tela de Filmes e aproximá-la da versão real. Foram removidos o shell lateral, a barra permanente de instruções e avisos de mock/provisoriedade; ações secundárias passaram a ícones acessíveis no cabeçalho e nos detalhes. A alteração foi validada e está pronta para confirmação visual. O aceite histórico acima permanece registrado, mas não é reutilizado como aprovação automática desta alteração posterior.

Na mesma revisão posterior, a lista recebeu busca por título/original/gênero e ordenação por `Mais votados` ou `A–Z`, mantendo `Em destaque` como ordem inicial. [Captura](evidence/catalog-search-sort-1920.png). A regressão completa passou 132/132; esta ampliação também aguarda confirmação visual própria.

Solicitação de padronizar a visualização do filme entre Home e aba Filmes registrada em 2026-09-13. Atendida com uma única página `#/content/:contentId` e o mesmo componente cinematográfico para as duas entradas; a aba Filmes mantém apenas suas ações contextuais de gestão. Voltar restaura scroll e card de origem. A validação focada passou 48/48 e a regressão completa 136/136. O aceite histórico acima é preservado, mas não aprova automaticamente este ajuste posterior.

Solicitação posterior registrada em 2026-09-13: inverter a ordem das ações para manter Voltar somente como ícone à esquerda de Assistir/Continuar, Trailer à direita e foco inicial sempre na ação principal. O comportamento foi aplicado à página compartilhada e aos retornos de player/recomendação; a validação direcionada passou 15/15 e a regressão completa 136/136. Este refinamento permanece pronto para confirmação visual, sem reaproveitar automaticamente o aceite histórico.

Solicitação posterior registrada em 2026-09-13: conter badges e demais componentes internos dos filmes. O catálogo agora apresenta pôster e metadata numa única caixa responsiva; Health/favorito, título, ano, fontes, IMDb, votos, ID e gêneros permanecem dentro do card em 480–1920 px. A inspeção em 761 px e 19 testes focados passaram; a regressão completa fechou em 137/137. O ajuste está pronto para confirmação visual sem ampliar o aceite histórico.

Solicitação posterior registrada em 2026-09-13: manter Voltar, Assistir, Baixar e Trailer acima da sinopse. O agrupamento compartilhado agora ocupa a faixa imediatamente abaixo do Hero e antes do conteúdo descritivo; ordem e foco inicial foram preservados. A validação direcionada passou 8/8 e a regressão completa 138/138. O ajuste está pronto para confirmação visual sem ampliar o aceite histórico.

Solicitação posterior registrada em 2026-09-13: subir os elementos de `content/movie` para junto do bottom do Hero. A página canônica de Filme agora mantém apenas 8px antes da faixa de ações, sem sobreposição. A validação direcionada passou 7/7 e a regressão completa 138/138. O ajuste está pronto para confirmação visual sem ampliar o aceite histórico.

Solicitação posterior registrada em 2026-09-13: mover a sinopse para a direita, subir o título e colocar os botões na mesma `div` do título. O Hero da página canônica agora usa duas colunas com título/badges/ações juntos à esquerda e sinopse/gêneros/elenco à direita. A validação direcionada passou 7/7 e a regressão completa 138/138. O ajuste está pronto para confirmação visual sem ampliar o aceite histórico.

## Acesso à revisão

App → concluir onboarding → Filmes. No cabeçalho, o menu “Opções” permite alternar o conteúdo da biblioteca e os estados da interface usados na revisão. [Lista](evidence/list-1920.png), [detalhes no Electron](evidence/electron-details.png) e [fontes](evidence/sources-1920.png). Aprovação deve avaliar o roteiro acima; capturas não substituem interação.

Solicitação posterior registrada em 2026-09-13: reutilizar em Recomendados o mesmo componente de `Filmes para descobrir` e `Continuar assistindo`. Atendida com o trilho/card panorâmico compartilhado, Health, qualidade, progresso opcional e navegação horizontal. A validação focada passou 19/19. O aceite histórico permanece preservado e não aprova automaticamente este refinamento.

Solicitação posterior registrada em 2026-09-13: alinhar verticalmente os elementos da página. Atendida centralizando as duas colunas do Hero no mesmo eixo e alinhando fatos, cenários e Recomendados pela mesma guia lateral. Em telas estreitas, os blocos empilham sem overflow. O aceite histórico permanece preservado e não aprova automaticamente este refinamento.

Solicitação posterior registrada em 2026-09-13: remover a faixa redundante de título original, avaliação e afins, subir a composição e puxar Recomendados logo abaixo. Atendida na página canônica compartilhada: os fatos duplicados saíram e o trilho passa a seguir imediatamente o Hero; Série continua com fatos no modal. A validação direcionada passou 3/3 e a geometria passou em 1920/2560/3840/480. O aceite histórico permanece preservado e não aprova automaticamente este refinamento.
