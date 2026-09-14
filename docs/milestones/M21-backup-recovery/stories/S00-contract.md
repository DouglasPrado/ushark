# S00 — Contrato da experiência — M21

Status: concluída; EXPERIENCE.md define transições e limites.

## Objetivo

Definir o percurso: Falha detectada → diagnóstico/backup disponível → preview de restore → confirmar → restaurar → reabrir e retomar.

## Contexto e dependências

Autorização futura de execução; plano e fontes disponíveis. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Documentar EXPERIENCE.md com campos, mensagens, rotas propostas (recovery no startup; backup/restore em configurações; progresso e falha recuperável), transições e fixtures para backup criando; consistente; inválido; incompatível; DB ocupado; sem espaço; restaurando; falha parcial; recuperado. Mapear cada obrigação da cobertura e definir baseline/corpus quando houver budget.

## Fora de escopo

Código, schema definitivo e decisões de runtime antes da UX.

## Critérios de aceite

Cada estado tem gatilho, saída e recuperação; cada ação tem confirmação/cancelamento quando pertinente; premissas e limites de simulação identificados.

## Validação

Revisar roteiro contra as jornadas e cada requisito da cobertura; conferir fronteiras e riscos do README.

## Evidências

Evidências registradas no UPDATE e evidence/VALIDATION.md; somente frontend mockado.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
