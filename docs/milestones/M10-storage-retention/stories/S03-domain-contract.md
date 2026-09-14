# S03 — Contrato de domínio — M10

Status: DEFERRED; preparada documentalmente, não executada.

## Objetivo

Derivar o contrato mínimo de M10 da experiência aprovada.

## Contexto e dependências

UX M01–M22 aprovada; execução autorizada; dependências de integração M09 disponíveis conforme ondas do plano. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

StoragePolicy: consultar uso/elegibilidade, estimar limpeza, aplicar plano revalidado, promover/demover retenção, mudar pasta; lease de ativo e referências; bytes estimados distintos de liberados. Definir operações, DTOs, ownership, eventos/snapshots, unidades, limites, erros, transações e invariantes; fechar decisões: D09: ordem de eviction e limites em S03; nunca converter exemplo de 100GB em decisão aprovada.

## Fora de escopo

Código/adapters e schema total do projeto; promover exemplos a defaults sem decisão.

## Critérios de aceite

Cada ação da UX tem contrato de sucesso/falha/cancelamento; identidade e dados pessoais preservados; limites verificáveis; decisão pendente que afete integração resolvida antes de S04.

## Validação

Revisão de contratos com fixtures UX e contra cenários reais planejados: Limpeza concorrente com playback/download nunca remove ativos/Keep; promoção reaproveita bytes; falha entre volumes mantém original; corrupção afeta apenas cache; conferir espaço físico.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
