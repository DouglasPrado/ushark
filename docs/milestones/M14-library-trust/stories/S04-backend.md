# S04 — Adapters reais mínimos — M14

Status: DEFERRED; preparada documentalmente, não executada.

## Objetivo

Fornecer somente adapters exigidos pelo contrato de M14.

## Contexto e dependências

S03 concluída e dependências reais disponíveis; autorização para integrações e ambientes envolvidos. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Executar S04.1 → S04.2 → S04.3, uma por vez, conforme os incrementos abaixo. Escopo total: Ed25519 planejado, payload canônico assinado, TOFU, hash, key pinning, secure storage de chave privada, UI de confiança e mudança explícita de chave.

## Fora de escopo

Mudança silenciosa da UX, infraestrutura sem consumidor e capacidades fora do milestone.

## Critérios de aceite

Incrementos comprovados; falha não reporta sucesso nem perde estado; Não assinada pode ser aceita com identificação clara; inválida/hash divergente bloqueia; chave alterada não entra silenciosamente; assinatura persiste no roundtrip e secrets não aparecem no DB/logs. Aplicam-se também os critérios comuns acima.

## Validação

Testes de fronteira/domínio de cada incremento e ensaios reais controlados: Modificar bytes invalida assinatura; chave diferente nunca entra silenciosamente; não assinado é identificado; roundtrip preserva assinatura; verificar ausência de chave privada em DB/logs.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.

## S04.1 — Verificação/canonicalização com vetores

**Objetivo/contexto:** entregar verificação/canonicalização com vetores sob o contrato S03.
**Escopo:** Verificação/canonicalização com vetores; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Modificar bytes invalida assinatura; chave diferente nunca entra silenciosamente; não assinado é identificado; roundtrip preserva assinatura; verificar ausência de chave privada em DB/logs. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.

## S04.2 — TOFU/pins e confirmação explícita

**Objetivo/contexto:** entregar tofu/pins e confirmação explícita sob o contrato S03 após S04.1.
**Escopo:** TOFU/pins e confirmação explícita; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Modificar bytes invalida assinatura; chave diferente nunca entra silenciosamente; não assinado é identificado; roundtrip preserva assinatura; verificar ausência de chave privada em DB/logs. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.

## S04.3 — assinatura e secure storage do autor

**Objetivo/contexto:** entregar assinatura e secure storage do autor sob o contrato S03 após S04.2.
**Escopo:** assinatura e secure storage do autor; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Modificar bytes invalida assinatura; chave diferente nunca entra silenciosamente; não assinado é identificado; roundtrip preserva assinatura; verificar ausência de chave privada em DB/logs. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.
