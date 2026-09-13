# Método Frontend-Guided Milestones

## Objetivo

Transformar um PRD grande em um sistema de execução previsível para agentes de código, mantendo o progresso visível para humanos.

A hierarquia é:

```text
PRD → Milestones → Stories → GOAL → STATE/UPDATE
```

- **PRD**: define o produto e requisitos.
- **Milestone**: entrega uma capacidade vertical reconhecível.
- **Story**: unidade pequena e verificável de execução.
- **GOAL**: define como o agente trabalha.
- **STATE.yaml**: fonte de verdade operacional.
- **UPDATE.md**: visão humana do andamento.

## Regra central

Todo milestone começa por uma experiência navegável e testável no frontend usando um boundary mockável. Depois da validação de UX, o domínio e backend definitivos são construídos para atender essa experiência.

```text
Experience → Mock UI → Interaction → UX Review
→ Domain Contract → Backend → Integration
→ Functional Review → Tests → Hardening → Closure
```

## Milestones verticais

### Bom

```text
M01 Authentication
M02 Onboarding
M03 Dashboard
M04 Customers
M05 Transactions
```

### Ruim

```text
M01 Database
M02 Backend
M03 API
M04 Frontend
```

O segundo formato esconde progresso e adia feedback de produto.
