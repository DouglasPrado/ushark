# M08 — decisões D06, D07, D09 e D19

Data: 2026-09-14. Escopo: S03 do M08.

## Estados e precedência

Health usa `idle | measuring | ready | degraded | unavailable | error`.
`unavailable` representa ausência confirmada de capacidade; `error` representa
falha técnica de medição. Escolha manual tem precedência somente enquanto a
source é viável. Dados técnicos detectados vencem declaração de biblioteca;
isso não autoriza o override a falsificar resolução, codec ou disponibilidade.

## Budgets e validade

- máximo de 3 probes concorrentes, 8 MiB por probe e 2 MiB/s por probe;
- deadline de seleção de 2 s; Play pode prosseguir com informação conservadora;
- TTL de 15 s em detalhes e 90 s em cards; máximo de 120 samples por source;
- snapshots públicos até 4/s, requests até 64 KiB e 64 candidates;
- ranking mecânico local deve ficar abaixo de 10 ms no corpus controlado.

## Health v1

O score pre-play usa ratio 35%, availability desejada 25%, peers úteis 15%,
startup 10%, estabilidade 10% e swarm geral 5%. Caps críticos vencem média.
Throughput sustentável usa percentis conservadores das amostras, nunca apenas o
pico. Confidence considera volume/tempo/samples/availability e cai com dados
ausentes. Score bruto, score exibido, confidence, ratio e breakdown permanecem
separados; fonte local completa é ready/100/confidence 1 sem Health de rede.

## Ranking v1

- `balanced`: Health 50%, qualidade 30%, startup 10%, cache/local 5%, autor 5%;
- `quality`: qualidade 50%, Health 35%, startup 5%, cache/local 5%, autor 5%,
  ainda sujeito a viabilidade;
- `fast`: startup 35%, Health 35%, cache/local 20%, qualidade 10%;
- `smallest`: primeiro aplica viabilidade, codec/hardware e resolução máxima;
  depois prefere menor tamanho, sem promover uma source incapaz de sustentar a
  mídia. Local completa continua preferida salvo override viável explícito.

Empates são resolvidos por `sourceId`, reasons são versionados e somente uma
source é recomendada. Os algoritmos Health e Selection começam na versão 1 e
não dependem de LLM nem servidor.
