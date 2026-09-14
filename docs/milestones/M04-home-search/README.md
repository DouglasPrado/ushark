# M04 — Encontrar conteúdo e continuar pela Home

Status: READY_FOR_REVIEW — S00–S05 concluídas e UX aprovada. Checkpoint
funcional pronto, com decisão humana PENDING; S06–S08 não foram iniciadas e
M04 não está DONE.

## Objetivo e resultado

Descobrir conteúdo local rapidamente pela Home, busca global e filtros, abrindo o mesmo Content independentemente da origem e restaurando foco e contexto ao voltar. Biblioteca indexada deve aparecer offline, sem esperar scan, metadata remota ou health.

## Requisitos e fontes

FR-060, FR-081–FR-086, FR-168–FR-173, FR-175–FR-181; NFR-001–NFR-003, NFR-014–NFR-017, NFR-061, NFR-072, NFR-079, NFR-081–NFR-082, NFR-128, NFR-145, NFR-157; RX-009–RX-011. Ownership permanece na [matriz](../REQUIREMENTS_COVERAGE.md); preparação não significa entrega.

Fontes: [plano M04](../PLAN.md#m04), [requisitos funcionais](../../product/03-functional-requirements.md), [NFRs](../../product/04-non-functional-requirements.md), [jornadas](../../product/02-user-journeys.md) UJ07/41/43/44/51/52/53/77 e recortes UJ15/76/78; [A09](../../architecture/09-ux-navigation-spec.md) §§14–27/119–133 e [A06](../../architecture/06-data-model.md) §§54–56/106–114. Condicionais das fontes permanecem válidas.

## Dependências e limites

M02 e M03 fornecem catálogo e hierarquia na integração. M03 tem UX aprovada em seu checkpoint; preparar M04 não altera esse aceite. S00–S02 usam boundaries substituíveis e fixtures em memória; integrações reais exigem as dependências e aprovação UX da onda frontend M01–M22.

M04 consome progresso/favoritos, memberships, coleções e sources permitidas, sem assumir a produção desses dados: playback/progresso real em M05, curadoria em M12, importação em M13, subscriptions/sync em M16 e seleção/health em M08. Não criar dependência circular com M13/M16: M04 prova o contrato de leitura com dados locais controlados; os consumidores futuros comprovam seus fluxos reais e revalidam o contrato. O aceite de FR-086 neste marco cobre acesso e leitura local da subscription existente, não assinatura ou sync remoto. Favoritos são filtro; edição de coleções e estado pessoal permanece nos owners.

## Jornada e superfícies propostas

Home → seção ou busca → filtros/resultados → detalhes do Content → voltar ao mesmo item, consulta, filtro e posição. Continuar assistindo encaminha o Content e a posição ao boundary de playback; nesta fase o encaminhamento é simulado, sem alegar reprodução.

Superfícies propostas: `#/home`, `#/search`, catálogo `#/movies` e `#/series`, leitura `#/libraries/:libraryId` e `#/collections/:collectionId`; detalhes usam a rota canônica `#/content/:contentId`. Filmes abertos pela Home/busca e pela aba Filmes compartilham exatamente a mesma página; Séries preservam o modal de leitura. Os mesmos IDs/metadados M02/M03 são reutilizados sem duplicar seus comandos. Ver rotas efetivas no [contrato](EXPERIENCE.md). Busca por título, título original, série, episódio, nome de biblioteca ou coleção; nomes de origem não duplicam Content. Bibliotecas homônimas mantêm IDs distintos.

## Estados obrigatórios

Home carregada/vazia/loading/erro/offline; seção vazia oculta salvo intenção editorial; consulta vazia/sem resultado/em andamento/falha/retry; filtros combinados/limpos; metadata e poster ausentes; hydration tardia sem salto nem troca de foco; zero/uma/múltiplas sources; Content em múltiplas bibliotecas; catálogo grande; página seguinte falha; item focado removido; alteração externa/incremental simulada; sync/peer discovery indisponíveis. Hero não rouba foco nem rotaciona durante interação.

## Sequência preparada

- [S00 — Contrato da experiência](stories/S00-contract.md)
- [S01 — Home e busca mockadas](stories/S01-mock-ui.md)
- [S02 — Busca, filtros e foco](stories/S02-frontend-behavior.md)
- [Checkpoint UX](UX_CHECKPOINT.md)
- [S03 — Contrato de leitura e indexação](stories/S03-domain-contract.md)
- [S04 — Queries e indexação incremental](stories/S04-backend.md), S04.1–S04.3, uma por vez
- [S05 — Integração local](stories/S05-integration.md)
- [Checkpoint funcional](FUNCTIONAL_CHECKPOINT.md)
- [S06 — Regressões de jornada](stories/S06-tests.md)
- [S07 — Desempenho e hardening](stories/S07-hardening.md)
- [S08 — Closure](stories/S08-closure.md)

## Cobertura por etapa

| Requisitos                                          | Experiência S00–S02                                                        | Comprovação posterior                                               |
| --------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| FR-081–086; RX-010                                  | Hero, seções, progresso e acesso a bibliotecas; hydration e foco           | S03–S05 leitura local integrada; S06/S07 regressão e acessibilidade |
| FR-168–173/175; RX-009                              | Busca, filtros, memberships, coleções e offline                            | S03–S05 FTS e contrato consolidado; S06 isolamento/identidade       |
| FR-060/176–181; RX-011                              | Atualização simulada, janela de 24 cards, placeholders e imagens adequadas | S04 watcher/índices/paginação; S05 restart; S07 métricas reais      |
| NFR-001–003/014–017/061/072/079/081–082/128/145/157 | Corpus e protocolo definidos; limites da simulação explícitos              | S04–S07 queries, escala, thread, startup e p95; S08 auditoria       |

## Definition of Done

S00–S07 concluídas, checkpoints UX/funcional aprovados e S08 auditada. Busca local independente de cards montados e internet; Content consolidado com memberships e sources permitidas; atualização de um item sem rebuild global; restart exibe dados locais sem scan; foco preservado em listas grandes e hydration. Budgets medidos em ambiente compatível: cold <2s, warm <500ms como meta de otimização, conteúdo local <300ms após UI pronta e p95 de abertura de biblioteca indexada <300ms. Corpus: 100/1000/10000 Contents, 1/5 sources por Content e 1000/10000/50000 episódios. S00/S03 fixam protocolo, baseline e amostras; macOS/mock não comprova Windows/TV. Requisitos transversais continuam sujeitos às revalidações dos consumidores; frontend aprovado não encerra M04.

## Preparação documental M01–M22

S00–S08 e roteiros de checkpoints conferidos em 2026-09-13. [Cobertura individual](PREPARATION_COVERAGE.md) e [auditoria global](../PREPARATION_AUDIT.md). Esta conferência não executou stories nem alterou aceites.

## Estado da fase frontend M01–M22

S00–S02 implementadas no checkout real com mocks. UX READY_FOR_REVIEW; decisão PENDING. Revisão adiada por instrução explícita para o fim da fase frontend. S03–S08 DEFERRED; não DONE. [Roteiro único](../../execution/FRONTEND_REVIEW.md), [auditoria](../../execution/FRONTEND_COVERAGE_AUDIT.md) e [regressão final](../../execution/evidence/FINAL_VALIDATION.md). Planos futuros neste README continuam sujeitos à integração e autorização.
