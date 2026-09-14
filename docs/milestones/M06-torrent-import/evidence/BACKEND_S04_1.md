# Evidência S04.1 — parser e staging seguro

Data: 2026-09-14. Ambiente: macOS local, Node.js do workspace.

## Implementação

- `packages/core/src/torrent-input-store.cjs`:
  - parser de magnet com BTIH hex/Base32, allowlist de parâmetros e redaction;
  - parser bencode estrito com EOF, canonicalização, budgets e hash do `info`;
  - modelo de arquivos em bytes/pieces e classificação video/sample/extra;
  - validação de path por componentes e regras portáveis para Windows;
  - staging por file descriptor sem seguir symlink, cópia limitada, `fsync`,
    rename atômico, handle opaco com TTL e cleanup proprietário.
- export `@ushark/core/torrent-input`.

## Validação executada

`pnpm exec playwright test tests/torrent-input-store.spec.ts --workers=1`

Resultado: **5 passed**. Cobertura: magnet válido/inválido e sem vazamento,
infoHash sobre bytes canônicos, multi-file/classificação, bencode e paths hostis,
oversize, staging/liberação, cancelamento, symlink e caso `/safe` vs `/safe-evil`.

## Limites

Esta etapa não usa rede nem libtorrent. Metadata de magnet sem `.torrent`, daemon,
handshake, persistência de pendência e integração Electron pertencem a S04.2–S05.
