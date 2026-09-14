# Evidência S04.2 — scheduler, deadlines e cache limitado

Data: 2026-09-14.

Foi criado `@ushark/core/stream-scheduler`. O plano mantém HEAD/TAIL, traduz a
posição corrente em HOT/WARM/BUFFER com prioridades 7/5/3, usa background 0 em
Stream Only e 1 em Keep/Download, calcula target de buffer com bitrate e
throughput e alterna a cadência entre 250 ms e 1 s. A RAM é limitada entre 64 e
512 MiB; Stream Only recebe budget explícito de 512 MiB em disco. Playback ativo
é protegido e este incremento não autoriza eviction.

O protocolo privado Core↔torrentd ganhou `stream.describe` e
`stream.applySchedule`. O daemon valida source/file, geração, até 8.192
assignments, prioridades/deadlines e budgets antes de tocar o runtime. O storage
libtorrent usa modo sparse. A aplicação remove `upload_mode`, prioriza somente o
arquivo selecionado no pack, aplica piece priorities/deadlines e agrega sessões
ativas para uma sessão não despriorizar outra. Geração anterior é ignorada,
replay idêntico é idempotente e conflito na mesma geração falha fechado.

## Validação

Em macOS arm64, CPython 3.12.14 e libtorrent 2.1.1.0 reais, um `.torrent`
sintético de 80 MiB foi inspecionado. O teste leu geometria 0–19, aplicou o plano
e releu prioridade 7 diretamente do handle; geração antiga foi ignorada, replay
foi reconhecido e plano diferente na mesma geração retornou `STREAM_CONFLICT`.

```text
USHARK_TEST_PYTHON=<cpython-3.12.14> \
USHARK_TEST_LIBTORRENT_PYTHONPATH=<target-temporario-2.1.1> \
pnpm exec playwright test tests/stream-mapping.spec.ts \
  tests/stream-scheduler.spec.ts tests/torrent-daemon.spec.ts \
  --workers=1 --trace=off
# 20 passed; 7 casos próprios de S04.2

python3 -m py_compile apps/torrentd/torrentd.py
pnpm lint
pnpm typecheck
# passed
```

O ensaio comprova configuração real de prioridades no libtorrent, mas não mede
tráfego de swarm, curva de buffer, eviction física ou deadlines sob contenção de
I/O. Delivery parcial ao MPV, cancelamento/stop da sessão e última geração no
percurso completo são S04.3/S05. Windows/TV/Moonlight e controle físico seguem
pendentes.
