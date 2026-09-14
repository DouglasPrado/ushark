# Checkpoint funcional — M05

## Status

READY_FOR_REVIEW. Decisão humana: PENDING.

## Pré-condições

S03–S05 integradas após UX M01–M22 e dependências reais; só então READY_FOR_REVIEW.

## Jornada para testar

Detalhes → Play → preparar → primeiro frame → controles/tracks → sair → retomar ou recomeçar.

1. Percorrer o caminho principal e verificar o resultado: Arquivo já disponível toca no MPV, aceita controles e retoma da posição salva.
2. Exercitar estados: sem arquivo; preparando; tocando; pausado; seeking; encerrando; arquivo removido; codec não suportado; MPV falhou; sem legendas.
3. Voltar/cancelar/repetir e conferir foco, contexto e ausência de mutação não confirmada.
4. Reproduzir fixture local autorizada offline, trocar áudio/legenda sem reiniciar source, sair/reabrir e verificar posição; matar MPV e comprovar UI viva e progresso dentro do budget definido.
5. Registrar ambiente, versões, corpus, evidências e limitações; separar controle sintético e hardware real.

## Integrações reais e verificações

PlayerService: abrir(contentId, sourceId, posição), pausar, buscar, selecionar track, encerrar; snapshot com sessionId, posição, duração e tracks; eventos de readiness/primeiro frame distintos do processo iniciado.

Verificar ausência de mock no caminho principal, persistência pertinente após restart, permissões, erro/sucesso refletidos na UI e dependências M02. Testes verdes não substituem demonstração da jornada real.

## Evidências e decisão

[Evidência S05](evidence/INTEGRATION_VALIDATION.md): o caminho Electron usa
source gerenciada, processo MPV 0.41 separado, socket privado, primeiro frame
observado, comandos reais, persistência SQLite e preload/IPC restritos. O smoke
Electron reproduziu fixture H.264/AAC, pausou/retomou, encerrou e leu a posição
após reiniciar. A matriz direta cobre seek, tracks, legenda externa, crash e
limites sem expor path/PID ao renderer.

Validação final: lint e typecheck passaram; testes focados S04–S05 **13/13**;
smoke Electron real **1/1** e repetição concorrente **3/3**; regressão integral
**222 passed, 6 skipped, 0 failed** em 2,3 min. Os skips são os casos opcionais
condicionados ao runtime libtorrent da onda M06, já validados separadamente.

Pendências explícitas: empacotar MPV para Windows x64; observar vídeo/janela,
fullscreen e hardware decode reais; validar Windows/TV/Moonlight e controle
físico; executar S06–S08 somente após autorização. O headless macOS comprova
decode/IPC e não substitui esses gates. Aprovação humana continua `PENDING`.

## Mudanças solicitadas

Nenhuma registrada; isso não equivale a aprovação.

## Distinção da fase atual

S03–S05 estão concluídas. M05 não está `DONE`: S06–S08, aceite funcional
humano e validação física continuam pendentes.
