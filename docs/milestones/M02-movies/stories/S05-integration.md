# S05 — Integração do catálogo

Status: DEFERRED. Preparar este arquivo não conclui a story.

## Objetivo

Substituir mocks e provar o fluxo com dados reais.

## Contexto e dependências

Ler [M02](../README.md) e apenas as fontes aplicáveis: S04 concluída e contratos S03; M01 real disponível.

## Escopo

Conectar boundary a persistência/provider/cache reais; criar manualmente e por provider, corrigir, favoritar, remover source/membership e reabrir offline. Executar merge com ambos os registros existentes, preservar estado e overrides. Validar delete somente em arquivo temporário autorizado; catálogo não depende de catálogo central.

## Fora de escopo

Resolução torrent, player, curadoria compartilhada, publicação externa.

## Critérios de aceite

Caminho principal sem mocks acidentais; restart mantém ordem, memberships, IDs, metadata, favoritos e sources. Falha do provider mantém leitura local e opção manual; refresh não perde estado. Operações de arquivo respeitam confirmação, escopo e falhas definidas.

## Validação

Roteiro FUNCTIONAL_CHECKPOINT.md em perfil temporário; inspecionar persistência após restart e falhas injetadas; registrar ambiente e integrações efetivamente exercitadas.

## Evidências

PENDENTES. Registrar arquivos, comandos/resultados e ambiente após execução em UPDATE e nos checkpoints correspondentes.

## Conclusão

Evidências reais prontas para checkpoint funcional humano; aguardar aceite antes de S06.
