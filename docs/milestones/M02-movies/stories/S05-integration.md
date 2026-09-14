# S05 — Integração do catálogo

Status: DONE. Executada e validada localmente em 2026-09-14.

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

- [Validação de integração](../evidence/INTEGRATION_VALIDATION.md).
- `MovieCatalogApplicationService`, IPC/preload e `DesktopMovieCatalog` substituem o mock no Electron; browser preserva o mock.
- Catálogo vazio → cadastro manual → favorito → Home → reload/restart foi comprovado offline no Electron.
- Provider não configurado apresenta erro recuperável e permite cadastro manual; nenhum mock de provider é usado no caminho Electron.
- 49/49 testes afetados passaram; typecheck, lint afetado e build passaram.
- Smoke TMDB real, Windows/TV/controle físicos e gates externos permanecem explícitos no checkpoint.

## Conclusão

Evidências locais prontas para checkpoint funcional humano; aguardar aceite e completar os gates externos aplicáveis antes de S06.
