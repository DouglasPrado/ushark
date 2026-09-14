# M09 — Experiência frontend

S00 concluída. Baixar em detalhes usa a source escolhida M08; selecionar destino sintético (Biblioteca/Cache) e confirmar enfileira por source+selector. Cancelar destino não enfileira. Downloads acessível da Home/Filmes/Séries, com retorno ao contexto anterior.

Fila vazia → voltar à biblioteca. Queued → downloading por limite de concorrência; progresso/bytes/velocidade/peers/health ilustrativos. Pausar guarda posição em memória; fechar/reabrir a tela preserva. Simular reinício restaura snapshot em memória com estados pausados; não alega persistência após reload real. Complete permite reprodução local simulada. Cancelar conserva item de catálogo e bytes; apagar dados exige confirmação distinta. Detalhes do item mostram conteúdo/source e acesso ao player. Prioridade e limites download/upload/torrents/downloads/probes são provisórios, validados antes de aplicar; cancelar edição conserva valores anteriores.

Sem espaço/resume inválido/falha → escrita pausada, retry explícito sem recheck global. Offline → downloads aguardam rede simulada; playback ativo reduz orçamento de fundo. Nenhum tráfego/disco real. Timers atualizam o store em memória; comandos idempotentes e dedup por source+selector; remoção não afeta catálogo.

FR-054/056/059/116–123, NFR-054/067/068 e RX-027 representados em UI. Restart/disco/engine/limites físicos e defaults definitivos permanecem S03–S08. UX PENDING adiada para revisão final por instrução explícita. Validar fila, cancelamento separado, pause/resume/restart simulado, falhas, foco e layouts.
