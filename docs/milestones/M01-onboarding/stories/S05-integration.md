# S05 — Concluir onboarding com dados locais

Status: PLANNED. Preparação documental; não executada.

## Objetivo

Conectar o frontend aprovado ao armazenamento mínimo.

## Contexto e requisitos

FR-001, FR-187–193, FR-214–218, FR-220; NFR-004–009, NFR-065; RX-057.

Ler [M01](../README.md), [plano aprovado](../../PLAN.md#m01), [matriz](../../REQUIREMENTS_COVERAGE.md), [A11 frontend-first](../../../architecture/11-frontend-first-project-setup.md), [A09 UX](../../../architecture/09-ux-navigation-spec.md) e [A08 segurança](../../../architecture/08-security-model.md), apenas nas seções aplicáveis. Contratos/integração também consultam A06 §§69–79 e 88–104 quando persistência for necessária.

## Dependências

S04.

## Escopo

Trocar adapter em memória por adapter local; seleção/validação de pasta real pela API restrita; startup com configuração existente; erros inline e retry. Manter modo mock independente.

## Fora de escopo

Alterar telas aprovadas silenciosamente ou considerar mock prova de diretório/persistência real.

## Critérios de aceite

Novo usuário conclui e reabre sem repetir onboarding indevidamente; Home vazia abre offline; edição persiste e erro não bloqueia navegação; estados honestos; UX preservada e nenhum runtime futuro iniciado.

## Validação

E2E primeiro acesso → salvar → fechar → reabrir → configurações; cenários de erro; demonstração no checkpoint funcional, distinguindo Windows real de desenvolvimento em macOS.

## Evidências

Ainda não existem evidências de execução. Registrar arquivos alterados, comandos/resultados, ambiente e demonstração pertinente quando a story for executada.

## Conclusão

Aceite e validação satisfeitos, com evidências e revisão/gates aplicáveis. Preparar este arquivo não conclui a story. Implementação permanece dependente de autorização de execução e dos checkpoints indicados.
