# M10 — Frontend pronto para revisão

S00–S02 implementadas: uso/estimativa, política cache/LRU, ativos protegidos, limpeza revalidada, Keep/demotion, permissão/corrupção/cancelamento. [Validação](evidence/VALIDATION.md). UX READY_FOR_REVIEW/PENDING adiada por instrução explícita. S03–S08/hardware adiados. Próximo M11.

## Auditoria transversal da fase frontend

Jornadas conectadas e correções finais registradas em [auditoria](../../execution/FRONTEND_COVERAGE_AUDIT.md) e [validação final](../../execution/evidence/FINAL_VALIDATION.md). Esta atualização não muda aceites humanos existentes. S03–S08 continuam adiadas.
## S03 — contrato real

Storage v1 separa estimativa/bytes liberados, revalida revision/leases/paths e
define eviction LRU sem default fictício de 100 GB. Promoção entre volumes
preserva original até commit. [Evidência](evidence/DOMAIN_CONTRACT.md). Próxima:
S04.1.

## S04 — armazenamento real

S04.1–S04.3 concluídas: índice/policy SQLite, capacidade física, reconciliação
de downloads, leases de playback/streaming, limpeza com revision e promoção
Keep por commit recuperável. Falha injetada entre volumes preservou a origem.
[Evidências](evidence/BACKEND_S04_1.md).

## S05 — integração

IPC/preload versionados e autorizados alimentam `DesktopStoragePreview`. A
tela real remove linguagem e controles de simulação. O ensaio Electron moveu
bytes reais para Keep e limpou apenas o elegível; suíte focada M09/M10 13/13,
typecheck, lint e build passaram. M10 está
READY_FOR_REVIEW/PENDING no checkpoint funcional; S06–S08 e hardware físico
continuam pendentes. [Evidência](evidence/INTEGRATION_VALIDATION.md).
