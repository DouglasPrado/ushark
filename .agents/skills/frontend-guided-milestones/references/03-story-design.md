# Como desenhar stories

Toda story deve responder claramente: o que, por quê, qual escopo, o que não fazer, quais regras arquiteturais se aplicam, como validar e quando considerar concluída.

## Estrutura mínima

```text
Objective
Context
Architecture Inputs
Architecture Constraints
Scope
Out of Scope
Acceptance Criteria
Validation
Architecture Evidence
Done When
```

## Arquitetura na story

Inclua apenas fontes e constraints que mudam decisões desta story. Quando aplicável, deixe explícitos:

- owner do dado/estado e identidade usada;
- boundary de processo, módulo, adapter ou trust atravessado;
- contrato/versionamento, erros, idempotência e recovery;
- restrições de segurança, UX, performance e entrega;
- validação observável que comprova a regra.

Uma referência genérica como “seguir toda a arquitetura” não basta. Também não replique grandes trechos da spec: cite arquivo/seção e traduza somente a obrigação aplicável em critério verificável.

## Exemplo positivo

```md
# S04.2 — Customer List API

## Objective
Fornecer os dados exigidos pela tela `/customers`.

## Architecture Inputs
- `docs/architecture/api-contracts.md` — endpoint contracts and authorization boundary

## Architecture Constraints
- UI consome o contrato; repository permanece encapsulado pelo serviço.
- Input de busca e filtros é validado no boundary da API.

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
- teste de contrato UI/API e autorização
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
