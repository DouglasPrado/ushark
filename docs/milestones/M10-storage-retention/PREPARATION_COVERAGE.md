# M10 — Cobertura da preparação

Ownership preservado da [matriz](../REQUIREMENTS_COVERAGE.md). Definições originais e condicionais são normativas; esta alocação não comprova implementação. Os cenários específicos e a validação estão no [README](README.md) e nas stories. Todo requisito listado é obrigação de S03–S08 mesmo quando não tiver manifestação visual.

| Requisito | Obrigação preservada | Fonte | Etapas responsáveis | Estado |
|---|---|---|---|---|
| FR-047 | **Configurar pasta de cache.** Usuário pode escolher diretório. | [FR-047](../../product/03-functional-requirements.md):442 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-048 | **Configurar limite de cache.** Usuário pode definir tamanho máximo. | [FR-048](../../product/03-functional-requirements.md):448 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-049 | **Limpeza automática.** O sistema deve conseguir liberar espaço automaticamente. | [FR-049](../../product/03-functional-requirements.md):454 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-050 | **Política LRU.** Conteúdo elegível deve poder ser removido por política de uso recente. | [FR-050](../../product/03-functional-requirements.md):460 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-053 | **Keep After Watching.** Usuário pode manter arquivo depois de assistir. | [FR-053](../../product/03-functional-requirements.md):485 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-055 | **Alterar modo.** O modo de retenção pode ser alterado posteriormente. | [FR-055](../../product/03-functional-requirements.md):497 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-207 | **Tratar falta de espaço.** Mostrar ações possíveis. | [FR-207](../../product/03-functional-requirements.md):1519 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-208 | **Tratar cache corrompido.** Sistema deve poder invalidar e reconstruir dados afetados. | [FR-208](../../product/03-functional-requirements.md):1525 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-043 | **Limite configurável.** Usuário deve poder estabelecer máximo. | [NFR-043](../../product/04-non-functional-requirements.md):451 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-044 | **Diretório configurável.** Cache não deve estar preso a um volume específico. | [NFR-044](../../product/04-non-functional-requirements.md):457 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-045 | **Preferência por armazenamento rápido.** A documentação deve recomendar SSD/NVMe para cache ativo. | [NFR-045](../../product/04-non-functional-requirements.md):463 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-046 | **Sem corrupção da biblioteca.** Limpeza de cache não pode apagar metadata estrutural ou estado do usuário. | [NFR-046](../../product/04-non-functional-requirements.md):469 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-047 | **LRU segura.** Limpeza automática deve respeitar proteções. | [NFR-047](../../product/04-non-functional-requirements.md):477 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-049 | **Nunca remover protegido.** Conteúdo marcado para retenção deve permanecer. | [NFR-049](../../product/04-non-functional-requirements.md):489 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-050 | **Recuperação de espaço previsível.** O sistema deve saber estimar quanto pode liberar antes de uma operação de limpeza. | [NFR-050](../../product/04-non-functional-requirements.md):495 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-060 | **Dados corrompidos.** Cache corrompido deve ser invalidável sem apagar estado do usuário. | [NFR-060](../../product/04-non-functional-requirements.md):567 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| RX-028 | Reter parciais/favoritos, promover Stream Only→Keep reaproveitando bytes, demotion explícita; estimar liberação, proteger referências/ativos e reparar índice contra filesystem; volumes distintos permitidos. | PRD §20; A02 §§49–53; A06 §§61–63,87 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |

## Jornadas relacionadas

- UJ-18: Stream Only.
- UJ-19: Keep After Watching.
- UJ-45: Falta de espaço.
- UJ-46: Cache automático.
- UJ-59: Remover conteúdo local.

Jornadas compartilhadas comprovam apenas a fatia deste milestone; a matriz identifica os outros responsáveis. Consulte [jornadas originais](../../product/02-user-journeys.md).

## Auditoria posterior da implementação frontend

Preparação acima preservada como baseline documental. A execução S00–S02 está registrada em UPDATE/EXPERIENCE e na [auditoria frontend](../../execution/FRONTEND_COVERAGE_AUDIT.md). PREPARED nesta tabela descreve a preparação; não é o estado atual da etapa frontend. Requisitos integrais continuam pendentes de integração e aceite.
