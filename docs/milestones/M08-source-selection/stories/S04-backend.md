# S04 — Adapters reais mínimos — M08

Status: DONE — S04.1, S04.2 e S04.3 comprovadas; próxima story S05.

## Objetivo

Fornecer somente adapters exigidos pelo contrato de M08.

## Contexto e dependências

S03 concluída e dependências reais disponíveis; autorização para integrações e ambientes envolvidos. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Executar S04.1 → S04.2 → S04.3, uma por vez, conforme os incrementos abaixo. Escopo total: Preflight em details/foco com cancelamento e orçamento; Health 0–100, barras/labels/confidence/ratio/startup; métricas úteis/availability/estabilidade; ranking local mecânico, cache/hardware, override e fontes de múltiplas origens válidas.

## Fora de escopo

Mudança silenciosa da UX, infraestrutura sem consumidor e capacidades fora do milestone.

## Critérios de aceite

Incrementos comprovados; falha não reporta sucesso nem perde estado; Play permitido durante medição; arquivo local funciona sem health de rede; ranking determinístico com reason codes; usuário pode retirar override; 4K inviável não vence por resolução; sem flicker; ranking local <10ms no conjunto controlado. Aplicam-se também os critérios comuns acima.

## Validação

Testes de fronteira/domínio de cada incremento e ensaios reais controlados: Fixtures determinísticas de ranking incluindo menor tamanho, qualidade máxima inviável e fonte local; ranking <10ms sem probes; confirmar escolha com player e cancelar preflight ao sair sem flicker.

## Evidências

- [S04.1](../evidence/BACKEND_S04_1.md): sampler limitado, TTL,
  cancelamento e resumo real do torrentd, **3/3** próprios e **9/9** no recorte.
- [S04.2](../evidence/BACKEND_S04_2.md): Health/confidence/ratio determinísticos.
- [S04.3](../evidence/BACKEND_S04_3.md): ranking, persistência, override e deadline.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.

## S04.1 — Medições progressivas com limites e TTL

**Objetivo/contexto:** entregar medições progressivas com limites e ttl sob o contrato S03.
**Escopo:** Medições progressivas com limites e TTL; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Fixtures determinísticas de ranking incluindo menor tamanho, qualidade máxima inviável e fonte local; ranking <10ms sem probes; confirmar escolha com player e cancelar preflight ao sair sem flicker. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** cumprido. Medição passiva, limites, TTL, concorrência e
cancelamento foram comprovados. [Evidência](../evidence/BACKEND_S04_1.md).

## S04.2 — Health/confidence/ratio determinísticos

**Objetivo/contexto:** entregar health/confidence/ratio determinísticos sob o contrato S03 após S04.1.
**Escopo:** Health/confidence/ratio determinísticos; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Fixtures determinísticas de ranking incluindo menor tamanho, qualidade máxima inviável e fonte local; ranking <10ms sem probes; confirmar escolha com player e cancelar preflight ao sair sem flicker. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** cumprido. Health determinístico e suas fronteiras foram
comprovados. [Evidência](../evidence/BACKEND_S04_2.md).

## S04.3 — ranking e override local persistido

**Objetivo/contexto:** entregar ranking e override local persistido sob o contrato S03 após S04.2.
**Escopo:** ranking e override local persistido; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Fixtures determinísticas de ranking incluindo menor tamanho, qualidade máxima inviável e fonte local; ranking <10ms sem probes; confirmar escolha com player e cancelar preflight ao sair sem flicker. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** cumprido. Ranking, override e persistência foram comprovados.
[Evidência](../evidence/BACKEND_S04_3.md).
