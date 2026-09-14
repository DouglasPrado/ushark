# S03 — Contrato de domínio — M16

Status: DONE em 2026-09-14.

## Objetivo

Derivar o contrato mínimo de M16 da experiência aprovada.

## Contexto e dependências

UX M01–M22 aprovada; execução autorizada; dependências de integração M15, M04 disponíveis conforme ondas do plano. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

SubscriptionSync: preview/instalar/check/pausar/aplicar/rollback/unsubscribe; versão/hash/identity e operação idempotente; atomic swap mantém snapshot anterior; GC por referências. Definir operações, DTOs, ownership, eventos/snapshots, unidades, limites, erros, transações e invariantes; fechar decisões: D06/D08/D15: máquina de estados, limites e concorrência em S03; rollback explícito validado não equivale a downgrade remoto silencioso.

## Fora de escopo

Código/adapters e schema total do projeto; promover exemplos a defaults sem decisão.

## Critérios de aceite

Cada ação da UX tem contrato de sucesso/falha/cancelamento; identidade e dados pessoais preservados; limites verificáveis; decisão pendente que afete integração resolvida antes de S04.

## Validação

Revisão de contratos com fixtures UX e contra cenários reais planejados: Crash em stage/verify/commit preserva uma versão válida; update/unsubscribe mantém progresso/favoritos/overrides/downloads; mesmo número com outro hash e downgrade bloqueados; item focado removido restaura contexto.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
