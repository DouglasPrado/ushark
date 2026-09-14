# M11 S04 — sequência real

`NextEpisodeApplicationService` consulta a hierarquia real de M03, preserva
lacunas e especiais, reutiliza a source do pack, executa no máximo um preflight
M08 e persiste sessão/generation. Cancelamento e claim de início são
idempotentes; uma segunda tentativa com outra mutação é rejeitada.

Validação em 2026-09-14: três casos de domínio passaram, cobrindo S04.1–S04.3.
