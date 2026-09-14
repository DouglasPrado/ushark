# M18 — Cobertura da preparação

Ownership preservado da [matriz](../REQUIREMENTS_COVERAGE.md). Definições originais e condicionais são normativas; esta alocação não comprova implementação. Os cenários específicos e a validação estão no [README](README.md) e nas stories. Todo requisito listado é obrigação de S03–S08 mesmo quando não tiver manifestação visual.

| Requisito | Obrigação preservada | Fonte | Etapas responsáveis | Estado |
|---|---|---|---|---|
| FR-070 | **Inicialização via Sunshine.** O Ushark deve poder ser executado como app do Sunshine. | [FR-070](../../product/03-functional-requirements.md):593 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-071 | **Detectar modo TV.** Quando iniciado por esse fluxo, o app pode entrar em experiência de TV. | [FR-071](../../product/03-functional-requirements.md):599 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-072 | **Fullscreen automático.** Modo TV deve poder iniciar fullscreen. | [FR-072](../../product/03-functional-requirements.md):605 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-073 | **Encerramento integrado.** Ao sair do app, a sessão deve poder terminar corretamente. | [FR-073](../../product/03-functional-requirements.md):611 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-074 | **Pausar ao desconectar Moonlight.** Comportamento deve ser configurável. | [FR-074](../../product/03-functional-requirements.md):617 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| FR-219 | **Detectar Sunshine opcionalmente.** Sistema pode orientar integração. | [FR-219](../../product/03-functional-requirements.md):1595 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-066 | **Operação em LAN.** Uso via Sunshine/Moonlight deve funcionar adequadamente em rede local compatível. | [NFR-066](../../product/04-non-functional-requirements.md):607 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-074 | **Sunshine hardware encode.** Arquitetura deve permitir que Sunshine utilize encoder de hardware quando disponível. | [NFR-074](../../product/04-non-functional-requirements.md):666 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-120 | **Sunshine.** Versões suportadas devem ser documentadas. | [NFR-120](../../product/04-non-functional-requirements.md):997 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-121 | **Moonlight.** O produto deve usar protocolos de input de forma compatível com o fluxo Sunshine/Moonlight. | [NFR-121](../../product/04-non-functional-requirements.md):1003 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| NFR-122 | **100% das funções essenciais via gamepad.** Usuário na TV não deve precisar de mouse para: - navegar; - abrir; - reproduzir; - pausar; - voltar; - selecionar fonte; - trocar áudio; - trocar legenda; - sair. | [NFR-122](../../product/04-non-functional-requirements.md):1011 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |
| RX-044 | TV e desktop compartilham domínio; Sunshine captura/encode/input, Moonlight cliente sem app TV próprio; hotplug sem restart; desconectar salva e aplica pause/continue; reconnect preserva sessão e retomar segue usuário. | A04 §§62–79,91,98–109; UJ02,61 | S00/S01/S02: representar efeito e estados quando visíveis; S03: contrato; S04/S05: prova real; S06/S07: regressão e NFR; S08: auditar | PREPARED; aceite de entrega pendente |

## Jornadas relacionadas

- UJ-02: Abrir pelo Moonlight.
- UJ-61: Encerrar sessão Moonlight durante playback.

Jornadas compartilhadas comprovam apenas a fatia deste milestone; a matriz identifica os outros responsáveis. Consulte [jornadas originais](../../product/02-user-journeys.md).

## Auditoria posterior da implementação frontend

Preparação acima preservada como baseline documental. A execução S00–S02 está registrada em UPDATE/EXPERIENCE e na [auditoria frontend](../../execution/FRONTEND_COVERAGE_AUDIT.md). PREPARED nesta tabela descreve a preparação; não é o estado atual da etapa frontend. Requisitos integrais continuam pendentes de integração e aceite.
