# M08 — Integração em execução

## S03 — contrato real

S03 definiu snapshots separados de Health e Selection, estados completos,
score/confidence/ratio/startup/breakdown, budgets, TTL, deadline, algoritmos v1,
ranking determinístico e override viável. D06/D07/D09/D19 fecharam estados,
pesos, menor tamanho e precedência sem permitir que metadata declarativa vença
o runtime. [Evidência](evidence/DOMAIN_CONTRACT.md). Próxima: S04.1.

## S04.1 — sampler progressivo

O torrentd agora resume métricas wanted sem expor bitfields/peers individuais.
O Core limita janela, concorrência, TTL e histórico; cancelamento não deixa
resultado tardio. Testes próprios **3/3**, recorte com daemon real **9/9**.
[Evidência](evidence/BACKEND_S04_1.md). Próxima: S04.2.

## S04.2 — Health determinístico

Health v1 usa throughput sustentável p25, Streaming Ratio, wanted-piece
availability, peers úteis, estabilidade, startup e confidence. Caps críticos,
EMA/histerese e fonte local Health 100 têm fixtures determinísticas 8/8 PASS.
[Evidência](evidence/BACKEND_S04_2.md).

## S04.3 — ranking e persistência

Ranking mecânico das quatro estratégias, override idempotente validado contra o
conteúdo, snapshots/histórico limitados e decisões SQLite foram comprovados
5/5 PASS; 64 sources ranqueadas abaixo de 10 ms. Próxima: S05.
[Evidência](evidence/BACKEND_S04_3.md).

## S05 — integração e checkpoint funcional

Electron usa sampler/Health/ranking reais por preload/IPC v1. A jornada visual
de detalhes definiu e removeu override e o reidratou após restart. Recorte M08
16/16, Electron 1/1, torrentd/libtorrent 6/6, lint/typecheck/build PASS.
[Evidência](evidence/INTEGRATION_VALIDATION.md). M08 está
`READY_FOR_REVIEW/PENDING`; Windows/TV/hardware e S06–S08 permanecem pendentes.
O próximo incremento autorizado é M09/S03.

# Histórico — frontend pronto para revisão

S00–S02 implementadas: seleção/preflight simulado, comparação explicável, local/offline, resolução/qualidade/início/menor tamanho, override/remover, player com source escolhida. [Evidências](evidence/VALIDATION.md). UX READY_FOR_REVIEW/PENDING; revisão adiada por instrução explícita. S03–S08 e hardware pendentes. Próximo M09.

## Auditoria transversal da fase frontend

Jornadas conectadas e correções finais registradas em [auditoria](../../execution/FRONTEND_COVERAGE_AUDIT.md) e [validação final](../../execution/evidence/FINAL_VALIDATION.md). Esta atualização não muda aceites humanos existentes. S03–S08 continuam adiadas.

## Correção durante a revisão — sinal visual de Health

`SelectionPreview` passou a expor um snapshot resumido e substituível para cards. Filmes, Séries, Home, busca, Hero e comparação de fontes reutilizam o mesmo componente visual: 1–5 barras crescentes e label textual, sem depender apenas de cor. O mock é determinístico e não afirma probe real. Os três testes M08, os três fluxos visuais afetados e a regressão completa **125/125** passaram; UX continua PENDING.

O componente compartilhado também passou a suportar agregação por média. A função elimina `SourceHealth.id` repetido antes do cálculo; Séries usa esse resultado na capa/detalhe, e episódios calculam o indicador sobre suas próprias sources. A média continua no boundary frontend mockado, sem mudar ranking, probe ou integração real.
