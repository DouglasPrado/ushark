# S03 — Contrato de domínio — M21

Status: DEFERRED; preparada documentalmente, não executada.

## Objetivo

Derivar o contrato mínimo de M21 da experiência aprovada.

## Contexto e dependências

UX M01–M22 aprovada; execução autorizada; dependências de integração M20, M17 disponíveis conforme ondas do plano. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Recovery: criar snapshot consistente DB/WAL/manifests/resume/config e chaves conforme storage, validar backup, stage/restore atômico, supervisor com tentativas/timeouts; original preservado até commit. Definir operações, DTOs, ownership, eventos/snapshots, unidades, limites, erros, transações e invariantes; fechar decisões: S03: política de chaves portáveis/secure storage, budget de perda e limites de restart; restore real só em ambiente autorizado.

## Fora de escopo

Código/adapters e schema total do projeto; promover exemplos a defaults sem decisão.

## Critérios de aceite

Cada ação da UX tem contrato de sucesso/falha/cancelamento; identidade e dados pessoais preservados; limites verificáveis; decisão pendente que afete integração resolvida antes de S04.

## Validação

Revisão de contratos com fixtures UX e contra cenários reais planejados: Backup durante uso restaura em perfil isolado; injetar crash UI/Core/torrentd/MPV, DB lock/disk full/migração falha; manter original e restaurar estado/subscriptions/config; shutdown nunca espera indefinidamente.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
