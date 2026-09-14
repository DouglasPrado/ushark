# Experiência frontend M21

Configurações → Backup e recuperação → criar snapshot da sessão → listar backup consistente → alterar dados normalmente → revisar restore → confirmar substituição em memória → restauração validando/staging/aplicando → continuar para Home e retomar. Antes do swap, guardar snapshot de segurança do estado atual. Snapshot inclui configuração, filmes/séries, curadorias e catálogo retido, assinaturas/pessoal/favoritos, progresso, overrides, pins públicos demonstrativos, fila/resume e política de cache. Nenhuma mídia/chave privada real/DB/WAL é copiada.

Fixtures inválido/incompatível/DB ocupado/sem espaço/migração/falha parcial impedem swap e preservam original; offline permite operação local simulada. Cancelamento antes do commit não altera estado. Simular startup após falha mostra recuperação de UI/Core/torrentd/MPV/resume/manifest/cache com tentativas limitadas (3, proposta). Recuperar componente ou continuar com último estado válido não inicia processo real. Shutdown simulado salva snapshot e conclui dentro de prazo demonstrativo, com timeout e retry.

NFR085/147/150/152–154/160 e RX047–048 têm efeitos visíveis nessa jornada; garantia persistente após restart real, coerência SQLite/WAL, chaves/secure storage, migração, budget de perda e supervisor reais ficam S03–S08. Backup vive só nesta sessão; recarregar a aplicação o descarta. Prova automatizada cobre restore de dados conectados e falha sem troca, não crash físico.

Auditoria final: contador de IDs de curadoria não retrocede no restore, evitando colisão com identidades criadas depois do snapshot. Update/uninstall M22 verificados contra snapshot de catálogo/cache/progresso/downloads/preferências.
