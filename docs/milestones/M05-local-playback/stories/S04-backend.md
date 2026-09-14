# S04 — Adapters reais mínimos — M05

Status: DEFERRED; preparada documentalmente, não executada.

## Objetivo

Fornecer somente adapters exigidos pelo contrato de M05.

## Contexto e dependências

S03 concluída e dependências reais disponíveis; autorização para integrações e ambientes envolvidos. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Executar S04.1 → S04.2 → S04.3, uma por vez, conforme os incrementos abaixo. Escopo total: Details → preparar → player → details; play/pause/seek, áudio, legendas internas/externas, volume/mute, fullscreen, hardware decode, progresso, assistido, histórico e retomada offline.

## Fora de escopo

Mudança silenciosa da UX, infraestrutura sem consumidor e capacidades fora do milestone.

## Critérios de aceite

Incrementos comprovados; falha não reporta sucesso nem perde estado; MPV separado toca mídia controlada; tracks mudam sem reiniciar source; sair salva imediatamente; crash do MPV preserva UI; progresso periódico tem budget explícito; primeira imagem é observada, não inferida do lançamento do processo. Aplicam-se também os critérios comuns acima.

## Validação

Testes de fronteira/domínio de cada incremento e ensaios reais controlados: Reproduzir fixture local autorizada offline, trocar áudio/legenda sem reiniciar source, sair/reabrir e verificar posição; matar MPV e comprovar UI viva e progresso dentro do budget definido.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.

## S04.1 — Adapter MPV isolado e primeiro frame

**Objetivo/contexto:** entregar adapter mpv isolado e primeiro frame sob o contrato S03.
**Escopo:** Adapter MPV isolado e primeiro frame; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Reproduzir fixture local autorizada offline, trocar áudio/legenda sem reiniciar source, sair/reabrir e verificar posição; matar MPV e comprovar UI viva e progresso dentro do budget definido. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.

## S04.2 — estado/progresso periódico e saída

**Objetivo/contexto:** entregar estado/progresso periódico e saída sob o contrato S03 após S04.1.
**Escopo:** estado/progresso periódico e saída; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Reproduzir fixture local autorizada offline, trocar áudio/legenda sem reiniciar source, sair/reabrir e verificar posição; matar MPV e comprovar UI viva e progresso dentro do budget definido. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.

## S04.3 — tracks e legenda externa validada

**Objetivo/contexto:** entregar tracks e legenda externa validada sob o contrato S03 após S04.2.
**Escopo:** tracks e legenda externa validada; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Reproduzir fixture local autorizada offline, trocar áudio/legenda sem reiniciar source, sair/reabrir e verificar posição; matar MPV e comprovar UI viva e progresso dentro do budget definido. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.
