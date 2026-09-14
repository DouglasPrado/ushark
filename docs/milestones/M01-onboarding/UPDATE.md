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

## Preparação documental — 2026-09-13

PREPARED: S00–S08 e ambos os roteiros de checkpoint conferidos; [cobertura por requisito](PREPARATION_COVERAGE.md) adicionada. Nenhuma story executada nesta preparação. Evidências e aceites anteriores preservados; backend/S03–S08 permanecem adiados até UX M01–M22.

## Auditoria transversal da fase frontend

Jornadas conectadas e correções finais registradas em [auditoria](../../execution/FRONTEND_COVERAGE_AUDIT.md) e [validação final](../../execution/evidence/FINAL_VALIDATION.md). Esta atualização não muda aceites humanos existentes. S03–S08 continuam adiadas.

## Ajuste da revisão final — onboarding não recorrente

Solicitação do usuário aplicada: após uma conclusão bem-sucedida, um marcador local versionado faz recarregamentos e novas aberturas iniciarem diretamente na Home. Configuração, catálogos e demais fixtures permanecem em memória; isso não antecipa a persistência definitiva de S03–S05. Testes cobrem primeira execução e ausência do onboarding após reload no navegador e no Electron, com perfis Electron isolados entre casos.

## Ajuste da revisão final — navegação fluida por controle

O núcleo compartilhado de navegação foi refeito conforme A09: seleção espacial determinística prioriza linha/coluna, telas podem declarar vizinhos por `data-nav-*`, trilhos horizontais limitam esquerda/direita ao próprio grupo e centralizam suavemente o card focado. D-pad e analógico repetem após 260 ms e depois a cada 90 ms; A/B e OK/Voltar exigem soltura ou ignoram `keydown.repeat`, evitando confirmação dupla.

Controle remoto aceita setas, Enter/Space/Accept/Select, Escape/Backspace/BrowserBack e os códigos legados de retorno 461/10009. Select e slider usam esquerda/direita; cima/baixo deixam o controle. O input mais recente atualiza hints e mantém foco inequívoco; em modo TV, cursor é ocultado depois de input por controle. [Print 1920×1080](evidence/fluid-navigation-home-1920.png). Regressão completa **127/127** passou; Windows/TV/Moonlight e controles físicos continuam pendentes.

## Ajuste global — scroll vertical azul

O renderer passou a usar o accent Ushark `#87bbef` no thumb de todo scroll vertical, com trilho escuro, formato arredondado e hover azul-claro. A regra cobre página e painéis internos no Chromium/Electron, sem reexibir os trilhos horizontais ocultos da Home/player. O teste dedicado e os layouts M01–M04 passaram 19/19; a regressão completa passou 138/138. A aprovação histórica de M01 permanece preservada e não é ampliada automaticamente por este ajuste posterior.

## Ajuste global — primeiro botão retorna ao topo

Ao navegar por direcional para o primeiro botão habilitado e visível da tela, o motor compartilhado agora mantém o foco nesse botão e leva o scroll vertical ao topo. A mesma regra atua no scope do diálogo quando ele é a superfície ativa; os demais focos continuam usando scroll por proximidade. A suíte direcionada passou 3/3 e a regressão sem traces passou 139/139. O aceite histórico e as pendências de Windows/TV/controle físicos permanecem inalterados.
