# Evidência S03 — contrato de domínio M06

Data: 2026-09-14.

## Entregue

- `packages/types/src/torrent.ts`: protocolo/schema v1, limites mensuráveis,
  entradas opacas, snapshots/eventos, cancelamento, pendência/retry, erros e
  identidades separadas para operação/runtime/source/relação/selector.
- `docs/decisions/M06-D05-D08-D22-torrent-inspection-contract.md`: decisões D05,
  D08 e D22 fechadas antes da entrada real.
- Compatibilidade mantida com `TorrentPreview`, usado somente pela experiência
  mockada já aprovada.

## Invariantes verificáveis

- runtime deduplicado por infoHash sem fundir conteúdos/selectors;
- paths locais e bytes `.torrent` não atravessam o preload;
- operação longa retorna handle, emite evento versionado, aceita cancelamento e
  possui snapshot para reidratação;
- limites têm unidade explícita e erro tipado;
- contenção exige componentes válidos, cópia gerenciada e `realpath`/`relative`.

## Validação

`pnpm typecheck` deve passar após a mudança. Provas executáveis de parser,
staging, isolamento, persistência e jornada pertencem a S04/S05 e não são
inferidas desta revisão contratual.
