# M02 — Cadastrar e organizar filmes

Status: FRONTEND_UX_APPROVED — S00–S02 implementadas com mocks no checkout real; UX aprovada explicitamente em 2026-09-13: “UX Aprovada”. Integração e closure adiadas. [Evidências e capturas](evidence/VALIDATION.md).

## Objetivo e resultado

Adicionar um filme por título, manualmente ou a partir de uma source simulada; confirmar identificação, abrir detalhes e organizar a biblioteca. Na integração posterior, dados e relações sobrevivem ao restart e continuam acessíveis offline.

## Requisitos e fontes

FR-002–FR-003, FR-006–FR-008, FR-019, FR-021–FR-025, FR-028, FR-034–FR-036, FR-087, FR-090–FR-091, FR-127, FR-205, FR-211–FR-212, FR-223–FR-224, NFR-010–NFR-013, NFR-051–NFR-052, NFR-062–NFR-063, NFR-089, NFR-108, NFR-119, NFR-129, NFR-132–NFR-133, NFR-141, NFR-155, RX-005, RX-006, RX-007, RX-050.

Ownership preservado na [matriz](../REQUIREMENTS_COVERAGE.md); preparação não significa requisito entregue. Jornadas UJ03 (apenas identificação), UJ08 (detalhes), UJ17, UJ54, UJ59, UJ67, UJ68 e UJ74 (remoção de vínculo). Temporadas/episódios de RX-007 pertencem ao consumidor M03.

Consultar [plano aprovado](../PLAN.md#m02), [jornadas](../../product/02-user-journeys.md), [requisitos funcionais](../../product/03-functional-requirements.md), [NFRs](../../product/04-non-functional-requirements.md) e [pendências D03/D19](../SOURCE_ANALYSIS.md). Fontes técnicas sob demanda: A06 §§11–13, 100–104 e 115–122; A09 navegação; A11 §§31–38; A08 fronteiras de segurança.

## Dependências e limites

M01 fornece shell, configuração e UX aprovada; Windows/TV e gamepad físico ainda pendentes. Isso permite preparar a UI, mas integração/closure exigem M01 real. S00–S02 executadas sob autorização `EXECUTE_MILESTONE M02`. S03+ ficam adiadas até UX de M01–M22 aprovada, conforme GOAL.

Sem resolução torrent (M06), séries (M03), busca global/Home completa (M04), player (M05), Health/preflight (M08), gestão de armazenamento (M10) ou curadoria compartilhada (M12+). Fontes declaradas não comprovam arquivo disponível; Health não medido deve aparecer como indisponível, sem números inventados.

## Jornada e superfícies propostas

Home → Filmes → Adicionar → Buscar filme ou Criar manualmente → Revisar → Confirmar → Detalhes → Favoritar / Editar identificação / Fontes / Remover da biblioteca.

Rotas implementadas segundo [S00](EXPERIENCE.md): `#/movies`, `#/movies/new` e detalhe canônico `#/content/:contentId`. O filme usa a mesma página cinematográfica quando aberto pela Home/busca M04 ou pelo catálogo M02; somente as ferramentas contextuais de gestão pertencem à entrada por Filmes. Cadastro, edição, revisão e fontes usam diálogo; voltar do detalhe restaura lista, scroll e card de origem. Reutilizar o shell e a linguagem visual atual de M01; não redesenhar onboarding. A entrada por source usa fixture declarativa e converge na mesma revisão.

## Estados obrigatórios

Lista vazia/carregada/loading/erro/offline; pesquisa pendente/sem resultado/ambígua/provider indisponível; cadastro manual; revisão/duplicata/conflito; saving/success/failure/retry; cancelamento com rascunho; imagem ausente/falha; zero/uma/múltiplas fontes; confirmação de remoção e de delete físico separadas. Offline mantém catálogo disponível; cancelamento ou resposta antiga não altera seleção atual.

## Sequência

- [S00 — Contrato da experiência](stories/S00-contract.md)
- [S01 — Lista, cadastro e detalhes mockados](stories/S01-mock-ui.md)
- [S02 — Identificar e organizar filmes](stories/S02-frontend-behavior.md)
- [Checkpoint UX](UX_CHECKPOINT.md)
- [S03 — Contrato de catálogo e identidade](stories/S03-domain-contract.md)
- [S04 — Persistência, provider e imagens](stories/S04-backend.md), dividida em S04.1–S04.3, uma por vez.
- [S05 — Integração do catálogo](stories/S05-integration.md)
- [Checkpoint funcional](FUNCTIONAL_CHECKPOINT.md)
- [S06 — Testes das jornadas e invariantes](stories/S06-tests.md)
- [S07 — Hardening](stories/S07-hardening.md)
- [S08 — Closure](stories/S08-closure.md)

## Definition of Done

S08 concluída, UX e funcional aprovados, cadastro/correção/favoritos/remoções persistidos e reabríveis, provider offline tolerado, metadata/imagens locais e fallbacks validados. Merge conserva relações/estado; overrides não contaminam metadata global; apagar arquivo exige confirmação distinta. Evidências dos NFRs, migrações e verificações físicas aplicáveis registradas. Mock aprovado não encerra M02; publicação/merge externo depende de autorização própria.

## Preparação documental M01–M22

S00–S08 e roteiros de checkpoints conferidos em 2026-09-13. [Cobertura individual](PREPARATION_COVERAGE.md) e [auditoria global](../PREPARATION_AUDIT.md). Esta conferência não executou stories nem alterou aceites.

## Estado da fase frontend M01–M22

S00–S02 implementadas no checkout real com mocks. UX aprovada anteriormente; aceite humano preservado. S03–S08 DEFERRED; não DONE. [Roteiro único](../../execution/FRONTEND_REVIEW.md), [auditoria](../../execution/FRONTEND_COVERAGE_AUDIT.md) e [regressão final](../../execution/evidence/FINAL_VALIDATION.md). Planos futuros neste README continuam sujeitos à integração e autorização.
