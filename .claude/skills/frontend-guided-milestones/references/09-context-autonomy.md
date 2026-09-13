# Contexto, autonomia e decisões

## Contexto mínimo por execução

Leia normalmente:

```text
instruções persistentes do repositório
GOAL.md
STATE.yaml
README do milestone atual
story atual
referências explicitamente citadas pela story
```

Expanda o contexto somente quando necessário.

## Autonomia permitida

Normalmente o agente pode decidir:

- organização interna de implementação;
- nomes internos coerentes;
- pequenos refactors locais;
- estratégia de testes compatível com o projeto;
- correções necessárias para deixar a story verde.

## Mudanças que exigem registro especial

- UX aprovada;
- contratos públicos;
- regras de negócio;
- arquitetura fundamental;
- escopo do milestone;
- dependências relevantes entre milestones.

Use ADR quando a decisão for durável e impactar trabalho futuro.

## Precedência

Instruções explícitas do usuário têm precedência sobre recomendações da skill, desde que não violem políticas ou restrições do ambiente. Não use a skill para expandir escopo não solicitado.
