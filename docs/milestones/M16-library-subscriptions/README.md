# M16 — Assinar e atualizar sem perder estado pessoal

Status: FRONTEND_IMPLEMENTED / READY_FOR_REVIEW. S00–S02 concluídas; UX PENDING adiada por instrução explícita até o fim de M01–M22. S03–S08 DEFERRED; não DONE.

## Objetivo

Acompanhar curadoria remota mantendo autonomia e funcionamento offline.

## Resultado para o usuário

Versão nova aplica atomicamente; falha mantém versão anterior e dados pessoais.

## Escopo e fontes

Link/código/deep link com preview; subscription instalada, check manual/auto/pausa, staging/diff/verify/atomic swap, rollback explícito, retry/backoff, origens, hide, salvar na pessoal, unsubscribe e GC por referências.

[Plano aprovado](../PLAN.md#m16), [cobertura individual de requisitos e jornadas](PREPARATION_COVERAGE.md), [PRD](../../product/01-prd-master.md), [jornadas](../../product/02-user-journeys.md), [decisões pendentes](../SOURCE_ANALYSIS.md). Ler os FR/NFR e recortes A01–A11 apontados na cobertura, mantendo condicionais e exemplos como tais.

## Dependências

Integração/closure: M15, M04. A UI usa o shell de M01 e boundaries mockados dos fluxos consumidores, sem exigir runtimes reais. Ordem frontend M01→M22; ordem de integração das ondas B–D do plano, com M06 antes da integração M03. Contratos definitivos e adapters só após UX M01–M22 aprovada e autorização de execução. Preparar antecipadamente não aprova essas dependências.

## Jornada principal

Link/código → preview e confiança → assinar → abrir offline → verificar update/diff → aplicar ou retry → unsubscribe.

## Rotas e superfícies propostas

adicionar biblioteca; detalhes da subscription; diff/rollback; confirmação de unsubscribe. S00 verifica compatibilidade com navegação existente; nomes de rotas são propostas, não código entregue.

## Estados obrigatórios

preview; instalada; checking; update disponível; staging; verifying; applying; atualizada; offline; erro; rollback. Incluir loading, vazio, erro recuperável/retry, sucesso e offline/degradado conforme operação; não representar operação dependente de rede como disponível offline. Cancelar/voltar preserva contexto e dados confirmados; modais prendem foco e o devolvem ao gatilho. S00 registra entrada/saída e recuperação de cada estado; S02 prova todas as transições com fixtures em memória.

## Contrato previsto, sujeito à UX

SubscriptionSync: preview/instalar/check/pausar/aplicar/rollback/unsubscribe; versão/hash/identity e operação idempotente; atomic swap mantém snapshot anterior; GC por referências. S03 fixa DTOs, erros tipados, idempotência, cancelamento e limites apenas para ações aprovadas. Persistência e eventos reais nunca são presumidos pela simulação. Mocks ficam atrás de boundary substituível e usam conteúdo próprio/autorizado ou sintético.

## Stories

- [S00 — Contrato da experiência](stories/S00-contract.md).
- [S01 — UI mockada](stories/S01-mock-ui.md).
- [S02 — Comportamento frontend](stories/S02-frontend-behavior.md); depois [checkpoint UX](UX_CHECKPOINT.md).
- [S03 — Contrato de domínio](stories/S03-domain-contract.md).
- [S04 — Adapters reais mínimos](stories/S04-backend.md).
- [S05 — Integração da jornada](stories/S05-integration.md); depois [checkpoint funcional](FUNCTIONAL_CHECKPOINT.md).
- [S06 — Testes da jornada](stories/S06-tests.md).
- [S07 — Hardening](stories/S07-hardening.md).
- [S08 — Closure](stories/S08-closure.md).

S04 se divide em três incrementos descritos na story, executados sequencialmente. Testes e segurança necessários acompanham a introdução de cada fronteira; S06/S07 consolidam a evidência.

## Validação específica planejada

Crash em stage/verify/commit preserva uma versão válida; update/unsubscribe mantém progresso/favoritos/overrides/downloads; mesmo número com outro hash e downgrade bloqueados; item focado removido restaura contexto.

Para a UI: fixtures determinísticas dos estados acima, teclado/gamepad, foco e retorno, desktop/TV em 1080p/1440p/4K. Para integração: perfil isolado, ambiente/versões/corpus, resultado observado e limites registrados. Ensaios macOS ou input sintético não comprovam Windows/TV/controle físico. Comandos só serão registrados como executados quando rodarem na story autorizada.

## Riscos e decisões pendentes

Transação DB/filesystem, duas sincronizações simultâneas, source removida durante playback, override órfão.

D06/D08/D15: máquina de estados, limites e concorrência em S03; rollback explícito validado não equivale a downgrade remoto silencioso. Demais números de exemplo permanecem propostas; fechar antes da integração correspondente. Não bloqueiam preparação. Reconsultar as fontes e registrar decisão em S00/UX ou S03 conforme a responsabilidade.

## Fora de escopo

Executar código/stories durante PREPARE; construir dependências reais durante S00–S02; ampliar escopo para M23–M28; aprovar checkpoints; publicar/merge/deploy sem autorização; criar contratos definitivos de capacidades futuras.

## Definition of Done

Update e crash em cada fase preservam uma versão válida; progresso/favoritos/overrides/downloads sobrevivem update/unsubscribe/delete remoto; downgrade e mesma versão com outro hash bloqueiam; contexto/foco/playback preservados; snapshot abre sem Registry. Aplicam-se também os critérios comuns acima.

S00–S07 concluídas com evidências reais, ambos os checkpoints aprovados explicitamente, dependências integradas, requisitos de [cobertura](PREPARATION_COVERAGE.md) comprovados e S08 Closure auditada. Garantias transversais revalidadas nos consumidores e em M22. PREPARED não equivale a DONE, UX aprovada não encerra integração e hardware pendente não vira teste aprovado.

## Estado da fase frontend M01–M22

S00–S02 implementadas no checkout real com mocks. UX READY_FOR_REVIEW; decisão PENDING. Revisão adiada por instrução explícita para o fim da fase frontend. S03–S08 DEFERRED; não DONE. [Roteiro único](../../execution/FRONTEND_REVIEW.md), [auditoria](../../execution/FRONTEND_COVERAGE_AUDIT.md) e [regressão final](../../execution/evidence/FINAL_VALIDATION.md). Planos futuros neste README continuam sujeitos à integração e autorização.
