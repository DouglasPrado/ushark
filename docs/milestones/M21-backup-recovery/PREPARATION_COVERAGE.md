# M21 — Cobertura da preparação

Ownership preservado da [matriz](../REQUIREMENTS_COVERAGE.md). Definições originais e condicionais são normativas; esta alocação não comprova implementação. Os cenários específicos e a validação estão no [README](README.md) e nas stories. Todo requisito listado é obrigação de S03–S08 mesmo quando não tiver manifestação visual.

| Requisito | Obrigação preservada | Fonte | Etapas responsáveis | Estado |
|---|---|---|---|---|
| NFR-085 | **Reinício de componente.** Componentes isolados devem poder ser reiniciados quando possível. | [NFR-085](../../product/04-non-functional-requirements.md):738 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-147 | **Nenhuma perda de estado.** Testes devem cobrir crash/restart. | [NFR-147](../../product/04-non-functional-requirements.md):1202 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-150 | **Cleanup de runtime.** Sessões encerradas devem liberar recursos. | [NFR-150](../../product/04-non-functional-requirements.md):1222 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-152 | **Shutdown gracioso.** Ao encerrar: save playback state save resume data flush critical writes stop player stop UI | [NFR-152](../../product/04-non-functional-requirements.md):1236 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-153 | **Timeout de shutdown.** Processos auxiliares não devem impedir encerramento indefinidamente. | [NFR-153](../../product/04-non-functional-requirements.md):1250 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-154 | **Crash recovery.** No próximo startup, estado incompleto deve ser detectável. | [NFR-154](../../product/04-non-functional-requirements.md):1256 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-160 | **Persistência.** Operações normais não devem perder estado confirmado após shutdown gracioso. | [NFR-160](../../product/04-non-functional-requirements.md):1330 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| RX-047 | Backup consistente SQLite/WAL via API/checkpoint e manifests/resume/config; restore recupera catálogo/estado/subscriptions/config e dados não reconstruíveis/chaves; migração falha preserva original; rehydration por snapshots e recovery sem replay total. | A06 §§88–105; A07 §§95–109 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| RX-048 | Matriz de crash/restart de UI/Core/torrentd/MPV, DB locked, disk full, rede/tracker/provider/Registry indisponíveis, manifest/asset/resume corrompidos; stress playback+downloads+sync+metadata+cache próximo do limite, sem regressão/perda silenciosa. | NFR §§49–54; A02 §§105–118; A10 §§44–49,71 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |

## Jornadas relacionadas

- UJ-52: Reabrir após reinicialização.

Jornadas compartilhadas comprovam apenas a fatia deste milestone; a matriz identifica os outros responsáveis. Consulte [jornadas originais](../../product/02-user-journeys.md).

## Auditoria posterior da implementação frontend

Preparação acima preservada como baseline documental. A execução S00–S02 está registrada em UPDATE/EXPERIENCE e na [auditoria frontend](../../execution/FRONTEND_COVERAGE_AUDIT.md). PREPARED nesta tabela descreve a preparação; não é o estado atual da etapa frontend. Requisitos integrais continuam pendentes de integração e aceite.
