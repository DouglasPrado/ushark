# M15 — Cobertura da preparação

Ownership preservado da [matriz](../REQUIREMENTS_COVERAGE.md). Definições originais e condicionais são normativas; esta alocação não comprova implementação. Os cenários específicos e a validação estão no [README](README.md) e nas stories. Todo requisito listado é obrigação de S03–S08 mesmo quando não tiver manifestação visual.

| Requisito | Obrigação preservada | Fonte | Etapas responsáveis | Estado |
|---|---|---|---|---|
| NFR-110 | **Publicação explícita.** Compartilhamento remoto exige ação do usuário. | [NFR-110](../../product/04-non-functional-requirements.md):906 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| RX-037 | Draft não sincroniza; diff e confirmação de publicação; versões imutáveis crescentes; desfazer publicação gera nova versão baseada em anterior; upload stage antes do registro ativo e conflito optimistic version. | UJ30,69–70; A05 §§9–10,88–94,173–175,199–201 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| RX-038 | Registry opcional: resolver ID/código/latest/version/assets, auth distinta de assinatura, autorização por library e limites/rate/quota/tipos; retirar publicação não remove snapshot local; API versionada, sem hospedagem audiovisual core. | A05 §§18–21,88–100,141–149,194–206; A08 §23 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| RX-039 | Infra de Registry só derivada do publicar/link aprovados; declarativa com plan/review/apply, drift periódico e imagens por digest/versão; produção não criada nesta etapa de planejamento. | A10 §§77–79 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |

## Jornadas relacionadas

- UJ-30: Publicar biblioteca por link.
- UJ-69: Editar biblioteca compartilhada já publicada.
- UJ-70: Rollback de biblioteca publicada.

Jornadas compartilhadas comprovam apenas a fatia deste milestone; a matriz identifica os outros responsáveis. Consulte [jornadas originais](../../product/02-user-journeys.md).

## Auditoria posterior da implementação frontend

Preparação acima preservada como baseline documental. A execução S00–S02 está registrada em UPDATE/EXPERIENCE e na [auditoria frontend](../../execution/FRONTEND_COVERAGE_AUDIT.md). PREPARED nesta tabela descreve a preparação; não é o estado atual da etapa frontend. Requisitos integrais continuam pendentes de integração e aceite.
