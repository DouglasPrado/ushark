# S05 — Integração da jornada — M05

Status: DEFERRED; preparada documentalmente, não executada.

## Objetivo

Provar a jornada real: Detalhes → Play → preparar → primeiro frame → controles/tracks → sair → retomar ou recomeçar.

## Contexto e dependências

S04 concluída; dependências reais disponíveis. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Trocar adapters mockados pelos reais mantendo a UX. Demonstrar Arquivo já disponível toca no MPV, aceita controles e retoma da posição salva. Exercitar todos os estados aplicáveis, incluindo recuperação e dados preservados.

## Fora de escopo

Usar mocks acidentais no caminho principal, alterar UX sem revisão e declarar funcionamento por build verde.

## Critérios de aceite

MPV separado toca mídia controlada; tracks mudam sem reiniciar source; sair salva imediatamente; crash do MPV preserva UI; progresso periódico tem budget explícito; primeira imagem é observada, não inferida do lançamento do processo. Aplicam-se também os critérios comuns acima.

## Validação

Reproduzir fixture local autorizada offline, trocar áudio/legenda sem reiniciar source, sair/reabrir e verificar posição; matar MPV e comprovar UI viva e progresso dentro do budget definido. Registrar observação real no checkpoint funcional e aguardar decisão humana antes de S06.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
