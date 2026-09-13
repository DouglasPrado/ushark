---
name: frontend-guided-milestones
description: Planeja, prepara, executa, retoma e audita desenvolvimento no Codex a partir de PRDs usando milestones verticais, stories S00-S08, frontend mockado primeiro, checkpoints de UX/funcionais, GOAL, STATE e matriz de cobertura.
---

# Frontend-Guided Milestones — Codex

Transforme documentação de produto em um fluxo executável, rastreável e retomável.

## Precedência

A instrução explícita do usuário tem precedência sobre recomendações desta skill. Preserve escopo e permissões existentes. Não use esta skill para justificar trabalho externo ou não solicitado.

## Modos

### PLAN_PROJECT
Leia `references/01-plan-project.md`. Extraia requisitos, crie milestones verticais, dependências e coverage matrix. Não implemente código e não detalhe todas as stories do projeto.

### PREPARE_MILESTONE [MXX]
Leia `references/02-milestone-lifecycle.md` e `references/03-story-design.md`. Detalhe somente o milestone selecionado em S00–S08, incluindo sub-stories úteis. Atualize os artefatos de execução.

### EXECUTE_MILESTONE [MXX]
Leia `references/04-execution-loop.md` e `references/06-checkpoints.md`. Trabalhe em uma story por vez, valide, corrija, atualize STATE/UPDATE e prossiga até checkpoint, bloqueio real ou conclusão.

### RESUME
Leia primeiro as instruções `AGENTS.md` aplicáveis, depois `docs/execution/GOAL.md`, `docs/execution/STATE.yaml`, milestone atual e story atual. Carregue contexto adicional somente quando necessário. Continue do estado persistido.

### AUDIT_PROJECT
Leia `references/07-audit-project.md`. Audite cobertura do PRD, dependências, estrutura, estado e evidências. Corrija inconsistências documentais inequívocas e reporte mudanças que afetem produto/escopo.

## Invariantes

- Milestones são capacidades verticais, nunca apenas camadas como banco/backend/frontend.
- Lifecycle: S00 → S01 → S02 → UX → S03 → S04 → S05 → Functional → S06 → S07 → S08.
- Mock UI deve usar boundary substituível para reduzir retrabalho na integração.
- `GOAL.md` = política de execução; `STATE.yaml` = posição atual; `UPDATE.md` = visão humana.
- Evite carregar o PRD inteiro em toda story; use progressive disclosure.
- Faça validações proporcionais à mudança. Não repita testes sem necessidade depois que passaram, salvo nova mudança/falha que justifique.
- Não marque milestone DONE antes de S08 Closure.

## Recursos sob demanda

- `references/00-method.md`
- `references/01-plan-project.md`
- `references/02-milestone-lifecycle.md`
- `references/03-story-design.md`
- `references/04-execution-loop.md`
- `references/05-state-updates.md`
- `references/06-checkpoints.md`
- `references/07-audit-project.md`
- `references/08-positive-negative-examples.md`
- `references/09-context-autonomy.md`

Use `templates/` para artefatos novos. Não duplique as referências no contexto sem necessidade.
