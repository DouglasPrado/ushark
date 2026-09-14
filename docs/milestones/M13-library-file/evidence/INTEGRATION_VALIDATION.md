# M13 S04–S05 — integração funcional

O serviço real serializa e valida manifests canônicos, grava `.tslib` por
arquivo temporário + rename, faz staging sem seguir symlink e confirma a
importação transacionalmente em SQLite com deduplicação e conflito explícito.
Diálogos e paths pertencem ao main; o renderer recebe somente snapshots
validados pelo IPC autorizado.

Em 2026-09-14, 4/4 casos M13 passaram: versões/hash, roundtrip offline entre
serviços isolados preservando IDs/ordem/layout, rejeições de tamper, traversal,
código, schema major, assinatura e symlink, e autorização/ownership do IPC.
Typecheck, build e lint focado passaram. A regressão M11 pendente também passou
6/6. Assinatura/trust é responsabilidade do M14; fetch/cache de assets remotos,
Windows/TV e hardware continuam pendentes.
