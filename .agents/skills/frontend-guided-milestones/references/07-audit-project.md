# AUDIT_PROJECT

Use para verificar se o planejamento e a execução continuam coerentes com o produto.

## Auditoria de cobertura

- requisitos do PRD descobertos;
- requisitos mapeados;
- requisitos órfãos;
- ownership duplicado;
- requisitos implementados fora de milestone.

## Auditoria de estrutura

- milestones verticais;
- dependências sem ciclos;
- milestone atual consistente com STATE;
- UPDATE consistente com STATE;
- stories com acceptance criteria;
- checkpoints registrados.

## Auditoria de implementação

- stories DONE possuem evidência suficiente;
- testes/validações declarados foram realmente executados;
- mocks não vazaram para fluxos marcados como integrados;
- mudanças de regra/arquitetura estão registradas em ADR quando relevante.

## Auditoria de arquitetura

- cada milestone/story cita somente as fontes arquiteturais aplicáveis;
- decisões fechadas, ownership e separação de processos/módulos são respeitados;
- mocks e adapters preservam o contrato de substituição;
- infraestrutura real possui fluxo aprovado e story que a exige;
- entradas não confiáveis atravessam validação e limites adequados;
- contratos, schemas, migrations e artefatos possuem gates anti-drift aplicáveis;
- exemplos/recomendações não foram promovidos silenciosamente a requisitos;
- desvios possuem ADR/decisão e evidência, não apenas justificativa no código;
- `IMPLEMENTED`, validação local, CI, review, merge e gates manuais não foram colapsados em `DONE`.

## Saída recomendada

```text
PROJECT AUDIT
Requirements: 184
Covered: 184
Orphan: 0
Milestones: 14
Done: 4
Running: 1
Pending: 9
State consistency: PASS
Coverage: PASS
Dependency graph: PASS
Open critical issues: 0
Architecture conformance: PASS
Delivery gates: PASS
```
