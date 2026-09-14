# M08 — Frontend pronto para revisão

S00–S02 implementadas: seleção/preflight simulado, comparação explicável, local/offline, resolução/qualidade/início/menor tamanho, override/remover, player com source escolhida. [Evidências](evidence/VALIDATION.md). UX READY_FOR_REVIEW/PENDING; revisão adiada por instrução explícita. S03–S08 e hardware pendentes. Próximo M09.

## Auditoria transversal da fase frontend

Jornadas conectadas e correções finais registradas em [auditoria](../../execution/FRONTEND_COVERAGE_AUDIT.md) e [validação final](../../execution/evidence/FINAL_VALIDATION.md). Esta atualização não muda aceites humanos existentes. S03–S08 continuam adiadas.

## Correção durante a revisão — sinal visual de Health

`SelectionPreview` passou a expor um snapshot resumido e substituível para cards. Filmes, Séries, Home, busca, Hero e comparação de fontes reutilizam o mesmo componente visual: 1–5 barras crescentes e label textual, sem depender apenas de cor. O mock é determinístico e não afirma probe real. Os três testes M08, os três fluxos visuais afetados e a regressão completa **125/125** passaram; UX continua PENDING.

O componente compartilhado também passou a suportar agregação por média. A função elimina `SourceHealth.id` repetido antes do cálculo; Séries usa esse resultado na capa/detalhe, e episódios calculam o indicador sobre suas próprias sources. A média continua no boundary frontend mockado, sem mudar ranking, probe ou integração real.
