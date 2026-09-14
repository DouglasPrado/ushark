# S04 — Adapters reais mínimos — M11

Status: DONE em 2026-09-14; S04.1–S04.3 executadas sequencialmente.

## Objetivo

Fornecer somente adapters exigidos pelo contrato de M11.

## Contexto e dependências

S03 concluída e dependências reais disponíveis; autorização para integrações e ambientes envolvidos. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Executar S04.1 → S04.2 → S04.3, uma por vez, conforme os incrementos abaixo. Escopo total: Sequência, autoplay configurável, tocar agora/cancelar, fim de temporada/série, preflight antes do final, prioridades por arquivo e política de preparação.

## Fora de escopo

Mudança silenciosa da UX, infraestrutura sem consumidor e capacidades fora do milestone.

## Critérios de aceite

Incrementos comprovados; falha não reporta sucesso nem perde estado; Autoplay desligado não inicia próximo; cancelamento funciona; pack reutiliza sessão; próximo episódio não rouba banda do atual; episódio ausente possui saída recuperável. Aplicam-se também os critérios comuns acima.

## Validação

Testes de fronteira/domínio de cada incremento e ensaios reais controlados: Desligar autoplay impede início; cancelar até o limite definido não toca próximo; pack reutiliza sessão; banda do atual não é roubada; especial/episódio ausente não seleciona conteúdo errado.

## Evidências

[Backend](../evidence/BACKEND.md); `tests/next-episode-service.spec.ts` passou
3/3, cobrindo ordem/fim/lacuna/especial, preflight único e
cancelamento/claim idempotentes.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.

## S04.1 — Resolver próximo episódio e preferências

**Objetivo/contexto:** entregar resolver próximo episódio e preferências sob o contrato S03.
**Escopo:** Resolver próximo episódio e preferências; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Desligar autoplay impede início; cancelar até o limite definido não toca próximo; pack reutiliza sessão; banda do atual não é roubada; especial/episódio ausente não seleciona conteúdo errado. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.

## S04.2 — preflight limitado com sessão reutilizável

**Objetivo/contexto:** entregar preflight limitado com sessão reutilizável sob o contrato S03 após S04.1.
**Escopo:** preflight limitado com sessão reutilizável; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Desligar autoplay impede início; cancelar até o limite definido não toca próximo; pack reutiliza sessão; banda do atual não é roubada; especial/episódio ausente não seleciona conteúdo errado. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.

## S04.3 — countdown e início/cancelamento idempotentes

**Objetivo/contexto:** entregar countdown e início/cancelamento idempotentes sob o contrato S03 após S04.2.
**Escopo:** countdown e início/cancelamento idempotentes; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Desligar autoplay impede início; cancelar até o limite definido não toca próximo; pack reutiliza sessão; banda do atual não é roubada; especial/episódio ausente não seleciona conteúdo errado. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.
