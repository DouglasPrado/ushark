# M20 — Cobertura da preparação

Ownership preservado da [matriz](../REQUIREMENTS_COVERAGE.md). Definições originais e condicionais são normativas; esta alocação não comprova implementação. Os cenários específicos e a validação estão no [README](README.md) e nas stories. Todo requisito listado é obrigação de S03–S08 mesmo quando não tiver manifestação visual.

| Requisito | Obrigação preservada | Fonte | Etapas responsáveis | Estado |
|---|---|---|---|---|
| FR-182 | **Tela técnica opcional.** Usuário avançado pode visualizar runtime. | [FR-182](../../product/03-functional-requirements.md):1344 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-183 | **Mostrar download speed.** Diagnóstico deve exibir throughput. | [FR-183](../../product/03-functional-requirements.md):1350 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-184 | **Mostrar buffer.** Diagnóstico deve exibir buffer estimado. | [FR-184](../../product/03-functional-requirements.md):1356 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-185 | **Mostrar Streaming Ratio.** Quando disponível. | [FR-185](../../product/03-functional-requirements.md):1362 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-186 | **Mostrar decoder.** Player pode informar codec/hardware decode. | [FR-186](../../product/03-functional-requirements.md):1368 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-111 | **Logs estruturados.** Componentes principais devem produzir logs estruturados. | [NFR-111](../../product/04-non-functional-requirements.md):914 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-112 | **Correlation IDs.** Operações complexas podem possuir identificador correlacionável. Exemplo: playbackSessionId torrentSessionId librarySyncId | [NFR-112](../../product/04-non-functional-requirements.md):920 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-113 | **Sem secrets em logs.** Tokens, credenciais e URLs sensíveis não devem ser logados integralmente. | [NFR-113](../../product/04-non-functional-requirements.md):934 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-114 | **Métricas torrent.** Disponibilizar internamente: - peers; - throughput; - upload; - download; - piece availability; - buffer. | [NFR-114](../../product/04-non-functional-requirements.md):942 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-117 | **Diagnóstico exportável.** Futuramente, diagnóstico poderá ser exportado sem dados pessoais desnecessários. | [NFR-117](../../product/04-non-functional-requirements.md):977 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| RX-046 | Logs estruturados/redacted/rotacionados/bounded; painel inclui DB/WAL/counts/cache e raw/displayed Health; limpeza individual de health/playback history/cache/logs; manutenção cede a interação e playback. | A06 §§47–51,98–99,135–139; A08 §28 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |

## Jornadas relacionadas

- UJ-49: Diagnóstico técnico.

Jornadas compartilhadas comprovam apenas a fatia deste milestone; a matriz identifica os outros responsáveis. Consulte [jornadas originais](../../product/02-user-journeys.md).

## Auditoria posterior da implementação frontend

Preparação acima preservada como baseline documental. A execução S00–S02 está registrada em UPDATE/EXPERIENCE e na [auditoria frontend](../../execution/FRONTEND_COVERAGE_AUDIT.md). PREPARED nesta tabela descreve a preparação; não é o estado atual da etapa frontend. Requisitos integrais continuam pendentes de integração e aceite.
