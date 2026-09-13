# S08 — Fechar M01 com evidências

Status: PLANNED. Preparação documental; não executada.

## Objetivo

Auditar a capacidade entregue sem confundir UI pronta com feature completa.

## Contexto e requisitos

Todos os requisitos primários de M01; RX-049, RX-057.

Ler [M01](../README.md), [plano aprovado](../../PLAN.md#m01), [matriz](../../REQUIREMENTS_COVERAGE.md), [A11 frontend-first](../../../architecture/11-frontend-first-project-setup.md), [A09 UX](../../../architecture/09-ux-navigation-spec.md) e [A08 segurança](../../../architecture/08-security-model.md), apenas nas seções aplicáveis. Contratos/integração também consultam A06 §§69–79 e 88–104 quando persistência for necessária.

## Dependências

S07.

## Escopo

Consolidar cobertura story/requisito, aprovação UX/funcional, gates/CI/review/merge, limitações e atualização STATE/UPDATE. Distinguir garantias locais de transversais ainda a validar em outras telas.

## Fora de escopo

Marcar DONE com apenas S01/S02 ou fabricar aprovação, CI, merge, teste Windows/TV.

## Critérios de aceite

Todas as stories implementadas satisfazem aceite; persistência real comprovada; aprovações registradas com evidência; verificações proporcionais verdes; revisão/merge exigidos pelo repo confirmados; NFR gamepad global não declarado concluído só com onboarding.

## Validação

Auditar evidências e matriz; não repetir testes sem mudança/falha. Se faltar prova, manter milestone aberto e registrar a pendência.

## Evidências

Ainda não existem evidências de execução. Registrar arquivos alterados, comandos/resultados, ambiente e demonstração pertinente quando a story for executada.

## Conclusão

Aceite e validação satisfeitos, com evidências e revisão/gates aplicáveis. Preparar este arquivo não conclui a story. Implementação permanece dependente de autorização de execução e dos checkpoints indicados.
