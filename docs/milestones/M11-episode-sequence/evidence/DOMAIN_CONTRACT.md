# M11 S03 — contrato de domínio

`packages/types/src/next-episode.ts` fixa protocolo/snapshot v1, sessão,
geração, estados e operações de resolve, prepare, cancel e claim de início.
`M11-D10` define countdown de 5 s, término efetivo, ordem estrita, especiais e
budget de uma preparação. Estado pessoal permanece em SQLite local e não altera
o pack.
