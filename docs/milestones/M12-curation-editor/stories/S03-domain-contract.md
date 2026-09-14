# S03 — Contrato de domínio — M12

Status: DONE em 2026-09-14.

## Objetivo

Derivar o contrato mínimo de M12 da experiência aprovada.

## Contexto e dependências

UX M01–M22 aprovada; execução autorizada; dependências de integração M02, M03 disponíveis conforme ondas do plano. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

LibraryDraft: ler/salvar draft com revisão, editar identidade, memberships, Collection e Section separados; apresentação escopada ao libraryId; preview usa mesmo modelo de leitura do assinante. Definir operações, DTOs, ownership, eventos/snapshots, unidades, limites, erros, transações e invariantes; fechar decisões: D19: precedência de apresentação em S03; editor avançado pode ser desktop secundário conforme UX, sem supor todas funções TV.

## Fora de escopo

Código/adapters e schema total do projeto; promover exemplos a defaults sem decisão.

## Critérios de aceite

Cada ação da UX tem contrato de sucesso/falha/cancelamento; identidade e dados pessoais preservados; limites verificáveis; decisão pendente que afete integração resolvida antes de S04.

## Validação

Revisão de contratos com fixtures UX e contra cenários reais planejados: Reabrir mantém IDs/ordem/draft; preview equivale ao layout; reordenar não altera Content global; inspecionar payload sem estado pessoal; salvar não publica nem inicia torrent.

## Evidências

[Contrato](../evidence/DOMAIN_CONTRACT.md) e
[D19](../../../decisions/M12-D19-presentation-precedence.md).

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
