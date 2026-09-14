# M07 — decisões D09, D13 e D18

Data: 2026-09-14. Escopo: S03 do M07.

## D09 — scheduler, buffers e caches

- O scheduler usa tempo como unidade primária e recalcula a cada 250 ms em
  startup/seek/buffer crítico e a cada 1 s em estado saudável.
- Janelas iniciais: HOT até 30 s, WARM até 90 s e BUFFER adaptativo até 300 s.
  No libtorrent, prioridades iniciais são 7/5/3; BACKGROUND é 1 apenas em
  `keep`/`download` e 0 em `stream-only`. Valores são calibráveis no Core, não
  aparecem na UX e não formam garantia universal.
- O target parte de 30 s e varia com bitrate, throughput, estabilidade e
  disponibilidade. Crítico é menos de 15 s; saudável começa quando o target é
  alcançado. O cálculo real sempre inclui seconds/bytes e unidades explícitas.
- Probe inicial reserva HEAD de até 16 MiB e TAIL de até 8 MiB quando o container
  exigir. O limite quente de RAM varia de 64 a 512 MiB; Stream Only pode manter
  no máximo 512 MiB em disco fora das janelas. Nenhum cache cresce sem limite.
- Playback ativo é sempre protegido. `Keep` só pode sofrer demotion explícita;
  nenhum eviction do M07 remove ativo/Keep. Playback tem precedência sobre
  download geral; políticas completas de retenção permanecem no M10.

## D13 — delivery

M07 começa entregando arquivo parcial sparse ao MPV. HTTP Range não será criado
em S04 sem evidência de que o arquivo parcial falha em um container suportado.
Se necessário depois, será um adapter separado em `127.0.0.1`, token aleatório
por sessão, TTL curto, Range/206 estritos e sem path arbitrário.

## D18 — budgets e ambientes

Feedback de preparação deve chegar à UI em até 250 ms. Startup de 1–5 s e
seek→retomada de 1–3 s são metas operacionais somente em swarm controlado e
saudável, registrando bitrate, peers, storage e ambiente. macOS arm64 mede o
adapter de desenvolvimento; aceitação oficial exige Windows x64, TV/Moonlight e
controle físico. Resultados simulados ou locais não substituem essa matriz.

## Invariantes

Cada seek incrementa `seekGeneration`; gerações antigas não mudam prioridades,
buffer ou readiness. File offset e fronteiras de pieces participam do mapping.
Metadata técnica detectada vence declaração, mas sua confiança é registrada
como `indexed` ou `estimated`. A UI recebe snapshots limitados, nunca pieces,
paths, trackers ou peers individuais.
