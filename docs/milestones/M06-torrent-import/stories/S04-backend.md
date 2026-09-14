# S04 — Adapters reais mínimos — M06

Status: DONE em 2026-09-14; S04.1–S04.3 executadas sequencialmente.

## Objetivo

Fornecer somente adapters exigidos pelo contrato de M06.

## Contexto e dependências

S03 concluída e dependências reais disponíveis; autorização para integrações e ambientes envolvidos. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Executar S04.1 → S04.2 → S04.3, uma por vez, conforme os incrementos abaixo. Escopo total: torrentd/libtorrent estritamente para inspeção e lifecycle requerido; validação magnet/bencode/paths, cópia gerenciada, metadata timeout, arquivos/samples/extras, selectors, infoHash, deduplicação de sessões e eventos progressivos.

## Fora de escopo

Mudança silenciosa da UX, infraestrutura sem consumidor e capacidades fora do milestone.

## Critérios de aceite

Incrementos comprovados; falha não reporta sucesso nem perde estado; Importar ambos os formatos, cancelar e salvar pendente; entradas maliciosas rejeitadas; fonte reutilizada sem runtime redundante; UI continua disponível após falha do daemon; IPC local validado e autenticado conforme transporte. Aplicam-se também os critérios comuns acima.

## Validação

Testes de fronteira/domínio de cada incremento e ensaios reais controlados: Usar torrent e magnet autorizados com metadata e sem peers; cancelar/repetir/reabrir pendente; mesmo hash com selectors distintos reutiliza sessão; derrubar daemon mantém UI; rejeitar bencode hostil e paths fora do sandbox.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.

## S04.1 — Parser e staging seguro de entrada

**Status:** DONE em 2026-09-14.

**Objetivo/contexto:** entregar parser e staging seguro de entrada sob o contrato S03.
**Escopo:** Parser e staging seguro de entrada; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Usar torrent e magnet autorizados com metadata e sem peers; cancelar/repetir/reabrir pendente; mesmo hash com selectors distintos reutiliza sessão; derrubar daemon mantém UI; rejeitar bencode hostil e paths fora do sandbox. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** concluído. Parser magnet/bencode, classificação inicial, budgets,
paths hostis, cópia gerenciada, symlink/prefix containment, cancelamento e cleanup
foram comprovados por 5 testes focados. [Evidência](../evidence/BACKEND_S04_1.md).

## S04.2 — daemon isolado e IPC autenticado restrito

**Status:** DONE em 2026-09-14.

**Objetivo/contexto:** entregar daemon isolado e ipc autenticado restrito sob o contrato S03 após S04.1.
**Escopo:** daemon isolado e IPC autenticado restrito; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Usar torrent e magnet autorizados com metadata e sem peers; cancelar/repetir/reabrir pendente; mesmo hash com selectors distintos reutiliza sessão; derrubar daemon mantém UI; rejeitar bencode hostil e paths fora do sandbox. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** concluído. Processo Python isolado com libtorrent 2.1.1, protocolo
versionado, stdio herdado, secret efêmero, allowlist, budgets, cancelamento e
reuso por infoHash foram executados em runtime real. [Evidência](../evidence/BACKEND_S04_2.md).

## S04.3 — source/selector/pendências persistentes e deduplicação

**Status:** DONE em 2026-09-14.

**Objetivo/contexto:** entregar source/selector/pendências persistentes e deduplicação sob o contrato S03 após S04.2.
**Escopo:** source/selector/pendências persistentes e deduplicação; aplicar operações, limites e invariantes do contrato previsto no README.
**Fora de escopo:** demais incrementos, mudanças de UX e dependências futuras.
**Aceite:** comportamento observável correspondente atende ao contrato; falha e cancelamento preservam estado e não deixam recursos sem proprietário.
**Validação:** testes de fronteira desse incremento e sua contribuição aos cenários: Usar torrent e magnet autorizados com metadata e sem peers; cancelar/repetir/reabrir pendente; mesmo hash com selectors distintos reutiliza sessão; derrubar daemon mantém UI; rejeitar bencode hostil e paths fora do sandbox. Registrar qual parcela foi comprovada; prova integral em S05.
**Done When:** concluído. SQLite v5 persiste pendências/retry, runtime/source e
selector por relação, com idempotência e rollback. [Evidência](../evidence/BACKEND_S04_3.md).
