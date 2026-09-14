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
seções arquiteturais citadas pela story
```

Expanda o contexto somente quando necessário.

## Autonomia permitida

Normalmente o agente pode decidir:

- organização interna de implementação;
- nomes internos coerentes;
- pequenos refactors locais;
- estratégia de testes compatível com o projeto;
- correções necessárias para deixar a story verde.

Essa autonomia não permite redefinir ownership, atravessar boundaries, enfraquecer trust/security, antecipar infraestrutura da arquitetura-alvo ou dispensar gates vigentes.

## Mudanças que exigem registro especial

- UX aprovada;
- contratos públicos;
- regras de negócio;
- arquitetura fundamental;
- escopo do milestone;
- dependências relevantes entre milestones.

Use ADR quando a decisão for durável e impactar trabalho futuro.

Quando fontes arquiteturais divergirem, registre a tensão e resolva somente o necessário para o escopo atual. Uma decisão fechada pode ser alterada por instrução explícita compatível com as permissões, mas a mudança e suas consequências devem ficar rastreáveis; não reescreva o passado nem presuma aprovação de efeitos adicionais.

## Precedência

Instruções explícitas do usuário têm precedência sobre recomendações da skill, desde que não violem políticas ou restrições do ambiente. Não use a skill para expandir escopo não solicitado.
