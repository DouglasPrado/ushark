# S02 — Comportamento frontend — M10

Status: frontend concluído; ../evidence/VALIDATION.md. UX READY_FOR_REVIEW/PENDING.

## Objetivo

Completar interações de M10 antes da revisão humana.

## Contexto e dependências

S01 concluída. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Implementar navegação e ações: Configurações → espaço e estimativa → revisar protegidos → limpar elegíveis → promover para Keep → conferir uso; validação, retry, cancelamento, resposta antiga e duplo acionamento; foco preso/restaurado e estados calculando; vazio; sem elegíveis; protegido; ativo; disco cheio; cache corrompido; movendo; permissão negada.

## Fora de escopo

Persistência real, integração e aprovação UX automática.

## Critérios de aceite

Cancelar preserva dados confirmados; retry não duplica operação; respostas antigas não sobrescrevem contexto novo; teclado/gamepad alcançam ações essenciais e retorno previsível.

## Validação

Testes relevantes de interação e roteiro UX; simular os efeitos observáveis destes casos: Limpeza concorrente com playback/download nunca remove ativos/Keep; promoção reaproveita bytes; falha entre volumes mantém original; corrupção afeta apenas cache; conferir espaço físico. Não atribuir prova de runtime aos mocks.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
