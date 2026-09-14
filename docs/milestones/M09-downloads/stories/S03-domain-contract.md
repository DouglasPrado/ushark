# S03 — Contrato de domínio — M09

Status: DONE; contrato v1 e decisões fechados. Próxima: S04.1.

## Objetivo

Derivar o contrato mínimo de M09 da experiência aprovada.

## Contexto e dependências

UX M01–M22 aprovada; execução autorizada; dependências de integração M06, M07 disponíveis conforme ondas do plano. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

DownloadService: enfileirar(sourceId, selector, destino), pausar, retomar, cancelar, removerDados confirmado; snapshot com bytes totais/concluídos, velocidade, peers, prioridade e estado; resume versionado. Definir operações, DTOs, ownership, eventos/snapshots, unidades, limites, erros, transações e invariantes; fechar decisões: S03: defaults de concorrência/limites e tratamento de resume inválido; nenhuma escolha de destino real durante mocks.

## Fora de escopo

Código/adapters e schema total do projeto; promover exemplos a defaults sem decisão.

## Critérios de aceite

Cada ação da UX tem contrato de sucesso/falha/cancelamento; identidade e dados pessoais preservados; limites verificáveis; decisão pendente que afete integração resolvida antes de S04.

## Validação

Revisão de contratos com fixtures UX e contra cenários reais planejados: Pausar/restart/retomar sem recheck global desnecessário; cancelar mantém Content; apagar dados exige outra confirmação; download concorrente cede ao playback; disco cheio pausa escrita.

## Evidências

[Contrato](../evidence/DOMAIN_CONTRACT.md) e
[decisão](../../../decisions/M09-D01-download-manager-contract.md).

## Done When

Cumprido. S04.1 é o próximo incremento; nenhuma capacidade runtime foi inferida
do contrato.
