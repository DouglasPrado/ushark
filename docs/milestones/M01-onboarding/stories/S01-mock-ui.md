# S01 — Onboarding e Home vazia com mocks

Status: IMPLEMENTED — testes automatizados aprovados; UX aprovada; validação Windows/TV física e controle físico pendentes.

## Objetivo

Disponibilizar o primeiro percurso visual sem serviços externos.

## Contexto e requisitos

FR-001, FR-214–218, FR-220; NFR-004, NFR-065, NFR-137–138, NFR-142; RX-001–002.

Ler [M01](../README.md), [plano aprovado](../../PLAN.md#m01), [matriz](../../REQUIREMENTS_COVERAGE.md), [A11 frontend-first](../../../architecture/11-frontend-first-project-setup.md), [A09 UX](../../../architecture/09-ux-navigation-spec.md) e [A08 segurança](../../../architecture/08-security-model.md), apenas nas seções aplicáveis. Contratos/integração também consultam A06 §§69–79 e 88–104 quando persistência for necessária.

## Dependências

S00.

## Escopo

Shell Electron/React/TS/Vite/Tailwind/shadcn, pnpm/Turbo mínimos; desktop/ui/mocks/types. Rotas e formulários do contrato; configuração em memória por boundary substituível e marcador local versionado de conclusão do onboarding. Main cria janela/fullscreen; renderer isolado e preload mínimo.

## Fora de escopo

SQLite, filesystem de biblioteca/cache real, provider, MPV, torrentd, RPC, automação Sunshine, workflows de release.

## Critérios de aceite

pnpm dev abre o percurso sem rede; completar mock leva à Home vazia com ações identificáveis para futuros fluxos; loading/error/offline são selecionáveis; renderer sem Node amplo e com CSP; --tv abre fullscreen; recarregar/reabrir não repete o onboarding concluído, sem afirmar persistência dos demais dados após restart.

## Validação

Build/typecheck e teste de componente do percurso; inspecionar manualmente desktop e fullscreen e cenário offline. Registrar comandos que realmente passarem a existir.

## Evidências

Código presente no checkout e validado nesta retomada. Ver [evidências e limitações](../evidence/RESUME.md). Aceite completo pendente das verificações manuais registradas.

## Conclusão

Aceite e validação satisfeitos, com evidências e revisão/gates aplicáveis. Preparar este arquivo não conclui a story. Implementação permanece dependente de autorização de execução e dos checkpoints indicados.

Estado consolidado da fase: S00–S02 implementadas; aceite UX já existente de M01 preservado em ../UX_CHECKPOINT.md. Referências a revisão pendente acima registram o estágio histórico anterior ao aceite. S03–S08 adiadas.
