# S06 — Testes das jornadas e invariantes

Status: DEFERRED. Preparar este arquivo não conclui a story.

## Objetivo

Consolidar regressões significativas do catálogo integrado.

## Contexto e dependências

Ler [M02](../README.md) e apenas as fontes aplicáveis: S05 e checkpoint funcional aprovados; reaproveitar testes anteriores.

## Escopo

Cobrir invariantes de identidade/merge/ownership sem UI; adapters e transações; E2E cadastro, offline, edição, favoritos e remoções. Migrações fresh e upgrade histórico, rollback/falha e concorrência têm regressões.

## Fora de escopo

Duplicar testes já suficientes ou testar serviços futuros.

## Critérios de aceite

Suite detecta perda de relações no merge, duplicata por retry, refresh que apaga override e exclusão sem confirmação; fixtures isoladas e reprodutíveis.

## Validação

Executar suítes relevantes e gates existentes; acrescentar gates de migração somente para schema introduzido.

## Evidências

PENDENTES. Registrar arquivos, comandos/resultados e ambiente após execução em UPDATE e nos checkpoints correspondentes.

## Conclusão

Cobertura de risco e evidências disponíveis; testes verdes não substituem validação funcional/física.
