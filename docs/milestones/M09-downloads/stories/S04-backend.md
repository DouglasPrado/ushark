# S04 — Adapters reais mínimos — M09

Status: DONE — S04.1, S04.2 e S04.3 comprovadas; próxima story S05.

## Objetivo

Fornecer somente adapters exigidos pelo contrato de M09.

## Contexto e dependências

S03 concluída e dependências reais disponíveis; autorização para integrações e ambientes envolvidos. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Executar S04.1 → S04.2 → S04.3, uma por vez, conforme os incrementos abaixo. Escopo total: Fila, progresso, velocidade, peers, tamanho/destino/health, pausar/retomar/cancelar, prioridade, download completo, resume data e limites de sessão/download/upload.

## Fora de escopo

Mudança silenciosa da UX, infraestrutura sem consumidor e capacidades fora do milestone.

## Critérios de aceite

Incrementos comprovados; falha não reporta sucesso nem perde estado; Baixar/pause/restart/resume funciona sem recheck global desnecessário; cancelamento preserva catálogo; apagar dados é confirmação distinta; download em background cede para playback; falta de espaço pausa escrita com feedback. Aplicam-se também os critérios comuns acima.

## Validação

Testes de fronteira/domínio de cada incremento e ensaios reais controlados: Pausar/restart/retomar sem recheck global desnecessário; cancelar mantém Content; apagar dados exige outra confirmação; download concorrente cede ao playback; disco cheio pausa escrita.

## Evidências

[S04.1](../evidence/BACKEND_S04_1.md),
[S04.2](../evidence/BACKEND_S04_2.md) e
[S04.3](../evidence/BACKEND_S04_3.md).

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.

## S04.1 — Fila/comandos e limites de rede/sessões

**Objetivo/contexto:** entregar fila/comandos e limites de rede/sessões sob o contrato S03.
**Escopo:** Fila/comandos e limites de rede/sessões; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Pausar/restart/retomar sem recheck global desnecessário; cancelar mantém Content; apagar dados exige outra confirmação; download concorrente cede ao playback; disco cheio pausa escrita. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** cumprido. [Evidência](../evidence/BACKEND_S04_1.md).

## S04.2 — resume data e persistência de destino/prioridade

**Objetivo/contexto:** entregar resume data e persistência de destino/prioridade sob o contrato S03 após S04.1.
**Escopo:** resume data e persistência de destino/prioridade; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Pausar/restart/retomar sem recheck global desnecessário; cancelar mantém Content; apagar dados exige outra confirmação; download concorrente cede ao playback; disco cheio pausa escrita. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** cumprido. [Evidência](../evidence/BACKEND_S04_2.md).

## S04.3 — recuperação e cancelamento separado da remoção

**Objetivo/contexto:** entregar recuperação e cancelamento separado da remoção sob o contrato S03 após S04.2.
**Escopo:** recuperação e cancelamento separado da remoção; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Pausar/restart/retomar sem recheck global desnecessário; cancelar mantém Content; apagar dados exige outra confirmação; download concorrente cede ao playback; disco cheio pausa escrita. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** cumprido. [Evidência](../evidence/BACKEND_S04_3.md).
