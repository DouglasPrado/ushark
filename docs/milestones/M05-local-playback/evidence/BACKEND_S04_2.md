# Evidência S04.2 — progresso periódico e saída

Data: 2026-09-14.

A migration global v10 adiciona `playback_sessions`, `playback_progress` e
idempotência. Sessões guardam geração, source, primeiro frame, posições,
duração, status, motivo e métricas. O progresso por Content tem revisão
monotônica, `watched`, conclusão e última reprodução; o histórico compatível
com a projeção da Home também é atualizado na mesma transação.

`PlaybackProgressJournal` limita escrita periódica a uma vez a cada 5 segundos
e permite flush forçado nas transições críticas. Stop salva posição/histórico
imediatamente e é idempotente. EOF ou posição confirmada ≥90% marca assistido;
geração antiga é rejeitada. No restart, sessões que ficaram abertas são
encerradas como erro sem fabricar progresso novo.

Validação **3/3**: persist/replay/stop/restart, conclusão e histórico atômicos;
conflito de geração e recovery de crash; throttle 4.999 ms e flush explícito.
Lint e typecheck passaram. Os demais stores aceitam o schema v10 sem interpretar
ownership de playback.

```text
pnpm exec playwright test tests/playback-store.spec.ts --workers=1 --trace=off
# 3 passed
```

O wiring entre eventos MPV e o journal, tracks reais e legenda externa segura
é concluído em S04.3/S05. A prova física Windows permanece separada.
