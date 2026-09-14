# Checkpoint UX — M01

Status: APPROVED. Aprovação explícita do usuário em 2026-09-12: “a ux esta aprovado”, reafirmada para o frontend consolidado em 2026-09-14: “O frontend foi aprovado ja”. Escopo: experiência frontend mockada de M01 e ajustes visuais posteriores. Fullscreen macOS validado; Windows/TV e controle físico ainda pendentes; ver [evidências](evidence/RESUME.md).

Depois de S02: Percorrer onboarding e configurações por controle/teclado; revisar defaults, caminhos, loading/erro/offline, validação, retorno/restauração do foco e reset seletivo. Verificar TV/fullscreen/legibilidade e confirmar quais testes de hardware foram efetivamente feitos.

Registrar demonstração, ambiente, evidências, feedback e aprovação explícita. A aprovação do mapa não aprova este checkpoint.

Para revisar: `pnpm dev` (desktop) ou `pnpm dev:web` (navegador). A prévia usa somente dados em memória. Modo TV: `pnpm dev --tv`. Fullscreen macOS comprovado por teste Electron; revisar visualmente e registrar feedback. Windows/TV física permanecem pendentes.

A aprovação libera a sequência frontend; não comprova testes em hardware físico nem fecha M01. Backend, persistência e integrações reais continuam adiados até o fim da fase frontend M01–M22. Próximo passo: preparar M02.

Ajuste visual posterior solicitado pelo usuário: identidade Ushark e paleta azul (#87bbef). Aplicado globalmente, com capturas atualizadas em evidence/welcome-*.png; fluxos e aprovação UX preservados.

Ajuste posterior solicitado em 2026-09-13: scroll vertical na cor azul padrão. Aplicado globalmente com thumb `#87bbef`, trilho escuro e hover azul-claro; os trilhos horizontais intencionalmente ocultos permanecem assim. Teste dedicado, layouts e regressão 138/138 passaram. O aceite histórico acima foi preservado, sem aprovação automática desta alteração.

Ajuste posterior solicitado em 2026-09-13: quando a navegação direcional alcança o primeiro botão visível e habilitado da superfície, o scroll vertical volta ao topo. Teste direcionado 3/3 e regressão completa sem traces 139/139 passaram. O aceite histórico acima foi preservado, sem aprovação automática desta alteração; Windows/TV/controle físicos continuam pendentes.
