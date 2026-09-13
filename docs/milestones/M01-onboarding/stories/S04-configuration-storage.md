# S04 — Salvar configuração e biblioteca vazia

Status: PLANNED. Preparação documental; não executada.

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

Ainda não existem evidências de execução. Registrar arquivos alterados, comandos/resultados, ambiente e demonstração pertinente quando a story for executada.

## Conclusão

Aceite e validação satisfeitos, com evidências e revisão/gates aplicáveis. Preparar este arquivo não conclui a story. Implementação permanece dependente de autorização de execução e dos checkpoints indicados.
