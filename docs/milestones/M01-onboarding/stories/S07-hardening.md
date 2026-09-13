# S07 — Consolidar segurança e uso na TV

Status: PLANNED. Preparação documental; não executada.

## Objetivo

Resolver riscos restantes do shell e do onboarding integrado.

## Contexto e requisitos

NFR-004–009, NFR-065, NFR-116, NFR-123–127, NFR-137–138, NFR-142, NFR-146, NFR-149, NFR-158–159; RX-001–004, RX-049, RX-057.

Ler [M01](../README.md), [plano aprovado](../../PLAN.md#m01), [matriz](../../REQUIREMENTS_COVERAGE.md), [A11 frontend-first](../../../architecture/11-frontend-first-project-setup.md), [A09 UX](../../../architecture/09-ux-navigation-spec.md) e [A08 segurança](../../../architecture/08-security-model.md), apenas nas seções aplicáveis. Contratos/integração também consultam A06 §§69–79 e 88–104 quando persistência for necessária.

## Dependências

S06.

## Escopo

Revisar Electron/preload/CSP/navegação/window.open, foco e escala, bounded state/memória, erros de configuração e ausência de requests remotos no render inicial; corrigir apenas riscos de M01.

## Fora de escopo

Automação Sunshine, criptografia de toda a biblioteca, sistemas de diagnóstico extensos e hardening de superfícies futuras.

## Critérios de aceite

Renderer isolado; modais e hotplug não perdem navegação; no ciclo onboarding/settings/Home memória não cresce indefinidamente; erro tem recuperação; limites e validações proporcionais documentados.

## Validação

Revisão de segurança do boundary e evidências visuais/performance; repetir somente checks afetados pelas correções.

## Evidências

Ainda não existem evidências de execução. Registrar arquivos alterados, comandos/resultados, ambiente e demonstração pertinente quando a story for executada.

## Conclusão

Aceite e validação satisfeitos, com evidências e revisão/gates aplicáveis. Preparar este arquivo não conclui a story. Implementação permanece dependente de autorização de execução e dos checkpoints indicados.
