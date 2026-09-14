# M19 — Cobertura da preparação

Ownership preservado da [matriz](../REQUIREMENTS_COVERAGE.md). Definições originais e condicionais são normativas; esta alocação não comprova implementação. Os cenários específicos e a validação estão no [README](README.md) e nas stories. Todo requisito listado é obrigação de S03–S08 mesmo quando não tiver manifestação visual.

| Requisito | Obrigação preservada | Fonte | Etapas responsáveis | Estado |
|---|---|---|---|---|
| FR-112 | **Fallback automático.** Se uma source falhar, o sistema pode procurar alternativa. | [FR-112](../../product/03-functional-requirements.md):875 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-113 | **Troca automática configurável.** Usuário pode permitir ou bloquear troca automática. | [FR-113](../../product/03-functional-requirements.md):881 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-114 | **Persistir histórico por source.** Pode armazenar: - throughput; - startup; - buffering; - failures; - timestamp. | [FR-114](../../product/03-functional-requirements.md):889 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-115 | **Usar histórico como sinal.** O sistema pode combinar histórico e medição atual. | [FR-115](../../product/03-functional-requirements.md):901 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-204 | **Tratar source sem peers.** Sistema deve oferecer retry ou fallback. | [FR-204](../../product/03-functional-requirements.md):1501 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-039 | **Fallback.** Se a source escolhida falhar, a arquitetura deve permitir troca sem reiniciar o aplicativo. | [NFR-039](../../product/04-non-functional-requirements.md):423 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| RX-045 | History local agregado com decay/expiração/versão; fallback prepara candidato antes de interromper, confere Content/episódio/duração, retoma posição, conserva override, cooldown/blacklist; diferenças de edição impedem troca automática. | A03 §§47–49,71–83,96–99 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |

## Jornadas relacionadas

- UJ-13: Torrent ficando lento durante reprodução.
- UJ-14: Source sem peers.
- UJ-42: Mesma source em múltiplas bibliotecas.
- UJ-71: Health histórico melhorando decisão.
- UJ-79: Configuração de comportamento automático.

Jornadas compartilhadas comprovam apenas a fatia deste milestone; a matriz identifica os outros responsáveis. Consulte [jornadas originais](../../product/02-user-journeys.md).

## Auditoria posterior da implementação frontend

Preparação acima preservada como baseline documental. A execução S00–S02 está registrada em UPDATE/EXPERIENCE e na [auditoria frontend](../../execution/FRONTEND_COVERAGE_AUDIT.md). PREPARED nesta tabela descreve a preparação; não é o estado atual da etapa frontend. Requisitos integrais continuam pendentes de integração e aceite.
