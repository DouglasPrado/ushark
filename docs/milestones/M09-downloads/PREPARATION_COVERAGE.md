# M09 — Cobertura da preparação

Ownership preservado da [matriz](../REQUIREMENTS_COVERAGE.md). Definições originais e condicionais são normativas; esta alocação não comprova implementação. Os cenários específicos e a validação estão no [README](README.md) e nas stories. Todo requisito listado é obrigação de S03–S08 mesmo quando não tiver manifestação visual.

| Requisito | Obrigação preservada | Fonte | Etapas responsáveis | Estado |
|---|---|---|---|---|
| FR-054 | **Download completo.** Usuário pode solicitar download completo. | [FR-054](../../product/03-functional-requirements.md):491 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-056 | **Persistir resume data.** Torrent runtime deve poder ser retomado. | [FR-056](../../product/03-functional-requirements.md):505 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-059 | **Restaurar torrents ativos.** Após reinicialização, torrents ativos devem poder ser restaurados. | [FR-059](../../product/03-functional-requirements.md):523 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-116 | **Tela de downloads.** Deve mostrar torrents ativos. | [FR-116](../../product/03-functional-requirements.md):909 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-117 | **Mostrar progresso.** Exibir porcentagem. | [FR-117](../../product/03-functional-requirements.md):915 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-118 | **Mostrar velocidade.** Exibir throughput. | [FR-118](../../product/03-functional-requirements.md):921 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-119 | **Mostrar peers.** Exibir número de peers quando disponível. | [FR-119](../../product/03-functional-requirements.md):927 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-120 | **Pausar.** Usuário pode pausar download. | [FR-120](../../product/03-functional-requirements.md):933 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-121 | **Retomar.** Usuário pode continuar. | [FR-121](../../product/03-functional-requirements.md):939 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-122 | **Cancelar.** Usuário pode cancelar. | [FR-122](../../product/03-functional-requirements.md):945 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-123 | **Abrir Content.** Item de download deve levar aos detalhes. | [FR-123](../../product/03-functional-requirements.md):951 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-054 | **Resume Data.** Estado torrent deve ser salvo periodicamente e no shutdown normal. | [NFR-054](../../product/04-non-functional-requirements.md):527 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-067 | **Não saturar rede desnecessariamente.** Torrent engine deve poder limitar download/upload. | [NFR-067](../../product/04-non-functional-requirements.md):613 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-068 | **Limites configuráveis.** Usuário pode definir: download limit upload limit se a implementação expuser esse controle. | [NFR-068](../../product/04-non-functional-requirements.md):619 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| RX-027 | Escolher destino/source, alterar prioridade, limite de torrents/downloads/probes e upload/download; resume periódico/pause/completion/shutdown; pausar preserva catálogo; retomar sem full recheck injustificado. | UJ20–21,72–73; A02 §§54–63 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |

## Jornadas relacionadas

- UJ-20: Download completo.
- UJ-21: Gerenciar downloads.
- UJ-42: Mesma source em múltiplas bibliotecas.
- UJ-52: Reabrir após reinicialização.
- UJ-72: Abrir app com downloads em andamento.
- UJ-73: Pausar torrent sem perder biblioteca.

Jornadas compartilhadas comprovam apenas a fatia deste milestone; a matriz identifica os outros responsáveis. Consulte [jornadas originais](../../product/02-user-journeys.md).

## Auditoria posterior da implementação frontend

Preparação acima preservada como baseline documental. A execução S00–S02 está registrada em UPDATE/EXPERIENCE e na [auditoria frontend](../../execution/FRONTEND_COVERAGE_AUDIT.md). PREPARED nesta tabela descreve a preparação; não é o estado atual da etapa frontend. Requisitos integrais continuam pendentes de integração e aceite.
