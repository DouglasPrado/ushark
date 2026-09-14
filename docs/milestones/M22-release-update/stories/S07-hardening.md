# S07 — Hardening — M22

Status: DEFERRED; preparada documentalmente, não executada.

## Objetivo

Resolver riscos materiais de M22 com evidência.

## Contexto e dependências

S06 concluída. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Exercitar riscos: Code signing e permissões externas; assinatura alterar hash após validação; semver/canal conflitando com artefato único; hardware baseline não definido. Validar limites de entrada/recursos, privacidade, recuperação, responsividade/foco e NFRs da cobertura nas superfícies introduzidas; segurança necessária já acompanha S04.

## Fora de escopo

Otimização sem medição, ampliar escopo e usar ambiente mockado como comprovação de plataforma alvo.

## Critérios de aceite

NFRs aplicáveis medidos com ambiente/corpus/amostras/limites; nenhuma regressão crítica ou pendência obrigatória escondida; erros têm recuperação; secrets não aparecem em logs.

## Validação

Ensaios dirigidos de falha, segurança e performance, incluindo Windows x64: instalação fresh e upgrade histórico empacotados; preservar biblioteca/cache index/progresso/downloads; rejeitar assinatura/hash inválido; comparar hash entre canais; auditar todos requisitos transversais. Usar budgets das fontes; definir baseline antes de medir, sem relaxar limites para passar.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
