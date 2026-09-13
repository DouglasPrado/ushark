# Lifecycle padrão S00–S08

Todo milestone usa o mesmo esqueleto, com sub-stories quando necessário.

```text
S00 — Milestone Contract
S01 — Mock UI
S02 — Frontend Behavior
UX CHECKPOINT
S03 — Domain Contract
S04 — Backend Implementation
S05 — Frontend Integration
FUNCTIONAL CHECKPOINT
S06 — Automated Tests
S07 — Hardening
S08 — Milestone Closure
```

## S00 — Contract
Define objetivo, jornada principal, rotas, estados obrigatórios, dependências e Definition of Done.

## S01 — Mock UI
Cria a experiência visual usando dados mockados atrás de um boundary substituível.

## S02 — Frontend Behavior
Implementa navegação, formulários, busca, filtros, validação, loading, empty, error e feedbacks.

## UX CHECKPOINT
A experiência deve estar navegável. Mudanças de UX são baratas aqui. Não avance para backend definitivo quando o checkpoint exigir aprovação humana e ela ainda não existir.

## S03 — Domain Contract
Formaliza entidades, DTOs, queries, comandos e contratos que a experiência realmente exige.

## S04 — Backend
Implementa persistência, serviços, APIs, autorização e regras. Divida em `S04.1`, `S04.2` etc. quando necessário.

## S05 — Integration
Troca mocks por adaptadores reais preservando a UI já validada.

## FUNCTIONAL CHECKPOINT
Executa a jornada ponta a ponta com dados reais.

## S06 — Tests
Testes unitários, integração e E2E relevantes, com foco em jornadas reais.

## S07 — Hardening
Segurança, permissões, observabilidade, performance, acessibilidade, responsividade, edge cases e falhas.

## S08 — Closure
Audita evidências, validações, dívida conhecida, documentação, estado e conclusão formal.
