# S05 — Concluir onboarding com dados locais

Status: DONE. Executada e validada localmente em 2026-09-14.

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

- `apps/desktop/src/main/configuration-ipc.cjs`: allowlist IPC v1, validação de sender/frame, protocolo, payload/opções e erros públicos.
- `apps/desktop/src/preload/index.cjs`: somente `configuration.read/save/resetPlayback/chooseDirectory`, sem Node ou IPC genérico.
- `apps/desktop/src/renderer/app/configuration.ts`: adapter real atrás de `ConfigurationService`; o navegador preserva o mock independente.
- `App.tsx`: hydration no startup, migração do marcador legado, conclusão atômica, edição/reset persistentes, seletor nativo e mensagens honestas.
- `tests/configuration-ipc.spec.ts`, `tests/configuration-store.spec.ts`, `tests/desktop.electron.spec.ts` e `tests/onboarding.spec.ts`: 17 casos focados passaram; o caso de trace que falhou no teardown passou isolado sem trace.
- `pnpm typecheck`, lint afetado e `pnpm build` passaram; build preserva o aviso conhecido de chunk acima de 500 kB.

## Conclusão

Integração real comprovada localmente no Electron macOS e mock de navegador preservado. O checkpoint funcional está pronto para revisão; a autorização explícita para executar até S08 permite continuar tecnicamente, sem fabricar aprovação humana ou evidência Windows/TV.
