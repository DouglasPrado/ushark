# M19 S04–S05 — integração

Histórico/TTL/cooldown persistem em SQLite; alternativas vêm do catálogo real e
o preparo usa preflight M08 antes do callback de handoff no player. 2/2 casos
passaram: reranking/cooldown e bloqueio de incompatível. Typecheck passou.
Swarm real degradado e percepção do handoff ficam no checkpoint físico.
