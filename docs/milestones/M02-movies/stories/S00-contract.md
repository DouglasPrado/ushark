# S00 — Contrato da experiência

Status: IMPLEMENTED. Contrato revisado contra plano, jornadas e matriz; propostas aguardam UX.

## Objetivo

Definir jornada, campos, transições e critérios de M02 antes de construir a UI.

## Contexto e dependências

Ler [M02](../README.md) e apenas as fontes aplicáveis: README, UJ03/08/17/54/59/67/68/74 e D03/D19.

## Escopo

Documentar EXPERIENCE.md com rotas, campos obrigatórios/opcionais, validações e mensagens; tipo fixo Filme, título obrigatório e poster opcional no cadastro manual. Definir busca por título/ano, revisão de identidade e fonte declarada, cancelamento e retorno de foco. Descrever duplicata, conflito e as três ações distintas: remover source, remover membership e apagar arquivo. Inventariar fixtures neutras e mapear cada requisito aos aceites frontend ou futuros.

## Fora de escopo

Código, schemas de banco, TMDB real e decisões prematuras de RPC.

## Critérios de aceite

Todos os estados do README têm entrada, saída e recuperação; metadados ausentes não viram valores inventados. Identidade não é renomeada silenciosamente; conflitos aguardam escolha explícita. Defaults e apresentação ficam como propostas até UX.

## Validação

Revisão documental contra plano/matriz; registrar cobertura e roteiro teclado/gamepad/1080p/1440p/4K.

## Evidências

[EXPERIENCE.md](../EXPERIENCE.md): campos, transições, estados, fixtures, identidade e cobertura por etapa. Revisão documental concluída em 2026-09-12. Ajuste posterior registra `#/content/:contentId` como rota única do detalhe de Filme para M02/M04, sem alterar os contratos adiados.

## Conclusão

Contrato pronto para orientar S01, sem atribuir aprovação humana.

Estado consolidado da fase: S00–S02 implementadas; aceite UX já existente de M02 preservado em ../UX_CHECKPOINT.md. Referências a revisão pendente acima registram o estágio histórico anterior ao aceite. S03–S08 adiadas.
