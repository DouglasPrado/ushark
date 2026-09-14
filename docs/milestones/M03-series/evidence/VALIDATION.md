# M03 — Evidências frontend

Data: 2026-09-13. Checkout real `/Users/douglasprado/www/ushark`; Darwin 25.6.0 arm64, Node v26.8.1, Electron 44.3.0, Chromium via Playwright 1.63.0. S00–S02 apenas. Não houve commit, merge ou publicação.

## Resultado

- `pnpm typecheck`, `pnpm lint`, `pnpm build`: passaram.
- `pnpm exec prettier --check` nos arquivos de código e testes alterados por M03: passou.
- `pnpm exec playwright test`: **39 passed (30.5s)**; 10 testes M03 e 29 de regressão M01/M02. Não houve testes ignorados nesta execução.
- `git diff --check`: passou.

## Evidências por risco

| Risco / jornada                          | Evidência                                                                                                                                                                                                                                |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UJ06, hierarquia e especiais             | `series.layout.spec.ts`: três viewports, confirmação de pack multitemporada e detalhes                                                                                                                                                   |
| UJ55, colisão, revisão manual e rascunho | `series.behavior.spec.ts`: desconhecido→especial, correção isolada, legenda, colisão excluída explicitamente, arquivo duplo para depois, cancelamento sem mutação, rascunho entre Home/Séries, falha e retry, reabrir associações salvas |
| Foco e múltiplas fontes                  | Mesmo arquivo de testes: Tab/Enter/Escape, retorno episódio→temporada→card, duas fontes sem duplicar série                                                                                                                               |
| Resposta antiga e escala                 | Loading lento não sobrescreve erro mais recente; retry e offline; 20.000 episódios em 100 temporadas com 20 temporadas/episódios renderizados por página e retorno à página anterior                                                     |
| Gamepad e repetição                      | Controle sintético A/B/analógico, select de legenda, focus trap e duplo clique de confirmação                                                                                                                                            |
| Identidade e selectors                   | `series.catalog.spec.ts`: saves concorrentes, IDs independentes, relações por source, correção mantém outra source e identidade; snapshot não pode mutar catálogo; entrada inválida/ambígua rejeitada sem mutação                        |
| Electron real                            | `series.electron.spec.ts`: pacote `file:`, contexto offline, season pack→episódio→arquivo, foco, ausência de pageerror/Node no renderer e reset da sessão ao recarregar                                                                  |
| Busca e ordenação do catálogo            | `movies.behavior.spec.ts`: termos sem acento, título original/gêneros, mais votados e A–Z em Séries e Filmes                                                                                                                             |

## Capturas inspecionadas

- [Revisão 1080p](review-1920.png), [1440p](review-2560.png), [4K](review-3840.png).
- [Temporadas 1080p](seasons-1920.png), [1440p](seasons-2560.png), [4K](seasons-3840.png).
- [Episódio no Electron macOS](electron-episode.png).
- [Busca e ordenação 1080p](catalog-search-sort-1920.png).

Inspeção visual direta: revisão 1080p, temporadas 4K e episódio no Electron. Todas as resoluções têm assertions de overflow e bounds do diálogo. A primeira passagem revelou diálogo fora da viewport em 4K devido ao zoom global; corrigido com especificidade e limite de altura compensado, e as três resoluções passaram novamente. Os testes de edição verificam foco após alterar temporada: grupos são estáveis pela sugestão inicial para não remontar o campo durante digitação.

## Limites

Catálogo, sugestões de identificação, arquivos e legendas são declarativos, em memória. Nenhuma inferência, leitura real, provider, persistência do catálogo ou player. O corpus grande prova paginação de DOM, não índices/latência de banco. Arquivo duplo exige escolha manual de um episódio ou exclusão explícita da confirmação; nunca funde episódios. Ao confirmar com arquivos deixados para depois, o rascunho completo permanece para retomada e a fonte salva pode ser reaberta por episódio. Reiniciar descarta esses dados, mas preserva o marcador local de onboarding concluído.

Windows, TV física, distância de leitura e gamepad físico permanecem PENDING. UX humana PENDING; integração/funcional S03–S08 DEFERRED até a onda frontend M01–M22. M03 não está DONE.

## Ajuste de catálogo padrão — 2026-09-13

O [seed IMDb de séries](IMDB_SERIES_SEED.md) adicionou oito séries reais e 16 artes locais, mantendo 48 episódios como fixtures explícitas. A navegação de Séries foi alinhada a Filmes/Home e a Home passou a receber os mesmos backdrops. Validação posterior: typecheck, lint, build e regressão completa **125/125**; Electron offline carregou as imagens locais. O aceite histórico acima permanece, mas este ajuste visual posterior aguarda confirmação própria.

O primeiro ajuste interpretou incorretamente o selo como resolução. Após esclarecimento do usuário, cards e detalhe passaram a mostrar Torrent Health com 1–5 barras crescentes e rótulo textual; `4K`/`1080p` ficam na metadata. O valor é um snapshot determinístico do `MockSelectionPreview`, permitido pelo frontend-first, e não probe real ou dado do IMDb.

Cada linha de episódio agora apresenta seu Health; quando há mais de uma source, usa a média das sources únicas daquele episódio. Capa/card e detalhe mostram `Média` e agregam somente `sourceId`s únicos da série, evitando multiplicar uma source compartilhada por todos os episódios de uma temporada. [Catálogo](imdb-series-1920.png), [detalhe](imdb-series-detail-1920.png) e [episódios](imdb-series-episodes-1920.png) foram regenerados e inspecionados em 1920×1080. Os 16 testes focados de M03/M04 e a regressão completa **125/125** passaram.

## Ajuste de arte por episódio — 2026-09-13

O [print atualizado dos episódios](imdb-series-episodes-1920.png) foi inspecionado em 1920×1080: cada linha reserva uma thumbnail 16:9, sem deslocar código, título, fonte, resolução, Health ou ação. Até o usuário enviar uma arte própria, o backdrop da série funciona como prévia; ausência total de arte mostra fallback com as mesmas dimensões.

No detalhe, o input aceita JPEG/PNG/WebP/GIF com extensão e MIME coerentes, arquivo não vazio e limite de 12 MB. O [seletor de arte](episode-artwork-upload-1920.png) usa texto em português e mantém o input real acessível. O teste novo rejeita texto, aplica um GIF, confirma data URL no detalhe e verifica a mesma imagem no card após fechar o modal. A suíte focada passou **6/6** e `pnpm test` passou **128/128 em 2,2 min**, incluindo os três layouts de Séries e Electron macOS. O mock guarda o arquivo somente na sessão; a validação de magic bytes e a persistência/cópia segura pertencem à integração futura.

## Ajuste de busca e ordenação — 2026-09-13

O catálogo de Séries ganhou busca local por termos normalizados em título localizado, original e gêneros, além de `Em destaque`, `Mais votados` e `A–Z`. A [captura 1080p](catalog-search-sort-1920.png) foi inspecionada. O teste conjunto M02/M03 e a regressão completa passaram **132/132 em 2,3 min**; não há índice, provider ou ranking de backend.
