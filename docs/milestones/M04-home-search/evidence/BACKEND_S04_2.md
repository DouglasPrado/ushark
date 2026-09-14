# Evidência S04.2 — busca FTS5 incremental

Data: 2026-09-14.

## Implementação

A migration global v8 adiciona `discovery_search`, um índice FTS5 local com
tokenizer Unicode e remoção de diacríticos. O documento indexa título, título
original, sinopse, série, episódio e nomes de bibliotecas/coleções, sem depender
dos cards montados no renderer.

A busca:

- normaliza NFKD, case e acentos;
- transforma cada token em prefix match escapado e intersecta todos os tokens;
- trata pontuação e texto com aparência de operador como dados, não como FTS
  arbitrário;
- cruza tipo, favorito, recentes, continuar, gênero, coleção e origem;
- aplica sempre o alcance da biblioteca selecionada;
- usa ranking FTS seguido por título normalizado e `contentId`;
- pagina até 128 itens por cursor opaco preso à revisão;
- limita texto a 512 bytes e lote incremental/payload a 1.000 documentos/1 MiB;
- oferece cancelamento versionado para o adapter assíncrono de S05.

`apply` atualiza ou remove somente os IDs recebidos, na mesma transação dos
documentos, gêneros, origens e FTS. Retry é idempotente; revisão obsoleta falha
antes da escrita. Uma renomeação de origem reindexa somente os Contents
afetados. O delete do FTS usa `rowid`, evitando varredura quadrática em catálogos
grandes.

As decisões da janela de 30 dias para recentes e do rebuild explícito estão em
[D30–D31](../../../decisions/M04-D30-D31-search-window-and-recovery.md).

## Migração, restart e recuperação

- v7 → v8 faz backfill uma única vez e preserva documentos existentes;
- restart mantém exatamente as linhas/rowids do FTS intacto;
- ausência do FTS não derruba Home: busca retorna
  `DISCOVERY_INDEX_CORRUPT` recuperável;
- `rebuildSearchIndex` recria o índice somente por comando explícito,
  transacional e idempotente.

## Validação

Suíte conjunta S04.1/S04.2: **6/6**.

- acentos, case, prefixos, pontuação e expressão hostil;
- título/original/sinopse/série/episódio/biblioteca/coleção;
- filtros combinados e consulta vazia;
- dois homônimos preservados e paginação textual sem duplicata;
- item fora da janela inicial encontrado em corpus de 10.000 Contents;
- rename, coleção, delete e replay afetam somente o documento delimitado;
- falha no segundo upsert faz rollback do primeiro e do FTS;
- migração v7, restart sem rebuild e recuperação explícita;
- cancelamento e limites inválidos falham com código estável.

```text
pnpm exec playwright test tests/discovery-index-store.spec.ts --workers=1 --trace=off
# 6 passed

pnpm lint
pnpm typecheck
# passed
```

O watcher real, coalescência e processamento de arquivos fora da thread de UI
continuam pertencendo ao S04.3. A integração IPC/renderer fica para S05.
