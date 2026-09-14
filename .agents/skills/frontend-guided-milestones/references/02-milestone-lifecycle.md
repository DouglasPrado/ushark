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
Define objetivo, jornada principal, rotas, estados obrigatórios, dependências, fontes arquiteturais aplicáveis, boundaries afetados e Definition of Done.

## S01 — Mock UI
Cria a experiência visual usando dados mockados atrás de um boundary substituível. Preserva as regras arquiteturais de UX e não introduz infraestrutura real antecipada.

## S02 — Frontend Behavior
Implementa navegação, formulários, busca, filtros, validação, loading, empty, error e feedbacks. Exercita estados e erros que o contrato futuro precisará representar, sem simular integração como prova funcional.

## UX CHECKPOINT
A experiência deve estar navegável. Mudanças de UX são baratas aqui. Não avance para backend definitivo quando o checkpoint exigir aprovação humana e ela ainda não existir.

## S03 — Domain Contract
Formaliza entidades, ownership, IDs, DTOs, queries, comandos, eventos, erros, versionamento e trust boundaries que a experiência realmente exige. Não copie exemplos arquiteturais como contratos definitivos sem verificar se são normativos.

## S04 — Backend
Implementa somente a persistência, serviços, processos, APIs/adapters, autorização e regras exigidos pelo contrato aprovado. Respeita a separação de responsabilidades e os limites de segurança. Divida em `S04.1`, `S04.2` etc. quando necessário.

## S05 — Integration
Troca mocks por adaptadores reais preservando a UI já validada e prova que nenhuma camada passou a depender de detalhes internos da outra.

## FUNCTIONAL CHECKPOINT
Executa a jornada ponta a ponta com dados reais e com os processos, boundaries, permissões e ambientes que fazem parte da promessa.

## S06 — Tests
Testes unitários, contratos, integração, migrations/fixtures e E2E relevantes, com foco em jornadas reais e anti-drift aplicável.

## S07 — Hardening
Segurança, permissões, isolamento, observabilidade, performance, acessibilidade, responsividade, edge cases, recovery e falhas conforme as fontes arquiteturais citadas.

## S08 — Closure
Audita requisitos, conformidade arquitetural, decisões/ADRs, evidências, validações, dívida conhecida, documentação, estado e gates de entrega. Se CI, review, merge ou validação manual forem exigidos mas estiverem fora do escopo/autorização, mantenha o status anterior a DONE e registre a pendência.
