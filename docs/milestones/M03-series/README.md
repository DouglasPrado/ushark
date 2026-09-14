# M03 — Importar e organizar séries e episódios

Status: READY_FOR_FUNCTIONAL_REVIEW — S00–S05 concluídas. UX aprovada; decisão
funcional humana pendente. S06–S08 não autorizadas; M03 não está DONE. Veja
[experiência](EXPERIENCE.md), [contrato](evidence/DOMAIN_CONTRACT.md) e
[integração real](evidence/INTEGRATION_VALIDATION.md).

## Objetivo e resultado

Representar séries, temporadas, especiais e episódios com identidade própria e permitir revisar a associação entre cada episódio e seu arquivo. Na integração posterior, episódios avulsos, season packs e packs com várias temporadas mantêm hierarquia e selectors após reiniciar o app.

## Requisitos e fontes

FR-004–FR-005, FR-017–FR-018, FR-020, FR-206, NFR-080 e RX-008. Ownership preservado na [matriz](../REQUIREMENTS_COVERAGE.md); preparação não significa requisito entregue.

Jornadas principais: UJ06 (adicionar série) e UJ55 (corrigir episódio identificado incorretamente). Consultar o [plano aprovado](../PLAN.md#m03), [PRD §§11–12](../../product/01-prd-master.md), [jornadas](../../product/02-user-journeys.md), [requisitos funcionais](../../product/03-functional-requirements.md), [NFRs](../../product/04-non-functional-requirements.md), A01 §§20–23/52–53, A02 §§12–17/88–90 e A06 §§6–10/18–20/54–56/117–120.

## Dependências e limites

M02 fornece o catálogo e a base de metadata; M06 fornecerá inspeção real de torrents e arquivos. S00–S02 podem usar fixtures declarativas, mas S03–S08 só podem prosseguir após a onda frontend M01–M22 e dependem das integrações reais correspondentes. Nenhum backend, persistência, provider ou torrent runtime integra esta fase frontend.

Playback, prioridades do scheduler e próximo episódio pertencem a M07/M11. M03 registra a legenda selecionável junto ao arquivo do episódio, mas não implementa reprodução. Arquivos com intervalos como `S01E01E02` permanecem em revisão manual até existir regra aprovada; a inferência nunca funde episódios distintos.

## Jornada e superfícies propostas

Home → Séries → Adicionar série → escolher cenário/source simulada → revisar série e arquivos → resolver pendências → confirmar → detalhes da série → temporada → episódio.

Rotas propostas: `/series`, `/series/new`, `/series/:seriesId` e `/series/:seriesId/season/:seasonNumber`. Cadastro/revisão pode usar uma superfície modal ou em página conforme o contrato S00, preservando retorno de foco e contexto. A revisão mostra arquivo, temporada, episódio, estado da associação, selector e legenda relacionada sem expor detalhes internos do torrent runtime.

## Estados obrigatórios

Lista vazia/carregada/loading/erro/offline; episódio avulso, season pack, pack multitemporada e especiais; metadata ausente; mapeamento identificado/ambíguo/não identificado/corrigido; conflito de dois arquivos no mesmo episódio; arquivo com múltiplos episódios; duplicata da mesma source; zero/uma/múltiplas fontes; saving/success/failure/retry; cancelamento com rascunho; coleção extensa sem renderizar todos os episódios de uma vez.

## Sequência preparada

- [S00 — Contrato da experiência](stories/S00-contract.md)
- [S01 — Biblioteca, hierarquia e revisão mockadas](stories/S01-mock-ui.md)
- [S02 — Correção e organização de episódios](stories/S02-frontend-behavior.md)
- [Checkpoint UX](UX_CHECKPOINT.md)
- [S03 — Contrato de série, episódio e selector](stories/S03-domain-contract.md)
- [S04 — Persistência e resolução de episódios](stories/S04-backend.md), dividida em S04.1–S04.3, uma por vez
- [S05 — Integração de packs e episódios](stories/S05-integration.md)
- [Checkpoint funcional](FUNCTIONAL_CHECKPOINT.md)
- [S06 — Testes das jornadas e invariantes](stories/S06-tests.md)
- [S07 — Hardening e escala](stories/S07-hardening.md)
- [S08 — Closure](stories/S08-closure.md)

## Definition of Done

S08 concluída com UX e funcional aprovados; episódio avulso, pack de temporada, várias temporadas e especiais validados com dados reais; correções e selectors persistem após restart; uma source compartilhada mantém relações independentes por episódio; ambiguidades e metadata ausente são recuperáveis; milhares de episódios não degradam estruturalmente o catálogo. Mocks aprovados não encerram M03.

## Preparação documental M01–M22

S00–S08 e roteiros de checkpoints conferidos em 2026-09-13. [Cobertura individual](PREPARATION_COVERAGE.md) e [auditoria global](../PREPARATION_AUDIT.md). Esta conferência não executou stories nem alterou aceites.

## Estado da fase frontend M01–M22

S00–S02 implementadas no checkout real com mocks. UX aprovada anteriormente; aceite humano preservado. S03–S08 DEFERRED; não DONE. [Roteiro único](../../execution/FRONTEND_REVIEW.md), [auditoria](../../execution/FRONTEND_COVERAGE_AUDIT.md) e [regressão final](../../execution/evidence/FINAL_VALIDATION.md). Planos futuros neste README continuam sujeitos à integração e autorização.
