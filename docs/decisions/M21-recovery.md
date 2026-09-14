# M21 — recovery v1

Backup usa snapshot consistente SQLite (`VACUUM INTO`), manifest schema 1 e
SHA-256 por parte. Inclui DB (config, catálogo, curadorias, progresso, fila,
resume e pins) e chave privada somente em sua forma cifrada pelo SO. Restore
valida e testa `integrity_check`, fecha owners, preserva o DB original com
timestamp e só então faz swap. Helpers têm três tentativas e timeout de 5 s.
