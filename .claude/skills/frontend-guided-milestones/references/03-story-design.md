# Como desenhar stories

Toda story deve responder claramente: o que, por quê, qual escopo, o que não fazer, como validar e quando considerar concluída.

## Estrutura mínima

```text
Objective
Context
Scope
Out of Scope
Acceptance Criteria
Validation
Done When
```

## Exemplo positivo

```md
# S04.2 — Customer List API

## Objective
Fornecer os dados exigidos pela tela `/customers`.

## Scope
- search por nome/email/documento
- filtro por status
- paginação

## Out of Scope
- criação
- edição
- exclusão
- alterações visuais

## Acceptance Criteria
- GET /customers retorna CustomerListItem
- filtros e paginação seguem S03
- autorização é aplicada

## Validation
- testes do endpoint
- typecheck
- lint relevante
```

## Exemplo negativo

```md
# Backend de clientes
Faça tudo do backend de clientes. Consulte o PRD.
```

Problemas: escopo aberto, contexto enorme, sem critérios de aceite, sem definição de pronto.

## Granularidade

Se uma story combina vários comportamentos independentes, quebre em sub-stories. Prefira unidades que possam ser implementadas, verificadas e encerradas sem deixar estado parcialmente utilizável.
