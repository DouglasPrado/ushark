# S03 — Contrato de domínio — M11

Status: DEFERRED; preparada documentalmente, não executada.

## Objetivo

Derivar o contrato mínimo de M11 da experiência aprovada.

## Contexto e dependências

UX M01–M22 aprovada; execução autorizada; dependências de integração M03, M07, M08 disponíveis conforme ondas do plano. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

NextEpisode: resolver sequência por identidade, preparar com budget, iniciar/cancelar countdown; sessionId e geração evitam início duplicado; estado pessoal separado do pack. Definir operações, DTOs, ownership, eventos/snapshots, unidades, limites, erros, transações e invariantes; fechar decisões: D10: duração de countdown, fim assistido e ordem de especiais em S03.

## Fora de escopo

Código/adapters e schema total do projeto; promover exemplos a defaults sem decisão.

## Critérios de aceite

Cada ação da UX tem contrato de sucesso/falha/cancelamento; identidade e dados pessoais preservados; limites verificáveis; decisão pendente que afete integração resolvida antes de S04.

## Validação

Revisão de contratos com fixtures UX e contra cenários reais planejados: Desligar autoplay impede início; cancelar até o limite definido não toca próximo; pack reutiliza sessão; banda do atual não é roubada; especial/episódio ausente não seleciona conteúdo errado.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
