# Método Frontend-Guided Milestones

## Objetivo

Transformar documentação extensa de produto e arquitetura em um sistema de execução previsível para agentes de código, mantendo o progresso visível para humanos.

A relação é:

```text
Produto + Arquitetura → Milestones → Stories → GOAL → STATE/UPDATE
```

- **Produto/PRD**: define o que o produto precisa entregar.
- **Arquitetura**: define como construir, separar responsabilidades e provar qualidades sem antecipar a arquitetura-alvo.
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

As fases não suspendem a arquitetura. S00–S02 já devem preservar contratos substituíveis, ownership, estados e restrições de UX/segurança aplicáveis. S03–S08 materializam somente a infraestrutura exigida pelo fluxo aprovado e comprovam os boundaries e gates correspondentes.

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
