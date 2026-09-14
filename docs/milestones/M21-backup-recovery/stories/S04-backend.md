# S04 — Adapters reais mínimos — M21

Status: DONE em 2026-09-14; S04.1–S04.3 integradas.

## Objetivo

Fornecer somente adapters exigidos pelo contrato de M21.

## Contexto e dependências

S03 concluída e dependências reais disponíveis; autorização para integrações e ambientes envolvidos. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Executar S04.1 → S04.2 → S04.3, uma por vez, conforme os incrementos abaixo. Escopo total: Backup/restore de DB/manifests/resume/config/chaves conforme storage, falha de migração/DB lock/disk full, reconciliação de cache, supervisor/restart com limites e shutdown global.

## Fora de escopo

Mudança silenciosa da UX, infraestrutura sem consumidor e capacidades fora do milestone.

## Critérios de aceite

Incrementos comprovados; falha não reporta sucesso nem perde estado; Backup consistente em runtime restaura catálogo/estado/subscriptions/config; falha preserva original; migração fresh e upgrade histórico passam; crashes UI/Core/torrentd/MPV e sync/playback concorrentes têm recuperação observável; nenhum fechamento espera indefinidamente. Aplicam-se também os critérios comuns acima.

## Validação

Testes de fronteira/domínio de cada incremento e ensaios reais controlados: Backup durante uso restaura em perfil isolado; injetar crash UI/Core/torrentd/MPV, DB lock/disk full/migração falha; manter original e restaurar estado/subscriptions/config; shutdown nunca espera indefinidamente.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.

## S04.1 — Backup consistente e validação

**Objetivo/contexto:** entregar backup consistente e validação sob o contrato S03.
**Escopo:** Backup consistente e validação; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Backup durante uso restaura em perfil isolado; injetar crash UI/Core/torrentd/MPV, DB lock/disk full/migração falha; manter original e restaurar estado/subscriptions/config; shutdown nunca espera indefinidamente. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.

## S04.2 — restore/staging/migração com preservação do original

**Objetivo/contexto:** entregar restore/staging/migração com preservação do original sob o contrato S03 após S04.1.
**Escopo:** restore/staging/migração com preservação do original; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Backup durante uso restaura em perfil isolado; injetar crash UI/Core/torrentd/MPV, DB lock/disk full/migração falha; manter original e restaurar estado/subscriptions/config; shutdown nunca espera indefinidamente. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.

## S04.3 — supervisor/shutdown e matriz de falhas integrada

**Objetivo/contexto:** entregar supervisor/shutdown e matriz de falhas integrada sob o contrato S03 após S04.2.
**Escopo:** supervisor/shutdown e matriz de falhas integrada; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Backup durante uso restaura em perfil isolado; injetar crash UI/Core/torrentd/MPV, DB lock/disk full/migração falha; manter original e restaurar estado/subscriptions/config; shutdown nunca espera indefinidamente. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** incremento comprovado com evidência antes de avançar ao seguinte.
