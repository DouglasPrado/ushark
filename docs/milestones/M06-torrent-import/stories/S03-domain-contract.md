# S03 — Contrato de domínio — M06

Status: DEFERRED; preparada documentalmente, não executada.

## Objetivo

Derivar o contrato mínimo de M06 da experiência aprovada.

## Contexto e dependências

UX M01–M22 aprovada; execução autorizada; dependências de integração M02 disponíveis conforme ondas do plano. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

TorrentInspection: inspecionar entrada, cancelar(operationId), salvar pendente, repetir; Source/infoHash separado de ContentSourceSelector; snapshot de arquivos e eventos versionados. Definir operações, DTOs, ownership, eventos/snapshots, unidades, limites, erros, transações e invariantes; fechar decisões: D05/D08/D22: limites de input, containment por componentes/symlinks e identidade em S03.

## Fora de escopo

Código/adapters e schema total do projeto; promover exemplos a defaults sem decisão.

## Critérios de aceite

Cada ação da UX tem contrato de sucesso/falha/cancelamento; identidade e dados pessoais preservados; limites verificáveis; decisão pendente que afete integração resolvida antes de S04.

## Validação

Revisão de contratos com fixtures UX e contra cenários reais planejados: Usar torrent e magnet autorizados com metadata e sem peers; cancelar/repetir/reabrir pendente; mesmo hash com selectors distintos reutiliza sessão; derrubar daemon mantém UI; rejeitar bencode hostil e paths fora do sandbox.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
