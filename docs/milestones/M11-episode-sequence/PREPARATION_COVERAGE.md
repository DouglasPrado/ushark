# M11 — Cobertura da preparação

Ownership preservado da [matriz](../REQUIREMENTS_COVERAGE.md). Definições originais e condicionais são normativas; esta alocação não comprova implementação. Os cenários específicos e a validação estão no [README](README.md) e nas stories. Todo requisito listado é obrigação de S03–S08 mesmo quando não tiver manifestação visual.

| Requisito | Obrigação preservada | Fonte | Etapas responsáveis | Estado |
|---|---|---|---|---|
| FR-129 | **Detectar próximo episódio.** Player deve conhecer sequência da série. | [FR-129](../../product/03-functional-requirements.md):991 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-130 | **Autoplay configurável.** Usuário pode habilitar reprodução automática. | [FR-130](../../product/03-functional-requirements.md):997 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-131 | **Countdown.** Pode existir contagem regressiva antes do próximo episódio. | [FR-131](../../product/03-functional-requirements.md):1003 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-132 | **Preflight antecipado.** Próximo episódio pode ser preparado antes do atual acabar. | [FR-132](../../product/03-functional-requirements.md):1009 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| RX-029 | Pré-carregar próximo perto do fim sob orçamento; cancelar countdown/assistir agora; episódio atual prevalece sobre próximo e restante do pack; tratar fim/ausência sem loop. | UJ63–64; A02 §§86–90 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |

## Jornadas relacionadas

- UJ-63: Próximo episódio.
- UJ-64: Preflight do próximo episódio.
- UJ-79: Configuração de comportamento automático.

Jornadas compartilhadas comprovam apenas a fatia deste milestone; a matriz identifica os outros responsáveis. Consulte [jornadas originais](../../product/02-user-journeys.md).

## Auditoria posterior da implementação frontend

Preparação acima preservada como baseline documental. A execução S00–S02 está registrada em UPDATE/EXPERIENCE e na [auditoria frontend](../../execution/FRONTEND_COVERAGE_AUDIT.md). PREPARED nesta tabela descreve a preparação; não é o estado atual da etapa frontend. Requisitos integrais continuam pendentes de integração e aceite.
