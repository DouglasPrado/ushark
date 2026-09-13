# Política de execução

Usuário autorizou EXECUTE_MILESTONE M01. Executar S00–S02 até checkpoint UX, sem backend/infra/integrações reais. S03 e seguintes aguardam UX principal aprovada conforme PLAN. Publicação/merge externo não autorizado nesta instrução.

Uma story por vez; registrar evidência real em STATE/UPDATE; nenhuma aprovação UX/funcional implícita. Não marcar milestone DONE antes de S08. Mocks em memória, shell seguro e testes proporcionais. Seguir AGENTS e plano aprovado.

Diretriz do usuário: “o backend pode continuar pendente até o fim”. Concluir a fase frontend de M01–M22 com mocks e checkpoints UX antes de iniciar backend, persistência ou integrações reais. Pendências dessas camadas não bloqueiam o avanço do frontend após o respectivo aceite UX; continuam registradas para a fase de integração e o fechamento funcional. Esta diretriz não amplia o escopo futuro M23–M28.

Checkpoint UX de M01 aprovado explicitamente pelo usuário: “a ux esta aprovado”. Próxima ação planejada: preparar M02 frontend; a aprovação não encerra M01 nem substitui as verificações físicas pendentes.
