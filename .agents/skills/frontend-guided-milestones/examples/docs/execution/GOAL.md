# Autonomous Development Goal

Execute o projeto através dos milestones em `docs/milestones`.

## Sources of truth
- Product: `docs/product/`
- Architecture: `docs/architecture/`
- Milestones: `docs/milestones/`
- State: `docs/execution/STATE.yaml`
- Decisions: `docs/decisions/`

## Execution Policy
Work on one story at a time. Validate before advancing.

For every story:
1. Read STATE and current milestone/story.
2. Read only referenced context.
3. Implement within scope.
4. Confirm applicable architecture constraints and boundaries.
5. Run validation.
6. Fix relevant failures.
7. Confirm acceptance criteria and architecture gates.
8. Update milestone UPDATE.md.
9. Update STATE.yaml.
10. Record durable decisions when needed.
11. Commit if repository policy requires it.
12. Continue until a stopping condition.

## Checkpoints
Stop at human checkpoints that are not approved.

## Scope
Do not silently implement future-milestone product scope.
Do not anticipate target-architecture infrastructure without an approved flow and a current story that requires it.

## Completion
A milestone is DONE only after S08 Closure and every required delivery gate succeeds. Keep local implementation, CI, review, merge and manual validation distinguishable.
