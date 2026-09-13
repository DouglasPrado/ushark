# S06 — Comprovar o primeiro acesso

Status: PLANNED. Preparação documental; não executada.

## Objetivo

Consolidar evidência de comportamento frontend e persistência.

## Contexto e requisitos

Todos os FRs de M01; NFR-116, NFR-142, NFR-146, NFR-149, NFR-158–159; RX-049.

Ler [M01](../README.md), [plano aprovado](../../PLAN.md#m01), [matriz](../../REQUIREMENTS_COVERAGE.md), [A11 frontend-first](../../../architecture/11-frontend-first-project-setup.md), [A09 UX](../../../architecture/09-ux-navigation-spec.md) e [A08 segurança](../../../architecture/08-security-model.md), apenas nas seções aplicáveis. Contratos/integração também consultam A06 §§69–79 e 88–104 quando persistência for necessária.

## Dependências

S05 e checkpoint funcional aprovado.

## Escopo

Testes de interação/E2E relevantes ao onboarding, gamepad/foco, reset, restart e falha; medir navegação/frame pacing/memória segundo baseline definido. Reutilizar testes anteriores.

## Fora de escopo

Testar torrent/MPV/Registry inexistentes, fixar baseline para esconder regressão ou afirmar desempenho Windows sem medir.

## Critérios de aceite

Caminho principal e falhas pertinentes passam; não há regressão conhecida de foco/estado; resultados registram ambiente/versões e limitações; testes não dependem da internet pública.

## Validação

Executar suíte proporcional e gates existentes uma vez após mudanças; não criar testes de runtimes inexistentes nem usar retries ilimitados.

## Evidências

Ainda não existem evidências de execução. Registrar arquivos alterados, comandos/resultados, ambiente e demonstração pertinente quando a story for executada.

## Conclusão

Aceite e validação satisfeitos, com evidências e revisão/gates aplicáveis. Preparar este arquivo não conclui a story. Implementação permanece dependente de autorização de execução e dos checkpoints indicados.
