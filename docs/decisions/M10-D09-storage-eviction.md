# M10 D09 — eviction, leases e volumes

Data: 2026-09-14. Status: aceita para S03–S05.

Ordem v1 de eviction: stream-only concluído e não usado; cache concluído antigo;
cache não assistido antigo; parcial somente quando `retainPartial=false`.
Favorito é protegido quando `retainFavorites=true`. Keep, playback/download
ativo, lease e referência protegida nunca são elegíveis.

Não existe default de 100 GB. O limite inicial preserva os 40 GB aprovados na
UX e é confrontado com capacidade/espaço livre retornados pelo filesystem real.
Estimativa e bytes efetivamente liberados são campos distintos; aplicar sempre
revalida revision, leases, referências, path e identidade do arquivo.

Promoção/demissão entre volumes usa copy para temporário + fsync + rename; o
original só é removido após commit do destino. Falha preserva original. Todo
path precisa permanecer em roots gerenciadas, sem symlink. Cache corrompido é
descartável isoladamente; catálogo, metadata, progresso e preferências não são.
