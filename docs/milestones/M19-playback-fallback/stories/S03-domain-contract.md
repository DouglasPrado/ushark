# S03 — Contrato de domínio — M19

Status: DONE em 2026-09-14.

## Objetivo

Derivar o contrato mínimo de M19 da experiência aprovada.

## Contexto e dependências

UX M01–M22 aprovada; execução autorizada; dependências de integração M08 disponíveis conforme ondas do plano. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

PlaybackFallback: avaliar candidato/content/episódio/duração, preparar antes do handoff, trocar com geração/posição; HealthHistory agregado local com decay/TTL/algorithmVersion; override original preservado. Definir operações, DTOs, ownership, eventos/snapshots, unidades, limites, erros, transações e invariantes; fechar decisões: S03: tolerância de duração/edição, TTL/cooldown e corrida seek/troca; não prometer transição imperceptível.

## Fora de escopo

Código/adapters e schema total do projeto; promover exemplos a defaults sem decisão.

## Critérios de aceite

Cada ação da UX tem contrato de sucesso/falha/cancelamento; identidade e dados pessoais preservados; limites verificáveis; decisão pendente que afete integração resolvida antes de S04.

## Validação

Revisão de contratos com fixtures UX e contra cenários reais planejados: Retirar peers de source controlada; auto-switch off não troca; outra edição não troca automaticamente; seek concorrente usa posição correta; cooldown impede loop; expiração reduz peso do histórico.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
