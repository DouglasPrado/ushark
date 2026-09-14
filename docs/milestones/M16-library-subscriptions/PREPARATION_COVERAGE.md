# M16 — Cobertura da preparação

Ownership preservado da [matriz](../REQUIREMENTS_COVERAGE.md). Definições originais e condicionais são normativas; esta alocação não comprova implementação. Os cenários específicos e a validação estão no [README](README.md) e nas stories. Todo requisito listado é obrigação de S03–S08 mesmo quando não tiver manifestação visual.

| Requisito | Obrigação preservada | Fonte | Etapas responsáveis | Estado |
|---|---|---|---|---|
| FR-128 | **Preservar histórico após unsubscribe.** Remover biblioteca não deve apagar histórico. | [FR-128](../../product/03-functional-requirements.md):983 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-151 | **Importar por link/código.** Sistema deve suportar identificador remoto. | [FR-151](../../product/03-functional-requirements.md):1137 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-153 | **Assinar biblioteca.** Usuário pode acompanhar biblioteca remota. | [FR-153](../../product/03-functional-requirements.md):1156 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-154 | **Persistir versão instalada.** Subscription deve conhecer versão atual. | [FR-154](../../product/03-functional-requirements.md):1162 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-155 | **Verificar atualização.** Sistema pode consultar nova versão. | [FR-155](../../product/03-functional-requirements.md):1168 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-156 | **Baixar atualização.** Nova versão deve ser obtida sem remover a atual primeiro. | [FR-156](../../product/03-functional-requirements.md):1174 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-157 | **Validar atualização.** Antes de ativar. | [FR-157](../../product/03-functional-requirements.md):1180 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-158 | **Aplicar atomicamente.** Swap somente após sucesso. | [FR-158](../../product/03-functional-requirements.md):1186 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-159 | **Preservar versão anterior em falha.** Nunca deixar biblioteca parcialmente atualizada. | [FR-159](../../product/03-functional-requirements.md):1192 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-160 | **Preservar user overrides.** Atualização remota não pode apagar preferências locais. | [FR-160](../../product/03-functional-requirements.md):1200 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-161 | **Preservar progresso.** Atualização não pode apagar playback state. | [FR-161](../../product/03-functional-requirements.md):1206 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-162 | **Preservar favoritos.** Atualização não pode apagar favoritos. | [FR-162](../../product/03-functional-requirements.md):1212 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-163 | **Remoção remota não apaga Content pessoal.** Se usuário adicionou item à biblioteca própria, ele continua existindo. | [FR-163](../../product/03-functional-requirements.md):1218 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-164 | **Ocultar item localmente.** Usuário pode esconder item de uma library subscription. | [FR-164](../../product/03-functional-requirements.md):1224 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-213 | **Unsubscribe preserva estado.** UI deve informar o que será mantido. | [FR-213](../../product/03-functional-requirements.md):1557 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-222 | **Estados de Sync.** Mínimos: idle checking downloading validating applying ready error | [FR-222](../../product/03-functional-requirements.md):1633 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-055 | **Library Update.** Atualização de biblioteca remota deve ser atômica. | [NFR-055](../../product/04-non-functional-requirements.md):535 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-056 | **Rollback.** Versão anterior deve permanecer disponível até confirmação da nova. | [NFR-056](../../product/04-non-functional-requirements.md):541 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-057 | **Crash during update.** Crash durante sync não deve deixar manifest parcialmente aplicado. | [NFR-057](../../product/04-non-functional-requirements.md):547 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-090 | **Shared library service failure.** Subscriptions existentes devem continuar acessíveis localmente. | [NFR-090](../../product/04-non-functional-requirements.md):770 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| RX-040 | Snapshot exato e active pointer; check manual/auto/pausado, backoff, concorrência única por library/global limitada e prioridades; idempotência, diff, rollback explícito, versões retidas e GC que protege ativa/staging/rollback. | A05 §§38–52,83–87,114–130 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| RX-041 | Origem removida afeta elegibilidade futura, preserva source salva/download/cache; override órfão fica histórico com fallback temporário; remoção remota e unsubscribe não apagam local; update preserva foco vizinho e sessão em execução; reparar manifest via versão anterior ou download imutável. | A05 §§53–71,147–154,176–184; A09 §§143–147 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| RX-042 | Deep links validam→preview→confirmação, nunca player/destruição automática; hash divergente na mesma versão e downgrade automático bloqueiam; sync stage/verify/semantic/commit não altera estado pessoal. | A08 §§15,24; A09 §142 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |

## Jornadas relacionadas

- UJ-32: Importar biblioteca por link.
- UJ-33: Navegar em biblioteca compartilhada.
- UJ-34: Assistir a partir de biblioteca compartilhada.
- UJ-35: Atualização de biblioteca compartilhada.
- UJ-36: Atualização com erro.
- UJ-37: Autor remove conteúdo.
- UJ-38: Adicionar item compartilhado à biblioteca pessoal.
- UJ-39: Ocultar item compartilhado.
- UJ-41: Mesmo conteúdo em múltiplas bibliotecas.
- UJ-44: Modo offline.
- UJ-58: Unsubscribe.
- UJ-65: Biblioteca compartilhada com múltiplas sources.
- UJ-66: Source override sobrevivendo atualização.
- UJ-70: Rollback de biblioteca publicada.
- UJ-75: Conteúdo sem source em biblioteca compartilhada.
- UJ-78: Múltiplas bibliotecas oferecem sources diferentes.

Jornadas compartilhadas comprovam apenas a fatia deste milestone; a matriz identifica os outros responsáveis. Consulte [jornadas originais](../../product/02-user-journeys.md).

## Auditoria posterior da implementação frontend

Preparação acima preservada como baseline documental. A execução S00–S02 está registrada em UPDATE/EXPERIENCE e na [auditoria frontend](../../execution/FRONTEND_COVERAGE_AUDIT.md). PREPARED nesta tabela descreve a preparação; não é o estado atual da etapa frontend. Requisitos integrais continuam pendentes de integração e aceite.
