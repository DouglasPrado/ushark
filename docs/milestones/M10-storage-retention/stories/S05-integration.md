# S05 — Integração da jornada — M10

Status: DEFERRED; preparada documentalmente, não executada.

## Objetivo

Provar a jornada real: Configurações → espaço e estimativa → revisar protegidos → limpar elegíveis → promover para Keep → conferir uso.

## Contexto e dependências

S04 concluída; dependências reais disponíveis. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Trocar adapters mockados pelos reais mantendo a UX. Demonstrar Usuário inspeciona uso/liberação estimada, aplica política e promove cache para Keep sem redownload. Exercitar todos os estados aplicáveis, incluindo recuperação e dados preservados.

## Fora de escopo

Usar mocks acidentais no caminho principal, alterar UX sem revisão e declarar funcionamento por build verde.

## Critérios de aceite

Limpeza libera somente elegíveis; ativo/download/Keep/protegido permanece; limite considera espaço físico real; promoção reaproveita bytes; corrupção reconstrói cache sem afetar progresso/metadata; alteração de pasta tem tratamento de falha. Aplicam-se também os critérios comuns acima.

## Validação

Limpeza concorrente com playback/download nunca remove ativos/Keep; promoção reaproveita bytes; falha entre volumes mantém original; corrupção afeta apenas cache; conferir espaço físico. Registrar observação real no checkpoint funcional e aguardar decisão humana antes de S06.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
