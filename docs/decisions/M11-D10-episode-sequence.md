# M11-D10 — sequência de episódios

Decisão em 2026-09-14 para S03:

- countdown padrão: 5 segundos, sempre cancelável até o claim de início;
- o encadeamento só é oferecido após término efetivo do episódio atual;
- episódios numerados seguem ordem estrita por temporada; lacunas não são
  puladas automaticamente;
- temporada seguinte começa apenas em `E1`; especiais (`S0`) não encadeiam;
- uma única preparação do próximo pode estar ativa; ela mede/seleciona uma
  source com o budget de M08 e não inicia um segundo stream;
- `sessionId`, geração e idempotência impedem início duplicado.
