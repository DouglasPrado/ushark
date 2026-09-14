# M18 — Frontend pronto para revisão

S00–S02: orientação Sunshine/Moonlight, sessão TV simulada compartilhando catálogo/player, fullscreen do navegador, desconexão pause/continue, hotplug, reconexão sem auto-resume e encerramento confirmado. Menu TV isola navegação de camadas inferiores; posição confirmada preservada.

Na validação inicial, 3 testes comportamentais cobriam pausa/reconnect, falha/cancel/retry/fullscreen, continuar e B de gamepad sintético. As capturas eram `disconnected.png` e `tv-player-1080/1440/2160.png`; Sunshine/Moonlight, `--tv` no renderer e hardware real ainda não tinham prova específica.

Após solicitação do usuário, o modo TV passou a ocultar todas as affordances de gestão e configuração nas superfícies de consumo. O flag `--tv` agora chega ao renderer; Home, Filmes, Séries, detalhes e Player compartilham a política somente de consumo. Fonte é selecionada automaticamente, enquanto Favoritos, Play, controles de transporte, áudio e legendas permanecem acessíveis. O painel persistente foi reduzido a um ícone de energia, e ferramentas de fixture exigem modo explícito de revisão. M18 agora possui 5 testes comportamentais; `--tv` também é coberto no Electron empacotado. Novas capturas: `tv-home-1080.png` e `tv-movies-1080.png`.

UX READY_FOR_REVIEW/PENDING. A alteração posterior está pronta para confirmação visual e não recebeu aceite por inferência. S03–S08 DEFERRED; nenhum aceite fabricado. Próximo: aguardar revisão humana consolidada.

## Auditoria transversal da fase frontend

## S03–S05

Sinal `--tv`, fullscreen, hotplug browser e shutdown limitado dos helpers foram
integrados; 2/2 passaram. Checkpoint READY_FOR_REVIEW/PENDING com gate físico
Windows/Sunshine/Moonlight/controle explicitamente não comprovado.

Jornadas conectadas e correções finais registradas em [auditoria](../../execution/FRONTEND_COVERAGE_AUDIT.md) e [validação final](../../execution/evidence/FINAL_VALIDATION.md). Esta atualização não muda aceites humanos existentes. S03–S08 continuam adiadas.

## Ajuste transversal — controle remoto e gamepad

O modo TV passou a consumir o motor espacial compartilhado: D-pad/analógico, setas de controle remoto, OK/A e Voltar/B seguem o mesmo grafo e o cursor desaparece após input por controle. Hotplug continua sem restart; os testes sintéticos e Electron permaneceram verdes na regressão **127/127**. Sunshine/Moonlight e controles físicos ainda exigem validação no Windows/TV.
