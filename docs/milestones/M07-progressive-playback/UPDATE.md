# M07 — checkpoint funcional

## Reparo pós-checkpoint — composição do vídeo

O retorno humano de 2026-09-14 confirmou que importar e iniciar o stream não era
suficiente: o MPV aparecia como janela externa. O player compartilhado com M05
agora compõe o vídeo nativo dentro da superfície visual do Ushark, mantendo o
processo MPV isolado e os controles React acima dele. A validação macOS com
fixture H.264/AAC confirmou reprodução real, posição avançando, z-order e
alinhamento dos bounds. Evidência em
[POST_CHECKPOINT_WINDOW_COMPOSITION](../M05-local-playback/evidence/POST_CHECKPOINT_WINDOW_COMPOSITION.md).
Aceite humano e validação Windows/TV/Moonlight permanecem pendentes.

## Reparo pós-checkpoint — importação até exibição

Em 2026-09-14, a jornada real importada foi reparada ponta a ponta: o renderer
deixou de tratar torrent disponível como arquivo local, o adapter preserva
`stream.ready` antecipado e o Core cancela preparações ainda em resolução antes
de criar MPV concorrente. O teste Electron/macOS em modo TV carregou o arquivo
parcial gerenciado em um único MPV e confirmou posição avançando. Validações
focalizadas passaram **20/20** e **6/6**, além de typecheck. Detalhes em
[POST_CHECKPOINT_DISPLAY_REPAIR](evidence/POST_CHECKPOINT_DISPLAY_REPAIR.md).
O estado permanece `READY_FOR_REVIEW/PENDING` e os gates físicos continuam
pendentes.

## S04.3 e S05

O delivery sparse contido, rebind após restart, stop e geração latest-wins foram
ligados ao MPV e ao Electron por preload/IPC v1. No swarm local sintético, o
stream ficou pronto em **2.660 ms**, o primeiro frame em **2.764 ms** com apenas
**31/174 pieces**, o seek fora do cache em **509 ms**, e três seeks rápidos
terminaram somente na geração 4. A suíte M07 passou **27/27**. Evidências:
[S04.3](evidence/BACKEND_S04_3.md) e
[S05](evidence/INTEGRATION_VALIDATION.md).

M07 está `READY_FOR_REVIEW/PENDING`; Windows/TV/Moonlight, controle físico e
empacotamento continuam pendentes. S06–S08 não foram iniciados.

## S03 — contrato real

S03 foi concluída em 2026-09-14. `@ushark/types/stream` agora define protocolo
v1, sessão protegida, preparação/posição/seek+geração/stop/cancelamento,
metadata técnica, buffer em segundos+bytes+bitrate, delivery parcial, eventos,
erros e limites. D09/D13/D18 fecharam janelas/prioridades calibráveis, caches
limitados, arquivo parcial antes de Range e separação macOS versus aceitação
Windows/TV. [Evidência](evidence/DOMAIN_CONTRACT.md). Próxima: S04.1.

## S04.1 — probe parcial e mapping

`@ushark/core/stream-mapping` implementa mapping tempo→byte estimado/indexado,
byte→piece com offset/fronteiras, plano HEAD 16 MiB + TAIL opcional 8 MiB,
readiness deduplicada e limites. O adapter executou `ffprobe` 9.0.1 real sobre
MP4 sintético, depois de recusar pieces incompletos. Testes passaram **8/8**;
lint e typecheck passaram. Scheduler/libtorrent, delivery MPV e jornada integral
continuam nas etapas seguintes. [Evidência](evidence/BACKEND_S04_1.md). Próxima:
S04.2.

## S04.2 — scheduler e cache limitado

O scheduler gera HEAD/TAIL e HOT/WARM/BUFFER 7/5/3, adapta target/cadência,
limita RAM/Stream Only disk e protege sessões ativas. O torrentd passou a
validar e aplicar até 8.192 prioridades/deadlines em storage sparse, mantendo a
última geração e compondo sessões concorrentes. CPython 3.12.14/libtorrent
2.1.1.0 reais confirmaram a prioridade no handle; S04.2 passou **7/7** e a suíte
combinada passou **20/20**. [Evidência](evidence/BACKEND_S04_2.md). Próxima:
S04.3.

# Histórico — frontend pronto para revisão

S00–S02 implementadas no frontend. READY_FOR_REVIEW; decisão PENDING, revisão humana adiada para o final por instrução explícita do usuário. S03–S08 adiadas.

2026-09-13: pnpm typecheck passou; pnpm exec playwright test tests/stream.behavior.spec.ts: 3 testes passaram (22,2s). Último seek vence, pausa preservada, metadata/rede/disco recuperáveis, bitrate variável, cancelamento e retorno; filme e episódio importados M06 abrem M07. Inspeção visual de evidence/stream.png em Chromium 1440×1000: controles legíveis e simulação identificada. Windows, TV, gamepad físico, MPV, swarm, I/O e métricas reais não validados. Metas temporais de runtime não comprovadas.

## Auditoria transversal da fase frontend

Jornadas conectadas e correções finais registradas em [auditoria](../../execution/FRONTEND_COVERAGE_AUDIT.md) e [validação final](../../execution/evidence/FINAL_VALIDATION.md). Esta atualização não muda aceites humanos existentes. S03–S08 continuam adiadas.
