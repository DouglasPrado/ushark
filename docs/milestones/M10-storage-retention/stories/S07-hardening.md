# S07 — Hardening — M10

Status: DEFERRED; preparada documentalmente, não executada.

## Objetivo

Resolver riscos materiais de M10 com evidência.

## Contexto e dependências

S06 concluída. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Exercitar riscos: GC com corrida, movimentação entre volumes, confusão entre cache e biblioteca; ordem de eviction diverge entre exemplos. Validar limites de entrada/recursos, privacidade, recuperação, responsividade/foco e NFRs da cobertura nas superfícies introduzidas; segurança necessária já acompanha S04.

## Fora de escopo

Otimização sem medição, ampliar escopo e usar ambiente mockado como comprovação de plataforma alvo.

## Critérios de aceite

NFRs aplicáveis medidos com ambiente/corpus/amostras/limites; nenhuma regressão crítica ou pendência obrigatória escondida; erros têm recuperação; secrets não aparecem em logs.

## Validação

Ensaios dirigidos de falha, segurança e performance, incluindo Limpeza concorrente com playback/download nunca remove ativos/Keep; promoção reaproveita bytes; falha entre volumes mantém original; corrupção afeta apenas cache; conferir espaço físico. Usar budgets das fontes; definir baseline antes de medir, sem relaxar limites para passar.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
