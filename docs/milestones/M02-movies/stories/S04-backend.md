# S04 — Persistência, provider e imagens

Status: DEFERRED. Preparar este arquivo não conclui a story.

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

PENDENTES. Registrar arquivos, comandos/resultados e ambiente após execução em UPDATE e nos checkpoints correspondentes.

## Conclusão

Todos os adapters exigidos pelo contrato estão validados.

## S04.1 — Catálogo local transacional

**Objetivo/contexto:** persistir somente entidades e operações definidas em S03, sobre a configuração real de M01.
**Escopo:** repositórios de Content/membership/source/estado pessoal, ordem, deduplicação e merge conservador; migrações e configuração SQLite apropriada de concorrência/WAL.
**Fora de escopo:** provider, imagens, schemas de séries/manifest futuro.
**Aceite:** restart preserva registros e relações; falha intermediária de merge faz rollback; remoção de source não apaga Content e membership não apaga arquivo.
**Validação:** testes de domínio/transação, fresh/upgrade histórico, conflito dos dois lados e migração interrompida recuperável; backup/review/rollback para mudança destrutiva.
**Done when:** persistência comprovada e evidência registrada antes de S04.2.

## S04.2 — MetadataProvider TMDB

**Objetivo/contexto:** implementar o adapter do contrato S03 após S04.1.
**Escopo:** busca/identificação e IDs TMDB/IMDb, cache local e atualização em background; timeout/cancelamento/retry conforme contrato, credenciais fora do renderer/logs.
**Fora de escopo:** serviço de catálogo obrigatório, torrent, identidade alterada por refresh.
**Aceite:** indisponibilidade permite cadastro manual e catálogo offline; override mantém precedência sem contaminar metadata global.
**Validação:** contrato com respostas controladas, falhas e respostas antigas; smoke real documentado quando configuração estiver disponível, sem confundir stub com rede real.
**Done when:** adapter verificado e limitações reais registradas antes de S04.3.

## S04.3 — Imagens locais e operação explícita de arquivo

**Objetivo/contexto:** completar recursos locais necessários aos detalhes após S04.2, usando limites S03.
**Escopo:** cache de poster/backdrop e variantes, fallback/progresso; operação mínima de delete explícito em path autorizado com confirmação separada, sem política de eviction.
**Fora de escopo:** cache torrent, retenção/limpeza M10 e manipulação irrestrita de paths.
**Aceite:** imagens cacheadas abrem offline; erro de download/decode não impede navegação; cancelamento não apaga arquivo; falha de delete é visível e não remove relações silenciosamente.
**Validação:** imagem ausente/corrompida/oversized, path fora de escopo e falha de disco; usar apenas arquivos temporários dedicados no teste de delete.
**Done when:** cache e operação local comprovados com evidências, permitindo S05.
