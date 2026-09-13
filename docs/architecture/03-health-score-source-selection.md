# TorrentStream — Architecture 03: Health Score & Source Selection

**Status:** Draft v1  
**Produto:** TorrentStream  
**Documento:** Architecture Specification  
**Dependências:**  
- `01-prd-master.md`
- `02-user-journeys.md`
- `03-functional-requirements.md`
- `04-non-functional-requirements.md`
- `docs/architecture/01-library-manifest.md`
- `docs/architecture/02-torrent-streaming-engine.md`

---

# 1. Objetivo

Este documento define a arquitetura responsável por responder duas perguntas:

1. **Esta source conseguirá reproduzir este conteúdo agora com boa estabilidade?**
2. **Entre várias sources, qual é a melhor para este usuário neste momento?**

Essas respostas devem ser produzidas por dois módulos:

```text
Health Engine
+
Source Selection Engine
```

O objetivo de produto é transformar métricas técnicas de torrent em uma informação simples:

```text
█████ Excelente
Pronto em ~1s
```

---

# 2. Princípio central

A decisão não deve ser baseada apenas em `seeders` ou `resolução`.

A decisão deve considerar:

```text
capacidade real de streaming
+
qualidade da mídia
+
preferências do usuário
+
confiança da medição
```

---

# 3. Separação dos conceitos

## Swarm Health

Responde:

> O torrent parece saudável como swarm?

Considera:

- peers;
- seeders;
- disponibilidade geral;
- estabilidade do swarm;
- conectividade.

## Streaming Health

Responde:

> Esta source consegue sustentar este conteúdo agora?

Considera:

- throughput sustentável;
- bitrate necessário;
- disponibilidade dos próximos pieces;
- buffer;
- latência de startup;
- estabilidade.

## Source Score

Responde:

> Esta source é a melhor escolha entre todas as disponíveis?

Considera:

```text
Streaming Health
+
media quality
+
user preferences
+
startup
+
stability
+
historical data
```

---

# 4. Arquitetura

```text
torrentd
   │
   │ raw metrics
   ▼
┌──────────────────────┐
│    Health Engine     │
│                      │
│ throughput           │
│ availability         │
│ stability            │
│ peers                │
│ startup              │
│ confidence           │
└──────────┬───────────┘
           │
           ▼
     Health Snapshot
           │
           ▼
┌──────────────────────┐
│ Source Selection     │
│                      │
│ health               │
│ media quality        │
│ user preferences     │
│ device capability    │
│ history              │
└──────────┬───────────┘
           │
           ▼
      Ranked Sources
```

---

# 5. Input mínimo do Health Engine

Cada source deve fornecer, quando disponível:

```text
download throughput
upload throughput
peer count
useful peer count
piece availability
wanted-piece availability
connection latency
request responsiveness
buffer seconds
media bitrate
torrent state
sample history
```

---

# 6. Health Snapshot

```ts
interface HealthSnapshot {
  sourceId: string;
  score: number;
  bars: 1 | 2 | 3 | 4 | 5;
  label: 'excellent' | 'very-good' | 'good' | 'unstable' | 'poor';
  confidence: number;
  streamingRatio?: number;
  startupEstimateMs?: number;
  sustainableThroughputBps?: number;
  requiredBitrateBps?: number;
  usefulPeers: number;
  connectedPeers: number;
  wantedPieceAvailability?: number;
  stabilityScore?: number;
  state: 'idle' | 'measuring' | 'ready' | 'degraded' | 'unavailable';
}
```

---

# 7. Score Range

O score interno será de `0–100`.

Mapeamento visual inicial:

```text
90–100  █████  Excelente
75–89   ████░  Muito bom
55–74   ███░░  Bom
30–54   ██░░░  Instável
0–29    █░░░░  Ruim
```

Os thresholds devem ser configuráveis sem alterar o contrato público.

---

# 8. Estado inicial

Enquanto a medição ainda não possui confiança suficiente:

```text
◌ Medindo...
```

Não mostrar uma barra definitiva baseada em poucos dados.

---

# 9. Confidence

Confidence representa o quanto o sistema confia no score atual.

Range:

```text
0.0 → 1.0
```

Exemplo:

```text
score = 86
confidence = 0.22
```

não deve ser tratado da mesma forma que:

```text
score = 86
confidence = 0.94
```

---

# 10. Fatores de Confidence

Confidence pode crescer com:

```text
tempo de observação
número de peers úteis
volume transferido
quantidade de samples
estabilidade das métricas
availability conhecida
```

Pode cair com:

```text
peer churn
mudança abrupta de throughput
seek recente
swarm muito pequeno
dados incompletos
```

---

# 11. Confidence mínimo para decisão automática

Valor inicial proposto:

```text
confidence >= 0.60
```

Antes disso:

```text
usar heurística conservadora
ou
aguardar mais dados
```

---

# 12. Sustainable Throughput

Throughput instantâneo não deve ser usado diretamente como métrica principal.

A métrica principal deve ser:

```text
sustainableThroughput
```

Definição:

> Estimativa conservadora de quanto throughput esta source consegue sustentar continuamente.

---

# 13. Rolling Windows

Manter séries temporais de:

```text
5s
15s
30s
60s
```

Uso conceitual:

```text
5s  → reação rápida
15s → startup/seek
30s → estabilidade
60s → histórico curto
```

---

# 14. Cálculo conservador

Estratégia inicial possível:

```text
sustainableThroughput =
0.5 * p25(15s)
+
0.3 * p25(30s)
+
0.2 * median(30s)
```

O objetivo é evitar confiar em picos momentâneos.

---

# 15. Required Bitrate

Preferência:

```text
bitrate real detectado
```

Fallback:

```text
fileSize * 8 / duration
```

Para VBR, usar uma estimativa conservadora acima da média quando possível.

---

# 16. Streaming Ratio

Fórmula:

```text
Streaming Ratio =
sustainableThroughput / requiredBitrate
```

Exemplo:

```text
Source: 80 Mbps
Video: 20 Mbps

Ratio = 4.0
```

---

# 17. Mapping inicial do Streaming Ratio

```text
>= 4.0     100
>= 3.0      90
>= 2.0      80
>= 1.5      65
>= 1.2      45
>= 1.0      30
< 1.0       10
```

Interpolação pode ser usada entre pontos.

---

# 18. Availability dos pieces necessários

Não basta disponibilidade geral.

Precisamos de:

```text
wantedPieceAvailability
```

principalmente para:

```text
HOT window
WARM window
```

---

# 19. Wanted Piece Availability

Exemplo:

```text
HOT window:
32 pieces

availability mínima:
1

availability média:
8.4
```

Um único piece raro pode causar stall.

---

# 20. Availability Score

Deve considerar:

```text
minimum availability
median availability
percentage with availability >= N
```

Condição crítica:

```text
availability = 0
```

em qualquer piece imediatamente necessário deve aplicar penalidade severa.

---

# 21. Piece Scarcity Penalty

Se qualquer piece da HOT window tiver:

```text
availability = 0
```

o score deve ser limitado.

Se:

```text
availability = 1
```

o risco deve aumentar.

---

# 22. Useful Peers

Contar peers descobertos é insuficiente.

Precisamos de:

```text
usefulPeers
```

Um peer útil deve estar:

```text
connected
+
com wanted pieces
+
responsivo
+
transferindo ou apto a transferir
```

---

# 23. Peer Score

Exemplo inicial:

```text
0 useful peers  → 0
1               → 35
2–3             → 60
4–7             → 80
8+              → 100
```

O valor deve ser ajustado pelo throughput real.

---

# 24. Stability Score

Mede variação de throughput e comportamento do swarm.

Pode considerar:

```text
coefficient of variation
drop frequency
zero-throughput intervals
peer churn
```

---

# 25. Coefficient of Variation

```text
CV = standardDeviation / mean
```

Quanto maior:

```text
menos estável
```

Exemplo de mapping:

```text
CV < 0.15       excelente
0.15–0.30       bom
0.30–0.60       instável
> 0.60          ruim
```

---

# 26. Stall Penalty

Se ocorrer:

```text
wanted data
+
download ≈ 0
```

por período relevante, aplicar penalidade forte.

---

# 27. Startup Latency

Medir:

```text
probe/start
→ first useful bytes
```

e:

```text
Play
→ minimum startup buffer
```

---

# 28. Startup Estimate

Estimativa conceitual:

```text
startupEstimate =
connectionRemaining
+
metadataRemaining
+
bufferBytesNeeded / effectiveThroughput
+
playerStartupCost
```

---

# 29. Startup Score

Exemplo:

```text
< 1s       100
1–2s        90
2–4s        75
4–8s        55
8–15s       30
> 15s       10
```

---

# 30. Buffer Score

Durante playback:

```text
> 180s      100
90–180       90
45–90        75
20–45        50
10–20        30
< 10         10
```

---

# 31. Pre-play vs Runtime Health

Antes do Play:

```text
throughput
availability
peers
startup
confidence
```

Durante playback:

```text
buffer
ratio
stability
availability
stalls
```

Os pesos mudam conforme o estado.

---

# 32. Pesos iniciais — Pre-play

```text
Throughput / Streaming Ratio      35%
Wanted Piece Availability        25%
Useful Peers                     15%
Startup Latency                  10%
Stability                        10%
Swarm General Health              5%
```

---

# 33. Pesos iniciais — Runtime

```text
Buffer                           30%
Streaming Ratio                  30%
Wanted Piece Availability        20%
Stability                        10%
Useful Peers                      5%
Swarm Health                      5%
```

---

# 34. Weighted Score

Exemplo:

```text
score =
ratioScore * 0.35
+
availabilityScore * 0.25
+
peerScore * 0.15
+
startupScore * 0.10
+
stabilityScore * 0.10
+
swarmScore * 0.05
```

---

# 35. Hard Penalties

Algumas condições não devem ser diluídas pela média.

Exemplos:

```text
0 useful peers
wanted piece availability = 0
disk error
metadata unavailable
source stalled
```

---

# 36. Score Caps

Exemplo:

```text
0 useful peers               → max score 20
missing required pieces      → max score 25
ratio < 1.0                  → max score 35
active stall                 → max score 20
```

---

# 37. Hysteresis

Evitar mudança visual constante:

```text
████░
█████
████░
█████
```

Exemplo:

Para subir de `Muito bom` para `Excelente`:

```text
score >= 92
por alguns segundos
```

Para cair:

```text
score < 86
```

---

# 38. Smoothing

Score exibido pode usar:

```text
EMA(rawScore)
```

EMA = Exponential Moving Average.

Falhas críticas como stall devem ignorar parte do smoothing e reagir imediatamente.

---

# 39. Health Labels

Contrato interno:

```text
excellent
very-good
good
unstable
poor
```

UI:

```text
Excelente
Muito bom
Bom
Instável
Ruim
```

---

# 40. Estimated Startup UI

Evitar falsa precisão.

Exemplos:

```text
Pronto em ~1s
Pronto em ~2s
Pronto em ~4s
Pode levar alguns segundos
Pode demorar para iniciar
```

---

# 41. Health State Machine

```text
idle
↓
measuring
↓
ready
```

Possíveis estados adicionais:

```text
degraded
unavailable
```

---

# 42. Probe Lifecycle

```text
probe requested
↓
torrent runtime ready
↓
connect peers
↓
collect bitfields
↓
request limited data
↓
collect samples
↓
emit health snapshot
↓
continue low-frequency update
```

---

# 43. Probe Budget

Probe não deve baixar conteúdo em excesso.

Faixa inicial sugerida:

```text
1–8 MB
```

dependendo da source e da quantidade de dados necessária para uma estimativa útil.

---

# 44. Probe Concurrency

Limitar probes simultâneos.

Exemplo inicial:

```text
max 3
```

Prioridade:

```text
current details
focused card
next episode
other visible candidates
```

---

# 45. Probe Cancellation

Se o usuário mudar rapidamente de conteúdo:

```text
cancel old low-priority probe
```

---

# 46. Health Cache

Snapshots recentes podem ser reutilizados com TTL.

Exemplo:

```text
30s–5min
```

dependendo do contexto.

---

# 47. Historical Health

Persistir amostras agregadas:

```text
sourceId
timestamp
startupMs
sustainableThroughput
stalls
averageRatio
usefulPeers
```

---

# 48. Histórico como prior

Histórico não substitui medição atual.

Exemplo de combinação:

```text
current probe 80%
history       20%
```

Quando confidence atual for baixa, o histórico pode pesar mais.

---

# 49. Time Decay

Histórico antigo deve perder relevância por:

```text
exponential decay
```

---

# 50. Source Selection Engine

Entrada:

```text
Content
+
candidate Sources
+
HealthSnapshots
+
UserPreferences
+
DeviceCapabilities
+
LocalOverrides
```

Saída:

```text
ranked sources
+
selected source
+
reason
```

---

# 51. Source Candidate

```ts
interface SourceCandidate {
  sourceId: string;
  health: HealthSnapshot;
  media: MediaInfo;
  preferredByAuthor?: boolean;
  localOverride?: boolean;
  cachedBytes?: number;
  completed?: boolean;
}
```

---

# 52. User Preferences

```ts
interface PlaybackPreferences {
  strategy: 'best-quality' | 'balanced' | 'fastest-start';
  maxResolution?: '720p' | '1080p' | '2160p';
  preferHdr?: boolean;
  autoFallback: boolean;
  autoSwitchDuringPlayback: boolean;
}
```

---

# 53. Device Capabilities

Considerar:

```text
supported codecs
hardware decode
HDR capability
maximum practical resolution
```

Como Sunshine transmite frames, a TV não precisa suportar o codec original, mas o PC precisa reproduzi-lo adequadamente.

---

# 54. Eligibility Filter

Antes do ranking, remover candidates inviáveis.

Exemplos:

```text
resolution above user max
unsupported codec
source unavailable
missing media file
manual blacklist
```

---

# 55. Local Override

Se usuário escolheu explicitamente uma source:

```text
localOverride = true
```

ela deve ser preferida enquanto viável.

Se estiver indisponível, fallback temporário pode ocorrer sem apagar a preferência.

---

# 56. Author Preference

Manifest pode recomendar uma source.

Isso gera apenas bônus pequeno, nunca prioridade absoluta.

---

# 57. Quality Score

Pode considerar:

```text
resolution
bitrate
HDR
audio
codec efficiency
```

Arquivo maior não é automaticamente melhor.

---

# 58. Resolution Score

Exemplo inicial:

```text
2160p  100
1440p   85
1080p   75
720p    55
480p    30
```

---

# 59. Balanced Strategy

Default recomendado.

Exemplo de pesos:

```text
Streaming Health       50%
Media Quality          30%
Startup                10%
Cache/local advantage   5%
Author preference       5%
```

---

# 60. Best Quality Strategy

Exemplo:

```text
Media Quality          50%
Streaming Health       35%
Startup                 5%
Cache                    5%
Author preference        5%
```

Ainda deve existir health mínimo.

---

# 61. Fastest Start Strategy

Exemplo:

```text
Startup                35%
Streaming Health       35%
Cache/local advantage 20%
Media Quality          10%
```

---

# 62. Health Minimum

Mesmo em `Best Quality`, uma source em estado crítico não deve vencer apenas pela resolução.

---

# 63. Source Selection Score

Exemplo:

```text
selectionScore =
health * WH
+
quality * WQ
+
startup * WS
+
cache * WC
+
authorPreference * WA
```

---

# 64. Cached Advantage

Exemplo:

```text
completed local      → 100
large healthy cache  → 80
small prefetch       → 30
none                 → 0
```

---

# 65. Completed Local Source

Se arquivo está completo localmente:

```text
network Streaming Health não é necessário
```

A source local completa deve receber prioridade, salvo escolha explícita diferente.

---

# 66. Source Ranking

```ts
interface RankedSource {
  sourceId: string;
  score: number;
  rank: number;
  reasonCodes: string[];
}
```

---

# 67. Reason Codes

Exemplos:

```text
BEST_STREAMING_HEALTH
BEST_AVAILABLE_4K
FASTEST_START
LOCAL_CACHE
USER_OVERRIDE
AUTHOR_RECOMMENDED
LOW_STABILITY
LOW_AVAILABILITY
INSUFFICIENT_RATIO
```

---

# 68. Explicabilidade

Tela avançada pode mostrar:

```text
Selecionada porque:
• 4K
• Health Excelente
• Ratio 3.8x
• Startup ~1s
```

---

# 69. Automatic Selection

Ao clicar Play:

```text
collect candidates
↓
get current health
↓
rank
↓
select best
↓
prepare stream
```

---

# 70. Selection Deadline

Não esperar probes indefinidamente.

Exemplo:

```text
1–3s
```

Depois usar a melhor informação disponível.

---

# 71. Runtime Re-ranking

Durante playback:

```text
current source
+
fallback candidates
```

podem ser reavaliados.

---

# 72. Fallback Threshold

Considerar source degradada quando:

```text
buffer crítico
+
ratio baixo
+
health baixo
```

por período sustentado.

---

# 73. Auto-fallback

```text
current source degraded
↓
rank alternatives
↓
candidate significantly better
↓
prepare candidate
↓
switch
```

---

# 74. Handoff

Preferir:

```text
prepare new source
before
stopping old source
```

para reduzir interrupção.

---

# 75. Playback Position Preservation

Nova source deve iniciar na mesma posição.

```text
currentTime
↓
map to new media
↓
seek
```

---

# 76. Compatibility Check

Fallback deve validar:

- mesmo Content;
- episódio correto;
- duração compatível;
- source correta.

---

# 77. Duration Mismatch

Se versões tiverem duração muito diferente:

```text
não trocar automaticamente
```

Exemplo:

```text
director's cut
vs
theatrical
```

---

# 78. Runtime Switch UX

Se automático estiver habilitado:

```text
Fonte alterada para manter reprodução estável
```

Pode ser exibido como toast discreto.

---

# 79. Manual Confirmation Mode

```text
Uma fonte mais estável está disponível.

[ Trocar ]
[ Continuar ]
```

---

# 80. Auto-switch Off

Se usuário desabilitar:

```text
não trocar automaticamente
```

mas pode mostrar aviso.

---

# 81. Health após Seek

Após seek, confidence deve cair temporariamente porque:

```text
nova região
nova availability
novo buffer
```

---

# 82. Source Blacklist Temporário

Source que falhou repetidamente deve receber penalidade temporária para evitar loop.

---

# 83. Cooldown

Após troca automática, não trocar novamente imediatamente salvo falha crítica.

Exemplo:

```text
30–120s
```

---

# 84. Manual Source Selection Screen

Exemplo:

```text
4K Remux
72 GB
██░░░ Instável
Pronto em ~8s

4K HEVC
28 GB
█████ Excelente
Pronto em ~1s

1080p
12 GB
█████ Excelente
Pronto em <1s
```

---

# 85. Ordering na UI

Default:

```text
recommended first
```

Depois ordenar conforme estratégia por:

```text
quality
health
size
startup
```

---

# 86. Recommended Badge

Somente uma source recebe:

```text
RECOMENDADA
```

---

# 87. Accessibility

Health deve ser comunicado por:

```text
bars
+
label
```

Não depender apenas de cor.

---

# 88. Lazy Health

Prioridade de medição:

```text
details open
focused card
hero
next episode
```

Cards fora da viewport não precisam medição atual.

---

# 89. Stale Health

Snapshots antigos devem ser marcados internamente e revalidados quando necessário.

Persistir:

```text
measuredAt
```

---

# 90. Snapshot TTL

Exemplo:

```text
active playback: 1–5s
details:         5–15s
library card:    30–120s
```

---

# 91. Resource Budget

Health Engine deve respeitar:

```text
max probes
max bandwidth
max torrent runtimes
```

---

# 92. Network Priority

Ordem:

```text
active playback
active seek
next episode prefetch
manual health probe
visible card probe
background health
```

---

# 93. Determinismo

Mesmos inputs devem produzir mesmo score na v1.

Isso facilita:

```text
testes
debugging
explicabilidade
```

---

# 94. Sem LLM

Health Score e Source Selection devem ser totalmente mecânicos.

Nenhum LLM é necessário.

---

# 95. Configuração de pesos

```ts
interface HealthWeights {
  ratio: number;
  availability: number;
  peers: number;
  startup: number;
  stability: number;
  swarm: number;
}
```

---

# 96. Versionamento do algoritmo

Persistir:

```text
healthAlgorithmVersion
selectionAlgorithmVersion
```

em logs e dados históricos relevantes.

---

# 97. Telemetria local de decisão

```json
{
  "contentId": "movie:tmdb:157336",
  "selectedSource": "source:4k-hevc",
  "algorithmVersion": 1,
  "candidates": 3,
  "reasonCodes": [
    "BEST_AVAILABLE_4K",
    "BEST_STREAMING_HEALTH"
  ]
}
```

---

# 98. Observabilidade do Health

Tela técnica pode mostrar:

```text
Raw score         91
Displayed score   89
Confidence        0.94
Ratio             3.8x
Stable Mbps       72
Required Mbps     19
Useful peers      9
Availability      94%
Buffer            122s
```

---

# 99. Debug Breakdown

```text
Ratio         96 × 0.35 = 33.6
Availability  90 × 0.25 = 22.5
Peers         84 × 0.15 = 12.6
Startup       94 × 0.10 = 9.4
Stability     88 × 0.10 = 8.8
Swarm         80 × 0.05 = 4.0

Total = 90.9
```

---

# 100. Testing — Unit

Testar:

```text
ratio score
availability score
peer score
stability score
startup score
confidence
weighted score
caps
hysteresis
```

---

# 101. Testing — Source Selection

Fixtures obrigatórias:

```text
4K ruim vs 1080p excelente
4K excelente vs 1080p excelente
cached 1080p vs remote 4K
user override
source unavailable
low confidence
```

---

# 102. Testing — Runtime Fallback

Simular:

```text
buffer drop
ratio drop
stall
better candidate available
```

Validar:

```text
fallback decision
cooldown
position preservation
```

---

# 103. Testing — No Oscillation

Simular scores:

```text
74
76
73
77
```

A UI não deve alternar labels continuamente.

---

# 104. Performance

Ranking local deve ser rápido.

Meta:

```text
< 10 ms
```

para quantidade normal de candidates, excluindo probes externos.

---

# 105. Failure Cases

Health deve lidar com:

```text
bitrate desconhecido
sem peers
sem samples
torrent local completo
duration desconhecida
probe timeout
partial metadata
```

---

# 106. Bitrate Unknown

Fallback:

```text
size / duration
```

Se duração também for desconhecida:

```text
confidence reduzida
```

---

# 107. Completed Local File

Para disponibilidade:

```text
state = ready
score = 100
confidence = 1
```

Source Selection ainda deve validar compatibilidade de playback.

---

# 108. Torrent sem Peer

Se discovery suficiente confirmar ausência:

```text
state = unavailable
bars = 1
```

Não concluir cedo demais durante discovery incompleta.

---

# 109. Source Selection com Health desconhecido

Usar:

```text
cache
history
quality
conservative assumptions
```

até obter medição melhor.

---

# 110. User Strategy — Balanced

Default recomendado.

Objetivo:

```text
alta qualidade
sem sacrificar estabilidade
```

---

# 111. User Strategy — Best Quality

Prioriza qualidade desde que health mínimo seja atendido.

---

# 112. User Strategy — Fastest Start

Prioriza:

```text
local cache
startup
stability
```

mesmo que a resolução seja menor.

---

# 113. Estratégias futuras

Possíveis:

```text
Data Saver
Always 4K
```

fora da v1 obrigatória.

---

# 114. Multiple Libraries

Sources disponíveis ao mesmo Content em diferentes bibliotecas podem entrar no ranking, respeitando memberships e estado local.

---

# 115. Library Source Visibility

Source removida de todas as origens válidas não deve continuar elegível, salvo se o usuário a tiver salvo localmente.

---

# 116. Privacy

Health history deve permanecer local por padrão.

---

# 117. Sem servidor obrigatório

O score não deve depender de serviço central.

---

# 118. Offline

Source local completa:

```text
funciona normalmente
```

Torrent remoto sem rede:

```text
offline/unavailable
```

---

# 119. Acceptance Criteria — Health Engine

Considerado funcional quando:

1. produz score de `0–100`;
2. produz `1–5` barras;
3. calcula Streaming Ratio;
4. considera availability dos wanted pieces;
5. considera useful peers;
6. possui confidence;
7. evita flicker;
8. reage rapidamente a stall crítico;
9. funciona sem LLM;
10. possui breakdown de debug.

---

# 120. Acceptance Criteria — Source Selection

Considerado funcional quando:

1. rankeia múltiplas sources;
2. respeita resolução máxima;
3. respeita user override;
4. prioriza arquivo local completo;
5. Balanced escolhe source estável de boa qualidade;
6. Best Quality não escolhe source inviável;
7. Fastest Start considera cache/startup;
8. retorna reason codes;
9. consegue executar fallback;
10. preserva posição ao trocar quando compatível.

---

# 121. Relação com Functional Requirements

Atende principalmente:

```text
FR-092–104
Health Score

FR-105–115
Source Selection e history

FR-088–090
Preflight/details

FR-112–113
Fallback
```

---

# 122. Relação com NFRs

Atende principalmente:

```text
NFR-029–039
Streaming Ratio / Health / Selection

NFR-032–036
Confidence e score

NFR-037
Decision explainability

NFR-141–143
Testabilidade
```

---

# 123. Decisões fechadas

```text
Health Score
= mecânico

LLM
= não utilizado

score
= 0–100

UI
= 1–5 barras + label

principal sinal
= Streaming Ratio

availability
= wanted pieces, não apenas global

selection
= health + quality + preference + cache

fallback
= permitido e configurável

history
= local
```

---

# 124. Regra central

> **A melhor source não é a de maior resolução nem a de maior número de seeders. É a source que entrega a melhor experiência de reprodução para aquele usuário naquele momento.**
