# S03 — Contrato de domínio — M08

Status: DONE em 2026-09-14.

## Objetivo

Derivar o contrato mínimo de M08 da experiência aprovada.

## Contexto e dependências

UX M01–M22 aprovada; execução autorizada; dependências de integração M07 disponíveis conforme ondas do plano. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

SourceSelection: observar/cancelar preflight, rankear métricas, definir/remover override; Health/confidence/ratio/startup e reasonCodes separados; unidades e budget explícitos. Definir operações, DTOs, ownership, eventos/snapshots, unidades, limites, erros, transações e invariantes; fechar decisões: D06/D07/D09/D19: estados, pesos e preferência por menor tamanho em UX/S03, sem defaults inventados.

## Fora de escopo

Código/adapters e schema total do projeto; promover exemplos a defaults sem decisão.

## Critérios de aceite

Cada ação da UX tem contrato de sucesso/falha/cancelamento; identidade e dados pessoais preservados; limites verificáveis; decisão pendente que afete integração resolvida antes de S04.

## Validação

Revisão de contratos com fixtures UX e contra cenários reais planejados: Fixtures determinísticas de ranking incluindo menor tamanho, qualidade máxima inviável e fonte local; ranking <10ms sem probes; confirmar escolha com player e cancelar preflight ao sair sem flicker.

## Evidências

[Contrato](../evidence/DOMAIN_CONTRACT.md) e
[decisões D06/D07/D09/D19](../../../decisions/M08-D06-D07-D09-D19-source-selection-contract.md).

## Done When

Cumprido. S04.1 é a próxima sub-story; nenhuma medição runtime foi inferida do
contrato.
