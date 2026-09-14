# S02 — Comportamento frontend — M15

Status: implementada e validada no frontend.

## Objetivo

Completar interações de M15 antes da revisão humana.

## Contexto e dependências

S01 concluída. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Implementar navegação e ações: Draft → diff e preview → publicar explicitamente → upload → versão imutável → copiar link/código → nova versão ou retirada; validação, retry, cancelamento, resposta antiga e duplo acionamento; foco preso/restaurado e estados não autenticado; sem permissão; upload em andamento; quota; conflito de versão; falha parcial; publicado; retirado.

## Fora de escopo

Persistência real, integração e aprovação UX automática.

## Critérios de aceite

Cancelar preserva dados confirmados; retry não duplica operação; respostas antigas não sobrescrevem contexto novo; teclado/gamepad alcançam ações essenciais e retorno previsível.

## Validação

Testes relevantes de interação e roteiro UX; simular os efeitos observáveis destes casos: Ambiente de teste: editor autorizado publica, não editor rejeitado; falha de upload não aponta a blob incompleto; concorrência retorna conflito; vN imutável; retirada não apaga instalações locais. Não atribuir prova de runtime aos mocks.

## Evidências

Evidências registradas no UPDATE e evidence/VALIDATION.md; somente frontend mockado.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
