# S02 — Navegação e preferências simuladas

Status: IMPLEMENTED — testes automatizados aprovados; UX aprovada; validação Windows/TV física e controle físico pendentes.

## Objetivo

Tornar o fluxo operável por controle e validar as escolhas antes de integrar.

## Contexto e requisitos

FR-075–080, FR-187–193, FR-214–218, FR-220; NFR-005–009, NFR-123–127, NFR-158–159; RX-003–004.

Ler [M01](../README.md), [plano aprovado](../../PLAN.md#m01), [matriz](../../REQUIREMENTS_COVERAGE.md), [A11 frontend-first](../../../architecture/11-frontend-first-project-setup.md), [A09 UX](../../../architecture/09-ux-navigation-spec.md) e [A08 segurança](../../../architecture/08-security-model.md), apenas nas seções aplicáveis. Contratos/integração também consultam A06 §§69–79 e 88–104 quando persistência for necessária.

## Dependências

S01.

## Escopo

Grafo de foco, D-pad/analógico, A/B, keyboard fallback, hotplug/hints; focus trap/restoration; formulários e confirmação de defaults. Qualidade/resolução, áudio/legenda, auto-switch/autoplay/preflight e pause/continue são preferências simuladas; não executam runtimes.

## Fora de escopo

Persistência real, validação de paths no SO, integrações externas e mudança do escopo das preferências.

## Critérios de aceite

Nenhuma tela sem saída; B fecha camada ativa e restaura contexto; modais não vazam foco; rascunho preservado durante navegação; limite inválido mostra erro; pasta inacessível e falha ao salvar são simuláveis; restaurar defaults mantém biblioteca/histórico/downloads/subscriptions das fixtures; foco/legibilidade em 1080p/1440p/4K.

## Validação

Testes de interação para navegação, form validation, modal e restauração; percurso por gamepad quando disponível e teclado; documentar indisponibilidade de hardware sem declarar validação real.

## Evidências

Código presente no checkout e validado nesta retomada. Ver [evidências e limitações](../evidence/RESUME.md). Aceite completo pendente das verificações manuais registradas.

## Conclusão

Aceite e validação satisfeitos, com evidências e revisão/gates aplicáveis. Preparar este arquivo não conclui a story. Implementação permanece dependente de autorização de execução e dos checkpoints indicados.
