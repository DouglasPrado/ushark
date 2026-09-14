# M12 — Cobertura da preparação

Ownership preservado da [matriz](../REQUIREMENTS_COVERAGE.md). Definições originais e condicionais são normativas; esta alocação não comprova implementação. Os cenários específicos e a validação estão no [README](README.md) e nas stories. Todo requisito listado é obrigação de S03–S08 mesmo quando não tiver manifestação visual.

| Requisito | Obrigação preservada | Fonte | Etapas responsáveis | Estado |
|---|---|---|---|---|
| FR-026 | **Permitir metadata override.** Bibliotecas podem sobrescrever dados de apresentação. | [FR-026](../../product/03-functional-requirements.md):290 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-027 | **Preservar metadata global.** Overrides não devem alterar cadastro global do Content. | [FR-027](../../product/03-functional-requirements.md):296 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-133 | **Criar biblioteca compartilhável.** **Prioridade:** P0 **Tipo:** SHARING Usuário pode criar biblioteca independente. | [FR-133](../../product/03-functional-requirements.md):1017 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-134 | **Nome da biblioteca.** Campo obrigatório. | [FR-134](../../product/03-functional-requirements.md):1026 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-135 | **Descrição.** Campo opcional. | [FR-135](../../product/03-functional-requirements.md):1032 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-136 | **Identidade visual.** Pode possuir: - avatar; - logo; - banner; - accent color. | [FR-136](../../product/03-functional-requirements.md):1038 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-137 | **Adicionar Content existente.** Curador pode adicionar Contents já conhecidos. | [FR-137](../../product/03-functional-requirements.md):1049 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-138 | **Selecionar sources publicadas.** Curador decide quais sources fazem parte da biblioteca. | [FR-138](../../product/03-functional-requirements.md):1055 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-139 | **Criar sections.** Curador pode criar seções. | [FR-139](../../product/03-functional-requirements.md):1061 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-140 | **Ordenar sections.** Ordem publicada deve ser persistida. | [FR-140](../../product/03-functional-requirements.md):1067 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-141 | **Ordenar items.** Ordem dentro da section deve ser persistida. | [FR-141](../../product/03-functional-requirements.md):1073 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-142 | **Hero.** Curador pode definir conteúdo de destaque. | [FR-142](../../product/03-functional-requirements.md):1079 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-143 | **Preview.** Curador deve visualizar experiência antes de publicar. | [FR-143](../../product/03-functional-requirements.md):1085 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-225 | **Biblioteca compartilhada não controla runtime local.** Curador pode recomendar source, não forçar execução. | [FR-225](../../product/03-functional-requirements.md):1663 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-109 | **Não publicar biblioteca automaticamente.** Conteúdo criado localmente é privado por padrão. | [NFR-109](../../product/04-non-functional-requirements.md):900 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| RX-030 | Distinguir coleção lógica de seção visual; coleções determinísticas/pessoais; hero/carousel/grid/continue-watching; autor seleciona sources e ordem; preview como assinante. | A01 §§24–31; UJ23–28,76 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| RX-031 | Comportamento: User Override > runtime > manifest > provider; apresentação library override > provider > fallback; overrides escopados e ocultação local não editam original; resolver precedência de custom title opcional em contrato. | FR §43; A01 §§62–63; A05 §§58–67,132–136 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |

## Jornadas relacionadas

- UJ-23: Criar biblioteca compartilhada.
- UJ-24: Adicionar conteúdo à biblioteca compartilhada.
- UJ-25: Criar seções.
- UJ-26: Definir Hero.
- UJ-27: Reordenar biblioteca.
- UJ-28: Preview da biblioteca.
- UJ-76: Reorganização pessoal sem alterar biblioteca compartilhada.

Jornadas compartilhadas comprovam apenas a fatia deste milestone; a matriz identifica os outros responsáveis. Consulte [jornadas originais](../../product/02-user-journeys.md).

## Auditoria posterior da implementação frontend

Preparação acima preservada como baseline documental. A execução S00–S02 está registrada em UPDATE/EXPERIENCE e na [auditoria frontend](../../execution/FRONTEND_COVERAGE_AUDIT.md). PREPARED nesta tabela descreve a preparação; não é o estado atual da etapa frontend. Requisitos integrais continuam pendentes de integração e aceite.
