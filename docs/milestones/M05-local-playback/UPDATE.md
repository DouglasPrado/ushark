# M05 — Frontend pronto para revisão

## Reparo pós-checkpoint — vídeo composto no player

Em 2026-09-14, o retorno humano rejeitou a exibição do MPV como janela externa.
A composição D11 foi corrigida sem trocar o engine: MPV continua isolado, mas a
janela nativa fica sem borda, alinhada à área de conteúdo e atrás da superfície
Electron transparente; os controles e o foco continuam pertencendo ao Ushark.
Move/resize/fullscreen atualizam a geometria e o cleanup restaura o z-order.
Teste MPV real no macOS confirmou primeiro frame, posição avançando e bounds
coincidentes entre conteúdo Electron e vídeo. Evidência em
[POST_CHECKPOINT_WINDOW_COMPOSITION](evidence/POST_CHECKPOINT_WINDOW_COMPOSITION.md).
O reparo está validado localmente; Windows/TV/Moonlight continua pendente.

## S05 — integração funcional real

S05 foi concluída em 2026-09-14. O Electron troca o mock por `DesktopPlayer`,
e o Core resolve apenas arquivos regulares registrados dentro da biblioteca
gerenciada. Um coordenador mantém MPV, sessão/geração, journal de 5 s, flush em
transições, tracks e cleanup; preload/IPC v1 não expõem path, SQL, PID ou JSON
bruto. A UI recebe primeiro frame/posição/pausa por eventos e envia controles
reais. Uma corrida em que o evento inicial de pause promovia a sessão antes do
primeiro frame foi detectada e corrigida.

MPV 0.41.0 no macOS arm64 reproduziu uma fixture sintética H.264/AAC via
Electron 44.3.0; pausa/retomada, saída e progresso após restart passaram. A
matriz S04–S05 passou **13/13**, o smoke Electron **1/1**, a repetição concorrente
**3/3**, lint/typecheck/build e a regressão integral **222 passed, 6 skipped,
0 failed**. [Evidência](evidence/INTEGRATION_VALIDATION.md). M05 está
`READY_FOR_REVIEW/PENDING`; composição visível/hardware decode no Windows/TV,
controle físico e S06–S08 continuam pendentes.

## S04.3 — tracks e legenda externa

O último adapter S04 foi concluído em 2026-09-14. Áudio/legenda interna/off são
validados contra tracks normalizadas sem reiniciar source; legenda externa usa
allowlist, limite de 20 MiB, `O_NOFOLLOW`, cópia privada e cleanup. A matriz
passou **3/3**; S04 completa **9/9**. [Evidência](evidence/BACKEND_S04_3.md).
Próxima story: S05, integração Electron da jornada real.

## S04.2 — progresso periódico e saída

SQLite v10 e o journal de progresso foram concluídos em 2026-09-14. A posição
é limitada a uma escrita a cada 5 s e forçada em transições; stop, histórico,
watched em EOF/90%, idempotência, restart e sessão interrompida passaram **3/3**.
[Evidência](evidence/BACKEND_S04_2.md). Próxima sub-story: S04.3, tracks e
legenda externa validada.

## S04.1 — MPV isolado e primeiro frame

O adapter real foi concluído em 2026-09-14. MPV 0.41.0 tocou uma fixture local
H.264/AAC por socket privado, com direct play, pause/seek, propriedades
normalizadas e `first-frame` distinto de `file-loaded`. Processo
protocol-compatible cobriu tracks/volume/mute/erros/cleanup; suíte **3/3**, lint
e typecheck passaram. [Evidência](evidence/BACKEND_S04_1.md). Próxima sub-story:
S04.2, progresso persistente e saída.

## S03 — contrato real

S03 foi concluída em 2026-09-14. `@ushark/types/player` agora separa a prévia do
protocolo real v1 e define preparação/start, sessão+geração, snapshots, tracks,
métricas, eventos, comandos idempotentes, cancelamento, limites e erros. D10,
D11, D18 e D21 foram fechadas para progresso/conclusão, composição de janelas,
matriz física e legenda externa segura. [Evidência](evidence/DOMAIN_CONTRACT.md).
Próxima sub-story: S04.1, adapter MPV isolado e primeiro frame.

S00–S02 implementadas: player simulado conectado aos detalhes de Filmes/Home, controles, áudio/legendas, foco, cancelamento, progresso/assistido em memória, falha/retry e offline. [Evidências](evidence/VALIDATION.md). UX READY_FOR_REVIEW/PENDING, revisão humana adiada por instrução explícita para fim M01–M22. S03–S08 e funcional permanecem adiados; sem MPV ou persistência. Hardware físico pendente. Próximo: M06 S00.

## Auditoria transversal da fase frontend

Jornadas conectadas e correções finais registradas em [auditoria](../../execution/FRONTEND_COVERAGE_AUDIT.md) e [validação final](../../execution/evidence/FINAL_VALIDATION.md). Esta atualização não muda aceites humanos existentes. S03–S08 continuam adiadas.

## Ajuste solicitado durante a revisão

O player recebeu chrome cinematográfico no rodapé: gradiente transparente, progresso e controles em uma única linha, ações secundárias somente por ícones acessíveis e auto-ocultação após quatro segundos de inatividade. Movimento, clique, teclado ou foco revelam a barra; pausado e modal de áudio/legendas a mantêm visível. A superfície comum não mostra diagnóstico, recuperação, cenários nem linguagem de fixture; essas ferramentas continuam disponíveis apenas com `?review=1`.

A alteração permanece dentro de S01–S02 e dos boundaries mockados existentes. Não adiciona MPV, vídeo real ou persistência. Revisão UX continua READY_FOR_REVIEW/PENDING.
