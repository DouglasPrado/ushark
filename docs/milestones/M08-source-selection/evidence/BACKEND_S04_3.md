# M08 S04.3 — ranking e override persistido

Implementado `packages/core/src/source-selection-service.cjs`:

- ranking local determinístico com filtro de resolução, codec/hardware,
  blacklist e inviabilidade por Health;
- estratégias Balanced, Quality, Fast e Smallest com desempate por source ID;
- fonte local completa prioritária e override explícito superior enquanto
  viável;
- SQLite para último Health, histórico limitado a 120 registros por source,
  override, decisões e idempotência;
- validação de pertencimento tanto em `content_sources` quanto em
  `content_source_selectors`;
- preflight com deadline, cancelamento, eventos versionados e máximo de quatro
  updates por segundo.

Validação: `tests/source-selection-service.spec.ts`: 5/5 PASS, incluindo
restart do override, source estrangeira rejeitada, 4K inviável, Smallest,
seleção única, deadline sem decisão tardia e ranking de 64 sources abaixo de
10 ms.
