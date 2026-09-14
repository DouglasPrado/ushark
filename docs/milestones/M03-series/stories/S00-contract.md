# S00 — Contrato da experiência

Status: DONE (frontend), 2026-09-13.

## Objetivo

Definir jornada, hierarquia, campos, transições e critérios de M03 antes de construir a UI.

## Contexto e dependências

Ler [M03](../README.md), UJ06/UJ55, FR-004–005/017–018/020/206 e RX-008. Usar M02 apenas como referência visual e de catálogo; M06 permanece mockado nesta fase.

## Escopo

Produzir `EXPERIENCE.md` com rotas, navegação série→temporada→episódio, revisão por arquivo, edição manual de temporada/episódio, confirmação e retorno de foco. Definir os quatro conjuntos de fixtures, estados obrigatórios, regras de colisão, especiais como temporada 0, metadata ausente, legendas relacionadas e comportamento de rascunho/cancelamento. Mapear requisitos entre aceite frontend e validação futura.

## Fora de escopo

Código, schema SQLite, RPC, leitura real de torrent, algoritmo definitivo para episódios duplos e decisões de playback.

## Critérios de aceite

Cada estado do README possui entrada, saída, recuperação e copy proposta. Identidade da série e de cada episódio permanece distinta da source e do arquivo. A UI não confirma automaticamente ambiguidades, não funde episódios diferentes e não inventa metadata. Intervalos como `S01E01E02` seguem para revisão manual.

## Validação

Revisão documental contra plano, matriz, UJ06/UJ55 e A01/A02/A06; registrar roteiro de teclado/gamepad e 1080p/1440p/4K.

## Evidências

Contrato: [EXPERIENCE.md](../EXPERIENCE.md), incluindo matriz de estados, fixtures, UJ06/UJ55, requisitos e validações físicas pendentes. Revisão documental concluída, sem aprovação UX.

## Done When

Contrato suficiente para S01, sem atribuir aprovação humana ou resolver arquitetura prematuramente.
