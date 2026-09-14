# Validação de integração — M01 S04–S06

Data: 2026-09-14. Ambiente: macOS, Node 26.8.1, Electron 44.3.0 com Node 24.20.0, Chromium/Playwright local. Rede pública não utilizada.

## Resultado

- `pnpm typecheck`: passou.
- lint dos arquivos M01 alterados: passou.
- `pnpm build`: passou; permanece o aviso conhecido de chunk acima de 500 kB (596,55 kB minificado, 176,86 kB gzip nesta execução).
- Suíte focada M01 após hardening com `--trace=off`: 27/27 passaram em 22,1 s.
- Regressão integral serial com `--workers=1 --trace=off`: 150/150 passaram em 9,3 min.
- Uma execução anterior com quatro workers teve seis falhas de espera/contenção fora de M01; os seis arquivos afetados passaram 26/26 em série antes da regressão integral limpa.
- A execução anterior com trace reteve 16/17 resultados verdes e falhou ao fechar o contexto por `ENOENT` no artefato de trace; o caso afetado passou isoladamente sem trace em 3,8 s.

## Cobertura observada

- SQLite: migration v1, WAL, identidade estável, biblioteca vazia, restart, reset seletivo, diretório inválido sem perda do snapshot e recovery de configuração corrompida.
- IPC/preload: quatro métodos em allowlist, protocolo v1, payload/opções, sender/frame e erros públicos; nenhuma API de filesystem/Node genérica no renderer.
- Electron: isolamento, modo TV, offline, conclusão do onboarding, seletor nativo simulado no processo main e reabertura preservando nome, pasta, cache e estratégia.
- Browser: mock independente, estados lento/erro/offline/pasta inacessível, foco/modal/reset, gamepad/remote sintéticos e layouts 1080p/1440p/4K.
- Estrutura: boundaries físicos e exports públicos preservados.

## Métricas locais

Em 50 transições locais Home↔Configurações e 60 frames observados no Chromium headless:

- p95 da transição: 33,90 ms, abaixo da meta local de 100 ms;
- p95 de frame pacing: 16,70 ms;
- heap observado: 27.600.000 bytes antes/depois, crescimento reportado 0 nesta amostra.

Três repetições consecutivas do teste de budget passaram. Essas medidas são anti-regressão local, não certificação de hardware Windows/TV nem latência Sunshine/Moonlight.

## Limites

Checkpoint funcional humano permanece PENDING. Windows x64, TV, controle físico, hotplug real, overscan/legibilidade à distância e Sunshine/Moonlight não foram comprovados. CI, review final, merge e distribuição também não foram executados nesta story.
