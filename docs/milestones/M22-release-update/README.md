# M22 — Instalar e atualizar uma versão verificável

Status: FRONTEND_IMPLEMENTED / READY_FOR_REVIEW. S00–S02 concluídas; UX PENDING adiada por instrução explícita até o fim de M01–M22. S03–S08 DEFERRED; não DONE.

## Objetivo

Entregar o produto completo com instalação e atualização preservando dados.

## Resultado para o usuário

Candidato Windows x64 inspecionável, assinado e rastreável; promoção mantém o mesmo artefato.

## Escopo e fontes

Installer/smoke, About/canais, update com integridade, pinning nativo, SBOM/checksums/provenance quando disponível, Canary/Beta/Stable, gates completos, documentação operacional e suporte.

[Plano aprovado](../PLAN.md#m22), [cobertura individual de requisitos e jornadas](PREPARATION_COVERAGE.md), [PRD](../../product/01-prd-master.md), [jornadas](../../product/02-user-journeys.md), [decisões pendentes](../SOURCE_ANALYSIS.md). Ler os FR/NFR e recortes A01–A11 apontados na cobertura, mantendo condicionais e exemplos como tais.

## Dependências

Integração/closure: M21. A UI usa o shell de M01 e boundaries mockados dos fluxos consumidores, sem exigir runtimes reais. Ordem frontend M01→M22; ordem de integração das ondas B–D do plano, com M06 antes da integração M03. Contratos definitivos e adapters só após UX M01–M22 aprovada e autorização de execução. Preparar antecipadamente não aprova essas dependências.

## Jornada principal

Instalar → abrir → About/canal → verificar update → validar candidato → atualizar → reabrir dados → desinstalar conforme política.

## Rotas e superfícies propostas

installer e About; atualização/canal; recuperação de falha; documentação operacional. S00 verifica compatibilidade com navegação existente; nomes de rotas são propostas, não código entregue.

## Estados obrigatórios

atualizado; update disponível; baixando; assinatura inválida; incompatível; aplicando; falha; recuperação. Incluir loading, vazio, erro recuperável/retry, sucesso e offline/degradado conforme operação; não representar operação dependente de rede como disponível offline. Cancelar/voltar preserva contexto e dados confirmados; modais prendem foco e o devolvem ao gatilho. S00 registra entrada/saída e recuperação de cada estado; S02 prova todas as transições com fixtures em memória.

## Contrato previsto, sujeito à UX

AppUpdate: metadados de versão/canal separados de bytes do candidato assinado, checksum/provenance/SBOM; validar/instalar com migração recuperável; promoção conserva hash e exige gate manual Stable. S03 fixa DTOs, erros tipados, idempotência, cancelamento e limites apenas para ações aprovadas. Persistência e eventos reais nunca são presumidos pela simulação. Mocks ficam atrás de boundary substituível e usam conteúdo próprio/autorizado ou sintético.

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

Windows x64: instalação fresh e upgrade histórico empacotados; preservar biblioteca/cache index/progresso/downloads; rejeitar assinatura/hash inválido; comparar hash entre canais; auditar todos requisitos transversais.

Para a UI: fixtures determinísticas dos estados acima, teclado/gamepad, foco e retorno, desktop/TV em 1080p/1440p/4K. Para integração: perfil isolado, ambiente/versões/corpus, resultado observado e limites registrados. Ensaios macOS ou input sintético não comprovam Windows/TV/controle físico. Comandos só serão registrados como executados quando rodarem na story autorizada.

## Riscos e decisões pendentes

Code signing e permissões externas; assinatura alterar hash após validação; semver/canal conflitando com artefato único; hardware baseline não definido.

D17/D18: versão/canal, hardware e code signing em S03; instalação/publicação/Stable não autorizadas pela preparação. Demais números de exemplo permanecem propostas; fechar antes da integração correspondente. Não bloqueiam preparação. Reconsultar as fontes e registrar decisão em S00/UX ou S03 conforme a responsabilidade.

## Fora de escopo

Executar código/stories durante PREPARE; construir dependências reais durante S00–S02; ampliar escopo para M23–M28; aprovar checkpoints; publicar/merge/deploy sem autorização; criar contratos definitivos de capacidades futuras.

## Definition of Done

Instalar/abrir/atualizar/desinstalar conforme política preserva dados prometidos; upgrade histórico e smoke empacotado passam; budgets/segurança/nightly aplicáveis verdes; mesma identidade/hash do artefato promovido; Stable requer aprovação manual. Aplicam-se também os critérios comuns acima.

S00–S07 concluídas com evidências reais, ambos os checkpoints aprovados explicitamente, dependências integradas, requisitos de [cobertura](PREPARATION_COVERAGE.md) comprovados e S08 Closure auditada. Garantias transversais revalidadas nos consumidores e em M22. PREPARED não equivale a DONE, UX aprovada não encerra integração e hardware pendente não vira teste aprovado.

## Estado da fase frontend M01–M22

S00–S02 implementadas no checkout real com mocks. UX READY_FOR_REVIEW; decisão PENDING. Revisão adiada por instrução explícita para o fim da fase frontend. S03–S08 DEFERRED; não DONE. [Roteiro único](../../execution/FRONTEND_REVIEW.md), [auditoria](../../execution/FRONTEND_COVERAGE_AUDIT.md) e [regressão final](../../execution/evidence/FINAL_VALIDATION.md). Planos futuros neste README continuam sujeitos à integração e autorização.
