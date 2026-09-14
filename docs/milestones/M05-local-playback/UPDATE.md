# M05 — Frontend pronto para revisão

S00–S02 implementadas: player simulado conectado aos detalhes de Filmes/Home, controles, áudio/legendas, foco, cancelamento, progresso/assistido em memória, falha/retry e offline. [Evidências](evidence/VALIDATION.md). UX READY_FOR_REVIEW/PENDING, revisão humana adiada por instrução explícita para fim M01–M22. S03–S08 e funcional permanecem adiados; sem MPV ou persistência. Hardware físico pendente. Próximo: M06 S00.

## Auditoria transversal da fase frontend

Jornadas conectadas e correções finais registradas em [auditoria](../../execution/FRONTEND_COVERAGE_AUDIT.md) e [validação final](../../execution/evidence/FINAL_VALIDATION.md). Esta atualização não muda aceites humanos existentes. S03–S08 continuam adiadas.

## Ajuste solicitado durante a revisão

O player recebeu chrome cinematográfico no rodapé: gradiente transparente, progresso e controles em uma única linha, ações secundárias somente por ícones acessíveis e auto-ocultação após quatro segundos de inatividade. Movimento, clique, teclado ou foco revelam a barra; pausado e modal de áudio/legendas a mantêm visível. A superfície comum não mostra diagnóstico, recuperação, cenários nem linguagem de fixture; essas ferramentas continuam disponíveis apenas com `?review=1`.

A alteração permanece dentro de S01–S02 e dos boundaries mockados existentes. Não adiciona MPV, vídeo real ou persistência. Revisão UX continua READY_FOR_REVIEW/PENDING.
