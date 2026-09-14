# S04 — Adapters reais mínimos — M19

Status: DONE em 2026-09-14; S04.1–S04.3 integradas.

## Objetivo

Fornecer somente adapters exigidos pelo contrato de M19.

## Contexto e dependências

S03 concluída e dependências reais disponíveis; autorização para integrações e ambientes envolvidos. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Executar S04.1 → S04.2 → S04.3, uma por vez, conforme os incrementos abaixo. Escopo total: Histórico agregado local com expiração, versões de algoritmo, reranking, fallback manual/automático, preparo antes da troca, compatibilidade Content/episódio/duração, cooldown/blacklist temporária.

## Fora de escopo

Mudança silenciosa da UX, infraestrutura sem consumidor e capacidades fora do milestone.

## Critérios de aceite

Incrementos comprovados; falha não reporta sucesso nem perde estado; Source lenta/sem peers produz retry/alternativa; auto-switch off impede troca; incompatibilidade de edição impede handoff automático; posição preservada; override original não apagado; histórico antigo perde peso; não há loop de troca. Aplicam-se também os critérios comuns acima.

## Validação

Testes de fronteira/domínio de cada incremento e ensaios reais controlados: Retirar peers de source controlada; auto-switch off não troca; outra edição não troca automaticamente; seek concorrente usa posição correta; cooldown impede loop; expiração reduz peso do histórico.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.

## S04.1 — Histórico agregado/expiração e reranking

**Objetivo/contexto:** entregar histórico agregado/expiração e reranking sob o contrato S03.
**Escopo:** Histórico agregado/expiração e reranking; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Retirar peers de source controlada; auto-switch off não troca; outra edição não troca automaticamente; seek concorrente usa posição correta; cooldown impede loop; expiração reduz peso do histórico. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.

## S04.2 — elegibilidade compatível e preparação

**Objetivo/contexto:** entregar elegibilidade compatível e preparação sob o contrato S03 após S04.1.
**Escopo:** elegibilidade compatível e preparação; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Retirar peers de source controlada; auto-switch off não troca; outra edição não troca automaticamente; seek concorrente usa posição correta; cooldown impede loop; expiração reduz peso do histórico. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.

## S04.3 — handoff coordenado com cooldown/blacklist temporária

**Objetivo/contexto:** entregar handoff coordenado com cooldown/blacklist temporária sob o contrato S03 após S04.2.
**Escopo:** handoff coordenado com cooldown/blacklist temporária; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Retirar peers de source controlada; auto-switch off não troca; outra edição não troca automaticamente; seek concorrente usa posição correta; cooldown impede loop; expiração reduz peso do histórico. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.
