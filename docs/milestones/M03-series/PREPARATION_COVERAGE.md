# M03 — Cobertura da preparação

Ownership preservado da [matriz](../REQUIREMENTS_COVERAGE.md). Definições originais e condicionais são normativas; esta alocação não comprova implementação. Os cenários específicos e a validação estão no [README](README.md) e nas stories. Todo requisito listado é obrigação de S03–S08 mesmo quando não tiver manifestação visual.

| Requisito | Obrigação preservada | Fonte | Etapas responsáveis | Estado |
|---|---|---|---|---|
| FR-004 | **Suportar séries.** O sistema deve representar séries com temporadas e episódios. | [FR-004](../../product/03-functional-requirements.md):112 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-005 | **Suportar episódios.** Cada episódio deve possuir identidade independente. | [FR-005](../../product/03-functional-requirements.md):118 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-017 | **Inferir série.** O sistema deve identificar padrões como: S01E01 1x01 Season 01 Episode 01 | [FR-017](../../product/03-functional-requirements.md):214 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-018 | **Mapear episódio automaticamente.** Arquivos identificados como episódios devem ser vinculados ao episódio correspondente. | [FR-018](../../product/03-functional-requirements.md):226 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-020 | **Persistir selector.** A associação entre source e arquivo deve ser persistida. Selectors mínimos: largest-video filename episode manual | [FR-020](../../product/03-functional-requirements.md):238 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-206 | **Tratar episódio não identificado.** Usuário pode mapear manualmente. | [FR-206](../../product/03-functional-requirements.md):1513 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-080 | **Dezenas de milhares de episódios.** Data model não deve assumir biblioteca pequena. | [NFR-080](../../product/04-non-functional-requirements.md):706 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| RX-008 | Episódio avulso, season pack, múltiplas temporadas/especiais; selectors por vínculo Content/Source, inferência não funde episódios diferentes; legenda selecionada no torrent acompanha prioridade. | PRD §11; A02 §§13–17,88–90 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |

## Jornadas relacionadas

- UJ-06: Adicionar uma série.
- UJ-55: Episódio identificado incorretamente.

Jornadas compartilhadas comprovam apenas a fatia deste milestone; a matriz identifica os outros responsáveis. Consulte [jornadas originais](../../product/02-user-journeys.md).

## Auditoria posterior da implementação frontend

Preparação acima preservada como baseline documental. A execução S00–S02 está registrada em UPDATE/EXPERIENCE e na [auditoria frontend](../../execution/FRONTEND_COVERAGE_AUDIT.md). PREPARED nesta tabela descreve a preparação; não é o estado atual da etapa frontend. Requisitos integrais continuam pendentes de integração e aceite.
