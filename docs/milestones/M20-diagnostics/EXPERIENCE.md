# Experiência frontend M20

Configurações → Diagnóstico; acesso contextual também no player. Painel opcional reúne dados das simulações em memória e fixture detalhada. Sem sessão e desconhecido são distintos de zero medido na fixture; DB/WAL/decoder/encode reais indicam indisponível. Coletar é cancelável; erro/retry/offline preservam último snapshot.

Prévia sanitizada → inspecionar JSON → confirmar exportação simulada em memória; nada enviado/salvo no disco. Apenas campos permitidos, sem title/path/token/magnet/progresso pessoal. Logs sintéticos entram redigidos, com correlation ID demonstrativo, limite e retenção ajustáveis. Rajada simula rotação sem crescer indefinidamente.

Limpar categoria (logs, Health, histórico de reprodução, cache elegível) exige confirmação independente. Logs não apagam biblioteca/progresso; Health limpa só seu sinal; playback limpa histórico mock preservando sessão ativa; cache delega política/proteções M10. Falha parcial informa o que permaneceu, cancelamento preserva confirmado. Coleta/limpeza não inicia runtime/telemetria.

FR182–186/NFR111–114/117/RX046 representados por dados conhecidos/desconhecidos, painel, logs/preview e limpeza. Sanitização real de archive, overhead/rotação em disco e limites definitivos S03–S08 permanecem adiados. Testes usam valores sintéticos, sem segredos reais.
