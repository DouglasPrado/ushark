# Autonomous Development Goal

Execute o projeto através dos milestones em `docs/milestones`.

## Sources of truth
- Product: `docs/product/`
- Milestones: `docs/milestones/`
- State: `docs/execution/STATE.yaml`
- Decisions: `docs/decisions/`

## Execution Policy
Work on one story at a time. Validate before advancing.

For every story:
1. Read STATE and current milestone/story.
2. Read only referenced context.
3. Implement within scope.
4. Run validation.
5. Fix relevant failures.
6. Confirm acceptance criteria.
7. Update milestone UPDATE.md.
8. Update STATE.yaml.
9. Record durable decisions when needed.
10. Commit if repository policy requires it.
11. Continue until a stopping condition.

## Checkpoints
Stop at human checkpoints that are not approved.

## Scope
Do not silently implement future-milestone product scope.

## Completion
A milestone is DONE only after S08 Closure succeeds.
