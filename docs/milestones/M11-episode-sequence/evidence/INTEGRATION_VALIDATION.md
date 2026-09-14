# M11 S05 — integração funcional

IPC/preload autorizado e `DesktopNextEpisodePreview` substituem o mock no
Electron. O overlay usa o countdown aprovado sem rótulo de simulação; preparar,
cancelar e fazer claim passam pela sessão persistida antes de trocar o player.

Validação em 2026-09-14: 6/6 testes focados passaram. O ensaio Electron com
perfil isolado resolveu S1E2 por identidade, reutilizou arquivo Keep/local,
preparou sem iniciar outro stream, fez um claim e rejeitou um segundo claim.
Build e typecheck passaram. Hardware Windows/TV e término natural em mídia longa
continuam pendentes.
