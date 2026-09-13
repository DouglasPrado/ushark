# Atualização — M01

Barra superior removida a pedido do usuário. Conteúdo ocupa o espaço liberado; acesso às preferências na Home e botão Voltar nas configurações preservados.

Ajuste solicitado: removidos os textos LOCAL FIRST e PRÉVIA · DADOS SIMULADOS do cabeçalho, junto com seus estilos exclusivos.

Diretriz visual atual: removido o ícone de tubarão do cabeçalho e favicon a pedido do usuário; marca representada apenas pelo nome Ushark.

Refinamento da logo conforme referência visual do usuário: mascote de tubarão azul/branco com boca aberta e traços angulares. Asset atual `apps/desktop/public/ushark-mascot.png`, fundo escuro, aplicado no cabeçalho e favicon. SVG simples anterior preservado como alternativa; a marca ativa usa PNG.

Logo atualizada por solicitação do usuário: tubarão flat azul em SVG local (`apps/desktop/public/ushark-logo.svg`), aplicado ao cabeçalho e favicon. Lint, typecheck, build e 3 testes de layout aprovados; captura 1080p inspecionada.

Ajuste global solicitado: nome Ushark na interface, pacotes e documentação; paleta verde convertida para azul mantendo luminosidade e saturação, com destaque #87bbef. Lint, typecheck e build passaram; 3 testes de layout passaram em 1080p/1440p/4K. Capturas atualizadas e tela 1080p inspecionada visualmente. Aprovação UX anterior preservada; sem alteração de backend.

UX aprovada em 2026-09-12: “a ux esta aprovado”. Próxima ação: preparar M02 frontend. Backend permanece adiado até o fim da fase frontend M01–M22; validações físicas continuam pendentes e M01 não está DONE.

Retomada em 2026-09-12 no checkout real. S00–S02 já tinham implementação; corrigidos ESLint/TypeScript, declaração CSS e Escape que fechava modal e voltava etapa ao mesmo tempo.

Format/lint/typecheck/build passaram; 11 testes passaram, incluindo dois testes permanentes de Electron. Electron em janela concluiu onboarding offline com renderer isolado. Fullscreen `--tv` corrigido e validado em 1920×1080 no macOS com fullscreen simples após ready-to-show; gamepad físico e Windows/TV pendentes. S01/S02 não têm aceite completo.

Posição: frontend M01/S02 com UX aprovada; verificação de Windows/TV e controle físico pendente. UX aprovada pelo usuário; S03+ aguardam os checkpoints do plano. Nenhum backend real ou persistência foi acrescentado; M01 não está DONE.

Evidências: [retomada](evidence/RESUME.md).
