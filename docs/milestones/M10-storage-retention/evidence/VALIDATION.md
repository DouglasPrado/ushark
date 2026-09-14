# M10 — Validação frontend — 2026-09-13

Storage/StoragePreview/MockStoragePreview ligados a Configurações M01 e dados de Downloads M09. Typecheck e ESLint passaram. Playwright storage.behavior: 2 casos principais passaram (10.4s); caso pressão/LRU passou (2.7s) após ajustar a expectativa de disparo automático ao aplicar política e remover mensagem de sucesso antiga durante operação.

Coberto: plano estimado→ativo durante revisão→0 GB removidos; Keep/demotion com confirmação e cancelamento; limpeza só elegíveis; limite inválido; movimento cancelado; permissão conserva original; corrupção não altera metadata/progresso; auto cleanup sob limite preserva protegidos. Capturas storage-1080/1440/2160.png e check de overflow; 1080p inspecionada diretamente na região da lista, legível e com ativo desabilitado.

Limites: dados/volumes/bytes ilustrativos, sem filesystem/medição física; playback ativo representado por fixture e downloads reais do store de prévia. Não prova corrida do SO, falha física entre volumes, SSD/NVMe ou hardware Windows/TV/controle. UX READY_FOR_REVIEW/PENDING, adiada por instrução explícita. S03–S08/integrações adiados.
