# S03 — Contrato de domínio — M17

Status: DEFERRED; preparada documentalmente, não executada.

## Objetivo

Derivar o contrato mínimo de M17 da experiência aprovada.

## Contexto e dependências

UX M01–M22 aprovada; execução autorizada; dependências de integração M12, M16 disponíveis conforme ondas do plano. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

LibraryFork: duplicar(originLibraryId, version, novo nome, operationId), retornar novo libraryId; copiar apresentação/memberships por referência e provenance opcional; não criar subscription na cópia. Definir operações, DTOs, ownership, eventos/snapshots, unidades, limites, erros, transações e invariantes; fechar decisões: S03: provenance opcional e destino de assets; republicação de fork fora deste escopo.

## Fora de escopo

Código/adapters e schema total do projeto; promover exemplos a defaults sem decisão.

## Critérios de aceite

Cada ação da UX tem contrato de sucesso/falha/cancelamento; identidade e dados pessoais preservados; limites verificáveis; decisão pendente que afete integração resolvida antes de S04.

## Validação

Revisão de contratos com fixtures UX e contra cenários reais planejados: Novo libraryId, mesmos Contents/Sources; atualização da origem não muda cópia; editar cópia não muda origem; cancelamento/falha não deixa parcial; GC mantém assets ainda usados.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
