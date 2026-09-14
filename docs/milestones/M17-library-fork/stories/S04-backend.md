# S04 — Adapters reais mínimos — M17

Status: DEFERRED; preparada documentalmente, não executada.

## Objetivo

Fornecer somente adapters exigidos pelo contrato de M17.

## Contexto e dependências

S03 concluída e dependências reais disponíveis; autorização para integrações e ambientes envolvidos. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Executar S04.1 → S04.2 → S04.3, uma por vez, conforme os incrementos abaixo. Escopo total: Duplicar, editar cópia, provenance opcional, coleções pessoais de conteúdo externo e preservação da subscription original.

## Fora de escopo

Mudança silenciosa da UX, infraestrutura sem consumidor e capacidades fora do milestone.

## Critérios de aceite

Incrementos comprovados; falha não reporta sucesso nem perde estado; Fork transacional com novo libraryId; origem atualizada não altera cópia; Content/Source não duplicados; edição pessoal não muda remote; cancelar não cria cópia parcial. Aplicam-se também os critérios comuns acima.

## Validação

Testes de fronteira/domínio de cada incremento e ensaios reais controlados: Novo libraryId, mesmos Contents/Sources; atualização da origem não muda cópia; editar cópia não muda origem; cancelamento/falha não deixa parcial; GC mantém assets ainda usados.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.

## S04.1 — Cópia transacional com identidade nova

**Objetivo/contexto:** entregar cópia transacional com identidade nova sob o contrato S03.
**Escopo:** Cópia transacional com identidade nova; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Novo libraryId, mesmos Contents/Sources; atualização da origem não muda cópia; editar cópia não muda origem; cancelamento/falha não deixa parcial; GC mantém assets ainda usados. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.

## S04.2 — edição/memberships e proveniência escopadas

**Objetivo/contexto:** entregar edição/memberships e proveniência escopadas sob o contrato S03 após S04.1.
**Escopo:** edição/memberships e proveniência escopadas; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Novo libraryId, mesmos Contents/Sources; atualização da origem não muda cópia; editar cópia não muda origem; cancelamento/falha não deixa parcial; GC mantém assets ainda usados. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.

## S04.3 — retenção por referência e recuperação

**Objetivo/contexto:** entregar retenção por referência e recuperação sob o contrato S03 após S04.2.
**Escopo:** retenção por referência e recuperação; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Novo libraryId, mesmos Contents/Sources; atualização da origem não muda cópia; editar cópia não muda origem; cancelamento/falha não deixa parcial; GC mantém assets ainda usados. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.
