# M16 — sync v1

Uma operação por subscription; check tem timeout do Registry e backoff externo.
Snapshot novo passa por trust e regra estrita de versão/hash, então troca em
transação SQLite mantendo exatamente uma versão anterior. Rollback é ação
local explícita; nunca aceita downgrade remoto. Unsubscribe remove a referência
da subscription e preserva conteúdo pessoal.
