# Loop de execução autônoma

Para cada story:

```text
Read state/context
→ Confirm objective/scope
→ Implement
→ Validate
→ Fix failures
→ Confirm acceptance criteria
→ Record decisions/evidence
→ Update UPDATE.md
→ Update STATE.yaml
→ Commit if project policy requires
→ Next story
```

## Regras

- Trabalhe em uma story por vez.
- Não avance com validações vermelhas relacionadas à mudança.
- Não implemente silenciosamente requisitos de milestones futuros.
- Decisões técnicas locais podem ser tomadas autonomamente quando compatíveis com arquitetura e escopo.
- Mudanças de UX, regras de negócio, contratos públicos ou arquitetura fundamental devem ser registradas; se o fluxo define checkpoint humano, aguarde a aprovação nesse checkpoint.
- Não leia todo o PRD a cada story. Use contexto progressivo.

## Stopping conditions

Pare quando:

1. chegar a um checkpoint humano ainda não aprovado;
2. existir bloqueio material que não possa ser resolvido pelo contexto/repositório disponível;
3. o milestone terminar;
4. o usuário explicitamente pedir para parar.
