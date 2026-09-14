# S07 — Hardening — M13

Status: DEFERRED; preparada documentalmente, não executada.

## Objetivo

Resolver riscos materiais de M13 com evidência.

## Contexto e dependências

S06 concluída. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Exercitar riscos: Exemplos divergentes de manifest e limites ainda não fechados; extração e TOCTOU; assinatura presente antes de verificador M14. Validar limites de entrada/recursos, privacidade, recuperação, responsividade/foco e NFRs da cobertura nas superfícies introduzidas; segurança necessária já acompanha S04.

## Fora de escopo

Otimização sem medição, ampliar escopo e usar ambiente mockado como comprovação de plataforma alvo.

## Critérios de aceite

NFRs aplicáveis medidos com ambiente/corpus/amostras/limites; nenhuma regressão crítica ou pendência obrigatória escondida; erros têm recuperação; secrets não aparecem em logs.

## Validação

Ensaios dirigidos de falha, segurança e performance, incluindo Roundtrip offline em dois catálogos sem DB original; IDs/ordem/layout iguais; rejeitar traversal, symlink, ZIP bomb, HTML/CSS/scripts e payload incompatível sem modificar catálogo. Usar budgets das fontes; definir baseline antes de medir, sem relaxar limites para passar.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
