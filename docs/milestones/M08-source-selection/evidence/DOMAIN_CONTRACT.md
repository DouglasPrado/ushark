# M08 S03 — contrato de domínio

Data: 2026-09-14.

`@ushark/types/selection` agora separa amostras técnicas, Streaming Health,
candidate, ranking e decisão. O contrato inclui estados completos, score
0–100, barras/label, confidence numérica, ratio, startup, breakdown,
reasonCodes, algoritmo v1, TTL, deadline, budgets e eventos limitados.

Operações públicas: iniciar/cancelar preflight, definir/remover e ler override,
receber updates. O renderer nunca recebe bitfields, IPs de peers, trackers,
paths, magnets ou amostras ilimitadas. Play não depende de confidence final;
deadline usa a melhor informação disponível sem converter unknown em
indisponível.

As decisões de estados, pesos, menor tamanho e precedência estão em
[M08-D06-D07-D09-D19](../../../decisions/M08-D06-D07-D09-D19-source-selection-contract.md).
