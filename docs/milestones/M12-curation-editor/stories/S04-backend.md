# S04 — Adapters reais mínimos — M12

Status: DEFERRED; preparada documentalmente, não executada.

## Objetivo

Fornecer somente adapters exigidos pelo contrato de M12.

## Contexto e dependências

S03 concluída e dependências reais disponíveis; autorização para integrações e ambientes envolvidos. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Executar S04.1 → S04.2 → S04.3, uma por vez, conforme os incrementos abaixo. Escopo total: Nome/descrição/autor/avatar/logo/banner/accent, conteúdos e fontes selecionadas, hero/carousel/grid/continue-watching local, coleções determinísticas, ordenação e overrides de apresentação escopados.

## Fora de escopo

Mudança silenciosa da UX, infraestrutura sem consumidor e capacidades fora do milestone.

## Critérios de aceite

Incrementos comprovados; falha não reporta sucesso nem perde estado; Reordenar/renomear preserva IDs; salvar e reabrir mantém draft; preview reproduz layout; estado pessoal não compõe dados exportáveis; curadoria não força runtime nem muda Content global. Aplicam-se também os critérios comuns acima.

## Validação

Testes de fronteira/domínio de cada incremento e ensaios reais controlados: Reabrir mantém IDs/ordem/draft; preview equivale ao layout; reordenar não altera Content global; inspecionar payload sem estado pessoal; salvar não publica nem inicia torrent.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.

## S04.1 — Draft/identidade persistentes

**Objetivo/contexto:** entregar draft/identidade persistentes sob o contrato S03.
**Escopo:** Draft/identidade persistentes; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Reabrir mantém IDs/ordem/draft; preview equivale ao layout; reordenar não altera Content global; inspecionar payload sem estado pessoal; salvar não publica nem inicia torrent. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.

## S04.2 — coleções/seções/ordem e overrides escopados

**Objetivo/contexto:** entregar coleções/seções/ordem e overrides escopados sob o contrato S03 após S04.1.
**Escopo:** coleções/seções/ordem e overrides escopados; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Reabrir mantém IDs/ordem/draft; preview equivale ao layout; reordenar não altera Content global; inspecionar payload sem estado pessoal; salvar não publica nem inicia torrent. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.

## S04.3 — preview pelo contrato compartilhado de leitura

**Objetivo/contexto:** entregar preview pelo contrato compartilhado de leitura sob o contrato S03 após S04.2.
**Escopo:** preview pelo contrato compartilhado de leitura; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Reabrir mantém IDs/ordem/draft; preview equivale ao layout; reordenar não altera Content global; inspecionar payload sem estado pessoal; salvar não publica nem inicia torrent. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.
