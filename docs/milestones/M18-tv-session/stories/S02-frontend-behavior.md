# S02 — Comportamento frontend — M18

Status: implementada e validada no frontend.

## Objetivo

Completar interações de M18 antes da revisão humana.

## Contexto e dependências

S01 concluída. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Implementar navegação e ações: Moonlight → app --tv → navegar somente pelas superfícies de consumo → Play com fonte automática → controlar áudio/legendas → desconectar → reconectar → sair; impedir por renderização e navegação o acesso às superfícies de gestão; validação, retry, cancelamento, resposta antiga e duplo acionamento; foco preso/restaurado e estados iniciando; foco no app; player ativo; controle desconectado; sessão perdida; pausado/continuando; reconectando; encerrando.

## Fora de escopo

Persistência real, integração e aprovação UX automática.

## Critérios de aceite

Cancelar preserva dados confirmados; retry não duplica operação; respostas antigas não sobrescrevem contexto novo; teclado/gamepad alcançam ações essenciais e retorno previsível.

## Validação

Testes relevantes de interação e roteiro UX; simular os efeitos observáveis destes casos: Windows/TV em LAN real: sem mouse/desktop/terminal exposto; áudio/vídeo/hardware encode quando disponível; desconectar/reconectar preserva posição; sair encerra helpers; registrar versões Sunshine/Moonlight e controle físico. Não atribuir prova de runtime aos mocks.

## Evidências

Evidências registradas no UPDATE e evidence/VALIDATION.md; somente frontend mockado.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
