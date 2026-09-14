# S00 — Contrato da experiência

Status: IMPLEMENTED — contrato em EXPERIENCE.md; revisão de UX pendente.

## Objetivo

Definir o fluxo inspecionável de primeiro acesso e os limites de M01.

## Contexto e requisitos

FR-001, FR-075–080, FR-187–193, FR-214–218, FR-220; NFRs e RX de M01 no plano.

Ler [M01](../README.md), [plano aprovado](../../PLAN.md#m01), [matriz](../../REQUIREMENTS_COVERAGE.md), [A11 frontend-first](../../../architecture/11-frontend-first-project-setup.md), [A09 UX](../../../architecture/09-ux-navigation-spec.md) e [A08 segurança](../../../architecture/08-security-model.md), apenas nas seções aplicáveis. Contratos/integração também consultam A06 §§69–79 e 88–104 quando persistência for necessária.

## Dependências

Nenhuma.

## Escopo

Jornada boas-vindas → biblioteca → cache → preferências → Home vazia; configurações acessíveis depois; rotas /onboarding, /home e /settings. Especificar transições, campos, defaults propostos e estados.

## Fora de escopo

Implementação de telas, banco, processos ou protocolos.

## Critérios de aceite

Cada campo tem obrigatoriedade, default proposto e mensagem de erro; B preserva rascunho entre etapas; concluir chega à Home; restaurar preferências não apaga a biblioteca; cenário Windows/TV e corpus para avaliação estão definidos.

## Validação

Revisar contrato contra UJ01/22/62/79/80, FRs de M01 e pendências D02/D08/D18. Registrar defaults como propostas até UX.

## Evidências

Contrato existente em EXPERIENCE.md, conferido na retomada. Defaults continuam propostos até aprovação UX. Ver [retomada](../evidence/RESUME.md).

## Conclusão

Aceite e validação satisfeitos, com evidências e revisão/gates aplicáveis. Preparar este arquivo não conclui a story. Implementação permanece dependente de autorização de execução e dos checkpoints indicados.

Evidência: [Contrato da experiência](../EXPERIENCE.md).

Estado consolidado da fase: S00–S02 implementadas; aceite UX já existente de M01 preservado em ../UX_CHECKPOINT.md. Referências a revisão pendente acima registram o estágio histórico anterior ao aceite. S03–S08 adiadas.
