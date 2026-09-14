# M09 — Validação frontend — 2026-09-13

Downloads/DownloadPreview/MockDownloadPreview conectados à escolha de sources e navegação Home/Filmes/Séries. Fila em memória atualizada mesmo fora da tela; conclusão torna source local para seleção M08. Sem backend/rede/disco.

Typecheck e ESLint passaram. Playwright downloads.behavior: 2 passaram (7s) após tornar explícito o nome acessível do seletor Destino; caso adicional offline/resume/falha/layout: 1 passou (2.7s). Casos principais: destino inválido, fila/progresso, pausar/retomar/restart simulado, cancelar mantém catálogo, apagar confirma separadamente, limites inválidos/correção, falta de espaço/retry e detalhe→player→detalhe. Cancelar após completo desabilitado; concluído preserva disponibilidade local simulada.

Captura downloads.png inspecionada diretamente; fila, limites, estados e ações legíveis. queue-1080/1440/2160.png geradas com checks de overflow horizontal. Hardware físico/Windows/TV não testado. Dados e métricas ilustrativos; reinício simulado não comprova persistência após reload/processo real. Health/engine/resume real S03–S08 adiados. UX READY_FOR_REVIEW/PENDING, revisão humana adiada por instrução explícita.
