# M09 S03 — contrato de domínio

`packages/types/src/downloads.ts` mantém o boundary da UX e acrescenta protocolo
v1 para fila real, snapshots/eventos, destinos gerenciados, comandos,
prioridade, limites, idempotência e erros tipados.

As decisões de ownership, concorrência, banda, resume inválido, disco cheio,
cancelamento e remoção estão em
[`M09-D01-download-manager-contract.md`](../../../decisions/M09-D01-download-manager-contract.md).

O contrato preserva bytes e bytes/s como unidades internas, percentuais apenas
derivados na UI e uma única confirmação destrutiva explícita. S03 não introduz
runtime nem altera a experiência aprovada.
