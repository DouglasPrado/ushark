# M11 — Frontend pronto para revisão

S00–S02 implementadas: próximo por identidade, countdown, cancelamento/autoplay, preflight/retry, fim/ausência/especiais, posição independente e retorno ao episódio atual. [Evidências](evidence/VALIDATION.md). UX READY_FOR_REVIEW/PENDING adiada por instrução explícita; S03–S08/hardware adiados. Próximo M12.

## Auditoria transversal da fase frontend

Jornadas conectadas e correções finais registradas em [auditoria](../../execution/FRONTEND_COVERAGE_AUDIT.md) e [validação final](../../execution/evidence/FINAL_VALIDATION.md). Esta atualização não muda aceites humanos existentes. S03–S08 continuam adiadas.

## S03–S05 — integração real

Contrato v1 e D10 fixam countdown de 5 s, ordem estrita, uma preparação e claim
idempotente. O serviço SQLite resolve a hierarquia M03 e usa o preflight M08 sem
abrir um segundo stream. IPC/preload e adapter Electron substituem o mock. Seis
testes focados, incluindo perfil Electron isolado, passaram. Checkpoint
funcional READY_FOR_REVIEW/PENDING; S06–S08 e hardware permanecem pendentes.
