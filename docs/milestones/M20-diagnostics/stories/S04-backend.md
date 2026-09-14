# S04 — Adapters reais mínimos — M20

Status: DONE em 2026-09-14; S04.1–S04.3 integradas.

## Objetivo

Fornecer somente adapters exigidos pelo contrato de M20.

## Contexto e dependências

S03 concluída e dependências reais disponíveis; autorização para integrações e ambientes envolvidos. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Executar S04.1 → S04.2 → S04.3, uma por vez, conforme os incrementos abaixo. Escopo total: Torrent/player/Health/DB/cache, decoder/FPS/drop frames quando disponíveis, razão de escolha, logs estruturados/correlation IDs/rotação/limites, diagnóstico exportável, retenção e limpeza separada.

## Fora de escopo

Mudança silenciosa da UX, infraestrutura sem consumidor e capacidades fora do milestone.

## Critérios de aceite

Incrementos comprovados; falha não reporta sucesso nem perde estado; Dados reais distinguem desconhecido de zero; export não inclui secrets/magnets privados/paths pessoais; logs e histórico não crescem sem limite; limpeza não apaga biblioteca; UI técnica é opcional. Aplicam-se também os critérios comuns acima.

## Validação

Testes de fronteira/domínio de cada incremento e ensaios reais controlados: Dados de runtimes reais comparados ao painel; inspecionar archive com tokens/magnets/paths sintéticos para comprovar redação; limpar logs não apaga biblioteca/progresso; medir overhead e rotação.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.

## S04.1 — Adapters de métricas e snapshots

**Objetivo/contexto:** entregar adapters de métricas e snapshots sob o contrato S03.
**Escopo:** Adapters de métricas e snapshots; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Dados de runtimes reais comparados ao painel; inspecionar archive com tokens/magnets/paths sintéticos para comprovar redação; limpar logs não apaga biblioteca/progresso; medir overhead e rotação. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.

## S04.2 — logs/retention/redação e export

**Objetivo/contexto:** entregar logs/retention/redação e export sob o contrato S03 após S04.1.
**Escopo:** logs/retention/redação e export; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Dados de runtimes reais comparados ao painel; inspecionar archive com tokens/magnets/paths sintéticos para comprovar redação; limpar logs não apaga biblioteca/progresso; medir overhead e rotação. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.

## S04.3 — limpeza seletiva com prioridade baixa

**Objetivo/contexto:** entregar limpeza seletiva com prioridade baixa sob o contrato S03 após S04.2.
**Escopo:** limpeza seletiva com prioridade baixa; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Dados de runtimes reais comparados ao painel; inspecionar archive com tokens/magnets/paths sintéticos para comprovar redação; limpar logs não apaga biblioteca/progresso; medir overhead e rotação. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.
