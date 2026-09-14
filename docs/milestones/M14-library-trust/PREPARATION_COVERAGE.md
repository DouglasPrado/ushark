# M14 — Cobertura da preparação

Ownership preservado da [matriz](../REQUIREMENTS_COVERAGE.md). Definições originais e condicionais são normativas; esta alocação não comprova implementação. Os cenários específicos e a validação estão no [README](README.md) e nas stories. Todo requisito listado é obrigação de S03–S08 mesmo quando não tiver manifestação visual.

| Requisito | Obrigação preservada | Fonte | Etapas responsáveis | Estado |
|---|---|---|---|---|
| FR-201 | **Verificar assinatura.** Quando presente, assinatura deve poder ser validada. | [FR-201](../../product/03-functional-requirements.md):1475 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-202 | **Detectar mudança de identidade.** Uma subscription assinada não deve aceitar nova identidade silenciosamente. | [FR-202](../../product/03-functional-requirements.md):1481 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-203 | **Exibir status de verificação.** UI pode informar: Assinatura válida Assinatura inválida Não assinada | [FR-203](../../product/03-functional-requirements.md):1487 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-105 | **Algoritmo moderno.** Assinatura deve utilizar algoritmo considerado seguro no momento da implementação. Planejado: Ed25519 | [NFR-105](../../product/04-non-functional-requirements.md):868 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-106 | **Identidade persistente.** Uma subscription assinada deve lembrar a identidade previamente aceita. | [NFR-106](../../product/04-non-functional-requirements.md):880 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-107 | **Mudança de key.** Troca inesperada deve exigir ação explícita do usuário. | [NFR-107](../../product/04-non-functional-requirements.md):886 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| RX-036 | Assinar libraryId/version/hash/schema/autor, verificar bytes canônicos, TOFU/pinning persistente; chave privada em secure storage/criptografada; não guardar secret plaintext; validade não prova direitos da mídia. | A05 §§25–35; A08 §§14,22 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |

## Jornadas relacionadas

- UJ-57: Biblioteca assinada.

Jornadas compartilhadas comprovam apenas a fatia deste milestone; a matriz identifica os outros responsáveis. Consulte [jornadas originais](../../product/02-user-journeys.md).

## Auditoria posterior da implementação frontend

Preparação acima preservada como baseline documental. A execução S00–S02 está registrada em UPDATE/EXPERIENCE e na [auditoria frontend](../../execution/FRONTEND_COVERAGE_AUDIT.md). PREPARED nesta tabela descreve a preparação; não é o estado atual da etapa frontend. Requisitos integrais continuam pendentes de integração e aceite.
