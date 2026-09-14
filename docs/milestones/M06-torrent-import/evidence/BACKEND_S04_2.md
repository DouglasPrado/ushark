# Evidência S04.2 — daemon isolado e IPC restrito

Data: 2026-09-14. Ambiente executado: macOS 26.6 arm64, CPython 3.12.14
fornecido pelo workspace, libtorrent 2.1.1.0.

## Implementação

- `apps/torrentd/torrentd.py`: processo libtorrent obrigatório, sem listener RPC;
  mensagens JSON limitadas sobre stdio herdado, secret por startup, handshake,
  allowlist, operações/snapshots/eventos/cancelamento e reuso do runtime por hash.
- `packages/core/src/torrent-daemon-client.cjs`: spawn sem shell, Python isolado,
  segredo aleatório, timeout, limite de payload, validação do staging em cada hop,
  eventos e recuperação explícita de exit.
- `apps/torrentd/runtime.json`: CPython 3.12/libtorrent 2.1.1 fixados e SHA-256
  registrados para macOS arm64 e Windows x64.

O wheel oficial macOS arm64 foi baixado em diretório temporário, teve SHA-256
`188aa0f03a2d6e967956a45534cbfd04d81641deb7b92b816e56723fc7ae5078`
confirmado e foi instalado somente com `--target` temporário. O Python do sistema
e o checkout não receberam instalação binária.

## Validação executada

```text
USHARK_TEST_PYTHON=<cpython-3.12> \
USHARK_TEST_LIBTORRENT_PYTHONPATH=<site-temporário> \
pnpm exec playwright test tests/torrent-daemon.spec.ts --workers=1
```

Resultado: **4 passed**. Provas: manifesto/allowlist; handshake real e versão;
inspeção real de `.torrent` pela binding; dois operationIds com mesmo torrentId;
handshake com secret incorreto rejeitado; magnet sem peers cancelado sem bloquear
o Core.

## Limites

- O binário não foi empacotado em instalador; Windows x64 continua sem execução
  física e é gate posterior.
- Esta etapa não afirma metadata real recebida da internet por magnet. S05 deve
  usar corpus autorizado e registrar rede/peers/timeout separadamente.
- Persistência de source/selector/pendência é responsabilidade de S04.3.
