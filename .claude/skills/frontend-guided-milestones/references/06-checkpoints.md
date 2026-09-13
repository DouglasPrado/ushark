# Checkpoints humanos

## UX CHECKPOINT

Ocorre após S02. A experiência deve funcionar com mocks suficientes para testar a jornada.

Estados sugeridos:

```text
PENDING
READY_FOR_REVIEW
APPROVED
CHANGES_REQUESTED
```

Durante `CHANGES_REQUESTED`, atualize S00/S01/S02 e contratos preliminares afetados antes de avançar.

## FUNCTIONAL CHECKPOINT

Ocorre após S05. A jornada deve usar dados reais, sem mocks acidentais no caminho principal.

Verifique:

- persistência real;
- autorização;
- erros principais;
- navegação;
- estados de carregamento e sucesso;
- dados apresentados conforme contrato.

## Quando automatizar checkpoints

Se o usuário explicitamente autorizar execução sem revisão humana para um milestone ou ambiente, registre a autorização no milestone e continue. Não invente autorização.
