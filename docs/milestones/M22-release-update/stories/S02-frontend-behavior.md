# S02 — Comportamento frontend — M22

Status: implementada e validada no frontend.

## Objetivo

Completar interações de M22 antes da revisão humana.

## Contexto e dependências

S01 concluída. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Implementar navegação e ações: Instalar → abrir → About/canal → verificar update → validar candidato → atualizar → reabrir dados → desinstalar conforme política; validação, retry, cancelamento, resposta antiga e duplo acionamento; foco preso/restaurado e estados atualizado; update disponível; baixando; assinatura inválida; incompatível; aplicando; falha; recuperação.

## Fora de escopo

Persistência real, integração e aprovação UX automática.

## Critérios de aceite

Cancelar preserva dados confirmados; retry não duplica operação; respostas antigas não sobrescrevem contexto novo; teclado/gamepad alcançam ações essenciais e retorno previsível.

## Validação

Testes relevantes de interação e roteiro UX; simular os efeitos observáveis destes casos: Windows x64: instalação fresh e upgrade histórico empacotados; preservar biblioteca/cache index/progresso/downloads; rejeitar assinatura/hash inválido; comparar hash entre canais; auditar todos requisitos transversais. Não atribuir prova de runtime aos mocks.

## Evidências

Evidências registradas no UPDATE e evidence/VALIDATION.md; somente frontend mockado.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
