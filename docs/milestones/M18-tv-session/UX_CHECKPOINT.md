# Checkpoint UX — M18

## Status

APPROVED. Aprovação consolidada do usuário em 2026-09-14: “O frontend foi aprovado ja”.

## Pré-condições

S00–S02 implementadas com evidências; só então READY_FOR_REVIEW.

## Jornada para testar

Moonlight → app --tv → navegar → Play → controlar tracks → desconectar → reconectar → sair.

1. Percorrer o caminho principal e verificar o resultado: TV abre app, controla player, desconecta/reconecta e sai corretamente.
2. Exercitar estados: iniciando; foco no app; player ativo; controle desconectado; sessão perdida; pausado/continuando; reconectando; encerrando.
3. Voltar/cancelar/repetir e conferir foco, contexto e ausência de mutação não confirmada.
4. Usar fixtures determinísticas, teclado/gamepad e superfícies 1080p/1440p/4K; conferir copy, hierarquia, legibilidade e recuperação.
5. Registrar ambiente, versões, corpus, evidências e limitações; separar controle sintético e hardware real.

## O que está mockado

TvSession: sinal de conexão verificável, política pause/continue, handoff de foco entre UI/MPV, input hotplug e shutdown limitado; versões suportadas e origem do sinal explícitas.

Todos os efeitos de runtime/rede/disco são simulados em memória. Não afirmar persistência/reprodução/publicação real. A aprovação libera apenas o avanço frontend conforme GOAL, não encerra o milestone.

## Evidências e decisão

Evidências em [UPDATE](UPDATE.md) e [VALIDATION](evidence/VALIDATION.md). Decisão humana pendente; não inferir aprovação pelo silêncio. Alterações de UX exigidas na integração voltam à revisão correspondente. Este roteiro não autoriza execução nem fecha S08.

## Mudanças solicitadas

Em 2026-09-13, o usuário solicitou que o modo TV se comporte como uma superfície Netflix: sem adicionar filmes/séries, importar torrent, gerenciar bibliotecas/downloads/fontes, editar identificação, abrir diagnóstico ou acessar configurações. O ajuste foi implementado em Home, Filmes, Séries, detalhes e Player, inclusive para o lançamento Electron com `--tv`. Favoritos, busca, reprodução, áudio e legendas foram preservados. Pronto para confirmação visual; isso não equivale a aprovação.

## Revisão final consolidada

APPROVED na revisão consolidada de 2026-09-14; [roteiro e evidência do aceite](../../execution/FRONTEND_REVIEW.md). O aceite cobre UX mockada, não integração funcional ou hardware físico.
