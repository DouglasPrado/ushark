# M09 S04.2 — resume, destino e prioridade

Destinos `library|cache`, prioridade 0–2, progresso e estado são persistidos em
SQLite. `torrentd` grava resume data libtorrent v1 por arquivo atômico privado,
com modo 0600 fora do Windows, em pause, completion, solicitação periódica e
shutdown. Ao rebind, resume válido é carregado; inválido é isolado como
`.invalid`, sem scan global nem perda de Content.

O teste real CPython 3.12/libtorrent 2.1.1 confirmou arquivo resume não vazio,
pause/resume e limites efetivos.

