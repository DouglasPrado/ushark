---
name: frontend-guided-milestones
description: Planeja e executa projetos no Claude Code a partir de PRDs usando milestones verticais, stories S00-S08, frontend mockado primeiro, checkpoints de UX/funcionais, GOAL, STATE e auditoria de cobertura. Use para PLAN_PROJECT, PREPARE_MILESTONE, EXECUTE_MILESTONE, RESUME ou AUDIT_PROJECT.
---

# Frontend-Guided Milestones — Claude Code

Use esta skill para converter documentação de produto em um fluxo executável e retomável.

## Precedência

As instruções explícitas do usuário têm precedência sobre recomendações desta skill. Não expanda o escopo sem pedido do usuário.

## Modos

Interprete a intenção do usuário ou um destes nomes explícitos:

### PLAN_PROJECT
Leia `references/01-plan-project.md`. Analise a documentação do produto, gere o mapa completo de milestones, dependências e cobertura. Não implemente código. Não detalhe todas as stories; prepare apenas o macro plano e a estrutura de execução.

### PREPARE_MILESTONE [MXX]
Leia `references/02-milestone-lifecycle.md` e `references/03-story-design.md`. Detalhe o milestone escolhido em S00–S08, criando sub-stories quando necessário. Sincronize README, UPDATE e STATE. Não implemente código salvo se o usuário também pedir execução.

### EXECUTE_MILESTONE [MXX]
Leia `references/04-execution-loop.md` e `references/06-checkpoints.md`. Execute uma story por vez, valide, corrija, atualize STATE/UPDATE e continue até um checkpoint não aprovado, bloqueio real ou conclusão.

### RESUME
Leia `docs/execution/GOAL.md`, `docs/execution/STATE.yaml`, o milestone atual e a story atual. Carregue somente o contexto necessário e continue pelo loop de execução.

### AUDIT_PROJECT
Leia `references/07-audit-project.md`. Compare PRD, coverage matrix, milestones, stories, STATE, UPDATE e evidências de implementação. Corrija inconsistências documentais seguras e reporte lacunas que alterem produto/escopo.

## Regras invariantes

- Milestones são verticais e orientados a capacidades de produto.
- Lifecycle padrão: S00 Contract → S01 Mock UI → S02 Behavior → UX → S03 Domain → S04 Backend → S05 Integration → Functional → S06 Tests → S07 Hardening → S08 Closure.
- Frontend-first significa experiência primeiro com boundary mockável, não arquitetura ignorada.
- `GOAL.md` define como trabalhar; `STATE.yaml` define onde estamos; `UPDATE.md` explica o estado para humanos.
- Contexto padrão: GOAL + STATE + milestone atual + story atual + referências explícitas.
- Nunca declare DONE apenas porque o código foi escrito; execute as validações pertinentes e confirme acceptance criteria.

## Recursos

Leia sob demanda:

- `references/00-method.md` — visão geral.
- `references/01-plan-project.md` — decomposição do PRD e cobertura.
- `references/02-milestone-lifecycle.md` — S00–S08.
- `references/03-story-design.md` — stories.
- `references/04-execution-loop.md` — loop autônomo.
- `references/05-state-updates.md` — STATE/UPDATE.
- `references/06-checkpoints.md` — checkpoints.
- `references/07-audit-project.md` — auditoria.
- `references/08-positive-negative-examples.md` — exemplos.
- `references/09-context-autonomy.md` — contexto/autonomia.

Use `templates/` para criar artefatos consistentes.
