# Retomada — 2026-09-12

Checkout real: `/Users/douglasprado/www/ushark`; base `09a728c`.

S00 já continha EXPERIENCE.md; S01/S02 já tinham código e testes, mas STATE/UPDATE estavam divergentes. Nesta retomada foram corrigidos:

- Compatibilidade do ESLint: `typescript` aponta para `@typescript/typescript6@6.0.2`, enquanto `@typescript/native` mantém o compilador 7.0.2. Segue a [orientação oficial](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6-0).
- Tipagem do import CSS via `vite/client`.
- Escape consumido pelo modal não volta também a etapa do onboarding. Teste existente reproduziu a falha e passou após a correção.
- Artefatos temporários do Playwright ignorados pelo Git.

## Evidências

macOS, Node 26.8.1, pnpm 11.17.0. `pnpm format:check`, `pnpm lint`, `pnpm typecheck` e `pnpm build`: passaram. `pnpm test`: 9/9 passaram em 7,9 s, fora do sandbox porque o Chromium era bloqueado por MachPort/Permission denied.

Cobertura: percurso completo, validação de cache, rascunho, falha/retry, reset seletivo, foco preso/restaurado no modal, pasta inacessível, salvamento lento, controle virtual e ausência de overflow horizontal na tela inicial em 1080p/1440p/4K. Screenshots welcome-1920.png, welcome-2560.png e welcome-3840.png; imagem 1920 inspecionada nesta sessão.

Smoke temporário `/private/tmp/ushark-resume-smoke.cjs`: Electron compilado abriu em janela, concluiu onboarding com contexto offline e confirmou `sandbox=true`, `contextIsolation=true`, `nodeIntegration=false`.

## Limites e pendências

O teste de `--tv` recebeu o argumento, mas `isFullScreen()` continuou false após 5 s no macOS. Tentativa de ativar após ready-to-show também não resolveu e foi revertida. Fullscreen não validado; requer diagnóstico na sessão gráfica e verificação Windows/TV. Não é evidência de sucesso do modo TV.

Gamepad físico, legibilidade à distância em TV e latência <100 ms não medidos. Testes de viewport não certificam essas condições. `pnpm dev` não foi inspecionado manualmente; smoke usou build Electron. Revisão UX humana pendente; S01/S02 implementadas com ressalva de validação desktop/TV, sem aceite completo. M01 permanece em andamento. S03+ não autorizadas pelo checkpoint atual.

## Continuação — fullscreen corrigido

O modo TV agora chama `setSimpleFullScreen(true)` no macOS após `ready-to-show`; Windows/Linux mantêm fullscreen nativo. A API simples ocupa a tela no desktop atual, sem depender da transição de Spaces. Referência: [Electron BrowserWindow](https://www.electronjs.org/docs/latest/api/browser-window#winsetsimplefullscreenflag-macos).

Teste permanente em `tests/desktop.electron.spec.ts` confirma janela normal e modo TV, dimensões da janela iguais às do display em TV, isolamento, onboarding offline e retorno de configurações com Escape. No ambiente local, modo TV ocupou 1920×1080. `pnpm test` agora gera o build antes de iniciar os testes Electron; `quality` evita duplicar esse build.

Validação final: lint, typecheck, build e 11/11 testes aprovados (8,0 s). A pendência macOS acima foi resolvida nesta continuação. Windows/TV física, gamepad físico e avaliação visual humana continuam pendentes; não há aprovação UX implícita.

## Ajuste posterior — navegação espacial fluida

Em 2026-09-13, `navigation.ts` passou a unificar controle remoto, D-pad e analógico com cálculo espacial por lane, grupos horizontais, vizinhos explícitos opcionais, scroll curto com suporte a reduced motion e repetição controlada. Confirmar/voltar não repetem ao segurar; modal continua sendo o scope ativo e restaura a origem ao fechar. Dois novos testes percorrem linhas e seções da Home, seguram o analógico, abrem/fecham detalhe e verificam retorno ao mesmo card. [Captura com foco por gamepad](fluid-navigation-home-1920.png) inspecionada. Build e regressão completa **127/127 em 2,1 min** passaram. Hardware físico permanece fora desta evidência.
