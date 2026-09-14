# Checkpoint funcional — M11

## Status

READY_FOR_REVIEW. Decisão: PENDING. S03–S05 concluídas em 2026-09-14; nenhuma aprovação funcional foi inferida.

## Pré-condições

S03–S05 integradas após UX M01–M22 e dependências reais; só então READY_FOR_REVIEW.

## Jornada para testar

Fim de episódio → countdown → tocar agora ou cancelar → próximo episódio → último episódio sem continuação.

1. Percorrer o caminho principal e verificar o resultado: Countdown cancelável e próximo episódio correto, com preflight limitado.
2. Exercitar estados: autoplay desligado; preparando próximo; countdown; cancelado; episódio ausente; fim de temporada; fim de série; preflight falhou.
3. Voltar/cancelar/repetir e conferir foco, contexto e ausência de mutação não confirmada.
4. Desligar autoplay impede início; cancelar até o limite definido não toca próximo; pack reutiliza sessão; banda do atual não é roubada; especial/episódio ausente não seleciona conteúdo errado.
5. Registrar ambiente, versões, corpus, evidências e limitações; separar controle sintético e hardware real.

## Integrações reais e verificações

NextEpisode: resolver sequência por identidade, preparar com budget, iniciar/cancelar countdown; sessionId e geração evitam início duplicado; estado pessoal separado do pack.

Verificar ausência de mock no caminho principal, persistência pertinente após restart, permissões, erro/sucesso refletidos na UI e dependências M03, M07, M08. Testes verdes não substituem demonstração da jornada real.

## Evidências e decisão

[Integração](evidence/INTEGRATION_VALIDATION.md) comprova o caminho local no
macOS/Electron. Decisão humana, Windows/TV, controle físico, Moonlight e término
natural em mídia longa permanecem pendentes. Este checkpoint não autoriza
S06–S08.

## Mudanças solicitadas

Nenhuma registrada; isso não equivale a aprovação.

Frontend aprovado; S03–S05 integradas. S06–S08 permanecem não autorizadas.
