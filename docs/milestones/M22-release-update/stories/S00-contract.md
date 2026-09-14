# S00 — Contrato da experiência — M22

Status: concluída; EXPERIENCE.md define transições e limites.

## Objetivo

Definir o percurso: Instalar → abrir → About/canal → verificar update → validar candidato → atualizar → reabrir dados → desinstalar conforme política.

## Contexto e dependências

Autorização futura de execução; plano e fontes disponíveis. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Documentar EXPERIENCE.md com campos, mensagens, rotas propostas (installer e About; atualização/canal; recuperação de falha; documentação operacional), transições e fixtures para atualizado; update disponível; baixando; assinatura inválida; incompatível; aplicando; falha; recuperação. Mapear cada obrigação da cobertura e definir baseline/corpus quando houver budget.

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
