# M08 S04.1 — medições progressivas

Data: 2026-09-14.

`health.sample` resume no torrentd throughput, peers conectados/úteis e
availability da janela wanted. Bitfields, endereços e trackers não atravessam a
fronteira. `TorrentHealthMetricsAdapter` limita a janela a 8 MiB e converte
bytes/s para bits/s explicitamente; arquivo local completo não inicia probe.

`ProgressiveHealthSampler` limita 64 candidates, três medições concorrentes,
120 samples por source, TTL de 15 s em detalhes e 90 s em cards. Cancelamento
descarta resultado tardio e não grava cache/histórico. A primeira versão usa
amostragem passiva (`probeBytes = 0`), portanto fica abaixo do budget e da
prioridade de playback/seek.

Validação: `tests/health-sampler.spec.ts` **3/3** e recorte com o daemon real
**9/9**, usando CPython 3.12.14/libtorrent 2.1.1.0 no macOS arm64.
