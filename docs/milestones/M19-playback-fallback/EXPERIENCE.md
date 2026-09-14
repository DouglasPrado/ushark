# Experiência frontend M19

Player → Recuperar fonte → simular degradação/sem peers → avaliar alternativas e histórico agregado → preparar candidata compatível → trocar mantendo posição confirmada e pausa/play. Opção auto-switch herda M01, pode ser alterada no painel. Com auto off nenhuma troca acontece sem botão; com auto on somente candidata compatível passa por preparo. Não promete troca imperceptível.

Compatibilidade de conteúdo/episódio/duração/edição precisa ser conhecida. Fontes reais do catálogo mock sem esses dados são apresentadas como não verificadas; fixture de comparação oferece uma compatível e outra edição bloqueada. Sem alternativa/offline/preparo falho mantém fonte atual, permite retry. Cancelar ou seek concorrente invalida preparo; próximo retry usa posição atual. Cooldown e blacklist temporários impedem ping-pong. Override M08 é preservado; fallback altera só sessão atual.

Histórico demonstrativo em memória agrega sucesso/falha, throughput/startup/buffering e idade por source com versão de algoritmo. Decay/expiração reduzem influência e podem ser simulados. Ranking equilibrado M08 usa penalidade histórica como sinal sem substituir elegibilidade atual. TTL/cooldown/números e tolerâncias são propostas visuais; S03–S08 fixam semântica e runtime. FR112–115/204/NFR039/RX045 representados nesses estados, sem peers/processos/servidor reais.
