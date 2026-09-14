# S04 — Adapters reais mínimos — M07

Status: DEFERRED; preparada documentalmente, não executada.

## Objetivo

Fornecer somente adapters exigidos pelo contrato de M07.

## Contexto e dependências

S03 concluída e dependências reais disponíveis; autorização para integrações e ambientes envolvidos. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Executar S04.1 → S04.2 → S04.3, uma por vez, conforme os incrementos abaixo. Escopo total: Integração torrentd/MPV, probe parcial, HEAD/TAIL, mapping tempo/byte/piece, janelas/deadlines, buffers adaptativos, cache RAM/disco mínimo limitado, Stream Only, prioridades de playback e falhas recuperáveis.

## Fora de escopo

Mudança silenciosa da UX, infraestrutura sem consumidor e capacidades fora do milestone.

## Critérios de aceite

Incrementos comprovados; falha não reporta sucesso nem perde estado; Play antes de completar e seek fora do cache comprovados; seeks rápidos respeitam última geração; season pack prioriza episódio atual; nenhum arquivo ativo é limpo; UI não bloqueia; startup 1–5s e seek 1–3s medidos em source saudável controlada. Aplicam-se também os critérios comuns acima.

## Validação

Testes de fronteira/domínio de cada incremento e ensaios reais controlados: Filme e episódio de pack incompletos tocam; seek fora do cache e três seeks rápidos reproduzem a última posição; medir primeiro frame 1–5s/seek 1–3s em swarm controlado; inspecionar prioridade e limites RAM/disco.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.

## S04.1 — Probe parcial e mapeamento tempo/byte/piece

**Objetivo/contexto:** entregar probe parcial e mapeamento tempo/byte/piece sob o contrato S03.
**Escopo:** Probe parcial e mapeamento tempo/byte/piece; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Filme e episódio de pack incompletos tocam; seek fora do cache e três seeks rápidos reproduzem a última posição; medir primeiro frame 1–5s/seek 1–3s em swarm controlado; inspecionar prioridade e limites RAM/disco. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.

## S04.2 — scheduler HEAD/TAIL/deadlines e cache limitado

**Objetivo/contexto:** entregar scheduler head/tail/deadlines e cache limitado sob o contrato S03 após S04.1.
**Escopo:** scheduler HEAD/TAIL/deadlines e cache limitado; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Filme e episódio de pack incompletos tocam; seek fora do cache e três seeks rápidos reproduzem a última posição; medir primeiro frame 1–5s/seek 1–3s em swarm controlado; inspecionar prioridade e limites RAM/disco. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.

## S04.3 — delivery ao MPV e cancelamento por geração

**Objetivo/contexto:** entregar delivery ao mpv e cancelamento por geração sob o contrato S03 após S04.2.
**Escopo:** delivery ao MPV e cancelamento por geração; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Filme e episódio de pack incompletos tocam; seek fora do cache e três seeks rápidos reproduzem a última posição; medir primeiro frame 1–5s/seek 1–3s em swarm controlado; inspecionar prioridade e limites RAM/disco. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.
