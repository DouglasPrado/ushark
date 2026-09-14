# M05 — Contrato da experiência frontend

S00 concluída em 2026-09-13. Entrada em Assistir nos detalhes de filme/Home. Player preserva conteúdo e retorno aos detalhes; sessão em memória compartilha posição com Continuar. Simulação explícita, sem vídeo/MPV/processos/disco. Fonte e métricas sintéticas não comprovam codecs ou hardware.

| Estado | Entrada | Saída/recuperação |
|---|---|---|
| sem arquivo | conteúdo sem fonte ou fixture | voltar ao detalhe, escolher fixture local |
| preparando | abrir/retry | primeiro frame simulado após readiness; cancelar volta sem progresso novo |
| tocando/pausado | readiness/play/pause | pausar, buscar, tracks ou sair |
| seeking | alterar posição | posição limitada à duração; última solicitação vence |
| encerrando | voltar | guardar posição em memória e restaurar detalhe/foco |
| arquivo removido/codec não suportado/MPV falhou | fixture ou falha durante sessão | erro local ao player, retry ou voltar; progresso confirmado preservado |
| sem legendas | fixture | faixa desativada ou legenda externa sintética validada |
| offline | fixture | mídia local simulada e controles continuam disponíveis |

Controles: play/pause, seek curto/longo pelo slider nativo, volume/mute, fullscreen da superfície, áudio, legenda interna/externna, estilo e atraso de legenda, sync A/V e preferência de decode. Overlay permanece em pausa, oculta após inatividade tocando, reaparece por input. Escape/B fecha tracks primeiro e depois sai sem confirmação. Dialog Radix prende/restaura foco. Cancelar configuração não aplica rascunho. Encerrar invalida timers/eventos antigos; comandos idempotentes.

Assistido: ação explícita nesta fase; limiar automático definitivo permanece D11. Progresso só vive na sessão; restart perde dados conforme escopo. Preferência de decode e métricas são ilustrativas. D10/D18/D21 e budgets físicos permanecem integração. Cobertura: FR-057–069, FR-124–126/174/209 e NFR/RX listados em PREPARATION_COVERAGE; obrigações de runtime não são satisfeitas por UI.

Verificação S01: typecheck e renderização. S02: abrir/cancelar, tocar/pausar/seek/tracks/sair/retomar, erro/retry/offline e teclado; capturas 1080p/1440p/4K. Hardware Windows/TV/gamepad real pendente. Revisão UX adiada para fim M01–M22 por instrução explícita, decisão PENDING.

Auditoria final: idiomas de áudio/legenda herdados de M01; sliders recebem esquerda/direita do gamepad sintético. Inspeção da captura 4K renovada; vídeo/hardware continuam simulados.
