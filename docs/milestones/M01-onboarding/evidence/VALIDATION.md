# Validação frontend M01

Evidências históricas e correções em [RESUME](RESUME.md). Aceite UX humano preservado em ../UX_CHECKPOINT.md. Regressão desta fase inclui onboarding.spec.ts, desktop.electron.spec.ts e frontend-audit.behavior.spec.ts; resultado em [FINAL_VALIDATION](../../../execution/evidence/FINAL_VALIDATION.md).

Mocks em memória; renderer isolado e fullscreen macOS testados. Windows/TV/controle físicos, durabilidade e integrações adiados.

## Scroll vertical azul

`styles.css` usa o accent Ushark `#87bbef` no thumb vertical, trilho escuro `#0a1118`, largura fina e hover `#a0cfff`. O teste dedicado verifica os valores computados no navegador; onboarding e layouts de Home, Filmes e Séries passaram junto, **19/19**. Lint, typecheck e build passaram; a regressão completa fechou em **138/138 em 2,2 min**. Uma tentativa anterior do Turbo encontrou `ENOSPC`; somente caches e build regeneráveis foram removidos antes da execução verde.

## Retorno ao topo pelo primeiro botão

O motor de navegação compartilhado agora leva a página, ou o diálogo rolável ativo, para `top: 0` quando o foco direcional chega ao primeiro botão habilitado e visível. A suíte `navigation.behavior.spec.ts` passou **3/3**, incluindo Home rolada, foco de Filmes para Início e `scrollY = 0`; a regressão completa sem traces passou **139/139 em 2,4 min**. Build, typecheck, lint completo e formatação dos arquivos alterados passaram. Hardware físico permanece pendente.
