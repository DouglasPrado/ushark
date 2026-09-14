# Experiência frontend M15

Bibliotecas → Publicações simuladas → entrar como editor simulado → escolher rascunho salvo → revisar diff, identidade/layout/conteúdos → confirmar publicação simulada → staging/progresso cancelável → link .invalid/código DEMO → copiar ou selecionar texto. Nenhuma rede, credencial ou Registry real. Autenticação simulada separada de assinatura M14; snapshot pode continuar não assinado.

Histórico mostra versões imutáveis. Editar draft M12 não altera publicação; revisar novamente gera próxima versão. Usar versão anterior prepara novo diff baseado na versão atual; só confirmação cria nova versão. Retirada exige confirmação, bloqueia resolução remota simulada sem apagar snapshots já recebidos. Cancelar review/upload mantém versões anteriores. Link pode ser resolvido pelo mesmo boundary mock; não é URL pública utilizável.

Estados e recuperação: vazio → criar draft; não autenticado → entrar simulação; sem permissão/quota/offline/falha parcial → mostrar erro, preservar histórico, mudar fixture/retry; conflito → recarregar diff contra versão atual, nunca sobrescrever; sucesso → copiar link/código; clipboard indisponível → texto selecionável. Falha durante stage não gera versão ativa. Auth/infra/quotas definitivas D15 e RX039 S03–S08 ficam adiadas. NFR110/RX037/RX038 representados por confirmação, diff, histórico, rollback como nova versão e retirada.
