# S02 — Comportamento frontend — M12

Status: implementada e validada no frontend.

## Objetivo

Completar interações de M12 antes da revisão humana.

## Contexto e dependências

S01 concluída. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Implementar navegação e ações: Bibliotecas → criar draft → identidade → conteúdos/fontes → coleções/seções → reordenar → preview → salvar; validação, retry, cancelamento, resposta antiga e duplo acionamento; foco preso/restaurado e estados draft vazio; inválido; editando; salvando; salvo; alterações não salvas; imagem ausente; preview vazio.

## Fora de escopo

Persistência real, integração e aprovação UX automática.

## Critérios de aceite

Cancelar preserva dados confirmados; retry não duplica operação; respostas antigas não sobrescrevem contexto novo; teclado/gamepad alcançam ações essenciais e retorno previsível.

## Validação

Testes relevantes de interação e roteiro UX; simular os efeitos observáveis destes casos: Reabrir mantém IDs/ordem/draft; preview equivale ao layout; reordenar não altera Content global; inspecionar payload sem estado pessoal; salvar não publica nem inicia torrent. Não atribuir prova de runtime aos mocks.

## Evidências

Evidências: [UPDATE](../UPDATE.md) e evidence/VALIDATION.md; apenas frontend mockado.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
