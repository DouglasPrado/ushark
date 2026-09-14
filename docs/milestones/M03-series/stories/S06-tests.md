# S06 — Testes das jornadas e invariantes

Status: DEFERRED. Preparar este arquivo não executa a story.

## Objetivo

Consolidar regressões significativas do catálogo de séries integrado.

## Contexto e dependências

Ler [M03](../README.md) e apenas as fontes aplicáveis: S05 e checkpoint funcional aprovados; reaproveitar testes anteriores.

## Escopo

Cobrir inferência, identidade, selectors e correções sem UI; adapters, migrações e transações; E2E episódio avulso, packs, especiais, ambiguidade, offline e restart. Incluir fresh/upgrade histórico, rollback, retry e corpus de nomes adversariais.

## Fora de escopo

Duplicar testes já suficientes, validar scheduler/player ou medir serviços de milestones futuros.

## Critérios de aceite

A suíte detecta merge de episódios distintos, selector trocado, correção perdida, confirmação duplicada e metadata refresh que muda identidade. Fixtures são isoladas e reprodutíveis.

## Validação

Executar suítes relevantes e gates existentes; acrescentar gates de migração e propriedades somente para o schema e invariantes introduzidos.

## Evidências

PENDENTES. Registrar arquivos, comandos/resultados e ambiente ao executar S06.

## Done When

Cobertura de risco e evidências disponíveis; testes verdes não substituem validação funcional ou física.
