# M07 S05 — validação integrada

Data: 2026-09-14.

## Caminho real

O Electron agora usa `DesktopProgressivePlayer` para conteúdo torrent, via
preload/IPC v1 restrito. O processo main cria o serviço progressivo sobre o
mesmo torrentd do M06 e um processo MPV separado. O renderer recebe somente
sessão, estado, geração, posição, metadata e buffer; paths e pieces ficam no
Core/daemon.

O swarm determinístico usa mídia H.264/AAC sintética de **182.113.675 bytes**,
**240 s**, pieces de 1 MiB, seeder libtorrent isolado em loopback e limite de
upload de **32 MiB/s**. Não usa tracker público nem conteúdo de terceiros.

Resultado da execução serial:

- readiness do stream: **2.660 ms**;
- primeiro frame MPV: **2.764 ms**;
- primeiro frame com **31/174 pieces**, portanto antes do download completo;
- seek fora do cache: **509 ms**;
- três seeks sucessivos: somente geração 4, posição 200 s, ficou pronta;
- delivery inicial exigiu 22 pieces; arquivo ativo permaneceu protegido;
- IPC recusou campo `path`, sender não principal e protocolo inválido.

Comando executado:

```text
USHARK_TEST_PYTHON=<CPython 3.12.14> \
USHARK_TEST_LIBTORRENT_PYTHONPATH=<libtorrent 2.1.1.0> \
pnpm exec playwright test tests/stream-mapping.spec.ts \
tests/stream-scheduler.spec.ts tests/progressive-stream-service.spec.ts \
tests/torrent-daemon.spec.ts tests/stream-ipc.spec.ts \
tests/stream-integration.spec.ts --workers=1 --reporter=line
```

Resultado: **27 passed, 0 failed** em 10,4 s. O cenário de pack é coberto pelo
mapping com offset/fronteira compartilhada e pelo scheduler que mantém somente
o arquivo selecionado acima do background; o swarm temporal medido usa arquivo
único para permanecer determinístico.

## Limites do checkpoint

Esta é evidência local em macOS arm64 com MPV 0.41, FFprobe 9.0.1, Electron
44.3.0, CPython 3.12.14 e libtorrent 2.1.1.0. Windows x64, TV/Moonlight,
controle físico, rede pública, disco cheio real e empacotamento do runtime
continuam pendentes e não são implicitamente aprovados.
