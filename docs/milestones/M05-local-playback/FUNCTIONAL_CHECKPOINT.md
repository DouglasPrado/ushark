# Checkpoint funcional — M05

## Status

NOT_STARTED. Decisão: PENDING. Roteiro preparado; nenhuma aprovação ou validação executada.

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

PENDENTES. Registrar decisão humana com contexto e evidência; não inferir aprovação pelo silêncio. Alterações de UX exigidas na integração voltam à revisão correspondente. Este roteiro não autoriza execução nem fecha S08.

## Mudanças solicitadas

Nenhuma registrada; isso não equivale a aprovação.

## Distinção da fase atual

M05 frontend implementado com mocks; evidência em evidence/VALIDATION.md não executa este checkpoint. Integração S03–S08 DEFERRED.
