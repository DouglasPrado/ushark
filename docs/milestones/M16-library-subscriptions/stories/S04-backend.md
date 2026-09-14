# S04 — Adapters reais mínimos — M16

Status: DEFERRED; preparada documentalmente, não executada.

## Objetivo

Fornecer somente adapters exigidos pelo contrato de M16.

## Contexto e dependências

S03 concluída e dependências reais disponíveis; autorização para integrações e ambientes envolvidos. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Executar S04.1 → S04.2 → S04.3, uma por vez, conforme os incrementos abaixo. Escopo total: Link/código/deep link com preview; subscription instalada, check manual/auto/pausa, staging/diff/verify/atomic swap, rollback explícito, retry/backoff, origens, hide, salvar na pessoal, unsubscribe e GC por referências.

## Fora de escopo

Mudança silenciosa da UX, infraestrutura sem consumidor e capacidades fora do milestone.

## Critérios de aceite

Incrementos comprovados; falha não reporta sucesso nem perde estado; Update e crash em cada fase preservam uma versão válida; progresso/favoritos/overrides/downloads sobrevivem update/unsubscribe/delete remoto; downgrade e mesma versão com outro hash bloqueiam; contexto/foco/playback preservados; snapshot abre sem Registry. Aplicam-se também os critérios comuns acima.

## Validação

Testes de fronteira/domínio de cada incremento e ensaios reais controlados: Crash em stage/verify/commit preserva uma versão válida; update/unsubscribe mantém progresso/favoritos/overrides/downloads; mesmo número com outro hash e downgrade bloqueados; item focado removido restaura contexto.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.

## S04.1 — Fetch/deep link/limites e scheduler com backoff

**Objetivo/contexto:** entregar fetch/deep link/limites e scheduler com backoff sob o contrato S03.
**Escopo:** Fetch/deep link/limites e scheduler com backoff; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Crash em stage/verify/commit preserva uma versão válida; update/unsubscribe mantém progresso/favoritos/overrides/downloads; mesmo número com outro hash e downgrade bloqueados; item focado removido restaura contexto. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.

## S04.2 — staging/verify/diff/commit atômico

**Objetivo/contexto:** entregar staging/verify/diff/commit atômico sob o contrato S03 após S04.1.
**Escopo:** staging/verify/diff/commit atômico; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Crash em stage/verify/commit preserva uma versão válida; update/unsubscribe mantém progresso/favoritos/overrides/downloads; mesmo número com outro hash e downgrade bloqueados; item focado removido restaura contexto. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.

## S04.3 — rollback/unsubscribe e GC seguro

**Objetivo/contexto:** entregar rollback/unsubscribe e gc seguro sob o contrato S03 após S04.2.
**Escopo:** rollback/unsubscribe e GC seguro; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Crash em stage/verify/commit preserva uma versão válida; update/unsubscribe mantém progresso/favoritos/overrides/downloads; mesmo número com outro hash e downgrade bloqueados; item focado removido restaura contexto. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.
