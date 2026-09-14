# M05 — Assistir mídia local e retomar

Status: READY_FOR_REVIEW/PENDING — UX aprovada e S03–S05 concluídas. S06–S08,
aceite funcional e validação física continuam pendentes; M05 não está DONE.
[Contrato](evidence/DOMAIN_CONTRACT.md) e [experiência](EXPERIENCE.md).

## Objetivo

Provar a jornada de reprodução sem depender de swarm.

## Resultado para o usuário

Arquivo já disponível toca no MPV, aceita controles e retoma da posição salva.

## Escopo e fontes

Details → preparar → player → details; play/pause/seek, áudio, legendas internas/externas, volume/mute, fullscreen, hardware decode, progresso, assistido, histórico e retomada offline.

[Plano aprovado](../PLAN.md#m05), [cobertura individual de requisitos e jornadas](PREPARATION_COVERAGE.md), [PRD](../../product/01-prd-master.md), [jornadas](../../product/02-user-journeys.md), [decisões pendentes](../SOURCE_ANALYSIS.md). Ler os FR/NFR e recortes A01–A11 apontados na cobertura, mantendo condicionais e exemplos como tais.

## Dependências

Integração/closure: M02. A UI usa o shell de M01 e boundaries mockados dos fluxos consumidores, sem exigir runtimes reais. Ordem frontend M01→M22; ordem de integração das ondas B–D do plano, com M06 antes da integração M03. Contratos definitivos e adapters só após UX M01–M22 aprovada e autorização de execução. Preparar antecipadamente não aprova essas dependências.

## Jornada principal

Detalhes → Play → preparar → primeiro frame → controles/tracks → sair → retomar ou recomeçar.

## Rotas e superfícies propostas

/player/:contentId; overlay de áudio/legendas; detalhes e Continuar. S00 verifica compatibilidade com navegação existente; nomes de rotas são propostas, não código entregue.

## Estados obrigatórios

sem arquivo; preparando; tocando; pausado; seeking; encerrando; arquivo removido; codec não suportado; MPV falhou; sem legendas. Incluir loading, vazio, erro recuperável/retry, sucesso e offline/degradado conforme operação; não representar operação dependente de rede como disponível offline. Cancelar/voltar preserva contexto e dados confirmados; modais prendem foco e o devolvem ao gatilho. S00 registra entrada/saída e recuperação de cada estado; S02 prova todas as transições com fixtures em memória.

## Contrato previsto, sujeito à UX

PlayerService: abrir(contentId, sourceId, posição), pausar, buscar, selecionar track, encerrar; snapshot com sessionId, posição, duração e tracks; eventos de readiness/primeiro frame distintos do processo iniciado. S03 fixa DTOs, erros tipados, idempotência, cancelamento e limites apenas para ações aprovadas. Persistência e eventos reais nunca são presumidos pela simulação. Mocks ficam atrás de boundary substituível e usam conteúdo próprio/autorizado ou sintético.

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

Reproduzir fixture local autorizada offline, trocar áudio/legenda sem reiniciar source, sair/reabrir e verificar posição; matar MPV e comprovar UI viva e progresso dentro do budget definido.

Para a UI: fixtures determinísticas dos estados acima, teclado/gamepad, foco e retorno, desktop/TV em 1080p/1440p/4K. Para integração: perfil isolado, ambiente/versões/corpus, resultado observado e limites registrados. Ensaios macOS ou input sintético não comprovam Windows/TV/controle físico. Comandos só serão registrados como executados quando rodarem na story autorizada.

## Riscos e decisões pendentes

Composição do overlay React com janela MPV; diferença de codecs/hardware; sinal confiável de primeiro frame; threshold assistido indefinido.

D10/D11/D18/D21: budget de progresso, assistido, composição de janelas e allowlist de legenda em S03. Demais números de exemplo permanecem propostas; fechar antes da integração correspondente. Não bloqueiam preparação. Reconsultar as fontes e registrar decisão em S00/UX ou S03 conforme a responsabilidade.

## Fora de escopo

Executar código/stories durante PREPARE; construir dependências reais durante S00–S02; ampliar escopo para M23–M28; aprovar checkpoints; publicar/merge/deploy sem autorização; criar contratos definitivos de capacidades futuras.

## Definition of Done

MPV separado toca mídia controlada; tracks mudam sem reiniciar source; sair salva imediatamente; crash do MPV preserva UI; progresso periódico tem budget explícito; primeira imagem é observada, não inferida do lançamento do processo. Aplicam-se também os critérios comuns acima.

S00–S07 concluídas com evidências reais, ambos os checkpoints aprovados explicitamente, dependências integradas, requisitos de [cobertura](PREPARATION_COVERAGE.md) comprovados e S08 Closure auditada. Garantias transversais revalidadas nos consumidores e em M22. PREPARED não equivale a DONE, UX aprovada não encerra integração e hardware pendente não vira teste aprovado.

## Estado da fase frontend M01–M22

No encerramento da fase frontend, S00–S02 estavam implementadas com mocks e
S03–S08 adiadas. A aprovação UX consolidada e a autorização posterior
permitiram executar S03–S05; o estado atual está na seção seguinte. S06–S08
continuam pendentes e M05 não está DONE. [Roteiro único](../../execution/FRONTEND_REVIEW.md),
[auditoria](../../execution/FRONTEND_COVERAGE_AUDIT.md) e
[regressão final](../../execution/evidence/FINAL_VALIDATION.md).

## Estado da integração S03–S05

Contrato v1, processo MPV isolado, persistência SQLite, tracks/legenda externa,
coordenador, preload/IPC e renderer desktop estão integrados. O smoke Electron
real passou de Details ao restart com progresso preservado; regressão integral
**222 passed, 6 skipped, 0 failed**. [Evidência](evidence/INTEGRATION_VALIDATION.md)
e [checkpoint](FUNCTIONAL_CHECKPOINT.md). O checkpoint funcional aguarda
decisão humana; S06 não foi iniciado.
