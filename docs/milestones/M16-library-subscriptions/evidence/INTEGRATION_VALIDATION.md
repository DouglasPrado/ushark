# M16 S04–S05 — integração

Subscription real persiste snapshots no SQLite, resolve pelo Registry M15,
verifica trust M14, bloqueia downgrade/hash divergente e faz swap atômico com
rollback. Hide, favoritos e cópia pessoal são independentes. 2/2 casos passaram:
update/rollback e falha de verify/unsubscribe preservando dados. Typecheck passou.
Scheduler automático e Registry externo permanecem dependentes do ambiente.
