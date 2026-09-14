# S05 — Integração de packs e episódios

Status: DONE em 2026-09-14. Checkpoint funcional pronto para revisão humana.

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

[Integração real e validação](../evidence/INTEGRATION_VALIDATION.md): adapter
Electron sem mock acidental, pack multifile, especial, legenda independente,
arte segura, falha parcial recuperável, retry, restart e regressão afetada
**86/86**.

## Done When

Cumprido. Evidências reais prontas para checkpoint funcional humano; S06
permanece não autorizado até aceite.
