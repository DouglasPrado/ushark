---
name: frontend-guided-milestones
description: Planeja, prepara, executa, retoma e audita desenvolvimento no Codex a partir de documentação de produto e arquitetura usando milestones verticais, stories S00-S08, frontend mockado primeiro, checkpoints, rastreabilidade e gates do projeto.
---

# Frontend-Guided Milestones — Codex

Transforme documentação de produto e arquitetura em um fluxo executável, rastreável e retomável, preservando a experiência como guia e a arquitetura como restrição de construção.

## Precedência

A instrução explícita do usuário tem precedência sobre recomendações desta skill. Preserve escopo e permissões existentes. Não use esta skill para justificar trabalho externo ou não solicitado.

## Modos

### PLAN_PROJECT
Leia `references/01-plan-project.md` e, quando houver documentação arquitetural, `references/10-architecture-guardrails.md`. Em projetos frontend-first, leia também `references/11-frontend-first-repository-structure.md`. Extraia requisitos e decisões arquiteturais aplicáveis, crie milestones verticais, dependências e coverage matrix. Não implemente código e não detalhe todas as stories do projeto.

### PREPARE_MILESTONE [MXX]
Leia `references/02-milestone-lifecycle.md`, `references/03-story-design.md` e `references/10-architecture-guardrails.md`. Quando o milestone incluir foundation, setup, entrypoints ou packages frontend, leia também `references/11-frontend-first-repository-structure.md`. Detalhe somente o milestone selecionado em S00–S08, incluindo sub-stories úteis e as restrições arquiteturais realmente aplicáveis. Atualize os artefatos de execução.

### EXECUTE_MILESTONE [MXX]
Leia `references/04-execution-loop.md`, `references/06-checkpoints.md` e `references/10-architecture-guardrails.md`. Quando alterar setup, entrypoints, packages ou localização de código frontend, leia também `references/11-frontend-first-repository-structure.md`. Trabalhe em uma story por vez, respeite os boundaries e gates citados pela story, valide, corrija, atualize STATE/UPDATE e prossiga até checkpoint, bloqueio real ou conclusão.

### RESUME
Leia primeiro as instruções `AGENTS.md` aplicáveis, depois `docs/execution/GOAL.md`, `docs/execution/STATE.yaml`, milestone atual e story atual. Leia as fontes arquiteturais citadas pela story antes de alterar código. Carregue contexto adicional somente quando necessário. Continue do estado persistido sem reinterpretar aprovação ou status histórico.

### AUDIT_PROJECT
Leia `references/07-audit-project.md`, `references/10-architecture-guardrails.md` e, para projetos frontend-first, `references/11-frontend-first-repository-structure.md`. Audite cobertura de produto e arquitetura, dependências, estrutura, estado, gates e evidências. Corrija inconsistências documentais inequívocas e reporte mudanças que afetem produto, escopo ou arquitetura.

## Invariantes

- Milestones são capacidades verticais, nunca apenas camadas como banco/backend/frontend.
- Lifecycle: S00 → S01 → S02 → UX → S03 → S04 → S05 → Functional → S06 → S07 → S08.
- Mock UI deve usar boundary substituível para reduzir retrabalho na integração.
- Em setup frontend-first, preserve a separação física `main`/`preload`/`renderer`, packages por responsabilidade e imports por API pública do workspace; não achate o renderer nem atravesse diretórios internos de `packages/*` a partir de consumidores.
- Documentação arquitetural define como construir; milestones não autorizam ignorar ownership, boundaries, trust, contratos, segurança ou gates aplicáveis.
- Arquitetura-alvo não autoriza infraestrutura antecipada: introduza componentes reais somente quando uma experiência aprovada e a story atual exigirem.
- Não transforme exemplos, recomendações ou itens planejados da arquitetura em decisões fechadas; leia a seção fonte e preserve seu grau de obrigatoriedade.
- `GOAL.md` = política de execução; `STATE.yaml` = posição atual; `UPDATE.md` = visão humana.
- Evite carregar o PRD inteiro em toda story; use progressive disclosure.
- Faça validações proporcionais à mudança. Não repita testes sem necessidade depois que passaram, salvo nova mudança/falha que justifique.
- Diferencie implementação local, validação local, review, CI e merge quando os gates do projeto os separarem.
- Não marque milestone DONE antes de S08 Closure nem marque Story DONE sem os gates exigidos pela arquitetura/política vigente.

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
- `references/10-architecture-guardrails.md`
- `references/11-frontend-first-repository-structure.md`

Use `templates/` para artefatos novos. Não duplique as referências no contexto sem necessidade.
