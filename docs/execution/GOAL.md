# Política vigente — fase frontend M01–M22

Autorização explícita do usuário em 2026-09-13: executar S00–S02 de M01–M22, uma story por vez, no checkout real, preservando alterações e evidências existentes. Ao validar cada frontend, avançar automaticamente ao próximo. Revisões UX intermediárias pendentes são adiadas, por instrução do usuário, para uma revisão única ao final: READY_FOR_REVIEW / decisão PENDING; atravessar checkpoint não é aprová-lo. Aceites M01–M03 preservados. Divergências históricas não autorizam fabricar aprovação.

Somente mocks em memória atrás de boundaries substituíveis. Entregar jornadas conectadas com ações, validações, foco, loading, vazio, erro, retry, cancelamento e offline/degradado aplicáveis. Registrar pressupostos não bloqueantes. Validar proporcionalmente, corrigir antes de avançar e distinguir automação, inspeção visual e hardware físico.

S03–S08, backend, persistência definitiva, providers, MPV, torrentd, Registry e integrações reais permanecem adiados. Simulações devem ser identificadas. Não marcar milestones DONE, não aprovar em nome do usuário, não executar M23–M28, merge, deploy ou publicação.

Ajuste autorizado em 2026-09-13: “Vamos fazer uma chamada com imdb e preencher um mock com filmes reais por padrao”. A autorização cobre consultas pontuais aos datasets não comerciais oficiais `title.basics` e `title.ratings`, a atualização do seed estático de M02/M04 e a apresentação visível desses dados. Não autoriza provider IMDb em runtime, credenciais no renderer, backend, persistência ou avanço de S03–S08.

Correção explícita do mesmo ajuste em 2026-09-13: “Precisa estar com as imagens do imdb a capa e etc”. A autorização inclui materializar no mock cópias locais do pôster principal e de uma imagem horizontal exibidos na página pública de cada título no IMDb. Os assets devem continuar offline/substituíveis, com origem registrada e sem inferir licença comercial, hotlink, provider ou integração de produção.

Ajuste estrutural autorizado em 2026-09-13: organizar o renderer em pastas por responsabilidade, manter CSS junto da família de componentes, mover componentes visuais reutilizáveis para `packages/ui`, limitar o botão compartilhado a `primary` e `secondary`, padronizar filtros em uma única toolbar e reutilizar o mesmo card para Filmes/Séries nas orientações vertical e horizontal. A mudança deve preservar navegação, foco, mocks, boundaries e checkpoints já registrados.

Conclusão do goal exige cobertura auditada dos 22 frontends contra jornadas/requisitos, fluxos conectados percorridos e corrigidos, README/UPDATE/checkpoints/STATE sincronizados e roteiro único de revisão com acesso, cenários, evidências, limites e hardware pendente. Concluir apenas quando tudo estiver pronto para revisão final, então aguardar aprovação humana. Parar antes somente por decisão indispensável ou impedimento real.

## Resultado da execução frontend

S00–S02 de M01–M22 implementadas e validadas no checkout real. Auditoria dos 445 requisitos/80 jornadas, fluxos conectados e roteiro final concluídos. Após os ajustes de revisão, incluindo renderer organizado por responsabilidade, design system com dois botões, toolbar única e card compartilhado nas orientações vertical/horizontal, marca não interativa, paleta e scroll vertical azul, retorno do scroll ao topo ao alcançar o primeiro botão, seeds IMDb de Filmes/Séries, Torrent Health, navegação espacial por controle, imagem/GIF de episódios em memória, player limpo, uma única página canônica de Filme compartilhada por M02/M04, Recomendados no mesmo `DiscoveryRail`/`DiscoveryCard` da Home, alinhamento vertical das colunas e remoção da faixa de fatos duplicados antes das recomendações, a regressão final anterior tem **141 testes aprovados**. O ajuste visual posterior passou em lint, typecheck, build, três testes direcionados e verificações geométricas em 1920/2560/3840/480; permanece o aviso conhecido de chunk acima de 500 kB. [Evidência](evidence/FINAL_VALIDATION.md), [refatoração](evidence/RENDERER_REFACTOR.md), [auditoria](FRONTEND_COVERAGE_AUDIT.md), [revisão final](FRONTEND_REVIEW.md).

Objetivo de implementação frontend atendido; aguardar revisão humana. M04–M22 READY_FOR_REVIEW/PENDING, M01–M03 aceites preservados. S03–S08 e integrações reais adiadas. Nenhum milestone DONE; nenhuma autorização de backend inferida do encerramento deste goal.

## Histórico preservado — substituído pela autorização acima quando divergente

# Política de execução

## Preparação documental concluída

Em 2026-09-13, o usuário autorizou PREPARE_MILESTONE de todos os pendentes M01–M22, sequencialmente, sem confirmação entre milestones. Preparar/completar S00–S08, jornadas, estados, dependências, contratos previstos, checkpoints e cobertura; auditar todos os artefatos ao final. Esta autorização prevalece sobre a convenção anterior de preparar somente o próximo milestone. Nenhuma execução de story, código, backend, aprovação humana, merge ou publicação faz parte desta tarefa. Preservar trabalho e aceites anteriores; M23–M28 não entram nesta preparação.

## Política de implementação preservada

Usuário autorizou `EXECUTE_MILESTONE M04` em 2026-09-13. Executar S00–S02, uma story por vez, até checkpoint UX humano. Backend, persistência e integração real continuam adiados. Publicação/merge externo não autorizado.

Uma story por vez; registrar evidência real em STATE/UPDATE; nenhuma aprovação UX/funcional implícita. Não marcar milestone DONE antes de S08. Mocks em memória, shell seguro e testes proporcionais. Seguir AGENTS e plano aprovado.

Diretriz do usuário: “o backend pode continuar pendente até o fim”. Concluir a fase frontend de M01–M22 com mocks e checkpoints UX antes de iniciar backend, persistência ou integrações reais. Pendências dessas camadas não bloqueiam o avanço do frontend após o respectivo aceite UX; continuam registradas para a fase de integração e o fechamento funcional. Esta diretriz não amplia o escopo futuro M23–M28.

Checkpoints UX de M01, M02 e M03 aprovados explicitamente pelo usuário. Essas aprovações não encerram os milestones nem substituem as verificações físicas pendentes.

M03 concluiu S00–S02 e recebeu aceite UX em 2026-09-13: “aprovado”, após correção do ícone de Séries no menu. S03–S08 permanecem adiadas pela fase frontend M01–M22.

M04 autorizado para S00–S02 até checkpoint UX humano. S00 define EXPERIENCE.md; execução segue uma story por vez. Nenhuma aprovação implícita de M03/M04.

`PREPARE_MILESTONE M05` concluído documentalmente em 2026-09-13. M05 está PREPARED, sem stories executadas; S00–S02 preparadas, S03–S08 adiadas. Preparar M05 não autoriza sua implementação, não aprova checkpoints e preserva a execução ativa de M04. Sua execução começará por S00 mediante `EXECUTE_MILESTONE M05`.

## Posição atual de execução

M04 concluiu S00–S02 e chegou a READY_FOR_REVIEW em 2026-09-13, com evidências de frontend e Electron macOS. Aguarda revisão UX humana. A citação “aprovado” presente no STATE durante trabalho simultâneo foi reconciliada com o checkpoint M03, ao qual pertence; não é aceite de M04. Preparação M01–M22 preservada; backend/S03–S08 continuam adiados.
