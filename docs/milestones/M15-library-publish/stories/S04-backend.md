# S04 — Adapters reais mínimos — M15

Status: DEFERRED; preparada documentalmente, não executada.

## Objetivo

Fornecer somente adapters exigidos pelo contrato de M15.

## Contexto e dependências

S03 concluída e dependências reais disponíveis; autorização para integrações e ambientes envolvidos. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Executar S04.1 → S04.2 → S04.3, uma por vez, conforme os incrementos abaixo. Escopo total: Adapter remoto e Registry mínimo apenas aqui; auth/autorizações/quotas, stage de blobs, concorrência de versão, diff/preview, publicar nova versão baseada em anterior, retirar publicação sem apagar instalações locais.

## Fora de escopo

Mudança silenciosa da UX, infraestrutura sem consumidor e capacidades fora do milestone.

## Critérios de aceite

Incrementos comprovados; falha não reporta sucesso nem perde estado; Somente editor autorizado publica; vN não muda; falha de upload não deixa versão apontando para blob incompleto; conflito simultâneo é explícito; link resolve snapshot; conteúdo audiovisual/estado pessoal não é enviado. Aplicam-se também os critérios comuns acima.

## Validação

Testes de fronteira/domínio de cada incremento e ensaios reais controlados: Ambiente de teste: editor autorizado publica, não editor rejeitado; falha de upload não aponta a blob incompleto; concorrência retorna conflito; vN imutável; retirada não apaga instalações locais.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.

## S04.1 — Adapter remoto/auth e quotas mínimas

**Objetivo/contexto:** entregar adapter remoto/auth e quotas mínimas sob o contrato S03.
**Escopo:** Adapter remoto/auth e quotas mínimas; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Ambiente de teste: editor autorizado publica, não editor rejeitado; falha de upload não aponta a blob incompleto; concorrência retorna conflito; vN imutável; retirada não apaga instalações locais. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.

## S04.2 — upload/staging e commit de versão

**Objetivo/contexto:** entregar upload/staging e commit de versão sob o contrato S03 após S04.1.
**Escopo:** upload/staging e commit de versão; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Ambiente de teste: editor autorizado publica, não editor rejeitado; falha de upload não aponta a blob incompleto; concorrência retorna conflito; vN imutável; retirada não apaga instalações locais. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.

## S04.3 — resolução de link/código e retirada

**Objetivo/contexto:** entregar resolução de link/código e retirada sob o contrato S03 após S04.2.
**Escopo:** resolução de link/código e retirada; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Ambiente de teste: editor autorizado publica, não editor rejeitado; falha de upload não aponta a blob incompleto; concorrência retorna conflito; vN imutável; retirada não apaga instalações locais. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.
