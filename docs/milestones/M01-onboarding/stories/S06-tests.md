# S06 — Comprovar o primeiro acesso

Status: DONE. Executada e validada localmente em 2026-09-14.

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

- [INTEGRATION_VALIDATION](../evidence/INTEGRATION_VALIDATION.md).
- 27/27 testes focados passaram: store, IPC, Electron, onboarding, navegação, estrutura e scrollbar.
- A regressão integral serial passou 150/150 em 9,3 min.
- Três repetições do budget local passaram; amostra registrada: transição p95 33,90 ms, frame p95 16,70 ms e crescimento de heap reportado 0 em 50 transições.
- Ambiente e limites separam Chromium/Electron macOS de Windows/TV/controle físicos.

## Conclusão

Testes e budgets proporcionais de M01 estão verdes localmente. O hardening restante segue em S07; checkpoint funcional humano e hardware real continuam pendentes.
