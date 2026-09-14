# M08 S04.2 — Health determinístico

Implementado `packages/core/src/health-engine.cjs` com p25 conservador de
throughput, bitrate detectado ou fallback tamanho/duração, Streaming Ratio por
interpolação, availability de wanted pieces, peers úteis, estabilidade por CV,
startup estimado, confidence e pesos pre-play versionados.

Os caps críticos (sem peers após discovery suficiente, piece ausente, ratio
abaixo de 1 e stall) não são diluídos pela média. EMA/histerese evita flicker;
stall e piece ausente reagem sem smoothing. Fonte local completa resulta em
Health 100/confidence 1 sem rede. Estado `unavailable` só aparece após três
amostras de discovery, evitando falso negativo precoce.

Validação: `tests/health-engine.spec.ts` e `tests/health-sampler.spec.ts`: 8/8
PASS em 2026-09-14.
