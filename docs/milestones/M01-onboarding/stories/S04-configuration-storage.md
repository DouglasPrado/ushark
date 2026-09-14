# S04 — Salvar configuração e biblioteca vazia

Status: DONE. Executada e validada localmente em 2026-09-14.

## Objetivo

Fazer somente os dados exigidos por M01 sobreviverem ao restart.

## Contexto e requisitos

FR-001, FR-187–193, FR-214–218; NFR-065, NFR-137–138; RX-002–003.

Ler [M01](../README.md), [plano aprovado](../../PLAN.md#m01), [matriz](../../REQUIREMENTS_COVERAGE.md), [A11 frontend-first](../../../architecture/11-frontend-first-project-setup.md), [A09 UX](../../../architecture/09-ux-navigation-spec.md) e [A08 segurança](../../../architecture/08-security-model.md), apenas nas seções aplicáveis. Contratos/integração também consultam A06 §§69–79 e 88–104 quando persistência for necessária.

## Dependências

S03; execução explicitamente autorizada.

## Escopo

Adapter local aprovado em S03, diretórios válidos e configuração atomicamente salva; criação mínima da biblioteca vazia; reset seletivo e recuperação de configuração inválida. Gate frontend básico após UX inicial aprovada; evoluir apenas checks pertinentes.

## Fora de escopo

Tabelas de filmes/séries, downloader, limpeza de cache real, TMDB, MPV, Registry, infraestrutura nativa ou release.

## Critérios de aceite

Salvar/reabrir mantém ID e configuração; falha de permissão/espaço não reporta sucesso nem perde configuração anterior; diretório inválido oferece correção; reset não apaga dados; renderer não recebe API de filesystem irrestrita.

## Validação

Testes em diretório temporário de salvar/reabrir, erro parcial e reset; inspeção do boundary Electron; format/lint/typecheck/testes/build disponíveis. Se houver DB, incluir migration proporcional.

## Evidências

- `packages/core/src/configuration-store.cjs`: SQLite local, migration v1, WAL, `busy_timeout`, transação atômica, validação de paths e recovery de snapshot inválido.
- O schema cria somente `schema_migrations`, `settings` e `local_libraries`; nenhum domínio futuro foi antecipado.
- `tests/configuration-store.spec.ts`: 3/3 testes passaram cobrindo restart/identidade estável, diretório inválido sem perda do snapshot anterior, reset seletivo e recovery.
- `pnpm typecheck` e lint dos arquivos afetados passaram no macOS; nenhuma afirmação de Windows/TV físicos.

## Conclusão

Persistência mínima implementada e validada isoladamente. A exposição restrita pelo preload e a jornada Electron pertencem a S05.
