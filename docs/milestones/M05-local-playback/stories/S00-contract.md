# S00 — Contrato da experiência — M05

Status: concluída (frontend). Evidência: ../EXPERIENCE.md; revisão documental contra cobertura em 2026-09-13.

## Objetivo

Definir o percurso: Detalhes → Play → preparar → primeiro frame → controles/tracks → sair → retomar ou recomeçar.

## Contexto e dependências

Autorização futura de execução; plano e fontes disponíveis. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Documentar EXPERIENCE.md com campos, mensagens, rotas propostas (/player/:contentId; overlay de áudio/legendas; detalhes e Continuar), transições e fixtures para sem arquivo; preparando; tocando; pausado; seeking; encerrando; arquivo removido; codec não suportado; MPV falhou; sem legendas. Mapear cada obrigação da cobertura e definir baseline/corpus quando houver budget.

## Fora de escopo

Código, schema definitivo e decisões de runtime antes da UX.

## Critérios de aceite

Cada estado tem gatilho, saída e recuperação; cada ação tem confirmação/cancelamento quando pertinente; premissas e limites de simulação identificados.

## Validação

Revisar roteiro contra as jornadas e cada requisito da cobertura; conferir fronteiras e riscos do README.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
