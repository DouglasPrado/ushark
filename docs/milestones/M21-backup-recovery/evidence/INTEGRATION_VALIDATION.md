# M21 S04–S05 — integração

Serviço real cria SQLite consistente, hashes, valida integrity_check, quiesce
os contexts do main e troca o DB mantendo cópia pre-restore. Chave cifrada é
parte opcional. 2/2 casos passaram: restore recupera estado e preserva original;
tamper falha sem tocar o live. Typecheck passou. Crash físico/disk-full/Windows
e migrações históricas ficam no checkpoint de ambiente.
