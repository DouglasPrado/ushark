# Checkpoint funcional — M04

Status: READY_FOR_REVIEW. Decisão humana: PENDING.

## Pré-condições e integrações reais

UX M01–M22 aprovada, M02/M03 integrados e S03–S05 concluídas. Perfil/pasta de teste dedicados; SQLite, FTS5, watcher, queries e cache locais reais. Dados locais controlados de subscriptions/coleções/progresso são permitidos para provar leitura, com procedência registrada; não comprovam produtores M05/M12/M13/M16.

## Jornada para revisar

1. Reiniciar offline com catálogo indexado e conferir Home sem esperar scan, metadata remota ou health.
2. Buscar por título/original/série/episódio/biblioteca/coleção e filtrar; comprovar resultado fora dos cards montados.
3. Verificar mesmo Content em múltiplas bibliotecas, sources permitidas consolidadas, origens homônimas e episodes com identidades diferentes.
4. Abrir biblioteca/coleção/subscription existente e detalhes; voltar com consulta/filtro/foco/scroll preservados. Conferir leitura de progresso incompleto recente e encaminhamento ao boundary, separando eventual playback M05.
5. Criar/alterar/renomear/remover arquivo real na pasta de teste; registrar eventos e entradas reindexadas, sem rebuild global.
6. Injetar rajada, evento duplicado, arquivo incompleto, erro transacional, índice interrompido e retry; reiniciar e conferir consistência/recuperação.
7. Verificar paginação em lote, hydration, imagens, limites de acesso e indisponibilidade de sync/peers sem bloquear leitura local.
8. Executar protocolo de startup/abertura e corpus do README; registrar baseline, hardware, OS, amostras e p95, separando macOS de Windows/TV e metas de garantias medidas.

## Evidências e decisão

[Evidência S05](evidence/INTEGRATION_VALIDATION.md): caminho principal
Electron/preload/IPC/SQLite/FTS5 real, sincronização automática de mutações,
busca offline, invalidação do renderer e restart persistente. A suíte afetada
M01–M06 passou **71/71** com CPython 3.12/libtorrent 2.1.1.0 real; a regressão
visual/comportamental M02/M04 passou **34/34**. Corpus de 10.000 Contents,
queries fixas, eventos de filesystem e recovery estão nas evidências S04.1–S04.3.

Pendências explícitas: produtores reais de progresso/coleções/subscriptions
continuam em M05/M12/M16; M04 comprovou sua leitura com dados locais
controlados sem alegar esses fluxos. Runtime empacotado, métricas finais S07 e
Windows/TV/controle/Moonlight físicos permanecem pendentes. Aprovação humana
continua `PENDING`; S06 não foi iniciado.
