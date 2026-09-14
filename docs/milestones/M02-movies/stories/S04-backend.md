# S04 — Persistência, provider e imagens

Status: DONE. S04.1–S04.3 concluídas e validadas localmente em 2026-09-14.

## Objetivo

Fornecer adapters reais mínimos sem alterar a UX aprovada.

## Contexto e dependências

Ler [M02](../README.md) e apenas as fontes aplicáveis: S03 concluída; M01 integrado; fase frontend M01–M22 aprovada.

## Escopo

Executar S04.1 → S04.2 → S04.3, conforme sub-stories abaixo; uma por vez.

## Fora de escopo

Torrentd, streaming, tabelas futuras e integração da UI antes de S05.

## Critérios de aceite

Sub-stories concluídas com evidências; domínio testável sem renderer; falhas não corrompem catálogo.

## Validação

Checks de cada sub-story, lint/typecheck/build aplicáveis e testes de fronteira.

## Evidências

- S04.1: `packages/core/src/movie-catalog-store.cjs` e `tests/movie-catalog-store.spec.ts`.
- S04.1: 6/6 testes passaram, cobrindo migration v2, restart/ordem/favorito, idempotência/revisão, merge conservador, rollback e remoções não destrutivas.
- S04.2: `packages/core/src/tmdb-metadata-provider.cjs` e `tests/tmdb-metadata-provider.spec.ts`.
- S04.2: adapter HTTPS fixo, token no Core, cache SQLite, timeout/cancelamento, limites, payload validado e fallback degradado; 5/5 testes próprios e 11/11 combinados passaram.
- Smoke TMDB de rede real pendente porque `USHARK_TMDB_TOKEN` não está configurado neste ambiente; respostas controladas não são registradas como rede real.
- Typecheck e lint dos arquivos afetados passaram após S04.1–S04.2.
- S04.3: `packages/core/src/movie-asset-store.cjs`, delete gerenciado no catálogo e testes correspondentes.
- S04.3: cache por hash/URI interna, allowlist HTTPS TMDB, magic bytes, limite de 20 MB, cancelamento sem parcial, path confinado e confirmação separada; 4 testes próprios e 15/15 combinados passaram.

## Conclusão

Todos os adapters exigidos pelo contrato estão validados.

## S04.1 — Catálogo local transacional

**Objetivo/contexto:** persistir somente entidades e operações definidas em S03, sobre a configuração real de M01.
**Escopo:** repositórios de Content/membership/source/estado pessoal, ordem, deduplicação e merge conservador; migrações e configuração SQLite apropriada de concorrência/WAL.
**Fora de escopo:** provider, imagens, schemas de séries/manifest futuro.
**Aceite:** restart preserva registros e relações; falha intermediária de merge faz rollback; remoção de source não apaga Content e membership não apaga arquivo.
**Validação:** testes de domínio/transação, fresh/upgrade histórico, conflito dos dois lados e migração interrompida recuperável; backup/review/rollback para mudança destrutiva.
**Done when:** DONE em 2026-09-14. Persistência comprovada e evidência registrada antes de S04.2.

## S04.2 — MetadataProvider TMDB

**Objetivo/contexto:** implementar o adapter do contrato S03 após S04.1.
**Escopo:** busca/identificação e IDs TMDB/IMDb, cache local e atualização em background; timeout/cancelamento/retry conforme contrato, credenciais fora do renderer/logs.
**Fora de escopo:** serviço de catálogo obrigatório, torrent, identidade alterada por refresh.
**Aceite:** indisponibilidade permite cadastro manual e catálogo offline; override mantém precedência sem contaminar metadata global.
**Validação:** contrato com respostas controladas, falhas e respostas antigas; smoke real documentado quando configuração estiver disponível, sem confundir stub com rede real.
**Done when:** adapter verificado e limitações reais registradas antes de S04.3.

DONE em 2026-09-14 com contrato controlado verde; smoke externo permanece gate explícito do checkpoint quando houver configuração.

## S04.3 — Imagens locais e operação explícita de arquivo

**Objetivo/contexto:** completar recursos locais necessários aos detalhes após S04.2, usando limites S03.
**Escopo:** cache de poster/backdrop e variantes, fallback/progresso; operação mínima de delete explícito em path autorizado com confirmação separada, sem política de eviction.
**Fora de escopo:** cache torrent, retenção/limpeza M10 e manipulação irrestrita de paths.
**Aceite:** imagens cacheadas abrem offline; erro de download/decode não impede navegação; cancelamento não apaga arquivo; falha de delete é visível e não remove relações silenciosamente.
**Validação:** imagem ausente/corrompida/oversized, path fora de escopo e falha de disco; usar apenas arquivos temporários dedicados no teste de delete.
**Done when:** cache e operação local comprovados com evidências, permitindo S05.

DONE em 2026-09-14.
