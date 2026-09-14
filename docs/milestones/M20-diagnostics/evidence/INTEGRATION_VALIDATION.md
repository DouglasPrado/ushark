# M20 S04–S05 — integração

Serviço real coleta estado de runtime e tamanhos DB/WAL, guarda logs limitados,
redige campos/valores sensíveis e oferece limpeza isolada. 2/2 casos passaram:
zero/unknown + redaction e retenção/limpeza. Typecheck passou. Métricas não
disponíveis (como encode Sunshine fora de Windows) aparecem como unknown.
