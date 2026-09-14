# M14 S04–S05 — integração funcional

Serviço real usa Ed25519 do Node, pins transacionais SQLite e chave privada
cifrada pelo `safeStorage` do Electron. Assinar atualiza o snapshot e o `.tslib`
atômico; import verifica a assinatura antes do commit. O renderer usa IPC
restrito e não recebe a chave privada.

Em 2026-09-14, 3/3 casos M14 passaram: tamper invalida, TOFU persiste e detecta
troca, e assinatura atravessa o boundary do pacote. A inspeção comprovou que o
secret não aparece no DB. Typecheck, build e lint focado passaram. Recuperação
da chave perdida/rotação portável, Windows/TV e hardware ficam pendentes.
