# Loop de execução autônoma

Para cada story:

```text
Read state/context
→ Confirm objective/scope
→ Read cited architecture and confirm boundaries
→ Implement
→ Validate
→ Fix failures
→ Confirm acceptance criteria
→ Confirm architecture constraints/gates
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
- Decisões técnicas locais podem ser tomadas autonomamente quando compatíveis com arquitetura, story e escopo.
- Não atravesse um boundary por atalho (por exemplo UI acessando runtime/persistência diretamente) só porque o caminho completo ainda não existe; mantenha ou introduza o contrato/adaptador mínimo exigido pela fase atual.
- Não implemente componentes da arquitetura-alvo sem uma necessidade concreta derivada do fluxo aprovado e sem escopo na story atual.
- Se código e arquitetura divergirem, determine se é bug, dívida registrada ou decisão nova. Não normalize a divergência silenciosamente.
- Mudanças de UX, regras de negócio, contratos públicos ou arquitetura fundamental devem ser registradas; se o fluxo define checkpoint humano, aguarde a aprovação nesse checkpoint.
- Um teste verde prova somente o que executou. Registre separadamente validação local, CI, review, merge, hardware e ambiente real quando a política os tratar como gates distintos.
- Não execute PR, merge, deploy ou outra mutação externa apenas para satisfazer um gate sem autorização correspondente; mantenha a story no estado anterior a DONE.
- Não leia todo o PRD a cada story. Use contexto progressivo.

## Stopping conditions

Pare quando:

1. chegar a um checkpoint humano ainda não aprovado;
2. existir bloqueio material que não possa ser resolvido pelo contexto/repositório disponível;
3. o milestone terminar;
4. o usuário explicitamente pedir para parar.
