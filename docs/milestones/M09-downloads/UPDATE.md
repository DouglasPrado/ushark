# M09 — Frontend pronto para revisão

Fila em memória, destino, prioridade/limites, pause/resume/cancelar, remoção separada, restart simulado, falhas e player conectados. [Evidências](evidence/VALIDATION.md). S00–S02 implementadas; UX READY_FOR_REVIEW/PENDING adiada por instrução explícita. S03–S08 e hardware pendentes. Próximo M10.

## Auditoria transversal da fase frontend

Jornadas conectadas e correções finais registradas em [auditoria](../../execution/FRONTEND_COVERAGE_AUDIT.md) e [validação final](../../execution/evidence/FINAL_VALIDATION.md). Esta atualização não muda aceites humanos existentes. S03–S08 continuam adiadas.

## S03 — contrato real

Download v1 define snapshots/eventos, destinos gerenciados, fila, comandos,
prioridade, limites, resume e erros sem expor paths ou resume bytes ao renderer.
Defaults: 4 sessões, 2 downloads, 1 probe, 8/1 MiB/s e resume a cada 30 s.
[Evidência](evidence/DOMAIN_CONTRACT.md). Próxima: S04.1.

## S04–S05 — runtime e integração

Fila SQLite, comandos, prioridade, rate limits, resume libtorrent privado,
recovery, cancelamento e remoção confirmada foram integrados ao Electron. O
ensaio real passou por enqueue → downloading → pause → restart → resume →
cancel, preservando o catálogo e o resume. Recorte 14/14, lint/typecheck/build
PASS. [Evidência](evidence/INTEGRATION_VALIDATION.md). M09 está
`READY_FOR_REVIEW/PENDING`; próximo M10/S03.
