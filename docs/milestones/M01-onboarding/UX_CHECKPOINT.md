# Checkpoint UX — M01

Status: APPROVED. Aprovação explícita do usuário em 2026-09-12: “a ux esta aprovado”. Escopo: experiência frontend mockada de M01. Prévia implementada e testes automatizados aprovados. Fullscreen macOS validado; Windows/TV e controle físico ainda pendentes; ver [evidências](evidence/RESUME.md).

Depois de S02: Percorrer onboarding e configurações por controle/teclado; revisar defaults, caminhos, loading/erro/offline, validação, retorno/restauração do foco e reset seletivo. Verificar TV/fullscreen/legibilidade e confirmar quais testes de hardware foram efetivamente feitos.

Registrar demonstração, ambiente, evidências, feedback e aprovação explícita. A aprovação do mapa não aprova este checkpoint.

Para revisar: `pnpm dev` (desktop) ou `pnpm dev:web` (navegador). A prévia usa somente dados em memória. Modo TV: `pnpm dev --tv`. Fullscreen macOS comprovado por teste Electron; revisar visualmente e registrar feedback. Windows/TV física permanecem pendentes.

A aprovação libera a sequência frontend; não comprova testes em hardware físico nem fecha M01. Backend, persistência e integrações reais continuam adiados até o fim da fase frontend M01–M22. Próximo passo: preparar M02.

Ajuste visual posterior solicitado pelo usuário: identidade Ushark e paleta azul (#87bbef). Aplicado globalmente, com capturas atualizadas em evidence/welcome-*.png; fluxos e aprovação UX preservados.
