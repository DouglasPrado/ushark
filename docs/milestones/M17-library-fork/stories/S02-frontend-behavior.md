# S02 — Comportamento frontend — M17

Status: implementada e validada no frontend.

## Objetivo

Completar interações de M17 antes da revisão humana.

## Contexto e dependências

S01 concluída. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Implementar navegação e ações: Biblioteca assinada → duplicar → novo nome → editar cópia → atualizar origem → comparar independência; validação, retry, cancelamento, resposta antiga e duplo acionamento; foco preso/restaurado e estados copiando; cancelado; falhou; cópia pronta; origem indisponível; asset compartilhado.

## Fora de escopo

Persistência real, integração e aprovação UX automática.

## Critérios de aceite

Cancelar preserva dados confirmados; retry não duplica operação; respostas antigas não sobrescrevem contexto novo; teclado/gamepad alcançam ações essenciais e retorno previsível.

## Validação

Testes relevantes de interação e roteiro UX; simular os efeitos observáveis destes casos: Novo libraryId, mesmos Contents/Sources; atualização da origem não muda cópia; editar cópia não muda origem; cancelamento/falha não deixa parcial; GC mantém assets ainda usados. Não atribuir prova de runtime aos mocks.

## Evidências

Evidências registradas no UPDATE e evidence/VALIDATION.md; somente frontend mockado.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
