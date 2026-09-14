# S00 — Contrato da experiência

Status: DONE (frontend), 2026-09-13.

## Objetivo

Definir a experiência e um protocolo verificável antes da UI.

## Contexto e dependências

Ler [M04](../README.md). Plano M04, matriz, UJ07/41/43/44/51/52/53/77, A09 e M02/M03 como referências.

## Escopo

Produzir EXPERIENCE.md com rotas reais/propostas, seções, foco inicial e fallback sem Hero, consultas/filtros, retorno de detalhes, leitura de biblioteca/coleção e encaminhamento de Continuar. Definir entrada de texto operável por gamepad (teclado virtual ou solução já disponível), cancelamento e retorno de foco; não exigir teclado físico na jornada TV. Mapear todos os estados do README e fixtures, incluindo item removido, bibliotecas homônimas e responses fora de ordem. Fixar protocolo de medição, OS/hardware/resolução, cold/warm, corpus, amostras e percentis, registrando hardware ainda indisponível.

## Fora de escopo

Código, schema/IPC definitivo, playback, edição de coleções e aprovação humana.

## Critérios de aceite

Cada estado possui entrada, saída, recuperação e copy. Busca consolida Content por identidade, sem fundir episódios diferentes. Escopo de dependências futuras está separado de fixtures; nenhum budget é considerado medido nesta story.

## Validação

Revisão documental de requisitos/estados e roteiro teclado/gamepad em 1080p/1440p/4K.

## Evidências

[EXPERIENCE.md](../EXPERIENCE.md) define estados, rotas, fixtures, foco, teclado TV e protocolo futuro de medição. Revisão documental contra README, plano e fontes realizada. Ajuste posterior consolida `#/content/:contentId` e a mesma página de Filme para Home/busca e catálogo M02.

## Done When

Contrato suficiente para S01; decisões de UX pendentes ficam explícitas.
