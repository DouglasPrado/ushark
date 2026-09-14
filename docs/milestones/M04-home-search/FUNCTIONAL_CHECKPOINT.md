# Checkpoint funcional — M04

Status: NOT_STARTED — integração adiada. Decisão: PENDING.

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

PENDENTES: versões/ambiente, corpus, comandos/resultados, traces de queries/eventos, banco após restart e limitações. Nenhum mock acidental na leitura/indexação principal. Identidade/acesso corretos, persistência, atualização incremental, recuperação e budgets aplicáveis precisam de evidências reais. Aprovação humana PENDING; só após aceite iniciar S06. Fluxos produtores futuros permanecem com seus owners e revalidam o contrato quando integrados.
