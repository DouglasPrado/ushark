# S05 — Integração de packs e episódios

Status: DEFERRED. Preparar este arquivo não executa a story.

## Objetivo

Substituir mocks e provar a jornada completa com catálogo, provider e inspeção de arquivos reais.

## Contexto e dependências

Ler [M03](../README.md) e apenas as fontes aplicáveis: S04 concluída, contratos S03 e M02/M06 reais disponíveis.

## Escopo

Conectar a UI aos adapters reais; importar episódio avulso, season pack, multitemporada e especiais; revisar/corrigir ambiguidades; confirmar e reabrir offline. Exercitar uma source compartilhada por vários episódios com selectors e legendas independentes. Confirmar idempotência e recuperação quando arquivos, metadata ou provider mudam.

## Fora de escopo

Playback, prioridades reais de download, próximo episódio, curadoria compartilhada e publicação externa.

## Critérios de aceite

Caminho principal não usa mocks acidentais. Restart mantém hierarquia, IDs, correções, source e selectors; episódios distintos permanecem distintos. Metadata ausente não bloqueia revisão, e falha após confirmação parcial faz rollback ou retorna estado recuperável.

## Validação

Executar o roteiro do `FUNCTIONAL_CHECKPOINT.md` em perfil temporário e arquivos/torrents de teste autorizados; inspecionar banco e comportamento após restart, falhas e retry; registrar ambiente e integrações exercitadas.

## Evidências

PENDENTES. Registrar arquivos, comandos/resultados, fixtures e ambiente ao executar S05.

## Done When

Evidências reais prontas para checkpoint funcional humano; aguardar aceite antes de S06.
