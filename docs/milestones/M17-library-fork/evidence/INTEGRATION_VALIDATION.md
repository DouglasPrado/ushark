# M17 S04–S05 — integração

O fork real é transacional/idempotente em SQLite, persiste draft e catálogo
externo referenciado, e pode ser reaberto/salvo pelo editor M12. O ensaio 1/1
com a regressão M12 3/3 preservou origem, criou identidade/IDs novos e confirmou
independência. GC efetivo só removerá assets quando o ref-count chegar a zero.
