# M13 — decisões do pacote `.tslib` v1

Decisão em 2026-09-14:

- `.tslib` v1 é JSON UTF-8 canônico declarativo, não archive;
- schema `1.0`; minor desconhecido pode ser lido com warning, major diferente é
  incompatível;
- limite 2 MiB, profundidade 24, 5.000 conteúdos e 256 referências de asset;
- SHA-256 cobre o payload canônico sem o campo `integrity`;
- somente referências `https:`, `ipfs:` ou `/movie-art/<nome seguro>`; traversal,
  paths absolutos externos, HTML, CSS, scripts e protocolos diferentes são
  rejeitados;
- mídia, paths locais e estado pessoal nunca entram no pacote;
- assinatura presente é bloqueada até o verificador M14;
- import é stage + commit transacional por `libraryId@version`; mesma chave com
  hash divergente é conflito e não altera o catálogo.
