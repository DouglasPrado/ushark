# S05 — Integração da jornada — M14

Status: DONE em 2026-09-14; integração real documentada.

## Objetivo

Provar a jornada real: Preview → ver autoria → aceitar identidade ou cancelar → assinar pacote próprio → reimportar → detectar alteração de chave.

## Contexto e dependências

S04 concluída; dependências reais disponíveis. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Trocar adapters mockados pelos reais mantendo a UX. Demonstrar Cliente verifica assinatura e lembra a identidade aceita; autor pode assinar pacote. Exercitar todos os estados aplicáveis, incluindo recuperação e dados preservados.

## Fora de escopo

Usar mocks acidentais no caminho principal, alterar UX sem revisão e declarar funcionamento por build verde.

## Critérios de aceite

Não assinada pode ser aceita com identificação clara; inválida/hash divergente bloqueia; chave alterada não entra silenciosamente; assinatura persiste no roundtrip e secrets não aparecem no DB/logs. Aplicam-se também os critérios comuns acima.

## Validação

Modificar bytes invalida assinatura; chave diferente nunca entra silenciosamente; não assinado é identificado; roundtrip preserva assinatura; verificar ausência de chave privada em DB/logs. Registrar observação real no checkpoint funcional e aguardar decisão humana antes de S06.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
