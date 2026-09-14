# S04 — Adapters reais mínimos — M10

Status: DONE em 2026-09-14; S04.1–S04.3 executadas sequencialmente.

## Objetivo

Fornecer somente adapters exigidos pelo contrato de M10.

## Contexto e dependências

S03 concluída e dependências reais disponíveis; autorização para integrações e ambientes envolvidos. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Executar S04.1 → S04.2 → S04.3, uma por vez, conforme os incrementos abaixo. Escopo total: Cache configurável, auto cleanup/LRU, retenção de parciais/favoritos/Keep, proteção de ativo, promoção/demotion explícita, volumes separados, reconciliação e reparo de cache corrompido.

## Fora de escopo

Mudança silenciosa da UX, infraestrutura sem consumidor e capacidades fora do milestone.

## Critérios de aceite

Incrementos comprovados; falha não reporta sucesso nem perde estado; Limpeza libera somente elegíveis; ativo/download/Keep/protegido permanece; limite considera espaço físico real; promoção reaproveita bytes; corrupção reconstrói cache sem afetar progresso/metadata; alteração de pasta tem tratamento de falha. Aplicam-se também os critérios comuns acima.

## Validação

Testes de fronteira/domínio de cada incremento e ensaios reais controlados: Limpeza concorrente com playback/download nunca remove ativos/Keep; promoção reaproveita bytes; falha entre volumes mantém original; corrupção afeta apenas cache; conferir espaço físico.

## Evidências

- [S04.1 — índice, leases e reconciliação](../evidence/BACKEND_S04_1.md)
- [S04.2 — limpeza revalidada](../evidence/BACKEND_S04_2.md)
- [S04.3 — Keep e falha recuperável](../evidence/BACKEND_S04_3.md)
- `tests/storage-policy-service.spec.ts`: 4/4 casos passaram.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.

## S04.1 — Índice/leases/elegibilidade e reconciliação

**Objetivo/contexto:** entregar índice/leases/elegibilidade e reconciliação sob o contrato S03.
**Escopo:** Índice/leases/elegibilidade e reconciliação; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Limpeza concorrente com playback/download nunca remove ativos/Keep; promoção reaproveita bytes; falha entre volumes mantém original; corrupção afeta apenas cache; conferir espaço físico. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.

## S04.2 — execução de limpeza com revalidação

**Objetivo/contexto:** entregar execução de limpeza com revalidação sob o contrato S03 após S04.1.
**Escopo:** execução de limpeza com revalidação; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Limpeza concorrente com playback/download nunca remove ativos/Keep; promoção reaproveita bytes; falha entre volumes mantém original; corrupção afeta apenas cache; conferir espaço físico. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.

## S04.3 — promoção e mudança de volume recuperável

**Objetivo/contexto:** entregar promoção e mudança de volume recuperável sob o contrato S03 após S04.2.
**Escopo:** promoção e mudança de volume recuperável; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Limpeza concorrente com playback/download nunca remove ativos/Keep; promoção reaproveita bytes; falha entre volumes mantém original; corrupção afeta apenas cache; conferir espaço físico. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.
