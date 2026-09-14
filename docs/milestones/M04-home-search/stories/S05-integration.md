# S05 — Integração local

Status: DEFERRED. Preparar este arquivo não executa a story.

## Objetivo

Provar Home e busca com dados e atualização reais.

## Contexto e dependências

Ler [M04](../README.md). S04 concluída; M02/M03 reais e contratos S03.

## Escopo

Substituir adapters por queries locais; abrir Home offline, buscar todos os tipos/campos, filtrar, entrar em detalhes e voltar. Validar leitura de memberships/coleções/subscription existente com dados locais controlados, sem depender de sync futuro. Alterar arquivo em pasta temporária autorizada e observar watcher→índice→UI; reiniciar e preservar catálogo. Se progresso real de M05 estiver disponível, validar sua leitura; caso contrário documentar fixture persistida de leitura sem alegar playback.

## Fora de escopo

Implementar M05/M12/M13/M16, streaming, probes e publicação externa.

## Critérios de aceite

Caminho de leitura/indexação não contém mocks acidentais; mudança afeta apenas dados pertinentes, busca não depende de cards montados ou internet e Home não espera scan/provider/health. Erro permite retry e preserva último estado consistente.

## Validação

Roteiro FUNCTIONAL_CHECKPOINT.md, inspeção de banco/queries/eventos e restart; registrar claramente produtores futuros ainda não exercitados.

## Evidências

PENDENTES. Registrar arquivos, comandos/resultados, ambiente e limitações ao executar esta story.

## Done When

Evidências reais prontas para aceite funcional humano; aguardar decisão antes de S06.
