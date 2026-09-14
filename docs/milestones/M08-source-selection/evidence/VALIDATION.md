# M08 — Evidências frontend — 2026-09-13

SourceChoices + SelectionPreview/MockSelectionPreview em Filmes/Home/episódios; preferências M01 herdadas, menor tamanho exposto; source escolhida identificada no Player.

Typecheck/ESLint passaram. Playwright: 2 testes de seleção passaram; regressão M07 filme/episódio passou. Uma rodada de seek retornou ao onboarding após alteração de arquivos durante execução (compatível com reload Vite); rerun estável do seek passou, junto à comparação (2/2, 16.8s). Caso adicional de layout/unknown passou (1, 4.1s).

Coberto: comparação local/compacto/4K inviável, limites, preferência/override/remover, fonte entregue ao player, autoSelect desligado, Play durante medição, erro/retry, offline local, cancelar/foco, score desconhecido não fabricado. Capturas selection-1080/1440/2160.png e comparison.png. Inspeção direta revelou hero sobre modal; z-index corrigido e superfície ampliada. Comparação passou a ocupar toda a largura do detalhe.

Limites: métricas fixas/sintéticas e ranking mecânico provisório; não comprovam probes, calibração, throughput real, hardware, performance <10ms no alvo ou algoritmo definitivo. Windows/TV/controle físico pendentes. UX READY_FOR_REVIEW/PENDING, adiada por instrução explícita. S03–S08 DEFERRED.

Na revisão posterior, o componente de Torrent Health foi compartilhado entre cards, Hero, detalhes e comparação de fontes. Ele apresenta barras crescentes e label (`Excelente`, `Muito bom`, `Bom`, `Instável`, `Ruim`, `Desconhecido` ou `Indisponível`) e mantém resolução em campo separado. `MockSelectionPreview.getHealthSummary()` fornece snapshots determinísticos. Os 3 testes M08 e a regressão completa **125/125** passaram após a mudança; isso continua sendo evidência frontend, não prova do Health Engine.

Na extensão para Séries, `averageTorrentHealth()` deduplica por ID e calcula a média aritmética somente dos snapshots com score. A capa da série agrega seus torrents únicos; cada episódio agrega apenas suas próprias sources. Estados sem score continuam `unknown`/`unavailable`, sem inventar valor. Os 16 testes focados M03/M04 e a regressão **125/125** passaram.
