# M22 — Cobertura da preparação

Ownership preservado da [matriz](../REQUIREMENTS_COVERAGE.md). Definições originais e condicionais são normativas; esta alocação não comprova implementação. Os cenários específicos e a validação estão no [README](README.md) e nas stories. Todo requisito listado é obrigação de S03–S08 mesmo quando não tiver manifestação visual.

| Requisito | Obrigação preservada | Fonte | Etapas responsáveis | Estado |
|---|---|---|---|---|
| NFR-118 | **Windows.** Windows é plataforma principal inicial. | [NFR-118](../../product/04-non-functional-requirements.md):985 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-131 | **Update não destrutivo.** Atualização do aplicativo não deve apagar: - biblioteca; - cache index; - estado; - downloads. | [NFR-131](../../product/04-non-functional-requirements.md):1081 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| RX-053 | Workflows PR/main/nightly/release por necessidade; Windows x64 packaged smoke, installer, SBOM SPDX/checksums/build metadata e attestation quando disponível; assinatura isolada, provenance e sem latest; build uma vez/promover Canary→Beta→Stable sem rebuild, Stable manual protegido. | A10 §§4,9–13,37–40,45–79,92–103 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| RX-054 | Release avalia budgets absolutos e regressão contra baseline, memória em ciclos Details/Play/Exit, nightly pertinente; update por canal verifica assinatura/integridade e mantém biblioteca/cache index/estado/downloads; schema DB/IPC/manifest/API independentes. | A10 §§45–49,72–76 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| RX-055 | Documentar instalação/configuração/versões suportadas, changelog, suporte/relato privado, licença/créditos e artefato por SHA/run/hash; acompanhamento Story/PR/CI/review/merge distingue implementado de concluído, dashboard de qualidade quando adotado. | README; CONTRIBUTING; SECURITY; SUPPORT; LICENSE; A10 §§75,96–103 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| RX-058 | Acompanhamento de entrega apresenta Story, PR, status CI, review e merge, diferenciando Implemented de Done; integração Devflow e dashboard somente na medida adotada pelo projeto, sem confundir isso com funcionalidade obrigatória do aplicativo desktop. | A10 §§96–103 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |

## Jornadas relacionadas



Jornadas compartilhadas comprovam apenas a fatia deste milestone; a matriz identifica os outros responsáveis. Consulte [jornadas originais](../../product/02-user-journeys.md).

## Auditoria posterior da implementação frontend

Preparação acima preservada como baseline documental. A execução S00–S02 está registrada em UPDATE/EXPERIENCE e na [auditoria frontend](../../execution/FRONTEND_COVERAGE_AUDIT.md). PREPARED nesta tabela descreve a preparação; não é o estado atual da etapa frontend. Requisitos integrais continuam pendentes de integração e aceite.
